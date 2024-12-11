import React, { useState } from "react";
import { db } from "../config/firebase.config";
import { Navbar } from "../components/NavBar";
import { UserAuth } from "../context/AuthContext";
import {
    doc,
    getDoc,
    updateDoc,
    Timestamp,
    collection,
    getDocs,
    addDoc,
} from "firebase/firestore";

export const NotificationTestPage = () => {
    const [eventId, setEventId] = useState("");
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [eventDetails, setEventDetails] = useState(null);
    const { user } = UserAuth();

    const addResult = (message, isError = false) => {
        const timestamp = new Date().toLocaleTimeString();
        setResults((prev) => [
            ...prev,
            {
                message,
                timestamp,
                isError,
            },
        ]);
    };

    const handleEventCompletion = async (eventDoc) => {
        const eventData = eventDoc.data();
        const eventRef = doc(db, "events", eventDoc.id);

        addResult("Starting event completion process...");

        try {
            await updateDoc(eventRef, { status: "completed" });
            addResult("Updated event status to completed");

            for (const volunteerEmail of eventData.participantList) {
                addResult(`Sending notifications to ${volunteerEmail}`);

                await addDoc(
                    collection(db, `users/${volunteerEmail}/notifications`),
                    {
                        type: "feedback_request_volunteer",
                        eventId: eventDoc.id,
                        eventDetails: {
                            title: eventData.title,
                            date: eventData.startTime
                                .toDate()
                                .toLocaleDateString(),
                            location: eventData.location,
                        },
                        feedbackForm: {
                            questions: [
                                {
                                    id: "experience",
                                    type: "text",
                                    question:
                                        "How was your volunteering experience?",
                                },
                                {
                                    id: "challenges",
                                    type: "text",
                                    question:
                                        "What challenges did you face, if any?",
                                },
                                {
                                    id: "suggestions",
                                    type: "text",
                                    question:
                                        "Do you have any suggestions for improvement?",
                                },
                            ],
                        },
                        createdTimeStamp: Timestamp.now(),
                        createdBy: "system",
                        creatorName: "System",
                        userId: volunteerEmail,
                        status: "pending",
                    }
                );
            }

            if (eventData.isRequestedEvent && eventData.requestedByMember) {
                addResult(
                    `Sending notifications to requesting member: ${eventData.requestedByMember}`
                );

                await addDoc(
                    collection(
                        db,
                        `users/${eventData.requestedByMember}/notifications`
                    ),
                    {
                        type: "feedback_request_member",
                        eventId: eventDoc.id,
                        eventDetails: {
                            title: eventData.title,
                            date: eventData.startTime
                                .toDate()
                                .toLocaleDateString(),
                            location: eventData.location,
                        },
                        feedbackForm: {
                            questions: [
                                {
                                    id: "satisfaction",
                                    type: "boolean",
                                    question:
                                        "Did the service meet your needs satisfactorily?",
                                },
                                {
                                    id: "rating",
                                    type: "rating",
                                    question:
                                        "How would you rate your overall experience? (1-5)",
                                    options: [1, 2, 3, 4, 5],
                                },
                                {
                                    id: "met_expectations",
                                    type: "text",
                                    question:
                                        "Were your needs and expectations met? Please explain.",
                                },
                                {
                                    id: "improvement",
                                    type: "text",
                                    question:
                                        "How could we better serve you in the future?",
                                },
                            ],
                        },
                        createdTimeStamp: Timestamp.now(),
                        createdBy: "system",
                        creatorName: "System",
                        userId: eventData.requestedByMember,
                        status: "pending",
                    }
                );
            }

            addResult(
                `Sending verification to coordinator: ${eventData.creatorEmail}`
            );
            await addDoc(
                collection(db, `users/${eventData.creatorEmail}/notifications`),
                {
                    type: "service_verification",
                    eventId: eventDoc.id,
                    eventDetails: {
                        title: eventData.title,
                        date: eventData.startTime.toDate().toLocaleDateString(),
                        location: eventData.location,
                    },
                    participantList: eventData.participantList,
                    createdTimeStamp: Timestamp.now(),
                    createdBy: "system",
                    creatorName: "System",
                    userId: eventData.creatorEmail,
                    status: "pending",
                }
            );

            addResult("Successfully completed all notifications");
        } catch (error) {
            addResult(`Error in handleEventCompletion: ${error.message}`, true);
            throw error;
        }
    };

    const testEventCompletion = async () => {
        if (!eventId.trim()) {
            addResult("Please enter an event ID", true);
            return;
        }

        setIsLoading(true);
        try {
            const eventRef = doc(db, "events", eventId);
            const eventDoc = await getDoc(eventRef);

            if (!eventDoc.exists()) {
                addResult("Event not found", true);
                return;
            }

            const eventData = eventDoc.data();
            setEventDetails(eventData);
            addResult(`Found event: ${eventData.title}`);

            await handleEventCompletion(eventDoc);

            addResult(
                "Event completion process finished. Checking notifications..."
            );

            // Check notifications
            for (const participantEmail of eventData.participantList) {
                const notificationsRef = collection(
                    db,
                    `users/${participantEmail}/notifications`
                );
                const notificationsSnapshot = await getDocs(notificationsRef);
                const recentNotifications = notificationsSnapshot.docs
                    .map((doc) => doc.data())
                    .filter((data) => {
                        const createdTime =
                            data.createdTimeStamp?.toDate() || new Date();
                        const fiveMinutesAgo = new Date(
                            Date.now() - 5 * 60 * 1000
                        );
                        return createdTime > fiveMinutesAgo;
                    });

                addResult(
                    `Found ${recentNotifications.length} recent notifications for ${participantEmail}`
                );
                recentNotifications.forEach((notification) => {
                    addResult(
                        `- Type: ${notification.type}, Message: ${notification.message}`
                    );
                });
            }
        } catch (error) {
            addResult(`Test failed: ${error.message}`, true);
        } finally {
            setIsLoading(false);
        }
    };

    const clearResults = () => {
        setResults([]);
        setEventDetails(null);
    };

    // Only allow coordinator access
    if (user?.role !== "coordinator") {
        return (
            <>
                <Navbar />
                <div className="p-4">
                    <h2 className="text-xl font-bold">Access Denied</h2>
                    <p>Only coordinators can access this testing page.</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="p-4 max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-4">
                    Notification Test Page
                </h2>

                <div className="mb-6">
                    <input
                        type="text"
                        value={eventId}
                        onChange={(e) => setEventId(e.target.value)}
                        placeholder="Enter event ID"
                        className="border p-2 rounded mr-2"
                        disabled={isLoading}
                    />
                    <button
                        onClick={testEventCompletion}
                        disabled={isLoading}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                    >
                        {isLoading ? "Testing..." : "Test Completion"}
                    </button>
                    <button
                        onClick={clearResults}
                        className="ml-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                        Clear Results
                    </button>
                </div>

                {eventDetails && (
                    <div className="mb-4 p-4 bg-gray-100 rounded">
                        <h3 className="font-bold">Current Event Details:</h3>
                        <p>Title: {eventDetails.title}</p>
                        <p>Status: {eventDetails.status}</p>
                        <p>
                            Participants:{" "}
                            {eventDetails.participantList?.length || 0}
                        </p>
                    </div>
                )}

                <div className="border rounded p-4">
                    <h3 className="font-bold mb-2">Test Results:</h3>
                    <div className="max-h-96 overflow-y-auto">
                        {results.map((result, index) => (
                            <div
                                key={index}
                                className={`mb-1 ${
                                    result.isError
                                        ? "text-red-600"
                                        : "text-gray-800"
                                }`}
                            >
                                <span className="text-xs text-gray-500">
                                    {result.timestamp}
                                </span>{" "}
                                {result.message}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};
