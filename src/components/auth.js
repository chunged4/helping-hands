import { useState } from "react";
import { auth, googleProvider } from "../config/firebase.config";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";

import "../styles/auth.css";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const logIn = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error(error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
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
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="form-element"
        placeholder="Password..."
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="form-element" onClick={logIn}>
        Log In
      </button>
      <button className="form-element" onClick={logOut}>
        Logout
      </button>
    </div>
  );
};
