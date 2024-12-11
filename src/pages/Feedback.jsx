/**
 * @fileoverview This component displays feedback responses submitted by users for events.
 */

import React, { useState, useEffect } from "react";
import { db } from "../config/firebase.config";
import { Navbar } from "../components/NavBar";
import {
    collection,
    query,
    getDocs,
    orderBy,
    getDoc,
    doc,
} from "firebase/firestore";
import "../styles/Feedback.css";

export const Feedback = () => {
    const [feedbackByEvent, setFeedbackByEvent] = useState({});
    const [loading, setLoading] = useState(true);
    const [userDetails, setUserDetails] = useState({});

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const feedbackRef = collection(db, "feedback");
                const feedbackQuery = query(
                    feedbackRef,
                    orderBy("submittedAt", "desc")
                );
                const feedbackSnapshot = await getDocs(feedbackQuery);

                const feedbackData = {};
                const userIds = new Set();

                const eventIds = new Set(
                    feedbackSnapshot.docs.map((doc) => doc.data().eventId)
                );

                const eventTitles = {};
                for (const eventId of eventIds) {
                    const eventDoc = await getDoc(doc(db, "events", eventId));
                    eventTitles[eventId] = eventDoc.exists()
                        ? eventDoc.data()?.title
                        : "Unknown Event";
                }

                feedbackSnapshot.docs.forEach((doc) => {
                    const data = doc.data();
                    userIds.add(data.userId);
                });

                const userDetailsMap = {};
                for (const userId of userIds) {
                    const userDoc = await getDoc(doc(db, "users", userId));
                    if (userDoc.exists()) {
                        userDetailsMap[userId] = userDoc.data();
                    }
                }
                setUserDetails(userDetailsMap);

                feedbackSnapshot.docs.forEach((doc) => {
                    const data = doc.data();
                    if (!feedbackData[data.eventId]) {
                        feedbackData[data.eventId] = {
                            title: eventTitles[data.eventId],
                            feedbacks: [],
                        };
                    }
                    feedbackData[data.eventId].feedbacks.push({
                        id: doc.id,
                        ...data,
                        submittedAt: data.submittedAt?.toDate() || new Date(),
                    });
                });

                Object.keys(feedbackData).forEach((eventId) => {
                    feedbackData[eventId].feedbacks.sort(
                        (a, b) => b.submittedAt - a.submittedAt
                    );
                });

                setFeedbackByEvent(feedbackData);
            } catch (error) {
                console.error("Error fetching feedback:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeedback();
    }, []);

    const renderFeedbackResponses = (responses) => {
        return Object.entries(responses).map(([questionId, answer]) => {
            const questionLabel = questionId
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");

            return (
                <div key={questionId} className="feedback-response">
                    <p className="question">{questionLabel}:</p>
                    {typeof answer === "boolean" ? (
                        <p className="answer">{answer ? "Yes" : "No"}</p>
                    ) : typeof answer === "number" ? (
                        <p className="answer">{answer} / 5</p>
                    ) : (
                        <p className="answer">{answer}</p>
                    )}
                </div>
            );
        });
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="feedback-container">
                    <div className="loading">Loading feedback...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="feedback-container">
                <h1>Feedback Overview</h1>

                <div className="feedback-content">
                    {Object.entries(feedbackByEvent).map(
                        ([eventId, eventData]) => (
                            <div
                                key={eventId}
                                className="event-feedback-section"
                            >
                                <h2 className="event-title">
                                    {eventData.title}
                                </h2>

                                <div className="feedback-grid">
                                    {eventData.feedbacks.map((feedback) => (
                                        <div
                                            key={feedback.id}
                                            className="feedback-card"
                                        >
                                            <div className="feedback-header">
                                                <div className="feedback-meta">
                                                    <span className="feedback-type">
                                                        {feedback.userType ===
                                                        "volunteer"
                                                            ? "👥 Volunteer"
                                                            : "👤 Member"}
                                                    </span>
                                                    <span className="feedback-from">
                                                        From:{" "}
                                                        {userDetails[
                                                            feedback.userId
                                                        ]
                                                            ? `${
                                                                  userDetails[
                                                                      feedback
                                                                          .userId
                                                                  ].firstName
                                                              } ${
                                                                  userDetails[
                                                                      feedback
                                                                          .userId
                                                                  ].lastName
                                                              }`
                                                            : "Loading..."}{" "}
                                                        ({feedback.userId})
                                                    </span>
                                                </div>
                                                <span className="feedback-date">
                                                    Submitted:{" "}
                                                    {feedback.submittedAt.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="feedback-content">
                                                {renderFeedbackResponses(
                                                    feedback.responses
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </>
    );
};
