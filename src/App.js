import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import { LogIn } from "./pages/LogIn";
import { SignUp } from "./pages/SignUp";
import { EmailVerification } from "./pages/EmailVerification";
import { Home } from "./pages/Home";
import { Calendar } from "./pages/Calendar";
import { Profile } from "./pages/Profile";
import { Tasks } from "./pages/Tasks";

import "./styles/App.css";

function App() {
    return (
        <div className="App">
            <Router>
                <Routes>
                    <Route path="/login" element={<LogIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route
                        path="/verify-page"
                        element={<EmailVerification />}
                    />
                    <Route path="/home" element={<Home />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/tasks" element={<Tasks />} />
                </Routes>
            </Router>
        </div>
    );
}

export default App;
