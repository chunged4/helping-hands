import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

export const RoleSelectionPage = () => {
    const [selectedRole, setSelectedRole] = useState("");
    const { updateUserRole } = UserAuth();

    const navigate = useNavigate();
    const location = useLocation();
    const signUpMethod = location.state?.signUpMethod;

    const handleRoleSelection = async () => {
        if (selectedRole) {
            try {
                await updateUserRole(selectedRole);
                if (signUpMethod === "email") {
                    navigate("/verify-page");
                } else if (signUpMethod === "google") {
                    navigate("/home");
                }
            } catch (error) {
                console.error("Error updating role:", error);
            }
        }
    };

    return (
        <div>
            <h2>Select Your Role</h2>
            <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
            >
                <option value="">Select a role</option>
                <option value="volunteer">Volunteer</option>
                <option value="coordinator">Coordinator</option>
            </select>
            <button onClick={handleRoleSelection}>Confirm Role</button>
        </div>
    );
};
