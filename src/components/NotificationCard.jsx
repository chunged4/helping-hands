/**
 * @fileoverview This component handles all the details about a notification like
 *               the title and the message. A coordinator is the only one able to
 *               receive help requests and is able to approve or reject the requests.
 */

import React, { useState } from "react";
import { IoIosCheckmarkCircleOutline } from "react-icons/io";
import { BsXCircle } from "react-icons/bs";
import { UserAuth } from "../context/AuthContext";

import "../styles/NotificationCard.css";

export const NotificationCard = ({ notification, onNotificationUpdate }) => {
    const { user, onApprove, onReject } = UserAuth();
    const [isProcessing, setIsProcessing] = useState(false);

    const getNotificationTitle = () => {
        switch (notification.type) {
            case "announcement":
                return `Announcement from: ${notification.creatorName}`;
            case "message":
                return `Message from: ${notification.creatorName}`;
            case "request":
                return `New Help Request from: ${notification.creatorName}`;
            case "reminder":
                return "⏰ Event Reminder ⏰";
            case "confirmation":
                return "Confirmation Message:";
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
                    Suggested Date: {notification.messageData.date}
                    <br />
                    Suggested Start Time: {notification.messageData.time}
                    <br />
                    Urgency: {notification.messageData.urgency}
                    <br />
                    Description: {notification.messageData.description}
                </>
            );
        }

        if (
            (notification.type === "reminder" ||
                notification.type === "confirmation") &&
            notification.eventDetails
        ) {
            return (
                <div className="reminder-details">
                    <div className="reminder-main-message">
                        {notification.message}
                    </div>
                    <div className="reminder-specifics">
                        {notification.eventDetails.title && (
                            <div className="reminder-item">
                                <strong>Event:</strong>{" "}
                                {notification.eventDetails.title}
                            </div>
                        )}
                        {notification.eventDetails.date && (
                            <div className="reminder-item">
                                <strong>Date:</strong>{" "}
                                {notification.eventDetails.date}
                            </div>
                        )}
                        {notification.eventDetails.time && (
                            <div className="reminder-item">
                                <strong>Time:</strong>{" "}
                                {notification.eventDetails.time}
                            </div>
                        )}
                        {notification.eventDetails.location && (
                            <div className="reminder-item">
                                <strong>Location:</strong>{" "}
                                {notification.eventDetails.location}
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return notification.message;
    };

    const handleApprove = async () => {
        if (notification.type !== "request") return;
        setIsProcessing(true);
        const result = await onApprove(notification.id);
        if (result.success) {
            onNotificationUpdate(notification.id);
        }
        setIsProcessing(false);
    };

    const handleReject = async () => {
        if (notification.type !== "request") return;
        setIsProcessing(true);
        const result = await onReject(notification.id);
        if (result.success) {
            onNotificationUpdate(notification.id);
        }
        setIsProcessing(false);
    };

    return (
        <div className={`notification-card ${notification.type}`}>
            <h3 className="notification-title">{getNotificationTitle()}</h3>
            <p className="notification-message">{renderMessage()}</p>
            {user.role === "coordinator" && notification.type === "request" && (
                <div className="notification-actions">
                    <button
                        onClick={handleApprove}
                        className="approve-button"
                        disabled={isProcessing}
                    >
                        <IoIosCheckmarkCircleOutline /> Approve
                    </button>
                    <button
                        onClick={handleReject}
                        className="reject-button"
                        disabled={isProcessing}
                    >
                        <BsXCircle /> Reject
                    </button>
                </div>
            )}
        </div>
    );
};
