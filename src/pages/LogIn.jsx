import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { auth, googleProvider } from "../config/firebase.config";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

import GoogleButton from "react-google-button";

import { ShowPasswordButton } from "../components/ShowPasswordButton";
import "../styles/LogIn.css";

export const LogIn = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    // makes sure there is only one request after clicking the button
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // const { user, setUser } = useContext(UserAuthContextProvider);

    const navigate = useNavigate();

    const handleLogIn = async (e) => {
        e.preventDefault();
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
            await signInWithEmailAndPassword(auth, email, password);
            setError(null);
            navigate("/home");
        } catch (error) {
            console.error(error);
            setError("An error occurred while logging in. Please try again.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const signInWithGoogle = async (e) => {
        e.preventDefault();
        try {
            const results = await signInWithPopup(auth, googleProvider);
            const authInfo = {
                userID: results.user.uid,
                name: results.user.displayName,
                profilePhoto: results.user.photoURL,
                isAuth: true,
            };
            // might want to change to cookies, currently on local storage
            localStorage.setItem("user", JSON.stringify(authInfo));
            navigate("/home");
        } catch (error) {
            console.error(error);
            setError(
                "An error occurred while logging in with Google. Please try again."
            );
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prevShowPassword) => !prevShowPassword);
    };

    return (
        <div className="login-page">
            <form className="login-form">
                <h1>Log In</h1>

                <section>
                    <label for="email">Email</label>
                    <input
                        className="form-element"
                        id="email"
                        name="email"
                        placeholder=" "
                        autoComplete="email"
                        type="email"
                        required
                        aria-invalid="true"
                        aria-errormessage="email-error"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </section>

                <section>
                    <label for="current-password">Password</label>
                    <input
                        className="form-element"
                        id="current-password"
                        name="current-password"
                        placeholder=" "
                        autoComplete="current-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <ShowPasswordButton
                        showPassword={showPassword}
                        togglePasswordVisibility={togglePasswordVisibility}
                    />
                </section>

                {error && <p className="error-message">{error}</p>}
                <button
                    className="form-element"
                    id="logIn"
                    onClick={handleLogIn}
                >
                    Log In
                </button>
                <hr></hr>

                <section>
                    <GoogleButton
                        className="form-element"
                        type="dark"
                        onClick={signInWithGoogle}
                    >
                        Continue with Google
                    </GoogleButton>
                </section>
            </form>
            <br></br>
            <div>
                Don't have an account?{" "}
                <Link to="/signup">Create an Account</Link>
            </div>
        </div>
    );
};
