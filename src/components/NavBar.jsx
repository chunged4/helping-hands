import React from "react";
import { Link } from "react-router-dom";

import "../styles/Navbar.css";

export const Navbar = () => {
    return (
        <nav>
            <ul>
                <div>
                    <Link to="/home" className="title">
                        Home
                    </Link>
                </div>
                <div>
                    <Link to="/calendar">Calendar</Link>
                </div>
                <div>
                    <Link to="/tasks">Tasks</Link>
                </div>
                {/* <li>
                    <Link to="/messaging">Messages</Link>
                </li> */}
                <div>
                    <Link to="/profile">Profile</Link>
                </div>
            </ul>
        </nav>
    );
};
