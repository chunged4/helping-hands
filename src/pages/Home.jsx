import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { auth } from "../config/firebase.config";
import { signOut } from "firebase/auth";

export const Home = () => {
    const [user, setUser] = useState(auth.currentUser);

    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    const logOut = async () => {
        try {
            await signOut(auth);
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
            <div>Home Page</div>
            <button onClick={logOut}>Logout</button>
        </div>
    );
};
