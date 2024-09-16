import React, { useState, useEffect, useCallback } from "react";
import { UserAuth } from "../context/AuthContext";
import { NotificationCard } from "./NotificationCard";

import "../styles/NotificationPopUp.css";

export const NotificationPopUp = ({ onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, fetchNotifications } = UserAuth();

    const loadNotifications = useCallback(async () => {
        if (user) {
            setLoading(true);
            const fetchedNotifications = await fetchNotifications();
            setNotifications(fetchedNotifications);
            setLoading(false);
        }
    }, [user, fetchNotifications]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const handleNotificationUpdate = useCallback((id) => {
        setNotifications((prevNotifications) =>
            prevNotifications.filter((notif) => notif.id !== id)
        );
    }, []);

    return (
        <div className="notification-popup">
            <div className="notification-header">
                <h2>Notifications</h2>
                <button onClick={onClose} className="close-button">
                    &times;
                </button>
            </div>
            <div className="notification-list">
                {loading ? (
                    <p>Loading notifications...</p>
                ) : notifications.length === 0 ? (
                    <p>No new notifications</p>
                ) : (
                    notifications.map((notification) => (
                        <NotificationCard
                            key={notification.id}
                            notification={notification}
                            onNotificationUpdate={handleNotificationUpdate}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
