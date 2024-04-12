import { createContext, useContext, useEffect, useState } from "react";

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
import { doc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthContextProvider({ children }) {
    const [user, setUser] = useState({});

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
            } else {
                setUser({});
            }
        });
        return () => {
            unsubscribe();
        };
    }, []);

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
                firstName: info.firstName,
                lastName: info.lastName,
            });
            await setDoc(doc, (db, "users", user.uid), { services: [] });
            await sendEmailVerification(user);
            setUser(user);
        } catch (error) {
            throw new Error(
                "An error occurred while signing up your account. Please try again."
            );
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
            setUser(user);
        } catch (error) {
            throw new Error(
                "An error occurred while logging in with email and password. Please try again."
            );
        }
    }

    async function signInWithGoogle() {
        try {
            const results = await signInWithPopup(auth, googleProvider);
            const authInfo = {
                userID: results.user.uid,
                name: results.user.displayName,
                profilePhoto: results.user.photoURL,
                isAuth: true,
            };
            // might want to change to cookies, currently on local storage
            localStorage.setItem("user", JSON.stringify(authInfo));
            setUser(results.user);
        } catch (error) {
            throw new Error(
                "An error occurred while logging in with Google. Please try again."
            );
        }
    }

    async function logOut() {
        try {
            await signOut(auth);
            setUser({});
        } catch (error) {
            throw new Error(
                "An error occurred while signing out. Please try again."
            );
        }
    }

    async function sendVerificationEmail() {
        try {
            const user = auth.currentUser;
            await sendEmailVerification(user);
        } catch (error) {
            throw new Error(
                "An error occurred while sending your verification email. Please try again."
            );
        }
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
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function UserAuth() {
    return useContext(AuthContext);
}
