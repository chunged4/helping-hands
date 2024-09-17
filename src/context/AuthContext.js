import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
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
    orderBy,
    limit,
    arrayUnion,
    arrayRemove,
} from "firebase/firestore";

const AuthContext = createContext();
const TOKEN_EXPIRATION = 3 * 60 * 60 * 1000;

export function AuthContextProvider({ children }) {
    const [user, setUser] = useState(null);
    const [tempUser, setTempUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const updateUserState = useCallback(async (currentUser) => {
        setIsLoading(true);
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
        setIsLoading(false);
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
            setIsLoading(false);
        };

        checkAuthState();

        const unsubscribe = onAuthStateChanged(auth, updateUserState);

        return () => {
            unsubscribe();
        };
    }, [logOut, updateUserState]);

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

    const contextValue = useMemo(
        () => ({
            user,
            tempUser,
            logOut,
            isLoading,

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

                    if (role === "volunteer") {
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
                    return userCredential.user;
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
                        ...(role === "coordinator"
                            ? { postedServices: [] }
                            : {}),
                        ...(role === "volunteer"
                            ? { signedUpServices: [] }
                            : {}),
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
                    const user = auth.currentUser;
                    if (!user) {
                        throw new Error("No user is currently signed in.");
                    }
                    await sendEmailVerification(user);
                } catch (error) {
                    console.error("Error sending verification email:", error);
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

            updateUserRole: async (user, role) => {
                try {
                    const userRef = doc(db, "users", user.email);
                    await updateDoc(userRef, { role: role });

                    const updatedUserDoc = await getDoc(userRef);
                    if (!updatedUserDoc.exists()) {
                        throw new Error("User document not found after update");
                    }

                    const updatedUserData = updatedUserDoc.data();

                    setUser((prevUser) => ({
                        ...prevUser,
                        ...updatedUserData,
                    }));

                    return { ...user, ...updatedUserData };
                } catch (error) {
                    console.error("Error in updateUserRole:", error);
                    throw error;
                }
            },

            fetchNotifications: async () => {
                if (!user) return [];

                try {
                    const userNotificationsRef = collection(
                        db,
                        "users",
                        user.email,
                        "notifications"
                    );
                    const q = query(
                        userNotificationsRef,
                        orderBy("createdTimeStamp", "desc"),
                        limit(20)
                    );
                    const querySnapshot = await getDocs(q);
                    return querySnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                } catch (error) {
                    console.error("Error fetching notifications:", error);
                    return [];
                }
            },

            onApprove: async (notificationId) => {
                try {
                    const notificationRef = doc(
                        db,
                        `users/${user.email}/notifications/${notificationId}`
                    );
                    const notificationDoc = await getDoc(notificationRef);

                    if (!notificationDoc.exists()) {
                        console.warn(
                            `Notification ${notificationId} not found, it may have been already processed.`
                        );
                        return {
                            success: false,
                            message:
                                "Notification not found or already processed.",
                        };
                    }

                    const notificationData = notificationDoc.data();
                    const coordinatorDoc = await getDoc(
                        doc(db, "users", user.email)
                    );
                    let coordinatorName = "Coordinator";
                    if (coordinatorDoc.exists()) {
                        const coordinatorData = coordinatorDoc.data();
                        coordinatorName =
                            coordinatorData.firstName &&
                            coordinatorData.lastName
                                ? `${coordinatorData.firstName} ${coordinatorData.lastName}`
                                : coordinatorData.displayName ||
                                  user.displayName ||
                                  "Coordinator";
                    }

                    await contextValue.addNotification({
                        type: "request_approved",
                        message: `Your request for help has been approved and scheduled. (${notificationData.messageData.location} at ${notificationData.messageData.time})`,
                        createdBy: user.email,
                        creatorName: coordinatorName,
                        userId: notificationData.createdBy,
                        messageData: notificationData.messageData,
                    });
                    await deleteDoc(notificationRef);
                    return {
                        success: true,
                        message: "Request approved successfully.",
                    };
                } catch (error) {
                    console.error("Error in onApprove:", error);
                    return {
                        success: false,
                        message: "Failed to approve request. Please try again.",
                    };
                }
            },

            onReject: async (notificationId) => {
                try {
                    const notificationRef = doc(
                        db,
                        `users/${user.email}/notifications/${notificationId}`
                    );
                    const notificationDoc = await getDoc(notificationRef);

                    if (!notificationDoc.exists()) {
                        console.warn(
                            `Notification ${notificationId} not found, it may have been already processed.`
                        );
                        return {
                            success: false,
                            message:
                                "Notification not found or already processed.",
                        };
                    }

                    const notificationData = notificationDoc.data();
                    const coordinatorDoc = await getDoc(
                        doc(db, "users", user.email)
                    );
                    let coordinatorName = "Coordinator";
                    if (coordinatorDoc.exists()) {
                        const coordinatorData = coordinatorDoc.data();
                        coordinatorName =
                            coordinatorData.firstName &&
                            coordinatorData.lastName
                                ? `${coordinatorData.firstName} ${coordinatorData.lastName}`
                                : coordinatorData.displayName ||
                                  user.displayName ||
                                  "Coordinator";
                    }

                    await contextValue.addNotification({
                        type: "request_rejected",
                        message: `Sorry, your request for help at ${notificationData.messageData.location} at ${notificationData.messageData.time} could not be fulfilled. Please contact ${coordinatorName} at ${user.email}.`,
                        createdBy: user.email,
                        creatorName: coordinatorName,
                        userId: notificationData.createdBy,
                        messageData: notificationData.messageData,
                    });

                    await deleteDoc(notificationRef);
                    return {
                        success: true,
                        message: "Request rejected successfully.",
                    };
                } catch (error) {
                    console.error("Error in onReject:", error);
                    return {
                        success: false,
                        message: "Failed to reject request. Please try again.",
                    };
                }
            },

            scheduleReminderNotification: async (eventId, userId) => {
                const eventRef = doc(db, "events", eventId);
                const eventDoc = await getDoc(eventRef);

                if (!eventDoc.exists()) {
                    throw new Error("Event not found");
                }

                const eventData = eventDoc.data();
                const reminderTime = new Date(
                    eventData.startTime.toDate().getTime() - 24 * 60 * 60 * 1000
                );
                const now = new Date();

                if (reminderTime > now) {
                    const reminderNotification = {
                        type: "reminder",
                        message: `Reminder: You have an upcoming service "${eventData.title}" tomorrow.`,
                        createdBy: "system",
                        creatorName: "System",
                        userId: userId,
                        eventId: eventId,
                        scheduledFor: Timestamp.fromDate(reminderTime),
                    };

                    await addDoc(
                        collection(
                            db,
                            `users/${userId}/scheduledNotifications`
                        ),
                        reminderNotification
                    );
                }
            },

            signUpForEvent: async (eventId) => {
                if (!user) throw new Error("No user logged in");
                try {
                    const userRef = doc(db, "users", user.email);
                    const eventRef = doc(db, "events", eventId);

                    const eventDoc = await getDoc(eventRef);
                    if (!eventDoc.exists()) {
                        throw new Error("Event not found");
                    }

                    const eventData = eventDoc.data();
                    if (eventData.participantList.includes(user.email)) {
                        throw new Error(
                            "User already signed up for this event"
                        );
                    }

                    if (
                        eventData.currentParticipants >=
                        eventData.maxParticipants
                    ) {
                        throw new Error("Event is full");
                    }

                    await updateDoc(userRef, {
                        signedUpServices: arrayUnion(eventId),
                    });

                    await updateDoc(eventRef, {
                        currentParticipants: eventData.currentParticipants + 1,
                        participantList: arrayUnion(user.email),
                    });

                    setUser((prevUser) => ({
                        ...prevUser,
                        signedUpServices: [
                            ...(prevUser.signedUpServices || []),
                            eventId,
                        ],
                    }));

                    return true;
                } catch (error) {
                    console.error("Error signing up for event:", error);
                    throw error;
                }
            },

            unSignFromEvent: async (eventId) => {
                if (!user) throw new Error("No user logged in");
                try {
                    const userRef = doc(db, "users", user.email);
                    const eventRef = doc(db, "events", eventId);

                    const eventDoc = await getDoc(eventRef);
                    if (!eventDoc.exists()) {
                        throw new Error("Event not found");
                    }

                    const eventData = eventDoc.data();
                    if (!eventData.participantList.includes(user.email)) {
                        throw new Error("User is not signed up for this event");
                    }

                    await updateDoc(userRef, {
                        signedUpServices: arrayRemove(eventId),
                    });

                    await updateDoc(eventRef, {
                        currentParticipants: eventData.currentParticipants - 1,
                        participantList: arrayRemove(user.email),
                    });

                    setUser((prevUser) => ({
                        ...prevUser,
                        signedUpServices: prevUser.signedUpServices.filter(
                            (id) => id !== eventId
                        ),
                    }));

                    return true;
                } catch (error) {
                    console.error("Error removing from event:", error);
                    throw error;
                }
            },

            getEventStatus: (event) => {
                if (event.status === "cancelled") {
                    return "cancelled";
                }

                const now = Timestamp.now();

                if (now.toMillis() < event.startTime.toMillis()) {
                    return "upcoming";
                } else if (
                    now.toMillis() >= event.startTime.toMillis() &&
                    now.toMillis() <= event.endTime.toMillis()
                ) {
                    return "ongoing";
                } else if (now.toMillis() > event.endTime.toMillis()) {
                    return "completed";
                }

                return event.status;
            },

            updateEventStatus: async (event) => {
                if (!user) throw new Error("No user logged in");
                try {
                    const now = Timestamp.now();
                    let newStatus = event.status;

                    if (event.status !== "cancelled") {
                        if (now.toMillis() < event.startTime.toMillis()) {
                            newStatus = "upcoming";
                        } else if (
                            now.toMillis() >= event.startTime.toMillis() &&
                            now.toMillis() <= event.endTime.toMillis()
                        ) {
                            newStatus = "ongoing";
                        } else if (now.toMillis() > event.endTime.toMillis()) {
                            newStatus = "completed";
                        }
                    }

                    if (newStatus !== event.status) {
                        const eventRef = doc(db, "events", event.id);
                        await updateDoc(eventRef, { status: newStatus });
                        return { ...event, status: newStatus };
                    }

                    return event;
                } catch (error) {
                    console.error("Error updating event status:", error);
                    throw error;
                }
            },

            cancelEvent: async (eventId) => {
                if (!user) throw new Error("No user logged in");
                try {
                    const eventRef = doc(db, "events", eventId);
                    await updateDoc(eventRef, { status: "cancelled" });
                    return true;
                } catch (error) {
                    console.error("Error cancelling event:", error);
                    throw error;
                }
            },

            isEmailVerified: () => auth.currentUser?.emailVerified ?? false,

            clearTempUser: () => setTempUser(null),
        }),
        [
            user,
            tempUser,
            logOut,
            isLoading,
            setTempUser,
            handleAuthError,
            updateUserState,
        ]
    );

    useEffect(() => {
        if (!user) return;

        const checkScheduledNotifications = async () => {
            const scheduledNotificationsRef = collection(
                db,
                `users/${user.email}/scheduledNotifications`
            );
            const q = query(
                scheduledNotificationsRef,
                where("scheduledFor", "<=", Timestamp.now())
            );
            const querySnapshot = await getDocs(q);

            querySnapshot.forEach(async (doc) => {
                const notification = doc.data();
                await contextValue.addNotification(notification);
                await deleteDoc(doc.ref);
            });
        };

        const intervalId = setInterval(checkScheduledNotifications, 60000); // Check every minute

        return () => clearInterval(intervalId);
    }, [user, contextValue]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export const UserAuth = () => useContext(AuthContext);
