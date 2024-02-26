import "./styles/App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import { Home } from "./pages/Home";
import { LogIn } from "./pages/LogIn";
import { SignUp } from "./pages/SignUp";

import { UserAuthContextProvider } from "./context/UserAuthContext";

function App() {
  return (
    <UserAuthContextProvider>
      <div className="App">
        <Router>
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<LogIn />} />
            <Route path="/signup" element={<SignUp />} />
          </Routes>
        </Router>
      </div>
    </UserAuthContextProvider>
  );
}

export default App;
