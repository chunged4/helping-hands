import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

import "../styles/RoleSelectionPage.css";

export const RoleSelectionPage = () => {
    const [error, setError] = useState(null);
    const {
        user,
        tempUser,
        completeRegistration,
        clearTempUser,
        updateUserRole,
    } = UserAuth();

    const navigate = useNavigate();

    useEffect(() => {
        if (!tempUser && !user) {
            navigate("/signup");
        }
        return () => {
            if (tempUser) {
                clearTempUser();
            }
        };
    }, [tempUser, user, navigate, clearTempUser]);

    const handleRoleSelection = async (role) => {
        try {
            if (tempUser) {
                await completeRegistration(role);
            } else if (user) {
                await updateUserRole(user, role);
            }
            if (role === "member") {
                navigate("/help");
            } else {
                navigate("/home");
            }
        } catch (error) {
            console.error("Error updating role:", error);
            setError("Failed to set role. Please try again.");
        }
    };

    if (!user && !tempUser) {
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
