/**
 * @fileoverview This component handles the elements a user needs to navigate around,
 *               toggling the notification modal, and logging out.
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { RiNotification4Line, RiNotification4Fill } from "react-icons/ri";
import { NotificationPopUp } from "./NotificationPopUp";

import logo from "../images/logo.jpg";
import "../styles/Navbar.css";
import "../styles/NotificationPopUp.css";

export const Navbar = () => {
    const { user, logOut } = UserAuth();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    const navigate = useNavigate();

    const toggleNotificationModal = () => {
        setIsNotificationOpen(!isNotificationOpen);
    };

    const handleLogout = async () => {
        try {
            await logOut();
            navigate("/");
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <img src={logo} alt="logo" className="navbar-logo" />
                <h2 className="navbar-title">Helping Hands</h2>
            </div>
            <div className="navbar-right">
                {user ? (
                    <>
                        {(user.role === "volunteer" ||
                            user.role === "coordinator") && (
                            <>
                                <Link to="/home">Home</Link>
                                <Link to="/calendar">Calendar</Link>
                            </>
                        )}
                        {user.role === "coordinator" && (
                            <>
                                <Link to="/create-event">Create Event</Link>
                                <Link to="/event-feedback">Feedback</Link>
                            </>
                        )}
                        {user.role === "member" && <Link to="/help">Help</Link>}
                        <button
                            onClick={toggleNotificationModal}
                            className="navbar-icon-button"
                        >
                            {isNotificationOpen ? (
                                <RiNotification4Line />
                            ) : (
                                <RiNotification4Fill />
                            )}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="navbar-button"
                        >
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
            {isNotificationOpen && (
                <div className="notification-modal">
                    <NotificationPopUp
                        onClose={() => setIsNotificationOpen(false)}
                    />
                </div>
            )}
        </nav>
    );
};
