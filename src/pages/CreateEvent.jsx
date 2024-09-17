/**
 * @fileoverview This page is for the coordinator to fill out a form in order to
 *               post events.
 */

import React, { useState } from "react";
import { db } from "../config/firebase.config";
import {
    collection,
    addDoc,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";
import { UserAuth } from "../context/AuthContext";
import { Navbar } from "../components/NavBar";

import "../styles/CreateEvent.css";

export const CreateEvent = () => {
    const { user } = UserAuth();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        location: "",
        startTime: "",
        endTime: "",
        maxParticipants: 1,
        status: "upcoming",
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

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

        try {
            const startTime = new Date(formData.startTime);
            const endTime = new Date(formData.endTime);

            const newEvent = {
                ...formData,
                createdTimeStamp: serverTimestamp(),
                creatorEmail: user.email,
                currentParticipants: 0,
                eventID: "",
                participantList: [],
                startTime: Timestamp.fromDate(new Date(startTime)),
                endTime: Timestamp.fromDate(new Date(endTime)),
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
                            required
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
                    <button type="submit" className="submit-button">
                        Create Event
                    </button>
                </form>
            </div>
        </div>
    );
};
