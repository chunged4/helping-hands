import React from "react";
import { Navigate } from "react-router-dom";

import { UserAuth } from "../context/AuthContext";

export const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = UserAuth();

    if (!user) {
        return <Navigate to="/" />;
    }

    if (!user.role) {
        return <Navigate to="/role-selection" />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/home" />;
    }

    return children;
};
