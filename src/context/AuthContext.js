import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    signInWithEmailAndPassword,
    signInWithPopup,
    createUserWithEmailAndPassword,
    fetchSignInMethodsForEmail,
    sendEmailVerification,
    updateProfile,
    signOut,
    onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider, db } from "../config/firebase.config";
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    Timestamp,
    deleteDoc,
} from "firebase/firestore";

const AuthContext = createContext();
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
const TOKEN_EXPIRATION = 3 * 60 * 60 * 1000;

export function AuthContextProvider({ children }) {
    const [user, setUser] = useState(null);
    const [tempUser, setTempUser] = useState(null);
    const [lastActivity, setLastActivity] = useState(Date.now());

    const updateUserState = useCallback(async (currentUser) => {
        if (currentUser) {
            const userDoc = await getDoc(doc(db, "users", currentUser.email));
            const userData = userDoc.exists() ? userDoc.data() : {};
            const userWithRole = {
                ...currentUser,
                role: userData.role || null,
            };
            setUser(userWithRole);
            localStorage.setItem(
                "authUser",
                JSON.stringify({
                    user: userWithRole,
                    expirationTime: new Date().getTime() + TOKEN_EXPIRATION,
                })
            );
        } else {
            setUser(null);
            localStorage.removeItem("authUser");
        }
    }, []);

    const handleAuthError = useCallback((error, errorMessage) => {
        console.error(errorMessage, error);
        throw new Error(error.message || errorMessage);
    }, []);

    const logOut = useCallback(async () => {
        try {
            await signOut(auth);
            updateUserState(null);
        } catch (error) {
            handleAuthError(
                error,
                "An error occurred while logging out. Please try again."
            );
        }
    }, [updateUserState, handleAuthError]);

    useEffect(() => {
        const checkAuthState = () => {
            const storedUser = JSON.parse(localStorage.getItem("authUser"));
            if (
                storedUser &&
                new Date().getTime() < storedUser.expirationTime
            ) {
                setUser(storedUser.user);
            }
        };

        checkAuthState();

        const unsubscribe = onAuthStateChanged(auth, updateUserState);

        const activityHandler = () => setLastActivity(Date.now());
        ["mousemove", "keypress", "click", "scroll"].forEach((event) =>
            window.addEventListener(event, activityHandler)
        );

        const checkInactivity = setInterval(() => {
            if (Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
                logOut();
            }
        }, 60000);
        return () => {
            unsubscribe();
            ["mousemove", "keypress", "click", "scroll"].forEach((event) => {
                window.removeEventListener(event, activityHandler);
            });
            clearInterval(checkInactivity);
        };
    }, [lastActivity, logOut, updateUserState]);

    const authOperations = {
        signUp: async (info) => {
            try {
                const methods = await fetchSignInMethodsForEmail(
                    auth,
                    info.email
                );
                if (methods.length > 0)
                    throw new Error("Email address already exists.");

                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    info.email,
                    info.password
                );
                const user = userCredential.user;
                await updateProfile(user, {
                    displayName: `${info.firstName} ${info.lastName}`,
                });

                const defaultRole = "member";
                const role = info.role || defaultRole;

                const userData = {
                    firstName: info.firstName,
                    lastName: info.lastName,
                    role: role,
                    notifications: [],
                };

                if (role === "coordinator") {
                    userData.postedServices = [];
                } else if (role === "volunteer") {
                    userData.signedUpServices = [];
                }

                await setDoc(doc(db, "users", info.email), userData);
                return user;
            } catch (error) {
                handleAuthError(
                    error,
                    "An error occurred while signing up. Please try again."
                );
            }
        },

        logIn: async (info) => {
            try {
                const userCredential = await signInWithEmailAndPassword(
                    auth,
                    info.email,
                    info.password
                );
                await updateUserState(userCredential.user);
            } catch (error) {
                handleAuthError(
                    error,
                    "An error occurred while logging in. Please try again."
                );
            }
        },

        signInWithGoogle: async () => {
            try {
                const result = await signInWithPopup(auth, googleProvider);
                setTempUser(result.user);
                const userDoc = await getDoc(
                    doc(db, "users", result.user.email)
                );
                if (userDoc.exists()) {
                    await updateUserState(result.user);
                    return { user: result.user, existingUser: true };
                }
                return { user: result.user, existingUser: false };
            } catch (error) {
                handleAuthError(
                    error,
                    "An error occurred during Google sign-in. Please try again."
                );
            }
        },

        completeRegistration: async (role) => {
            if (!tempUser) throw new Error("No temporary user found.");
            try {
                const userData = {
                    firstName: tempUser.displayName.split(" ")[0],
                    lastName: tempUser.displayName.split(" ")[1] || "",
                    role: role,
                    notifications: [],
                    ...(role === "coordinator" ? { postedServices: [] } : {}),
                    ...(role === "volunteer" ? { signedUpServices: [] } : {}),
                };
                await setDoc(doc(db, "users", tempUser.email), userData);
                setUser({ ...tempUser, role });
                setTempUser(null);
            } catch (error) {
                handleAuthError(
                    error,
                    "An error occurred while completing registration. Please try again."
                );
            }
        },

        sendVerificationEmail: async () => {
            try {
                await sendEmailVerification(auth.currentUser);
            } catch (error) {
                handleAuthError(
                    error,
                    "An error occurred while sending the verification email. Please try again."
                );
            }
        },

        updateUserProfile: async (updates) => {
            try {
                const user = auth.currentUser;
                await updateProfile(user, updates);
                await updateDoc(doc(db, "users", user.email), updates);
                setUser((prevUser) => ({ ...prevUser, ...updates }));
            } catch (error) {
                handleAuthError(
                    error,
                    "An error occurred while updating your profile. Please try again."
                );
            }
        },

        addNotification: async (notification) => {
            if (!notification.userId) return;
            try {
                const notificationData = {
                    ...notification,
                    createdTimeStamp: Timestamp.now(),
                    expiresAt: Timestamp.fromDate(
                        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    ),
                };
                await addDoc(
                    collection(
                        db,
                        `users/${notification.userId}/notifications`
                    ),
                    notificationData
                );
            } catch (error) {
                handleAuthError(
                    error,
                    "An error occurred while adding the notification. Please try again."
                );
            }
        },

        fetchNotifications: async () => {
            if (!user) return [];
            try {
                const q = query(
                    collection(db, `users/${user.uid}/notifications`),
                    where("expiresAt", ">", Timestamp.now())
                );
                const querySnapshot = await getDocs(q);
                return querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
            } catch (error) {
                handleAuthError(
                    error,
                    "An error occurred while fetching notifications."
                );
                return [];
            }
        },

        updateUserRole: async (user, role) => {
            try {
                await updateDoc(doc(db, "users", user.email), { role });
                setUser((prevUser) => ({ ...prevUser, role }));
            } catch (error) {
                handleAuthError(
                    error,
                    "An error occurred while updating your role. Please try again."
                );
            }
        },

        isEmailVerified: () => auth.currentUser?.emailVerified ?? false,

        clearTempUser: () => setTempUser(null),
    };

    useEffect(() => {
        const deleteExpiredNotifications = async () => {
            try {
                const q = query(
                    collection(db, "notifications"),
                    where("expiresAt", "<=", Timestamp.now())
                );
                const querySnapshot = await getDocs(q);
                await Promise.all(
                    querySnapshot.docs.map((doc) => deleteDoc(doc.ref))
                );
            } catch (error) {
                console.error("Error deleting expired notifications:", error);
            }
        };

        const interval = setInterval(
            deleteExpiredNotifications,
            24 * 60 * 60 * 1000
        );
        return () => clearInterval(interval);
    }, []);

    return (
        <AuthContext.Provider value={{ user, ...authOperations }}>
            {children}
        </AuthContext.Provider>
    );
}

export const UserAuth = () => useContext(AuthContext);
