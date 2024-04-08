import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { auth } from "../config/firebase.config";

import "../styles/EmailVerification.css";
import { sendEmailVerification } from "firebase/auth";

export const EmailVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { email } = location.state || {};

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const idToken = await user.getIdToken();
                    if (user.emailVerified && idToken) {
                        navigate("/home");
                    } else {
                        console.log("Email not verified");
                    }
                } catch (error) {
                    console.error("Error getting user token", error);
                }
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    if (!email) {
        return (
            <div className="verify-container">
                No email found for verification
            </div>
        );
    }

    const handleResendVerification = () => {
        const user = auth.currentUser;
        sendEmailVerification(user).catch((error) => {
            console.error("Error sending verification email", error);
        });
    };

    return (
        <div className="verify-container">
            <h2>Please verify your email</h2>
            <div>
                A verification link has been sent to {email}. Please click the
                link in your email to verify your account and complete your
                signup.
            </div>
            <div>
                If you don't see it, this process might take a couple of
                minutes, or you may need to check your <b>spam</b> folder.
            </div>
            <div>
                If you have verified, but have not yet been redirected, you can
                click <Link to="/home">here</Link>
            </div>
            <div>Still can't find the email?</div>
            <button onClick={handleResendVerification}>
                Resend Verification Email
            </button>
        </div>
    );
};
