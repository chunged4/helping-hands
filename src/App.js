import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import { AuthContextProvider } from "./context/AuthContext";

import { Landing } from "./pages/Landing";
import { LogIn } from "./pages/LogIn";
import { SignUp } from "./pages/SignUp";
import { EmailVerification } from "./pages/EmailVerification";
import { Home } from "./pages/Home";
import { Calendar } from "./pages/Calendar";
import { Profile } from "./pages/Profile";
import { Tasks } from "./pages/Tasks";
import { HelpForm } from "./pages/HelpForm";

import { ProtectedRoute } from "./components/ProtectedRoute";

import "./styles/App.css";

function App() {
    return (
        <div className="App">
            <AuthContextProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<LogIn />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route
                            path="/verify-page"
                            element={<EmailVerification />}
                        />
                        <Route
                            path="/home"
                            element={
                                <ProtectedRoute
                                    allowedRoles={["volunteer", "coordinator"]}
                                >
                                    <Home />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/calendar"
                            element={
                                <ProtectedRoute
                                    allowedRoles={["volunteer", "coordinator"]}
                                >
                                    <Calendar />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/tasks"
                            element={
                                <ProtectedRoute
                                    allowedRoles={["volunteer", "coordinator"]}
                                >
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
                </Router>
            </AuthContextProvider>
        </div>
    );
}

export default App;
