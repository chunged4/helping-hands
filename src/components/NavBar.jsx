import React from "react";
import { Link } from "react-router-dom";

import { UserAuth } from "../context/AuthContext";

import { RiNotification4Line } from "react-icons/ri";
import { RiNotification4Fill } from "react-icons/ri";

import logo from "../images/logo.jpg";

import "../styles/Navbar.css";

export const Navbar = () => {
    const { user, logout } = UserAuth();

    return (
        <nav>
            <ul>
                <div className="title">
                    <h2> Helping Hands</h2> <img src={logo} alt="logo" />
                </div>
                {user ? (
                    <>
                        <div>
                            <Link to="/home">Home</Link>
                        </div>
                        {(user.role === "volunteer" ||
                            user.role === "coordinator") && (
                            <>
                                <div>
                                    <Link to="/calendar">Calendar</Link>
                                </div>
                                <div>
                                    <Link to="/tasks">Tasks</Link>
                                </div>
                            </>
                        )}
                        <div>
                            <Link to="/help">Help</Link>
                        </div>
                        <div>
                            <Link to="/profile">Profile</Link>
                        </div>
                        <div>
                            <Link to="/notifications">
                                {/* if there is a notification, use <Rinotification4fill />, no notification, use <Rinotification4line /> */}
                            </Link>
                        </div>
                        <div>
                            <button onClick={logout}>Log Out</button>
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <Link to="/login">Log In</Link>
                        </div>
                        <div>
                            <Link to="/signup">Get Started</Link>
                        </div>
                    </>
                )}
            </ul>
        </nav>
    );
};
