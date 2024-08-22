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
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

const AuthContext = createContext();
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
const TOKEN_EXPIRATION = 3 * 60 * 60 * 1000;

export function AuthContextProvider({ children }) {
    const [user, setUser] = useState(null);
    const [lastActivity, setLastActivity] = useState(Date.now());

    const logOut = useCallback(async () => {
        try {
            await signOut(auth);
            setUser(null);
            localStorage.removeItem("authUser");
        } catch (error) {
            throw new Error(
                "An error occurred while logging out. Please try again."
            );
        }
    }, []);

    const checkAuthState = useCallback(() => {
        const storedUser = JSON.parse(localStorage.getItem("authUser"));
        if (storedUser && new Date().getTime() < storedUser.expirationTime) {
            setUser(storedUser.user);
        }
    }, []);

    useEffect(() => {
        checkAuthState();

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDoc = await getDoc(
                    doc(db, "users", currentUser.email)
                );
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
        });

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
    }, [lastActivity, logOut, checkAuthState]);

    async function signUp(info) {
        try {
            const checkEmailExists = await fetchSignInMethodsForEmail(
                auth,
                info.email
            );
            if (checkEmailExists.length > 0) {
                throw new Error("Email address already exists.");
            }

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                info.email,
                info.password
            );
            const user = userCredential.user;
            await updateProfile(user, {
                displayName: `${info.firstName} ${info.lastName}`,
            });
            await setDoc(doc(db, "users", info.email), {
                firstName: info.firstName,
                lastName: info.lastName,
                signedUpServices: [],
                postedServices: [],
                notifications: [],
            });
            return user;
        } catch (error) {
            console.error("Signup error:", error);
            if (error.code === "auth/email-already-in-use") {
                throw new Error(
                    "Email is already in ue. Please use a different email or try again."
                );
            } else if (error.code === "auth/weak-password") {
                throw new Error(
                    "Password is too weak. Please try a stronger password."
                );
            } else {
                throw new Error(
                    `An error occurred while signing up your account. Please try again. $ { error.message }`
                );
            }
        }
    }

    async function logIn(info) {
        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                info.email,
                info.password
            );
            const user = userCredential.user;
            const userDoc = await getDoc(doc(db, "users", user.email));
            const userData = userDoc.data();
            setUser({ ...user, role: userData.role });
        } catch (error) {
            if (
                error.code === "auth/user-not-found" ||
                error.code === "auth/wrong-password"
            ) {
                throw new Error(
                    "Incorrect email or password. Please try again."
                );
            } else {
                throw new Error(
                    "An error occurred while logging in with email and password. Please try again."
                );
            }
        }
    }

    async function signInWithGoogle() {
        try {
            const results = await signInWithPopup(auth, googleProvider);
            const fullName = results.user.displayName;
            const [firstName, lastName] = fullName.split(" ");
            const userDoc = await getDoc(doc(db, "users", results.user.email));

            if (!userDoc.exists()) {
                await setDoc(doc(db, "users", results.user.email), {
                    firstName,
                    lastName,
                    signedUpServices: [],
                    postedServices: [],
                    notifications: [],
                });
                return results.user;
            } else {
                const userData = userDoc.data();
                setUser({ ...results.user, role: userData.role });
                return null;
            }
        } catch (error) {
            throw new Error(
                "An error occurred while logging in with Google. Please try again."
            );
        }
    }

    async function sendVerificationEmail() {
        try {
            await sendEmailVerification(auth.currentUser);
        } catch (error) {
            console.error(error);
            throw new Error(
                "An error occurred while sending the verification email. Please try again."
            );
        }
    }

    async function updateUserProfile(updates) {
        try {
            const user = auth.currentUser;
            await updateProfile(user, updates);
            await updateDoc(doc(db, "users", user.email), updates);
            setUser((prevUser) => ({ ...prevUser, ...updates }));
        } catch (error) {
            throw new Error(
                "An error occurred while updating your profile. Please try again."
            );
        }
    }

    async function addNotification(notification) {
        try {
            const user = auth.currentUser;
            await updateDoc(doc(db, "users", user.email), {
                notifications: arrayUnion(notification),
            });
        } catch (error) {
            throw new Error(
                "An error occurred while adding the notification. Please try again."
            );
        }
    }

    async function updateUserRole(user, role) {
        try {
            await updateDoc(doc(db, "users", user.email), { role });
            setUser((prevUser) => ({ ...prevUser, role }));
        } catch (error) {
            throw new Error(
                "An error occurred while updating your role. Please try again."
            );
        }
    }

    function isEmailVerified() {
        return auth.currentUser?.emailVerified ?? false;
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                signUp,
                logIn,
                signInWithGoogle,
                logOut,
                sendVerificationEmail,
                updateUserProfile,
                addNotification,
                isEmailVerified,
                updateUserRole,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function UserAuth() {
    return useContext(AuthContext);
}
