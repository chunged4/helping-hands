import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleButton from "react-google-button";

import { ShowPasswordIconButton } from "../components/ShowPasswordIconButton";
import { PasswordRequirements } from "../components/PasswordRequriements";
import { UserAuth } from "../context/AuthContext";
import { useValidation } from "../hooks/useValidation";

import "../styles/SignUp.css";

export const SignUp = () => {
    const [info, setInfo] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        accountType: "",
    });
    const [error, setError] = useState(null);
    const [passwordType, setPasswordType] = useState("password");
    const [validateType, setValidateType] = useState({
        lower: false,
        upper: false,
        number: false,
        symbol: false,
        length: false,
    });

    const navigate = useNavigate();
    const { errors, validate } = useValidation();
    const { signUp, signInWithGoogle } = UserAuth();

    const handleInput = (e) => {
        setInfo({ ...info, [e.target.name]: e.target.value });
    };

    const handlePasswordInput = (e) => {
        const password = e.target.value;
        setInfo({ ...info, password });

        setValidateType({
            lower: /(?=.*[a-z])/.test(password),
            upper: /(?=.*[A-Z])/.test(password),
            number: /(?=.*\d)/.test(password),
            symbol: /(?=.*[!@#$%^&*])/.test(password),
            length: /(?=.{10,})/.test(password),
        });
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        const isValid = validate(info);
        if (!isValid) {
            return;
        }

        try {
            await signUp(info);
            setError(null);
            navigate("/role-selection", { state: { signUpMethod: "email" } });
        } catch (error) {
            setError(error.message);
        }
    };

    const handleGoogleSignIn = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const result = await signInWithGoogle();
            if (result.user) {
                navigate("/role-selection", {
                    state: { signUpMethod: "google" },
                });
            } else {
                setError("Failed to sign in with Google. Please try again.");
            }
        } catch (error) {
            setError(
                error.message ||
                    "Failed to sign in with Google. Please try again."
            );
        }
    };

    return (
        <div className="signup-page">
            <form className="signup-form">
                <h1>Sign Up</h1>

                <section>
                    <label htmlFor="firstName">First Name</label>
                    <input
                        className="form-element"
                        id="firstName"
                        name="firstName"
                        placeholder=" "
                        autoComplete="firstName"
                        type="text"
                        aria-errormessage="firstName-error"
                        value={info.firstName}
                        onChange={handleInput}
                    />
                    {errors.firstName && (
                        <p className="error-message">{errors.firstName}</p>
                    )}
                </section>

                <section>
                    <label htmlFor="lastName">Last Name</label>
                    <input
                        className="form-element"
                        id="lastName"
                        name="lastName"
                        placeholder=" "
                        autoComplete="lastName"
                        type="text"
                        aria-invalid="true"
                        aria-errormessage="lastName-error"
                        value={info.lastName}
                        onChange={handleInput}
                    />
                    {errors.lastName && (
                        <p className="error-message">{errors.lastName}</p>
                    )}
                </section>

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
                    {errors.email && (
                        <p className="error-message">{errors.email}</p>
                    )}
                </section>

                <section className="password-section">
                    <label htmlFor="password">Password</label>
                    <div className="password-input-container">
                        <input
                            className="form-element"
                            id="password"
                            name="password"
                            placeholder=" "
                            autoComplete="new-password"
                            type={passwordType}
                            value={info.password}
                            onChange={handlePasswordInput}
                        />
                        <PasswordRequirements validateType={validateType} />
                        <ShowPasswordIconButton
                            passwordType={passwordType}
                            setPasswordType={setPasswordType}
                        />
                    </div>
                    {errors.password && (
                        <p className="error-message">{errors.password}</p>
                    )}
                </section>

                {error && <p className="error-message">{error}</p>}

                <button
                    className="form-element"
                    id="signUp"
                    onClick={handleSignUp}
                >
                    Sign Up
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
            <br></br>
            <div>
                Already have an account? <Link to="/login">Log in</Link>
            </div>
        </div>
    );
};
