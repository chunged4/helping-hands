import { useState } from "react";
import { auth, googleProvider } from "../config/firebase.config";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

import "../styles/auth.css";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="login-form">
      <h1>Log In</h1>
      <button className="form-element">Continue with Google</button>
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
      <button className="form-element">Log In</button>
    </div>
  );
};
