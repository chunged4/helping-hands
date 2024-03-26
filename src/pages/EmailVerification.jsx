import React from "react";
import { useLocation } from "react-router-dom";

import { auth } from "../config/firebase.config";

import "../styles/EmailVerification.css";
import { sendEmailVerification } from "firebase/auth";

export const EmailVerification = () => {
    const location = useLocation();
    const { email } = location.state || {};

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
                link in your email to verify your account.
            </div>
            <div>
                Click on the link in the email to complete your signup. If you
                don't see it, you may need to <b>check your spam</b> folder.
            </div>
            <div>Still can't find the email?</div>
            <button onClick={handleResendVerification}>
                Resend Verification Email
            </button>
        </div>
    );
};
