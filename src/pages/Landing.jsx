import React from "react";
import { useNavigate } from "react-router-dom";

import logo from "../images/logo.jpg";

import "../styles/Landing.css";

export const Landing = () => {
    const navigate = useNavigate();

    const sendToLogin = () => {
        navigate("/login");
    };
    const sendToSignup = () => {
        navigate("/signup");
    };

    return (
        <div>
            <div className="landingNav">
                <img src={logo} alt="logo" />
                <p className="title">Helping Hands</p>
                <button className="loginButton" onClick={sendToLogin}>
                    Log In
                </button>
                <button className="signupButton" onClick={sendToSignup}>
                    Get Started
                </button>
            </div>
            <div className="landingContainer"></div>
            {/* <p> Our mission: </p> */}
        </div>
    );
};
