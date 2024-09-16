import React, { useState, useEffect } from "react";
import { db } from "../config/firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { UserAuth } from "../context/AuthContext";

import "../styles/EventModal.css";

export const EventModal = ({ event, onClose }) => {
    const [coordinator, setCoordinator] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [manualAddEmail, setManualAddEmail] = useState("");
    const [showManualAdd, setShowManualAdd] = useState(false);
    const { user, signUpForEvent, unSignFromEvent } = UserAuth();

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

    if (!event) return null;

    const formatDate = (date) => {
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const getSignupStatus = () => {
        if (event.canSignUp) {
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
            // Handle error (e.g., show error message to user)
        }
    };

    const handleUnSignUp = async (email) => {
        try {
            await unSignFromEvent(event.id);
            onClose();
        } catch (error) {
            console.error("Failed to remove from event:", error);
            // Handle error (e.g., show error message to user)
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
                    setParticipants([
                        ...participants,
                        {
                            email: manualAddEmail,
                            name: `${userData.firstName} ${userData.lastName}`,
                        },
                    ]);
                    await signUpForEvent(event.id, manualAddEmail);

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
