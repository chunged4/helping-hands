/**
 * @fileoverview This component is a modal that shows events in greater detail.
 *               Interactions: A volunteer role can click on the open slots to signup,
 *               as well as remove themselves from the event.
 *               A coordinator can signup, cancel the event, remove users from the event,
 *               and can manually add users with an email lookup.
 */

import React, { useState, useEffect } from "react";
import { db } from "../config/firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { UserAuth } from "../context/AuthContext";

import "../styles/EventModal.css";

export const EventModal = ({ event: initialEvent, onClose }) => {
    const [event, setEvent] = useState(initialEvent);
    const [coordinator, setCoordinator] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [manualAddEmail, setManualAddEmail] = useState("");
    const [showManualAdd, setShowManualAdd] = useState(false);
    const {
        user,
        signUpForEvent,
        unSignFromEvent,
        addNotification,
        getEventStatus,
        updateEventStatus,
        cancelEvent,
    } = UserAuth();

    useEffect(() => {
        const fetchCoordinator = async () => {
            if (event.creatorEmail) {
                const userDocRef = doc(db, "users", event.creatorEmail);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setCoordinator(userDocSnap.data());
                }
            }
        };

        const fetchParticipants = async () => {
            const participantPromises = event.participantList.map(
                async (email) => {
                    const userDocRef = doc(db, "users", email);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        return {
                            email,
                            name: `${userData.firstName} ${userData.lastName}`,
                        };
                    }
                    return { email, name: email };
                }
            );
            const participantData = await Promise.all(participantPromises);
            setParticipants(participantData);
        };

        fetchCoordinator();
        fetchParticipants();
    }, [event.creatorEmail, event.participantList]);

    useEffect(() => {
        const checkAndUpdateStatus = async () => {
            const currentStatus = getEventStatus(event);
            if (currentStatus !== event.status) {
                const updatedEvent = await updateEventStatus(event);
                setEvent(updatedEvent);
            }
        };

        checkAndUpdateStatus();

        // Set up an interval to check status every minute
        const intervalId = setInterval(checkAndUpdateStatus, 60000);

        // Clean up the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, [event, getEventStatus, updateEventStatus]);

    if (!event) return null;

    const formatDate = (date) => {
        if (!(date instanceof Date)) {
            date = date.toDate ? date.toDate() : new Date(date);
        }
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (date) => {
        if (!(date instanceof Date)) {
            date = date.toDate ? date.toDate() : new Date(date);
        }
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const getSignupStatus = () => {
        if (event.status === "cancelled") {
            return "Event cancelled";
        } else if (event.canSignUp) {
            return "Open for signup";
        } else if (event.currentParticipants >= event.maxParticipants) {
            return "Event is full";
        } else {
            return "Signup closed";
        }
    };

    const handleSignUp = async () => {
        try {
            await signUpForEvent(event.id);
            onClose();
        } catch (error) {
            console.error("Failed to sign up for event:", error);
        }
    };

    const handleUnSignUp = async (email) => {
        try {
            await unSignFromEvent(event.id);
            setParticipants(participants.filter((p) => p.email !== email));
            if (email === user.email) {
                onClose();
            }
        } catch (error) {
            console.error("Failed to remove from event:", error);
        }
    };

    const handleManualAdd = async () => {
        if (!manualAddEmail) return;

        try {
            const userDocRef = doc(db, "users", manualAddEmail);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                if (userData.role === "volunteer") {
                    await signUpForEvent(event.id, manualAddEmail);
                    setParticipants([
                        ...participants,
                        {
                            email: manualAddEmail,
                            name: `${userData.firstName} ${userData.lastName}`,
                        },
                    ]);

                    setManualAddEmail("");
                    setShowManualAdd(false);
                } else {
                    alert("Only volunteers can be added to events.");
                }
            } else {
                alert("User not found");
            }
        } catch (error) {
            console.error("Error manually adding participant:", error);
        }
    };

    const handleCancelEvent = async () => {
        try {
            await cancelEvent(event.id);

            for (const participant of participants) {
                await addNotification({
                    type: "announcement",
                    message: `The event "${
                        event.title
                    }" scheduled for ${formatDate(
                        event.startTime
                    )} at ${formatTime(event.startTime)} has been cancelled.`,
                    createdBy: user.email,
                    creatorName: `${user.firstName} ${user.lastName}`,
                    userId: participant.email,
                    messageData: {
                        eventId: event.id,
                        eventTitle: event.title,
                        eventDate: formatDate(event.startTime),
                        eventTime: formatTime(event.startTime),
                    },
                });
            }

            setEvent((prevEvent) => ({
                ...prevEvent,
                status: "cancelled",
                canSignUp: false,
            }));

            alert(
                "Event cancelled successfully. All participants have been notified."
            );
        } catch (error) {
            console.error("Failed to cancel event:", error);
            alert("Failed to cancel event. Please try again.");
        }
    };

    return (
        <div className="event-modal">
            <div className="modal-overlay" onClick={onClose}>
                <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 className="event-title">{event.title}</h2>
                    <div className="event-details">
                        <div className="event-info">
                            <p>
                                <strong>Date:</strong>{" "}
                                {formatDate(event.startTime)}
                            </p>
                            <p>
                                <strong>Time:</strong>{" "}
                                {formatTime(event.startTime)} -{" "}
                                {formatTime(event.endTime)}
                            </p>
                            <p>
                                <strong>Location:</strong> {event.location}
                            </p>
                            <p>
                                <strong>Status:</strong> {event.status}
                            </p>
                            <p>
                                <strong>Signup Status:</strong>{" "}
                                {getSignupStatus()}
                            </p>
                            <p>
                                <strong>Participants:</strong>{" "}
                                {event.currentParticipants} /{" "}
                                {event.maxParticipants}
                            </p>
                        </div>
                        <div className="event-description">
                            <p>{event.description}</p>
                        </div>
                    </div>

                    {coordinator && (
                        <p className="coordinator-info">
                            Event Coordinator: {coordinator.firstName}{" "}
                            {coordinator.lastName}
                        </p>
                    )}

                    {user.email === event.creatorEmail &&
                        event.status !== "cancelled" && (
                            <button
                                onClick={handleCancelEvent}
                                className="cancel-event-button"
                            >
                                Cancel Event
                            </button>
                        )}

                    <h3>Attendees</h3>
                    <div className="attendees-table">
                        {participants.map((participant, index) => (
                            <div key={index} className="attendee-row">
                                {(user.email === event.creatorEmail ||
                                    user.email === participant.email) && (
                                    <span
                                        className="remove-participant"
                                        onClick={() =>
                                            handleUnSignUp(participant.email)
                                        }
                                    >
                                        ×
                                    </span>
                                )}
                                <span className="participant-name">
                                    {participant.name}
                                </span>
                            </div>
                        ))}
                        {event.canSignUp &&
                            event.currentParticipants < event.maxParticipants &&
                            !event.participantList.includes(user.email) && (
                                <div
                                    className="attendee-row available"
                                    onClick={handleSignUp}
                                >
                                    Click here to sign up
                                </div>
                            )}
                    </div>

                    {user.email === event.creatorEmail && (
                        <div className="coordinator-actions">
                            <button
                                onClick={() => setShowManualAdd(!showManualAdd)}
                            >
                                {showManualAdd
                                    ? "Cancel"
                                    : "Manually Add Participant"}
                            </button>
                            {showManualAdd && (
                                <div className="manual-add-form">
                                    <input
                                        type="email"
                                        value={manualAddEmail}
                                        onChange={(e) =>
                                            setManualAddEmail(e.target.value)
                                        }
                                        placeholder="Enter volunteer's email"
                                    />
                                    <button onClick={handleManualAdd}>
                                        Add
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {!event.canSignUp &&
                        event.currentParticipants < event.maxParticipants && (
                            <p className="signup-closed-message">
                                Sign-ups are currently closed for this event.
                            </p>
                        )}

                    {event.currentParticipants >= event.maxParticipants && (
                        <p className="event-full-message">
                            This event is full.
                        </p>
                    )}

                    <button onClick={onClose} className="close-button">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
