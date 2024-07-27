import React, { useState, useEffect } from "react";

import { UserAuth } from "../context/AuthContext";

export const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const { user } = UserAuth();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                // Fetch notifications for the user
                // const response = await fetch("/api/notifications", {
                //     method: "GET",
                //     headers: {
                //         Authorization: `Bearer ${user.token}`,
                //     },
                // });
                // const data = await response.json();
                // setNotifications(data.notifications);
            } catch (error) {
                console.error(error);
            }
        };

        fetchNotifications();
    }, [user]);

    return (
        <div className="notifications">
            <h2>Notifications</h2>
            {notifications.map((notification) => (
                <div key={notification.id}>{notification.message}</div>
            ))}
        </div>
    );
};
