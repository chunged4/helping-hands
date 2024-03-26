import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleButton from "react-google-button";
// import {calendar} from 'react-icons-kit/iconic/calendar'

import { auth, googleProvider } from "../config/firebase.config";
import {
    createUserWithEmailAndPassword,
    signInWithPopup,
    fetchSignInMethodsForEmail,
    sendEmailVerification,
} from "firebase/auth";

import { ShowPasswordIconButton } from "../components/ShowPasswordIconButton";
import { RequirementCheckmark } from "../components/RequirementCheckmark";
import { useValidation } from "../hooks/useValidation";
import "../styles/SignUp.css";

export const SignUp = () => {
    const [info, setInfo] = useState({
        firstName: "",
        lastName: "",
        email: "",
        currentPassword: "",
    });
    const [error, setError] = useState(null);
    // makes sure there is only one request after clicking the button
    const [isSigningUp, setIsSigningUp] = useState(false);
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

    const handleValidation = async (e) => {
        e.preventDefault();
        const isValid = validate(info);

        if (!isValid || isSigningUp) {
            return;
        }

        try {
            const checkEmailExists = await fetchSignInMethodsForEmail(
                auth,
                info.email
            );
            if (checkEmailExists.length > 0) {
                setError("Email address already exists.");
                return;
            }
            setIsSigningUp(true);
            await createUserWithEmailAndPassword(
                auth,
                info.email,
                info.password
            ).then(async (userCredential) => {
                const user = userCredential.user;
                await sendEmailVerification(user);
            });
            setError(null);
            // navigate to verify page to prompt user to verify their email
            navigate("/verify-page", { state: { email: info.email } });
        } catch (error) {
            console.error(error);
            setError(
                "An error occurred while signing up your account. Please try again."
            );
        } finally {
            setIsSigningUp(false);
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
