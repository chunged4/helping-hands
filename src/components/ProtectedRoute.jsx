import React from "react";
import { Route, Navigate } from "react-router-dom";

import { UserAuth } from "../context/AuthContext";

export const ProtectedRoute = ({ element, ...rest }) => {
    const { user, loading } = UserAuth();

    if (loading) {
        // Handle loading state (optional)
        return <div>Loading...</div>;
    }

    return user ? (
        <Route {...rest} element={element} />
    ) : (
        <Navigate to="/login" state={{ from: rest.location.pathname }} />
    );
};
