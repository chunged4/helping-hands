import React from "react";
import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate,
} from "react-router-dom";

import { AuthContextProvider, UserAuth } from "./context/AuthContext";

import { Landing } from "./pages/Landing";
import { LogIn } from "./pages/LogIn";
import { SignUp } from "./pages/SignUp";
import { EmailVerification } from "./pages/EmailVerification";
import { Home } from "./pages/Home";
import { Calendar } from "./pages/Calendar";
import { Profile } from "./pages/Profile";
import { Tasks } from "./pages/Tasks";
import { HelpForm } from "./pages/HelpForm";
import { RoleSelectionPage } from "./pages/RoleSelectionPage";

import { ProtectedRoute } from "./components/ProtectedRoute";

import "./styles/App.css";

function AppRoutes() {
    const { user } = UserAuth();

    return (
        <Routes>
            <Route
                path="/"
                element={user ? <Navigate to="/home" /> : <Landing />}
            />
            <Route path="/login" element={<LogIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify-page" element={<EmailVerification />} />
            <Route path="/role-selection" element={<RoleSelectionPage />} />
            <Route
                path="/home"
                element={
                    <ProtectedRoute allowedRoles={["volunteer", "coordinator"]}>
                        <Home />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/calendar"
                element={
                    <ProtectedRoute allowedRoles={["volunteer", "coordinator"]}>
                        <Calendar />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/tasks"
                element={
                    <ProtectedRoute allowedRoles={["volunteer", "coordinator"]}>
                        <Tasks />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/help"
                element={
                    <ProtectedRoute>
                        <HelpForm />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <div className="App">
            <AuthContextProvider>
                <Router>
                    <AppRoutes />
                </Router>
            </AuthContextProvider>
        </div>
    );
}

export default App;
