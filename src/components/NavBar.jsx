import React from "react";
import { Link } from "react-router-dom";

export const Navbar = () => {
    return (
        <nav>
            <ul>
                <li>
                    <Link>Home</Link>
                </li>
                <li>Calendar</li>
                <li>Profile</li>
            </ul>
        </nav>
    );
};
