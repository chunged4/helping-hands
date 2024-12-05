/**
 * @fileoverview This component is a modal that shows events in greater detail.
 *               Interactions: A volunteer role can click on the open slots to signup,
 *               as well as remove themselves from the event.
 *               A coordinator can signup, cancel the event, remove users from the event,
 *               and can manually add users with an email lookup.
 */

import React, { useState, useEffect } from "react";
import { db } from "../config/firebase.config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { UserAuth } from "../context/AuthContext";
import { CancelConfirmation } from "./CancelConfirmation";

import "../styles/EventModal.css";

export const EventModal = ({
    event: initialEvent,
    onClose,
    onUpdatedEvent,
}) => {
    const [event, setEvent] = useState(initialEvent);
    const [coordinator, setCoordinator] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [signupSkills, setSignupSkills] = useState("");
    const [participantSkills, setParticipantSkills] = useState({});
    const [assignmentInputs, setAssignmentInputs] = useState({});
    const [assignments, setAssignments] = useState({});
    const [manualAddEmail, setManualAddEmail] = useState("");
    const [showManualAdd, setShowManualAdd] = useState(false);
    const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
    const { user, signUpForEvent, unSignFromEvent, addNotification } =
        UserAuth();

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

        const storedSkills = JSON.parse(
            localStorage.getItem(`event_${event.id}_skills`) || "{}"
        );
        setParticipantSkills(storedSkills);

        const storedAssignments = JSON.parse(
            localStorage.getItem(`event_${event.id}_assignments`) || "{}"
        );
        setAssignments(storedAssignments);

        fetchCoordinator();
        fetchParticipants();
    }, [event]);

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
        const now = new Date();
        const startTime =
            initialEvent.startTime instanceof Date
                ? initialEvent.startTime
                : initialEvent.startTime.toDate();
        const twelveHoursBeforeStart = new Date(
            startTime.getTime() - 12 * 60 * 60 * 1000
        );

        if (initialEvent.status === "cancelled") {
            return "Event cancelled";
        } else if (
            initialEvent.status === "upcoming" &&
            now < twelveHoursBeforeStart
        ) {
            return "Open for signup";
        } else if (
            initialEvent.currentParticipants >= initialEvent.maxParticipants
        ) {
            return "Event is full";
        } else {
            return "Signup closed";
        }
    };

    const canSignUp = () => {
        const signupStatus = getSignupStatus();
        return (
            signupStatus === "Open for signup" &&
            initialEvent.currentParticipants < initialEvent.maxParticipants
        );
    };

    const handleSignUp = async () => {
        if (!canSignUp()) {
            alert("Sorry, sign-ups are currently closed for this event.");
            return;
        }
        try {
            await signUpForEvent(event.id);

            const storedSkills = JSON.parse(
                localStorage.getItem(`event_${event.id}_skills`) || "{}"
            );
            const updatedSkills = {
                ...storedSkills,
                [user.email]: signupSkills,
            };
            localStorage.setItem(
                `event_${event.id}_skills`,
                JSON.stringify(updatedSkills)
            );

            setParticipantSkills(updatedSkills);
            onClose();
        } catch (error) {
            console.error("Failed to sign up for event:", error);
        }
    };

    const handleUnSignUp = async (participantEmail) => {
        try {
            const updatedEventData = await unSignFromEvent(
                event.id,
                participantEmail
            );

            const storedSkills = JSON.parse(
                localStorage.getItem(`event_${event.id}_skills`) || "{}"
            );
            delete storedSkills[participantEmail];
            localStorage.setItem(
                `event_${event.id}_skills`,
                JSON.stringify(storedSkills)
            );

            if (updatedEventData && updatedEventData.participantList) {
                setParticipants(
                    updatedEventData.participantList.map((email) => ({ email }))
                );
                setParticipantSkills((prev) => {
                    const newSkills = { ...prev };
                    delete newSkills[participantEmail];
                    return newSkills;
                });
            } else {
                console.error(
                    "Updated event data is incomplete:",
                    updatedEventData
                );
                setParticipants((prevParticipants) =>
                    prevParticipants.filter((p) => p.email !== participantEmail)
                );
            }

            if (onUpdatedEvent) {
                onUpdatedEvent(updatedEventData);
            }
            onClose();
        } catch (error) {
            console.error("Failed to remove from event:", error);
        }
    };

    const canCancelEvent =
        event.status !== "completed" && event.status !== "cancelled";
    const canManuallyAdd = canSignUp() && event.status !== "cancelled";

    const handleManualAdd = async () => {
        if (!canManuallyAdd || !manualAddEmail) return;

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

    const handleCancelClick = () => {
        if (canCancelEvent) {
            setShowCancelConfirmation(true);
        }
    };

    const handleCancelConfirm = async () => {
        try {
            const eventRef = doc(db, "events", event.id);
            await updateDoc(eventRef, { status: "cancelled" });

            const updatedEvent = { ...event, status: "cancelled" };
            setEvent(updatedEvent);

            if (typeof onUpdatedEvent === "function") {
                onUpdatedEvent(updatedEvent);
            }

            for (const participant of participants) {
                await addNotification({
                    type: "announcement",
                    message: `The event "${
                        event.title
                    }" scheduled for ${formatDate(
                        event.startTime
                    )} at ${formatTime(event.startTime)} has been cancelled.`,
                    createdBy: user.email,
                    creatorName: `${event.creatorName}`,
                    userId: participant.email,
                    messageData: {
                        eventId: event.id,
                        eventTitle: event.title,
                        eventDate: formatDate(event.startTime),
                        eventTime: formatTime(event.startTime),
                    },
                });
            }

            setShowCancelConfirmation(false);
            alert(
                "Event cancelled successfully. All participants have been notified."
            );
            onClose();
        } catch (error) {
            console.error("Failed to cancel event:", error);
            alert("Failed to cancel event. Please try again.");
        }
    };

    const handleCancelDeny = () => {
        setShowCancelConfirmation(false);
    };

    const handleAssignment = (participantEmail) => {
        try {
            const newAssignments = {
                ...assignments,
                [participantEmail]: assignmentInputs[participantEmail],
            };

            const storedAssignments = JSON.parse(
                localStorage.getItem(`event_${event.id}_assignments`) || "{}"
            );
            const updatedAssignments = {
                ...storedAssignments,
                [participantEmail]: assignmentInputs[participantEmail],
            };
            localStorage.setItem(
                `event_${event.id}_assignments`,
                JSON.stringify(updatedAssignments)
            );

            setAssignments(newAssignments);
            setAssignmentInputs((prev) => ({
                ...prev,
                [participantEmail]: "",
            }));
        } catch (error) {
            console.error("Failed to update assignments:", error);
        }
    };

    return (
        <>
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
                                {event.skillsNeeded && (
                                    <p className="skills-needed">
                                        <strong>
                                            Preferred Skills Needed:
                                        </strong>
                                        <br />
                                        {event.skillsNeeded}
                                    </p>
                                )}
                            </div>
                            <div className="event-description">
                                <p>{event.description}</p>
                            </div>
                        </div>

                        {coordinator && (
                            <p className="coordinator-info">
                                Event Coordinator: {coordinator.firstName}{" "}
                                {coordinator.lastName} (
                                {coordinator.email || event.creatorEmail})
                            </p>
                        )}

                        {user.role === "coordinator" && (
                            <button
                                onClick={handleCancelClick}
                                className={`cancel-event-button ${
                                    !canCancelEvent ? "disabled" : ""
                                }`}
                                disabled={!canCancelEvent}
                            >
                                Cancel Event
                            </button>
                        )}

                        <h3>Attendees</h3>
                        <div className="attendees-table">
                            {participants.map((participant, index) => (
                                <div key={index} className="attendee-row">
                                    {(user.role === "coordinator" ||
                                        user.email === participant.email) && (
                                        <span
                                            className="remove-participant"
                                            onClick={() =>
                                                handleUnSignUp(
                                                    participant.email
                                                )
                                            }
                                        >
                                            ×
                                        </span>
                                    )}
                                    <div className="participant-info">
                                        <span className="participant-name">
                                            {participant.name}
                                        </span>
                                        <span className="skill-description">
                                            {participant.skills ||
                                                participantSkills[
                                                    participant.email
                                                ]}
                                            {assignments[participant.email] && (
                                                <span
                                                    style={{
                                                        fontStyle: "italic",
                                                    }}
                                                >
                                                    {participant.skills ||
                                                    participantSkills[
                                                        participant.email
                                                    ]
                                                        ? ` -- Assigned: ${
                                                              assignments[
                                                                  participant
                                                                      .email
                                                              ]
                                                          }`
                                                        : `Assigned: ${
                                                              assignments[
                                                                  participant
                                                                      .email
                                                              ]
                                                          }`}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    {user.role === "coordinator" && (
                                        <div className="assignment-controls">
                                            <input
                                                type="text"
                                                value={
                                                    assignmentInputs[
                                                        participant.email
                                                    ] || ""
                                                }
                                                onChange={(e) =>
                                                    setAssignmentInputs(
                                                        (prev) => ({
                                                            ...prev,
                                                            [participant.email]:
                                                                e.target.value,
                                                        })
                                                    )
                                                }
                                                placeholder="Assign tasks..."
                                                className="assignment-input"
                                            />
                                            <button
                                                onClick={() =>
                                                    handleAssignment(
                                                        participant.email
                                                    )
                                                }
                                                className="assign-button"
                                                disabled={
                                                    !assignmentInputs[
                                                        participant.email
                                                    ]
                                                }
                                            >
                                                Assign
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {canSignUp() &&
                            !event.participantList.includes(user.email) ? (
                                <div className="signup-section">
                                    <br></br>
                                    <textarea
                                        value={signupSkills}
                                        onChange={(e) =>
                                            setSignupSkills(e.target.value)
                                        }
                                        placeholder="What skills or experience can you contribute? (Optional, add here before signing up)"
                                        className="skills-input"
                                    />
                                    <div
                                        className="attendee-row available"
                                        onClick={handleSignUp}
                                    >
                                        Click here to sign up
                                    </div>
                                </div>
                            ) : (
                                <p
                                    className={
                                        event.currentParticipants >=
                                        event.maxParticipants
                                            ? "event-full-message"
                                            : "signup-closed-message"
                                    }
                                >
                                    {event.currentParticipants >=
                                    event.maxParticipants
                                        ? "This event is full."
                                        : "Sign-ups are currently closed for this event."}
                                </p>
                            )}
                        </div>

                        {user.role === "coordinator" && (
                            <div className="coordinator-actions">
                                <button
                                    onClick={() =>
                                        canManuallyAdd &&
                                        setShowManualAdd(!showManualAdd)
                                    }
                                    className={
                                        !canManuallyAdd ? "disabled" : ""
                                    }
                                    disabled={!canManuallyAdd}
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
                                                setManualAddEmail(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Enter volunteer's email"
                                        />
                                        <button
                                            onClick={handleManualAdd}
                                            disabled={
                                                !canManuallyAdd ||
                                                !manualAddEmail
                                            }
                                            className={
                                                !canManuallyAdd ||
                                                !manualAddEmail
                                                    ? "disabled"
                                                    : ""
                                            }
                                        >
                                            Add
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <button onClick={onClose} className="close-button">
                            Close
                        </button>
                    </div>
                </div>
            </div>
            {showCancelConfirmation && (
                <CancelConfirmation
                    isOpen={showCancelConfirmation}
                    onConfirm={handleCancelConfirm}
                    onDeny={handleCancelDeny}
                />
            )}
        </>
    );
};
