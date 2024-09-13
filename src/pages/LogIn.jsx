import { useEffect, useState, useCallback } from "react";
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
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { user, logIn, signInWithGoogle, updateUserRole } = UserAuth();

    const redirectBasedOnRole = useCallback(
        (currentUser) => {
            if (currentUser) {
                if (currentUser.role === "member") {
                    navigate("/help");
                } else if (
                    currentUser.role === "volunteer" ||
                    currentUser.role === "coordinator"
                ) {
                    navigate("/home");
                } else {
                    setError("User role not found. Please contact support.");
                }
            } else {
                setError("User not found. Please try logging in again.");
            }
        },
        [navigate]
    );

    useEffect(() => {
        if (user) {
            redirectBasedOnRole(user);
        }
    }, [user, redirectBasedOnRole]);

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

        setIsLoading(true);
        try {
            await logIn(info);
            setError(null);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const { user: googleUser, existingUser } = await signInWithGoogle();
            if (!existingUser) {
                await updateUserRole(googleUser, "member");
            }
        } catch (error) {
            console.error(error.message);
            setError("Failed to sign in with Google.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="login-page">
            <form className="login-form" onSubmit={handleLogIn}>
                <h1>Log In</h1>
                <p>
                    Logging in using Google without an account will default to a
                    member.
                </p>
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
                <button className="form-element" id="logIn" type="submit">
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
            <div className="message">
                Don't have an account?{" "}
                <Link to="/signup">Create an Account</Link>
            </div>
        </div>
    );
};
