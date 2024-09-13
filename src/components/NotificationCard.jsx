import React from "react";
import { IoIosCheckmarkCircleOutline } from "react-icons/io";
import { BsXCircle } from "react-icons/bs";
import { UserAuth } from "../context/AuthContext";

import "../styles/NotificationCard.css";

export const NotificationCard = ({ notification }) => {
    const { user, onApprove, onReject } = UserAuth();

    const getNotificationTitle = () => {
        switch (notification.type) {
            case "announcement":
                return `Announcement from: ${notification.creatorName}`;
            case "message":
                return `Message from: ${notification.creatorName}`;
            case "request":
                return `New Help Request from: ${notification.creatorName}`;
            case "request_approved":
                return `Request Approved by: ${notification.creatorName}`;
            case "request_rejected":
                return `Request Rejected by: ${notification.creatorName}`;
            default:
                return `Notification from: ${notification.creatorName}`;
        }
    };

    const renderMessage = () => {
        if (notification.type === "request" && notification.messageData) {
            return (
                <>
                    Location: {notification.messageData.location}
                    <br />
                    Suggested Start Time: {notification.messageData.time}
                    <br />
                    Description: {notification.messageData.description}
                </>
            );
        }
        return notification.message;
    };

    const handleApprove = async () => {
        try {
            console.log("Approving notification:", notification);
            console.log("Notification ID:", notification.id);
            await onApprove(notification.id);
            console.log("Notification approved successfully");
        } catch (error) {
            console.error("Error approving notification:", error);
        }
    };

    const handleReject = async () => {
        try {
            console.log("Rejecting notification:", notification);
            console.log("Notification ID:", notification.id);
            await onReject(notification.id);
            console.log("Notification rejected successfully");
        } catch (error) {
            console.error("Error rejecting notification:", error);
        }
    };

    return (
        <div className="notification-card">
            <h3 className="notification-title">{getNotificationTitle()}</h3>
            <p className="notification-message">{renderMessage()}</p>
            {user.role === "coordinator" && notification.type === "request" && (
                <div className="notification-actions">
                    <button onClick={handleApprove} className="approve-button">
                        <IoIosCheckmarkCircleOutline /> Approve
                    </button>
                    <button onClick={handleReject} className="reject-button">
                        <BsXCircle /> Reject
                    </button>
                </div>
            )}
        </div>
    );
};
