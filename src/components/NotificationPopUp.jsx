import React, { useState, useEffect, useCallback } from "react";
import { UserAuth } from "../context/AuthContext";
import { NotificationCard } from "./NotificationCard";
import { db } from "../config/firebase.config";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

import "../styles/NotificationPopUp.css";

export const NotificationPopUp = ({ onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user, approveHelpRequest, rejectHelpRequest } = UserAuth();

    const fetchNotifications = useCallback(async () => {
        if (!user || !user.email) return;
        try {
            const userNotificationsRef = collection(
                db,
                "users",
                user.email,
                "notifications"
            );
            const q = query(
                userNotificationsRef,
                orderBy("createdTimeStamp", "desc"),
                limit(20)
            );
            const querySnapshot = await getDocs(q);
            const fetchedNotifications = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setNotifications(fetchedNotifications);
            setError(null);
        } catch (err) {
            console.error("Error fetching notifications:", err);
            setError("Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 3 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [fetchNotifications]);

    const handleApprove = async (id) => {
        try {
            await approveHelpRequest(id);
            setNotifications(notifications.filter((notif) => notif.id !== id));
        } catch (error) {
            console.error("Error approving help request:", error);
        }
    };

    const handleReject = async (id) => {
        try {
            await rejectHelpRequest(id);
            setNotifications(notifications.filter((notif) => notif.id !== id));
        } catch (error) {
            console.error("Error rejecting help request:", error);
        }
    };

    return (
        <div className="notification-popup">
            <div className="notification-header">
                <h2>Notifications</h2>
                <button onClick={onClose} className="close-button">
                    &times;
                </button>
            </div>
            <div className="notification-list">
                {loading && <p>Loading notifications...</p>}
                {error && <p className="error-message">Error: {error}</p>}
                {!loading && !error && notifications.length === 0 && (
                    <p>No new notifications</p>
                )}
                {!loading &&
                    !error &&
                    notifications.length > 0 &&
                    notifications.map((notification) => (
                        <NotificationCard
                            key={notification.id}
                            notification={notification}
                            onApprove={handleApprove}
                            onReject={handleReject}
                        />
                    ))}
            </div>
        </div>
    );
};
