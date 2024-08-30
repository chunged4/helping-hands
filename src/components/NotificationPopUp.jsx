import React, { useState, useEffect } from "react";

import { UserAuth } from "../context/AuthContext";
import { Notification } from "./Notification";

import "../styles/NotificationPopUp.css";

export const NotificationPopUp = ({ onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const { fetchNotifications } = UserAuth();

    useEffect(() => {
        const getNotifications = async () => {
            const fetchedNotifications = await fetchNotifications();
            setNotifications(fetchedNotifications);
        };

        getNotifications();
    }, [fetchNotifications]);

    return (
        <div className="notification-popup">
            <div className="notification-header">
                <h2>Notifications</h2>
                <button onClick={onClose} className="close-button">
                    &times;
                </button>
            </div>
            <div className="notification-list">
                {notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <Notification
                            key={notification.id}
                            type={notification.type}
                            message={notification.message}
                            timestamp={notification.createdAt
                                .toDate()
                                .toLocaleString()}
                        />
                    ))
                ) : (
                    <p>No new notifications</p>
                )}
            </div>
        </div>
    );
};
