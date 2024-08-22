import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../config/firebase.config";

import { UserAuth } from "../context/AuthContext";

import "../styles/EmailVerification.css";

export const EmailVerification = () => {
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, sendVerificationEmail } = UserAuth();
    const { email } = location.state || {};

    useEffect(() => {
        const checkVerification = async () => {
            await auth.currentUser.reload();
            if (auth.currentUser.emailVerified) {
                navigate("/home");
            }
        };
        checkVerification();
    }, [navigate]);

    const userEmail = user ? user.email : email;

    if (!userEmail) {
        return (
            <div className="verify-container">
                No email found for verification
            </div>
        );
    }

    const handleResendVerification = async () => {
        try {
            await sendVerificationEmail();
            setError(null);
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="verify-container">
            <h1>One Last Step!</h1>
            <div>
                A verification link has been sent to <b>{email}</b>. Please
                click the link in your email to verify your account and complete
                your signup.
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
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};
