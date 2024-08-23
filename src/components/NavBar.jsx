// components/Navbar.js
import React from "react";
import { Link } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { RiNotification4Line } from "react-icons/ri";
import logo from "../images/logo.jpg";
import "../styles/Navbar.css";

export const Navbar = () => {
    const { user, logOut } = UserAuth();

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <img src={logo} alt="logo" className="navbar-logo" />
                <h2 className="navbar-title">Helping Hands</h2>
            </div>
            <div className="navbar-right">
                {user ? (
                    <>
                        <Link to="/home">Home</Link>
                        {(user.role === "volunteer" ||
                            user.role === "coordinator") && (
                            <>
                                <Link to="/calendar">Calendar</Link>
                                <Link to="/tasks">Tasks</Link>
                            </>
                        )}
                        {user.role === "member" && <Link to="/help">Help</Link>}
                        <Link to="/profile">Profile</Link>
                        <Link to="/notifications">
                            <RiNotification4Line />
                        </Link>
                        <button onClick={logOut} className="navbar-button">
                            Log Out
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/signup">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
};
