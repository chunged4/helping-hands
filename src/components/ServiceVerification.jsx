/**
 * @fileoverview This component is a type of notification that is sent to coordinators
 *               to verify each volunteer's event completion.
 */

import React, { useState, useEffect } from "react";
import { addDoc, collection, doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../config/firebase.config";
import { UserAuth } from "../context/AuthContext";

import "../styles/ServiceVerification.css";

export const ServiceVerification = ({ notification, onNotificationUpdate }) => {
    const [verifiedParticipants, setVerifiedParticipants] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [participantDetails, setParticipantDetails] = useState({});
    const { user, addNotification } = UserAuth();

    useEffect(() => {
        const fetchParticipantDetails = async () => {
            const details = {};
            for (const email of notification.participantList) {
                try {
                    const userDoc = await getDoc(doc(db, "users", email));
                    if (userDoc.exists()) {
                        details[email] = userDoc.data();
                    }
                } catch (error) {
                    console.error("Error fetching participant details:", error);
                }
            }
            setParticipantDetails(details);
        };
        fetchParticipantDetails();
    }, [notification.participantList]);

    const handleVerification = async (participantEmail) => {
        setVerifiedParticipants((prev) => ({
            ...prev,
            [participantEmail]: !prev[participantEmail],
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const verifiedEmails = Object.entries(verifiedParticipants)
                .filter(([_, verified]) => verified)
                .map(([email]) => email);

            const coordinatorDoc = await getDoc(doc(db, "users", user.email));
            const coordinatorData = coordinatorDoc.exists()
                ? coordinatorDoc.data()
                : {};
            const coordinatorName =
                coordinatorData.firstName && coordinatorData.lastName
                    ? `${coordinatorData.firstName} ${coordinatorData.lastName}`
                    : user.displayName || "Coordinator";

            await addDoc(collection(db, "service_verifications"), {
                eventId: notification.eventId,
                verifiedParticipants: verifiedEmails,
                verifiedBy: user.email,
                verifiedByName: coordinatorName,
                verifiedAt: new Date(),
            });

            for (const email of verifiedEmails) {
                await addNotification({
                    type: "verification_result",
                    message: `Your participation in "${notification.eventDetails.title}" has been verified by ${coordinatorName} (${user.email}).`,
                    userId: email,
                    eventDetails: notification.eventDetails,
                    createdTimeStamp: new Date(),
                    verifiedBy: {
                        email: user.email,
                        name: coordinatorName,
                    },
                });
            }

            const notificationRef = doc(
                db,
                `users/${user.email}/notifications/${notification.id}`
            );
            await deleteDoc(notificationRef);

            onNotificationUpdate(notification.id);
        } catch (error) {
            console.error("Error submitting verifications:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="verification-request">
            <div className="event-details">
                <h4>{notification.eventDetails.title}</h4>
                <p>Date: {notification.eventDetails.date}</p>
                <p>Location: {notification.eventDetails.location}</p>
            </div>
            <div className="participant-list">
                {notification.participantList.map((participantEmail) => (
                    <div
                        key={participantEmail}
                        className="participant-verification"
                    >
                        <span>
                            {participantDetails[participantEmail]
                                ? `${participantDetails[participantEmail].firstName} ${participantDetails[participantEmail].lastName}`
                                : "Loading..."}
                        </span>
                        <span>{participantEmail}</span>
                        <button
                            onClick={() => handleVerification(participantEmail)}
                            className={`verify-button ${
                                verifiedParticipants[participantEmail]
                                    ? "verified"
                                    : ""
                            }`}
                        >
                            {verifiedParticipants[participantEmail]
                                ? "Verified"
                                : "Verify"}
                        </button>
                    </div>
                ))}
            </div>
            <button
                onClick={handleSubmit}
                className="submit-button"
                disabled={
                    isSubmitting ||
                    !Object.values(verifiedParticipants).some((v) => v)
                }
            >
                {isSubmitting ? "Submitting..." : "Submit Verifications"}
            </button>
        </div>
    );
};
