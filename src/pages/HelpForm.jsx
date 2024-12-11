/**
 * @fileoverview This page is for the user with role "member" to fill out a help
 *               request form and on submit, a notification will be sent to all
 *               coordinators for approval or rejection.
 */

import React, { useState } from "react";
import { Navbar } from "../components/NavBar";
import { ThankYouModal } from "../components/ThankYouModal";
import { UserAuth } from "../context/AuthContext";
import { db } from "../config/firebase.config";
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
} from "firebase/firestore";

import "../styles/HelpForm.css";

export const HelpForm = () => {
    const [formData, setFormData] = useState({
        location: "",
        date: "",
        time: "",
        description: "",
        urgency: "medium",
    });
    const [showModal, setShowModal] = useState(false);
    const { user, addNotification } = UserAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendNotificationToCoordinators(formData);
        setShowModal(true);
        setFormData({
            location: "",
            date: "",
            time: "",
            description: "",
            urgency: "medium",
        });
    };

    const sendNotificationToCoordinators = async (data) => {
        try {
            const coordinatorsQuery = query(
                collection(db, "users"),
                where("role", "==", "coordinator")
            );
            const coordinatorSnapshot = await getDocs(coordinatorsQuery);

            const userDoc = await getDoc(doc(db, "users", user.email));
            const userData = userDoc.exists() ? userDoc.data() : null;
            const userName =
                userData.firstName && userData.lastName
                    ? `${userData.firstName} ${userData.lastName}`
                    : user.displayName;

            const twelveHourFormat = (time) => {
                const [hour, minute] = time.split(":");
                const hour12 = hour % 12 || 12;
                const amPm = hour < 12 ? "AM" : "PM";
                return `${hour12}:${minute} ${amPm}`;
            };

            const notificationData = {
                location: data.location,
                date: data.date,
                time: twelveHourFormat(data.time),
                description: data.description,
                urgency: data.urgency,
            };

            const notification = {
                type: "request",
                messageData: notificationData,
                createdBy: user.email,
                creatorName: userName,
            };
            const notificationPromises = coordinatorSnapshot.docs.map(
                (docs) => {
                    return addNotification({
                        ...notification,
                        userId: docs.id,
                    });
                }
            );
            await Promise.all(notificationPromises);
        } catch (error) {
            console.error("Error sending notification to coordinators", error);
        }
    };

    return (
        <>
            <Navbar />
            <div className="help-form-container">
                <div className="help-form-content">
                    <h1>Helping Hands, Reporting for Duty!</h1>
                    <p className="form-intro">
                        We're here to help! Please let us know what kind of
                        assistance you need. Whether it's a small task or a
                        bigger challenge, we are ready to lend a hand. Please
                        fill out the form so that we may meet your needs.
                    </p>
                    <form onSubmit={handleSubmit}>
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
                            <label htmlFor="date">Preferred Date:</label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="time">Suggested Start Time:</label>
                            <input
                                type="time"
                                id="time"
                                name="time"
                                value={formData.time}
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
                            ></textarea>
                        </div>
                        <div className="form-group">
                            <label htmlFor="urgency">Urgency:</label>
                            <select
                                id="urgency"
                                name="urgency"
                                value={formData.urgency}
                                onChange={handleChange}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <button type="submit" className="submit-button">
                            Submit Request
                        </button>
                    </form>
                </div>
                {showModal && (
                    <ThankYouModal onClose={() => setShowModal(false)} />
                )}
            </div>
        </>
    );
};
