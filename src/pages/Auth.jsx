import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../config/firebase.config";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";

import "../styles/Auth.css";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const logIn = async () => {
    if (!email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setError(null);
      navigate("/home");
    } catch (error) {
      console.error(error);
      setError("An error occurred while logging in. Please try again.");
    }
  };

  const signInWithGoogle = async () => {
    try {
      const results = await signInWithPopup(auth, googleProvider);
      const authInfo = {
        userID: results.user.uid,
        name: results.user.displayName,
        profilePhoto: results.user.photoURL,
        isAuth: true,
      };
      // might want to change to cookies, currently on local storage
      localStorage.setItem("auth", JSON.stringify(authInfo));
      navigate("/home");
    } catch (error) {
      console.error(error);
      setError(
        "An error occurred while logging in with Google. Please try again."
      );
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="login-form">
      <h1>Log In</h1>
      <button className="form-element" onClick={signInWithGoogle}>
        Continue with Google
      </button>
      <input
        className="form-element"
        placeholder="Email..."
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="form-element"
        placeholder="Password..."
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="form-element" onClick={logIn}>
        Log In
      </button>
      <button className="form-element" onClick={logOut}>
        Logout
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};
