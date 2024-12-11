/**
 * @fileoverview This file provides a centralized way to manage user authentication
 *               states and related functions throughout the app. There is functionality
 *               for:
 *
 *  - User signup, login, and logout
 *  - Google authentication
 *  - Email verification
 *  - Role-based access control
 *  - Event participation management
 *  - Notification handling
 *  - Event status management
 */

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
const NOTIFICATION_TYPES = {
    ANNOUNCEMENT: "announcement",
    MESSAGE: "message",
    REQUEST: "request",
    REMINDER: "reminder",
    CONFIRMATION: "confirmation",
    REQUEST_APPROVED: "request_approved",
    REQUEST_REJECTED: "request_rejected",
    FEEDBACK_REQUEST_VOLUNTEER: "feedback_request_volunteer",
    FEEDBACK_REQUEST_MEMBER: "feedback_request_member",
    SERVICE_VERIFICATION: "service_verification",
    VERIFICATION_RESULT: "verification_result",
};

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
                signedUpServices: userData.signedUpServices || [],
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

    const removeScheduledReminder = async (eventId, userEmail) => {
        try {
            const userNotificationsRef = collection(
                db,
                `users/${userEmail}/notifications`
            );
            const q = query(
                userNotificationsRef,
                where("type", "==", "scheduled_reminder"),
                where("eventDetails.eventId", "==", eventId),
                where("delivered", "==", false)
            );

            const querySnapshot = await getDocs(q);
            const deletePromises = querySnapshot.docs.map((doc) =>
                deleteDoc(doc.ref)
            );
            await Promise.all(deletePromises);
        } catch (error) {
            console.error("Error removing scheduled reminder:", error);
        }
    };

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
                const now = new Date();
                const usersRef = collection(db, "users");
                const usersSnapshot = await getDocs(usersRef);

                for (const userDoc of usersSnapshot.docs) {
                    const userNotificationsRef = collection(
                        db,
                        `users/${userDoc.id}/notifications`
                    );

                    const expiredQuery = query(
                        userNotificationsRef,
                        where("expiresAt", "<=", Timestamp.fromDate(now))
                    );

                    const expiredSnapshot = await getDocs(expiredQuery);
                    const expiredDeletePromises = expiredSnapshot.docs.map(
                        (doc) => deleteDoc(doc.ref)
                    );

                    const deliveredRemindersQuery = query(
                        userNotificationsRef,
                        where("type", "==", "scheduled_reminder"),
                        where("delivered", "==", true)
                    );

                    const deliveredSnapshot = await getDocs(
                        deliveredRemindersQuery
                    );
                    const deliveredDeletePromises = deliveredSnapshot.docs.map(
                        (doc) => deleteDoc(doc.ref)
                    );

                    const undeliveredRemindersQuery = query(
                        userNotificationsRef,
                        where("type", "==", "scheduled_reminder"),
                        where("delivered", "==", false),
                        where("scheduledFor", "<=", Timestamp.fromDate(now))
                    );

                    const undeliveredSnapshot = await getDocs(
                        undeliveredRemindersQuery
                    );
                    const undeliveredDeletePromises =
                        undeliveredSnapshot.docs.map((doc) =>
                            deleteDoc(doc.ref)
                        );

                    await Promise.all([
                        ...expiredDeletePromises,
                        ...deliveredDeletePromises,
                        ...undeliveredDeletePromises,
                    ]);
                }
            } catch (error) {
                console.error("Error deleting expired notifications:", error);
            }
        };

        const interval = setInterval(
            deleteExpiredNotifications,
            60 * 60 * 1000
        );
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!user) return;

        const handleEventCompletion = async (eventDoc) => {
            const eventData = eventDoc.data();
            const eventRef = doc(db, "events", eventDoc.id);

            try {
                await updateDoc(eventRef, { status: "completed" });

                for (const volunteerEmail of eventData.participantList) {
                    await addDoc(
                        collection(db, `users/${volunteerEmail}/notifications`),
                        {
                            type: NOTIFICATION_TYPES.ANNOUNCEMENT,
                            message: `The service "${eventData.title}" has been completed. Thank you for your participation! A feedback form is provided below.`,
                            createdTimeStamp: Timestamp.now(),
                            createdBy: "system",
                            creatorName: "System",
                            userId: volunteerEmail,
                            eventDetails: {
                                title: eventData.title,
                                date: eventData.startTime
                                    .toDate()
                                    .toLocaleDateString(),
                                location: eventData.location,
                            },
                        }
                    );

                    await addDoc(
                        collection(db, `users/${volunteerEmail}/notifications`),
                        {
                            type: NOTIFICATION_TYPES.FEEDBACK_REQUEST_VOLUNTEER,
                            eventId: eventDoc.id,
                            eventDetails: {
                                title: eventData.title,
                                date: eventData.startTime
                                    .toDate()
                                    .toLocaleDateString(),
                                location: eventData.location,
                            },
                            feedbackForm: {
                                questions: [
                                    {
                                        id: "experience",
                                        type: "text",
                                        question:
                                            "How was your volunteering experience?",
                                    },
                                    {
                                        id: "challenges",
                                        type: "text",
                                        question:
                                            "What challenges did you face, if any?",
                                    },
                                    {
                                        id: "suggestions",
                                        type: "text",
                                        question:
                                            "Do you have any suggestions for improvement?",
                                    },
                                ],
                            },
                            createdTimeStamp: Timestamp.now(),
                            createdBy: "system",
                            creatorName: "System",
                            userId: volunteerEmail,
                            status: "pending",
                        }
                    );
                }

                if (eventData.isRequestedEvent && eventData.requestedByMember) {
                    await addDoc(
                        collection(
                            db,
                            `users/${eventData.requestedByMember}/notifications`
                        ),
                        {
                            type: NOTIFICATION_TYPES.FEEDBACK_REQUEST_MEMBER,
                            eventId: eventDoc.id,
                            eventDetails: {
                                title: eventData.title,
                                date: eventData.startTime
                                    .toDate()
                                    .toLocaleDateString(),
                                location: eventData.location,
                            },
                            feedbackForm: {
                                questions: [
                                    {
                                        id: "satisfaction",
                                        type: "boolean",
                                        question:
                                            "Was the service completed satisfactorily?",
                                    },
                                    {
                                        id: "rating",
                                        type: "rating",
                                        question:
                                            "How would you rate the service? (1-5)",
                                        options: [1, 2, 3, 4, 5],
                                    },
                                    {
                                        id: "comments",
                                        type: "text",
                                        question:
                                            "Additional comments or suggestions:",
                                    },
                                ],
                            },
                            createdTimeStamp: Timestamp.now(),
                            createdBy: "system",
                            creatorName: "System",
                            userId: eventData.requestedByMember,
                            status: "pending",
                        }
                    );
                }

                await addDoc(
                    collection(
                        db,
                        `users/${eventData.creatorEmail}/notifications`
                    ),
                    {
                        type: NOTIFICATION_TYPES.SERVICE_VERIFICATION,
                        eventId: eventDoc.id,
                        eventDetails: {
                            title: eventData.title,
                            date: eventData.startTime
                                .toDate()
                                .toLocaleDateString(),
                            location: eventData.location,
                        },
                        participantList: eventData.participantList,
                        createdTimeStamp: Timestamp.now(),
                        createdBy: "system",
                        creatorName: "System",
                        userId: eventData.creatorEmail,
                        status: "pending",
                    }
                );
            } catch (error) {
                console.error("Error in handleEventCompletion:", error);
                throw error;
            }
        };

        const updateEventStatuses = async () => {
            try {
                const eventsRef = collection(db, "events");
                const now = Timestamp.fromDate(new Date());

                const completionQuery = query(
                    eventsRef,
                    where("status", "==", "ongoing"),
                    where("endTime", "<=", now)
                );

                const completionSnapshot = await getDocs(completionQuery);
                for (const doc of completionSnapshot.docs) {
                    await handleEventCompletion(doc);
                }

                const startQuery = query(
                    eventsRef,
                    where("status", "==", "upcoming"),
                    where("startTime", "<=", now)
                );

                const startSnapshot = await getDocs(startQuery);
                for (const doc of startSnapshot.docs) {
                    const eventData = doc.data();
                    if (eventData.endTime.toDate() > now.toDate()) {
                        await updateDoc(doc.ref, { status: "ongoing" });
                    } else {
                        await handleEventCompletion(doc);
                    }
                }
            } catch (error) {
                console.error("Error updating event statuses:", error);
            }
        };

        updateEventStatuses();
        const intervalId = setInterval(updateEventStatuses, 10 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [user]);

    const contextValue = useMemo(
        () => ({
            user,
            tempUser,
            logOut,
            isLoading,

            /**
             * Signs up a new user with email and password.
             * @param {Object} info - User information (email, password,
             *                        first and last names, and role)
             * @returns {Promise<Object>} The newly created user object.
             * @throws {Error} If the email already exists or if an error
             *                 occurs during signup.
             */
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

            /**
             * Logs in a user with email and password.
             * @param {Object} info - Login information (email, password)
             * @returns {Promise<Object>} The logged in user object.
             * @throws {Error} If there is an error during login.
             */
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

            /**
             * Initiates Google SignIn process.
             * @returns {Promise<Object>} Object containing user data and checks
             *                            for if the user already exists.
             * @throws {Error} If there is an error during signing in with Google.
             */
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

            /**
             * Completes the registration process for a user who signed in with Google.
             * @param {string} role - The role selected by the user
             * @throws {Error} If there is no temporary user or if there is an error during
             *                 the process.
             */
            completeRegistration: async (role) => {
                if (!tempUser) throw new Error("No temporary user found.");
                try {
                    const userData = {
                        firstName: tempUser.displayName.split(" ")[0],
                        lastName: tempUser.displayName.split(" ")[1] || "",
                        role: role,
                        notifications: [],
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

            /**
             * Sends a verification email to the user.
             * @throws {Error} If no user is signed in or an error occurs.
             */
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

            /**
             * Updates the user's profile information
             * @param {Object} updates - The profile updates to apply.
             * @throws {Error} If there is an error updating the profile.
             */
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

            /**
             * Adds a new notification for the user.
             * @param {Object} notification - The notification object to add.
             * @throws {Error} If there is an error adding the notification.
             */
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

            /**
             * Updates a user's role.
             * @param {Object} user - the user object to update.
             * @param {string} role - The new role to assign.
             * @returns {Promise<Object>} The updated user object.
             * @throws {Error} If there is an error updating the user role.
             */
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

            /**
             * Fetches notifications for the current user.
             * @returns {Promise<Array>} An array of notification objects.
             */
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
                    return querySnapshot.docs
                        .map((doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        }))
                        .filter(
                            (notification) =>
                                notification.type !== "scheduled_reminder"
                        );
                } catch (error) {
                    console.error("Error fetching notifications:", error);
                    return [];
                }
            },

            /**
             * Handles the approval of the help request notification.
             * @param {string} notificationId - The ID of the notification to approve.
             * @returns {Promise<Object>} An object indicating success or failure.
             * @throws {Error} If there is an error that occurs during the process.
             */
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

            /**
             * Handles the rejection of the help request notification.
             * @param {string} notificationId - The ID of the notification to reject.
             * @returns {Promise<Object>} An object indicating success or failure.
             * @throws {Error} If there is an error that occurs during the process.
             */
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

            /**
             * Schedules a reminder notification for an event.
             * @param {string} eventId - The ID of the event to set a reminder for.
             * @param {string} userId - The ID of the user to send the reminder to.
             * @throws {Error} If the event is not found.
             */
            scheduleReminderNotification: async (eventId, userEmail) => {
                try {
                    const eventRef = doc(db, "events", eventId);
                    const eventDoc = await getDoc(eventRef);

                    if (!eventDoc.exists()) {
                        throw new Error("Event not found");
                    }

                    const eventData = eventDoc.data();
                    const reminderTime = new Date(
                        eventData.startTime.toDate().getTime() -
                            24 * 60 * 60 * 1000
                    );
                    const now = new Date();

                    if (reminderTime > now) {
                        const eventDate = eventData.startTime
                            .toDate()
                            .toLocaleDateString();
                        const eventTime = eventData.startTime
                            .toDate()
                            .toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            });

                        const scheduledReminder = {
                            type: "scheduled_reminder",
                            message: `You have an upcoming service "${eventData.title}" tomorrow.`,
                            createdBy: "system",
                            creatorName: "System",
                            userId: userEmail,
                            eventDetails: {
                                title: eventData.title,
                                date: eventDate,
                                time: eventTime,
                                location: eventData.location,
                                description: eventData.description,
                                eventId: eventId,
                            },
                            scheduledFor: Timestamp.fromDate(reminderTime),
                            createdTimeStamp: Timestamp.now(),
                            delivered: false,
                        };

                        await addDoc(
                            collection(db, `users/${userEmail}/notifications`),
                            scheduledReminder
                        );
                    }
                } catch (error) {
                    console.error(
                        "Error scheduling reminder notifications:",
                        error
                    );
                    handleAuthError(
                        error,
                        "An error occurred while scheduling reminders. Please try again."
                    );
                }
            },

            /**
             * Signs up a user for an event
             * @param {string} eventId - The ID of the event to sign up for.
             * @returns {Promise<boolean>} True if signup was successful.
             * @throws {Error} If the user is already signed up, the event is full,
             *                 the event is cancelled, or other errors occur.
             */
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

                    if (eventData.status === "cancelled") {
                        throw new Error("Event is cancelled");
                    }

                    await updateDoc(userRef, {
                        signedUpServices: arrayUnion(eventId),
                    });

                    await updateDoc(eventRef, {
                        currentParticipants: eventData.currentParticipants + 1,
                        participantList: arrayUnion(user.email),
                    });

                    await contextValue.addNotification({
                        type: "confirmation",
                        message: `You have successfully signed up for "${eventData.title}"`,
                        userId: user.email,
                        createdBy: "system",
                        creatorName: "System",
                        eventDetails: {
                            title: eventData.title,
                            date: eventData.startTime
                                .toDate()
                                .toLocaleDateString(),
                            time: eventData.startTime
                                .toDate()
                                .toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                }),
                            location: eventData.location,
                            description: eventData.description,
                            eventId: eventId,
                        },
                    });

                    await contextValue.scheduleReminderNotification(
                        eventId,
                        user.email
                    );

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

            /**
             * Removes the user from an event they're signed up for.
             * @param {string} eventId - The ID of the event to be removed from.
             * @returns {Promise<boolean>} True if the removal was successful.
             * @throws {Error} If the user is not signed up for the event or other
             *                 errors that may occur.
             */
            unSignFromEvent: async (eventId, participantEmail) => {
                if (!user) throw new Error("No user logged in");
                try {
                    const currentUser = auth.currentUser;
                    if (!currentUser) {
                        throw new Error("No user is currently logged in");
                    }

                    const userRef = doc(db, "users", currentUser.email);
                    const userDoc = await getDoc(userRef);
                    const userData = userDoc.data();

                    const eventRef = doc(db, "events", eventId);
                    const eventDoc = await getDoc(eventRef);

                    if (!eventDoc.exists()) {
                        throw new Error("Event not found");
                    }

                    const eventData = eventDoc.data();

                    if (
                        !eventData.participantList ||
                        !Array.isArray(eventData.participantList)
                    ) {
                        throw new Error("Event participants data is invalid");
                    }

                    const isCoordinator = userData.role === "coordinator";
                    const isSelfRemoval =
                        currentUser.email === participantEmail;

                    if (!isCoordinator && !isSelfRemoval) {
                        throw new Error(
                            "Unauthorized to remove this participant"
                        );
                    }

                    if (!eventData.participantList.includes(participantEmail)) {
                        throw new Error("User is not signed up for this event");
                    }

                    const updatedParticipants =
                        eventData.participantList.filter(
                            (email) => email !== participantEmail
                        );

                    await updateDoc(eventRef, {
                        participantList: updatedParticipants,
                        currentParticipants: eventData.currentParticipants - 1,
                    });

                    if (isSelfRemoval) {
                        const participantRef = doc(
                            db,
                            "users",
                            participantEmail
                        );
                        await updateDoc(participantRef, {
                            signedUpServices: arrayRemove(eventId),
                        });
                    }

                    await removeScheduledReminder(eventId, participantEmail);

                    const updatedEventDoc = await getDoc(eventRef);
                    return {
                        id: eventId,
                        ...updatedEventDoc.data(),
                        status: eventData.status,
                    };
                } catch (error) {
                    console.error("Error un-signing from event:", error);
                    throw error;
                }
            },

            /**
             * Checks if the current user's email is verified.
             * @returns {boolean} True if the email is verified, false otherwise.
             */
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
            try {
                const userNotificationsRef = collection(
                    db,
                    `users/${user.email}/notifications`
                );

                const q = query(
                    userNotificationsRef,
                    where("type", "==", "scheduled_reminder"),
                    where("delivered", "==", false)
                );

                const querySnapshot = await getDocs(q);
                const now = new Date();

                for (const doc of querySnapshot.docs) {
                    const reminderData = doc.data();
                    const scheduledTime = reminderData.scheduledFor.toDate();

                    if (scheduledTime <= now) {
                        try {
                            await addDoc(
                                collection(
                                    db,
                                    `users/${user.email}/notifications`
                                ),
                                {
                                    type: "reminder",
                                    message: reminderData.message,
                                    createdBy: reminderData.createdBy,
                                    creatorName: reminderData.creatorName,
                                    userId: reminderData.userId,
                                    eventDetails: reminderData.eventDetails,
                                    createdTimeStamp: Timestamp.now(),
                                    expiresAt: Timestamp.fromDate(
                                        new Date(
                                            now.getTime() + 24 * 60 * 60 * 1000
                                        )
                                    ),
                                }
                            );

                            await deleteDoc(doc.ref);
                        } catch (error) {
                            console.error(
                                "Error creating/deleting reminder:",
                                error
                            );
                        }
                    }
                }
            } catch (error) {
                console.error("Error checking scheduled notifications:", error);
            }
        };

        checkScheduledNotifications();

        const intervalId = setInterval(checkScheduledNotifications, 60000);

        return () => clearInterval(intervalId);
    }, [user]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export const UserAuth = () => useContext(AuthContext);
