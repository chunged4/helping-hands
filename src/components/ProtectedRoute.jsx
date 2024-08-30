import React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { UserAuth } from "../context/AuthContext";

export const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = UserAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/" />;
    }

    if (!user.role) {
        return <Navigate to="/role-selection" />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (location.pathname === "/help" && user.role !== "member") {
            return <Navigate to="/home" />;
        }
        if (location.pathname === "/home" && user.role === "member") {
            return <Navigate to="/help" />;
        }
        return <Navigate to="/home" />;
    }

    return children;
};
