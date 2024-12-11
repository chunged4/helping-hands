/**
 * @fileoverview This page is for the coordinator to fill out a form in order to
 *               post events.
 */

import React, { useState, useEffect } from "react";
import { db } from "../config/firebase.config";
import {
    collection,
    addDoc,
    serverTimestamp,
    Timestamp,
    doc,
    getDoc,
} from "firebase/firestore";
import { UserAuth } from "../context/AuthContext";
import { Navbar } from "../components/NavBar";

import "../styles/CreateEvent.css";

export const CreateEvent = () => {
    const { user } = UserAuth();
    const [creatorInfo, setCreatorInfo] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        location: "",
        startTime: "",
        endTime: "",
        maxParticipants: 1,
        status: "upcoming",
        signUpStatus: "",
        skillsNeeded: "",
        requestedByMember: "",
        isRequestedEvent: false,
    });
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCreatorInfo = async () => {
            if (user?.email) {
                try {
                    const userDocRef = doc(db, "users", user.email);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setCreatorInfo({
                            email: user.email,
                            name:
                                userData.firstName && userData.lastName
                                    ? `${userData.firstName} ${userData.lastName}`
                                    : user.displayName || "Unknown",
                            firstName: userData.firstName || "",
                            lastName: userData.lastName || "",
                        });
                    }
                } catch (error) {
                    console.error("Error fetching creator info:", error);
                    setError("Failed to fetch creator information.");
                }
            }
        };

        fetchCreatorInfo();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: name === "maxParticipants" ? parseInt(value, 10) : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        const startTime = new Date(formData.startTime);
        const endTime = new Date(formData.endTime);

        if (endTime <= startTime) {
            setError("End time must be after start time.");
            return;
        }

        try {
            const newEvent = {
                ...formData,
                createdTimeStamp: serverTimestamp(),
                creatorEmail: creatorInfo.email,
                creatorName: creatorInfo.name,
                creatorFirstName: creatorInfo.firstName,
                creatorLastName: creatorInfo.lastName,
                currentParticipants: 0,
                eventID: "",
                participantList: [],
                startTime: Timestamp.fromDate(startTime),
                endTime: Timestamp.fromDate(endTime),
                status: "upcoming",
                isRequestedEvent: !!formData.requestedByMember,
            };

            await addDoc(collection(db, "events"), newEvent);

            setSuccess(true);
            setFormData({
                title: "",
                description: "",
                location: "",
                startTime: "",
                endTime: "",
                maxParticipants: 1,
                status: "upcoming",
                signUpStatus: "",
                skillsNeeded: "",
                requestedByMember: "",
                isRequestedEvent: false,
            });
        } catch (err) {
            console.error("Error adding document: ", err);
            setError("Failed to create event. Please try again.");
        }
    };

    return (
        <div>
            <Navbar />
            <div className="create-event-container">
                <h2>Create New Event</h2>
                {error && <p className="error-message">{error}</p>}
                {success && (
                    <p className="success-message">
                        Event created successfully!
                    </p>
                )}
                <form onSubmit={handleSubmit} className="create-event-form">
                    <div className="form-group">
                        <label htmlFor="title">Title:</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Title of the event"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Description:</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Description of the event"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="skillsNeeded">
                            Skills/Tasks Expected (not required):
                        </label>
                        <textarea
                            id="skillsNeeded"
                            name="skillsNeeded"
                            value={formData.skillsNeeded}
                            onChange={handleChange}
                            placeholder="List any specific skills or tasks volunteers should be prepared for (e.g., sweeping, carrying heavy loads)"
                            className="skills-textarea"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="location">Location:</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Location of the event"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="startTime">Start Time:</label>
                        <input
                            type="datetime-local"
                            id="startTime"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="endTime">End Time:</label>
                        <input
                            type="datetime-local"
                            id="endTime"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="maxParticipants">
                            Max Participants:
                        </label>
                        <input
                            type="number"
                            id="maxParticipants"
                            name="maxParticipants"
                            value={formData.maxParticipants}
                            onChange={handleChange}
                            min="1"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="requestedByMember">
                            Member Email (if requested):{" "}
                        </label>
                        <input
                            type="email"
                            id="requestedByMember"
                            name="requestedByMember"
                            value={formData.requestedByMember}
                            onChange={handleChange}
                            placeholder="Leave empty if not requested by a community member"
                        />
                    </div>
                    <button type="submit" className="submit-button">
                        Create Event
                    </button>
                </form>
            </div>
        </div>
    );
};
