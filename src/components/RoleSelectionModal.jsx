import React, { useState, useEffect } from "react";

export const RoleSelectionModal = ({ onClose, onSubmit }) => {
    const [selectedRole, setSelectedRole] = useState("");
    const [canClose, setCanClose] = useState(false);

    useEffect(() => {
        const closeTimer = setTimeout(() => setCanClose(true), 5000);
        return () => clearTimeout(closeTimer);
    }, []);

    const handleSubmit = async () => {
        onSubmit(selectedRole);
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <h2>Complete Your Registration</h2>
                <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                >
                    <option value="">Select Account Type</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="coordinator">Volunteer Coordinator</option>
                    <option value="community">Community Member</option>
                </select>
                <button
                    onClick={handleSubmit}
                    disabled={!selectedRole}
                ></button>
                <button onClick={onClose} disabled={!canClose}>
                    {canClose ? "Close" : "Please select a role"}
                </button>
            </div>
        </div>
    );
};
