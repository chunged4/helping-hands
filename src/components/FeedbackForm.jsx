/**
 * @fileoverview This component is a type of notification that is sent to users after an event has ended.
 *               It contains a form for volunteers and members to submit feedback about the event.
 */

import React, { useState } from "react";
import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase.config";

import "../styles/FeedbackForm.css";

export const FeedbackForm = ({ notification, onNotificationUpdate }) => {
    const [responses, setResponses] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "feedback"), {
                eventId: notification.eventId,
                userId: notification.userId,
                userType:
                    notification.type === "feedback_request_volunteer"
                        ? "volunteer"
                        : "member",
                responses,
                submittedAt: new Date(),
            });

            if (notification.eventDetails?.creatorEmail) {
                await addDoc(
                    collection(
                        db,
                        `users/${notification.eventDetails.creatorEmail}/notifications`
                    ),
                    {
                        type: "feedback_submitted",
                        message: `${notification.userId} has submitted feedback for "${notification.eventDetails.title}"`,
                        userId: notification.eventDetails.creatorEmail,
                        eventDetails: notification.eventDetails,
                        createdTimeStamp: new Date(),
                        submittedBy: notification.userId,
                        userType:
                            notification.type === "feedback_request_volunteer"
                                ? "volunteer"
                                : "member",
                        feedback: responses,
                    }
                );
            }

            const notificationRef = doc(
                db,
                `users/${notification.userId}/notifications/${notification.id}`
            );
            await deleteDoc(notificationRef);

            onNotificationUpdate(notification.id);
        } catch (error) {
            console.error("Error processing feedback submission:", error);
            alert(
                "There was an error submitting your feedback. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="feedback-request">
            <div className="event-details">
                <h4>{notification.eventDetails.title}</h4>
                <p>Date: {notification.eventDetails.date}</p>
                <p>Location: {notification.eventDetails.location}</p>
            </div>
            <form onSubmit={handleSubmit}>
                {notification.feedbackForm.questions.map((question) => (
                    <div key={question.id} className="feedback-question">
                        <label>{question.question}</label>
                        {question.type === "text" ? (
                            <textarea
                                value={responses[question.id] || ""}
                                onChange={(e) =>
                                    setResponses({
                                        ...responses,
                                        [question.id]: e.target.value,
                                    })
                                }
                                required
                            />
                        ) : question.type === "rating" ? (
                            <div className="rating-buttons">
                                {question.options.map((option) => (
                                    <button
                                        type="button"
                                        key={option}
                                        onClick={() =>
                                            setResponses({
                                                ...responses,
                                                [question.id]: option,
                                            })
                                        }
                                        className={
                                            responses[question.id] === option
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="boolean-buttons">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setResponses({
                                            ...responses,
                                            [question.id]: true,
                                        })
                                    }
                                    className={
                                        responses[question.id] === true
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setResponses({
                                            ...responses,
                                            [question.id]: false,
                                        })
                                    }
                                    className={
                                        responses[question.id] === false
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    No
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                <button
                    type="submit"
                    className="submit-button"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </button>
            </form>
        </div>
    );
};
