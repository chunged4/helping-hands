import React from "react";

import { Navbar } from "../components/NavBar.jsx";

import "../styles/Landing.css";

export const Landing = () => {
    return (
        <div>
            <div className="landingContainer">
                <div className="navbarContainer">
                    <Navbar />
                </div>
                <div className="content">{/* <p> Our mission: </p> */}</div>
            </div>
        </div>
    );
};
