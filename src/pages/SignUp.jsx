import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleButton from "react-google-button";

import { ShowPasswordIconButton } from "../components/ShowPasswordIconButton";
import { RequirementCheckmark } from "../components/RequirementCheckmark";
import { RoleSelectionModal } from "../components/RoleSelectionModal";
import { UserAuth } from "../context/AuthContext";
import { useValidation } from "../hooks/useValidation";

import { deleteUser, signOut } from "firebase/auth";
import { auth } from "../config/firebase.config";

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
    const [currentUser, setCurrentUser] = useState(null);
    const [showRoleSelectModal, setShowRoleSelectModal] = useState(false);
    const [signUpMethod, setSignUpMethod] = useState(null);

    const navigate = useNavigate();
    const { errors, validate } = useValidation();
    const { signUp, signInWithGoogle, sendVerificationEmail, updateUserRole } =
        UserAuth();

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
            const user = await signUp(info);
            setError(null);
            setSignUpMethod("email");
            setCurrentUser(user);
            setShowRoleSelectModal(true);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleGoogleSignIn = async (e) => {
        e.preventDefault();
        try {
            const user = await signInWithGoogle();
            setSignUpMethod("google");
            setCurrentUser(user);
            setShowRoleSelectModal(true);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleModalClose = async () => {
        setShowRoleSelectModal(false);
        if (signUpMethod === "email") {
            try {
                await deleteUser(auth.currentUser);
                setError(
                    "Account creation cancelled. Please try again if you wish to create an account."
                );
            } catch (error) {
                console.error("Error deleting incomplete account: ", error);
            }
        }
        if (signUpMethod === "google") {
            await signOut(auth);
            setError(
                "Signup cancelled. Please try again if you with to create an account."
            );
        }
    };

    const handleRoleSelection = async (selectedRole) => {
        setShowRoleSelectModal(false);
        try {
            await updateUserRole(currentUser, selectedRole);
            if (signUpMethod === "email") {
                await sendVerificationEmail();
                navigate("/verify-page", { state: { email: info.email } });
            } else if (signUpMethod === "google") {
                navigate("/home");
            }
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
            {showRoleSelectModal && (
                <RoleSelectionModal
                    onClose={handleModalClose}
                    onSubmit={handleRoleSelection}
                />
            )}
        </div>
    );
};
