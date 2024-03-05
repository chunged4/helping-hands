import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleButton from "react-google-button";
// import {calendar} from 'react-icons-kit/iconic/calendar'

import { auth, googleProvider } from "../config/firebase.config";
import {
    createUserWithEmailAndPassword,
    signInWithPopup,
    fetchSignInMethodsForEmail,
} from "firebase/auth";

import { ShowPasswordIconButton } from "../components/ShowPasswordIconButton";
import { useValidation } from "../hooks/useValidation";
import "../styles/SignUp.css";

export const SignUp = () => {
    const [values, setValues] = useState({
        firstName: "",
        lastName: "",
        email: "",
        currentPassword: "",
        confirmPassword: "",
    });
    const [error, setError] = useState(null);
    // makes sure there is only one request after clicking the button
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [passwordType, setPasswordType] = useState({
        password: "password",
        confirmPassword: "password",
    });

    const navigate = useNavigate();
    const { errors, validate } = useValidation();

    const handleValidation = async (e) => {
        e.preventDefault();
        const isValid = validate(values);

        if (!isValid || isSigningUp) {
            return;
        }

        try {
            const checkEmailExists = await fetchSignInMethodsForEmail(
                auth,
                values.email
            );
            if (checkEmailExists.length > 0) {
                setError("Email address already exists.");
                return;
            }
            setIsSigningUp(true);
            await createUserWithEmailAndPassword(
                auth,
                values.email,
                values.password
            );
            setError(null);
            navigate("/home");
        } catch (error) {
            console.error(error);
            setError(
                "An error occurred while signing up your account. Please try again."
            );
        } finally {
            setIsSigningUp(false);
        }
    };

    const handleInput = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
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
                        value={values.firstName}
                        onChange={handleInput}
                    />
                    {errors.firstName && (
                        <p className="error-message">{errors.firstName}</p>
                    )}
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
                        value={values.lastName}
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
                        value={values.email}
                        onChange={handleInput}
                    />
                    {errors.email && (
                        <p className="error-message">{errors.email}</p>
                    )}
                </section>

                <section>
                    <label htmlFor="currentPassword">Password</label>
                    <input
                        className="form-element"
                        id="currentPassword"
                        name="currentPassword"
                        placeholder=" "
                        autoComplete="new-password"
                        type={passwordType.password}
                        value={values.password}
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
                    {errors.password && (
                        <p className="error-message">{errors.password}</p>
                    )}
                </section>

                <section>
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                        className="form-element"
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder=" "
                        autoComplete="new-password"
                        type={passwordType.confirmPassword}
                        value={values.confirmPassword}
                        onChange={handleInput}
                    />
                    <ShowPasswordIconButton
                        passwordType={passwordType.confirmPassword}
                        setPasswordType={(newType) =>
                            setPasswordType({
                                ...passwordType,
                                confirmPassword: newType,
                            })
                        }
                    />
                    {errors.confirmPassword && (
                        <p className="error-message">
                            {errors.confirmPassword}
                        </p>
                    )}
                </section>

                <button
                    className="form-element"
                    id="signUp"
                    onClick={handleValidation}
                >
                    Sign Up
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
                Already have an account? <Link to="/login">Log in</Link>
            </div>
        </div>
    );
};
