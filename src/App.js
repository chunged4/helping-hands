import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import { Home } from "./pages/Home";
import { LogIn } from "./pages/LogIn";
import { SignUp } from "./pages/SignUp";
import { EmailVerification } from "./pages/EmailVerification";

import "./styles/App.css";
// import { UserAuthContextProvider } from "./context/UserAuthContext";

function App() {
    return (
        <div className="App">
            <Router>
                <Routes>
                    <Route path="/home" element={<Home />} />
                    <Route path="/login" element={<LogIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route
                        path="/verify-page"
                        element={<EmailVerification />}
                    />
                </Routes>
            </Router>
        </div>
    );
}

export default App;
