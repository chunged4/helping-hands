import React from "react";
import { Route, Navigate } from "react-router-dom";

import { UserAuth } from "../context/AuthContext";

export const ProtectedRoute = ({ element, ...rest }) => {
    const { user } = UserAuth();
    return user ? (
        <Route {...rest} element={element} />
    ) : (
        <Navigate to="/login" />
    );
};
