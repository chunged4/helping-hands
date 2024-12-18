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
import { HelpForm } from "./pages/HelpForm";
import { RoleSelection } from "./pages/RoleSelection";
import { CreateEvent } from "./pages/CreateEvent";
import { Feedback } from "./pages/Feedback";

import { NotificationTestPage } from "./pages/NotificationTestPage";

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
            <Route path="/role-selection" element={<RoleSelection />} />
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
                path="/test-notifications"
                element={<NotificationTestPage />}
            />
            <Route
                path="/help"
                element={
                    <ProtectedRoute allowedRoles={["member"]}>
                        <HelpForm />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/create-event"
                element={
                    <ProtectedRoute allowedRoles={["coordinator"]}>
                        <CreateEvent />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/event-feedback"
                element={
                    <ProtectedRoute allowedRoles={["coordinator"]}>
                        <Feedback />
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
                <Router
                    future={{
                        v7_startTransition: true,
                        v7_relativePath: true,
                        v7_relativeSplatPath: true,
                    }}
                >
                    <AppRoutes />
                </Router>
            </AuthContextProvider>
        </div>
    );
}

export default App;
