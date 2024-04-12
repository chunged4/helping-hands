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
    const [passwordType, setPasswordType] = useState({
        password: "password",
    });

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
                        required
                        aria-invalid="true"
                        aria-errormessage="email-error"
                        value={info.email}
                        onChange={handleInput}
                    />
                </section>

                <section>
                    <label htmlFor="current-password">Password</label>
                    <input
                        className="form-element"
                        id="current-password"
                        name="current-password"
                        placeholder=" "
                        autoComplete="current-password"
                        type={passwordType.password}
                        value={info.password}
                        onChange={handleInput}
                    />
                    <ShowPasswordIconButton
                        passwordType={passwordType.password}
                        setPasswordType={(newType) =>
                            setPasswordType({
                                ...passwordType,
                                password: newType,
                            })
                        }
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
                        onClick={handleGoogleSignIn}
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
