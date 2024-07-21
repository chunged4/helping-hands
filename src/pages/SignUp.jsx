import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleButton from "react-google-button";

import { ShowPasswordIconButton } from "../components/ShowPasswordIconButton";
import { RequirementCheckmark } from "../components/RequirementCheckmark";
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
    const [passwordType, setPasswordType] = useState({
        password: "password",
    });
    const [validateType, setValidateType] = useState({
        lower: false,
        upper: false,
        number: false,
        symbol: false,
        length: false,
    });

    const navigate = useNavigate();
    const { errors, validate } = useValidation();
    const { signUp, signInWithGoogle, sendVerificationEmail } = UserAuth();

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
            await sendVerificationEmail();
            setError(null);
            // navigate to verify page to prompt user to verify their email
            navigate("/verify-page", { state: { email: info.email } });
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
                        required
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
                        required
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
                        required
                        aria-invalid="true"
                        aria-errormessage="email-error"
                        value={info.email}
                        onChange={handleInput}
                    />
                    {errors.email && (
                        <p className="error-message">{errors.email}</p>
                    )}
                </section>

                <section>
                    <label htmlFor="password">Password</label>
                    <input
                        className="form-element"
                        id="password"
                        name="password"
                        placeholder=" "
                        autoComplete="new-password"
                        type={passwordType.password}
                        value={info.password}
                        onChange={handlePasswordInput}
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
                    {errors.password && (
                        <p className="error-message">{errors.password}</p>
                    )}
                </section>

                <section>
                    <label htmlFor="accountType">Account Type</label>
                    <select
                        className="form-element"
                        id="accountType"
                        name="accountType"
                        required
                        value={info.accountType}
                        onChange={handleInput}
                    >
                        <option value="">Select Account Type</option>
                        <option value="coordinator">
                            Volunteer Coordinator
                        </option>
                        <option value="volunteer">Volunteer</option>
                        <option value="member">Member</option>
                    </select>
                    {errors.accountType && (
                        <p className="error-message">{errors.accountType}</p>
                    )}
                </section>

                <section>
                    <main className="tracker-box">
                        <p>Password must contain the following:</p>

                        <div
                            className={
                                validateType.lower
                                    ? "validated"
                                    : "not-validated"
                            }
                        >
                            <RequirementCheckmark
                                validateState={validateType.lower}
                            />
                            <span>Lowercase letter</span>
                        </div>
                        <div>
                            <RequirementCheckmark
                                validateState={validateType.upper}
                            />
                            Uppercase letter
                        </div>
                        <div>
                            <RequirementCheckmark
                                validateState={validateType.number}
                            />
                            Number
                        </div>
                        <div>
                            <RequirementCheckmark
                                validateState={validateType.symbol}
                            />
                            Symbol
                        </div>
                        <div>
                            <RequirementCheckmark
                                validateState={validateType.length}
                            />
                            10 Characters
                        </div>
                    </main>
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
                Already have an account? <Link to="/login">Log in</Link>
            </div>
        </div>
    );
};
