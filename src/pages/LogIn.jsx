import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleButton from "react-google-button";

import { ShowPasswordIconButton } from "../components/ShowPasswordIconButton";
import { UserAuth } from "../context/AuthContext";

import "../styles/LogIn.css";

export const LogIn = () => {
    const [info, setInfo] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState(null);
    const [passwordType, setPasswordType] = useState("password");

    const navigate = useNavigate();
    const { logIn, signInWithGoogle } = UserAuth();

    const handleInput = (e) => {
        setInfo({ ...info, [e.target.name]: e.target.value });
    };

    const handleLogIn = async (e) => {
        e.preventDefault();

        if (!info.email.trim()) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!info.email || !info.password) {
            setError("Please enter both email and password.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(info.email)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            await logIn(info);
            setError(null);
            navigate("/home");
        } catch (error) {
            setError(error.message);
        }
    };

    const handleGoogleSignIn = async (e) => {
        e.preventDefault();
        try {
            await signInWithGoogle();
            navigate("/home");
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="login-page">
            <form className="login-form">
                <h1>Log In</h1>

                <section>
                    <label htmlFor="email">Email</label>
                    <input
                        className="form-element"
                        id="email"
                        name="email"
                        placeholder=" "
                        autoComplete="email"
                        type="email"
                        aria-invalid="true"
                        aria-errormessage="email-error"
                        value={info.email}
                        onChange={handleInput}
                    />
                </section>

                <section className="password-section">
                    <label htmlFor="current-password">Password</label>
                    <div className="password-input-container">
                        <input
                            className="form-element"
                            id="current-password"
                            name="password"
                            placeholder=" "
                            autoComplete="current-password"
                            type={passwordType}
                            value={info.password}
                            onChange={handleInput}
                        />
                        <ShowPasswordIconButton
                            passwordType={passwordType}
                            setPasswordType={setPasswordType}
                        />
                    </div>
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
                        className="google-button"
                        type="dark"
                        onClick={handleGoogleSignIn}
                    >
                        Continue with Google
                    </GoogleButton>
                </section>
            </form>
            <div>
                Don't have an account?{" "}
                <Link to="/signup">Create an Account</Link>
            </div>
        </div>
    );
};
