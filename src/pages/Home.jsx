import React from "react";
import { useNavigate } from "react-router-dom";

import { UserAuth } from "../context/AuthContext";

export const Home = () => {
    const navigate = useNavigate();
    const { user, logOut } = UserAuth();

    const handleLogOut = async () => {
        try {
            await logOut();
            navigate("/login");
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <div>
                {user && user.firstName && <div>Welcome, {user.firstName}</div>}
            </div>
            <h1>Home</h1>
            <button onClick={handleLogOut}>Logout</button>
        </div>
    );
};
