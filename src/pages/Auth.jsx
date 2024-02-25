import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../config/firebase.config";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";

import "../styles/Auth.css";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const navigate = useNavigate();

  const handleLogIn = async () => {
    if (isLoggingIn) {
      return;
    }

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
      setIsLoggingIn(true);
      await createUserWithEmailAndPassword(auth, email, password);
      setError(null);
      navigate("/home");
    } catch (error) {
      console.error(error);
      setError("An error occurred while logging in. Please try again.");
    } finally {
      setIsLoggingIn(false);
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

  return (
    <div className="login-page">
      <h1>Log In</h1>
      <form className="login-form">
        <button className="form-element" onClick={signInWithGoogle}>
          Continue with Google
        </button>
        <input
          className="form-element"
          placeholder="Email:"
          autoComplete="email"
          type="email"
          required
          aria-invalid="true"
          aria-errormessage="email-error"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="form-element"
          placeholder="Password:"
          autoComplete="current-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="form-element" onClick={handleLogIn}>
          Log In
        </button>

        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
};
