/**
 * @fileoverview This page holds all of the elements on the landing page, where
 *               a user is able to sign up and login. The user will not be able
 *               visit the landing page as long as they are logged in.
 */

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { UserAuth } from "../context/AuthContext";
import { Navbar } from "../components/NavBar.jsx";

import "../styles/Landing.css";

export const Landing = () => {
    const { user } = UserAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate("/home");
        }
    }, [user, navigate]);

    if (user) {
        return null;
    }

    return (
        <div>
            <div className="landingContainer">
                <div className="navbarContainer">
                    <Navbar />
                </div>
                <div className="content">
                    <h3>
                        Making our community a better place, one hand at a time.
                    </h3>
                    <button
                        className="cta-button"
                        onClick={() => navigate("/signup")}
                    >
                        Sign Up Here
                    </button>
                </div>
            </div>
        </div>
    );
};
