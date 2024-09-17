/**
 * @fileoverview This page is one of the steps in the user authentication flow, where
 *               the user has to stop and wait to verify their email in order to continue
 *               to the home page.
 */

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../config/firebase.config";

import { UserAuth } from "../context/AuthContext";

import "../styles/EmailVerification.css";

export const EmailVerification = () => {
    const [error, setError] = useState(null);
    const [isVerified, setIsVerified] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, sendVerificationEmail } = UserAuth();
    const { email } = location.state || {};

    useEffect(() => {
        const checkVerification = async () => {
            if (auth.currentUser) {
                await auth.currentUser.reload();
                if (auth.currentUser.emailVerified) {
                    setIsVerified(true);
                    navigate("/home");
                }
            }
        };

        const interval = setInterval(checkVerification, 5000);

        return () => clearInterval(interval);
    }, [navigate]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const userEmail = user ? user.email : email;

    if (!userEmail) {
        return (
            <div className="verify-container">
                No email found for verification
            </div>
        );
    }

    const handleResendVerification = async () => {
        if (cooldown > 0) {
            setError(
                `Please wait ${cooldown} seconds before requesting another email.`
            );
            return;
        }

        try {
            await sendVerificationEmail();
            setError(null);
            setCooldown(60);
        } catch (error) {
            if (error.code === "auth/too-many-requests") {
                setError("Too many requests. Please try again later.");
                setCooldown(300);
            } else {
                setError(error.message);
            }
        }
    };

    if (isVerified) {
        return (
            <div className="verify-container">
                <h1>Email Verified!</h1>
                <p>
                    Your email has been successfully verified. Redirecting to
                    home page...
                </p>
            </div>
        );
    }

    return (
        <div className="verify-container">
            <h1>One Last Step!</h1>
            <div>
                A verification link has been sent to <b>{userEmail}</b>. Please
                click the link in your email to verify your account and complete
                your signup.
            </div>
            <div>
                If you don't see it, this process might take a couple of
                minutes, or you may need to check your <b>spam</b> folder.
            </div>
            <div>
                After clicking the verification link, you will be automatically
                redirected. If you have verified, but have not yet been
                redirected, you can click <Link to="/home">here</Link>
            </div>
            <div>Still can't find the email?</div>
            <button onClick={handleResendVerification} disabled={cooldown > 0}>
                {cooldown > 0
                    ? `Resend Verification Email (${cooldown}s)`
                    : "Resend Verification Email"}
            </button>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};
