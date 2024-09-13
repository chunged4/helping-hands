import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

import "../styles/RoleSelection.css";

export const RoleSelection = () => {
    const [error, setError] = useState(null);
    const {
        user,
        tempUser,
        completeRegistration,
        clearTempUser,
        updateUserRole,
        sendVerificationEmail,
    } = UserAuth();

    const navigate = useNavigate();
    const location = useLocation();
    const { signUpMethod, email } = location.state || {};

    useEffect(() => {
        if (!tempUser && !user && !email) {
            navigate("/signup");
        }
        return () => {
            if (tempUser) {
                clearTempUser();
            }
        };
    }, [tempUser, user, email, navigate, clearTempUser]);

    const handleRoleSelection = async (role) => {
        try {
            let updatedUser;
            if (tempUser) {
                updatedUser = await completeRegistration(role);
            } else if (user) {
                updatedUser = await updateUserRole(user, role);
            } else if (email) {
                updatedUser = await updateUserRole({ email }, role);
            } else {
                throw new Error("No user or email found for role update");
            }

            if (!updatedUser) {
                throw new Error(
                    "Failed to update user role: updateUserRole returned null or undefined"
                );
            }

            if (signUpMethod === "email") {
                try {
                    await sendVerificationEmail();
                    navigate("/verify-page", {
                        state: { email: updatedUser.email },
                    });
                } catch (verificationError) {
                    console.error(
                        "Error sending verification email:",
                        verificationError
                    );
                    setError(
                        "Role updated successfully, but failed to send verification email. Please check your email settings or try again later."
                    );
                }
            } else {
                if (role === "member") {
                    navigate("/help");
                } else {
                    navigate("/home");
                }
            }
        } catch (error) {
            console.error("Error in handleRoleSelection:", error);
            setError(`Failed to set role: ${error.message}. Please try again.`);
        }
    };

    if (!user && !tempUser && !email) {
        console.log(
            "No user, tempUser, or email found. Redirecting to signup."
        );
        return null;
    }

    return (
        <div className="role-selection-container">
            <div className="role-selection-card">
                <h2 className="role-selection-title">Select Your Role</h2>
                <p className="role-selection-subtitle">
                    Choose the role that best describes you
                </p>
                {error && <div className="role-selection-error">{error}</div>}
                <div className="role-selection-buttons">
                    <button
                        onClick={() => handleRoleSelection("volunteer")}
                        className="role-button role-button-primary"
                    >
                        Volunteer
                    </button>
                    <button
                        onClick={() => handleRoleSelection("coordinator")}
                        className="role-button role-button-outline"
                    >
                        Coordinator
                    </button>
                    <button
                        onClick={() => handleRoleSelection("member")}
                        className="role-button role-button-secondary"
                    >
                        Member
                    </button>
                </div>
            </div>
        </div>
    );
};
