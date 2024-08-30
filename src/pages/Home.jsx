import React, { useState, useEffect } from "react";
import { Navbar } from "../components/NavBar.jsx";
import { UserAuth } from "../context/AuthContext";
import { db } from "../config/firebase.config";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

export const Home = () => {
    const { user } = UserAuth();
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                setLoading(true);
                setError(null);
                try {
                    const eventsRef = collection(db, "events");
                    const now = new Date();
                    let q;
                    if (user.role === "coordinator") {
                        q = query(
                            eventsRef,
                            where("creatorID", "==", user.uid),
                            where("start", ">=", now),
                            limit(5)
                        );
                    } else {
                        q = query(
                            eventsRef,
                            where("start", ">=", now),
                            limit(5)
                        );
                    }
                    const eventSnapshot = await getDocs(q);
                    if (eventSnapshot.empty) {
                        setUpcomingEvents([]);
                    } else {
                        const eventsList = eventSnapshot.docs.map((doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        }));
                        setUpcomingEvents(eventsList);
                    }
                } catch (err) {
                    console.error("Error fetching events:", err);
                    setError("Failed to fetch events. Please try again later.");
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [user]);

    return (
        <div>
            <Navbar />
            <div className="home-container">
                <h2>Dashboard</h2>

                <div className="upcoming-events">
                    <h3>Upcoming Events</h3>
                    {loading ? (
                        <p>Loading events...</p>
                    ) : error ? (
                        <p className="error-message">{error}</p>
                    ) : upcomingEvents.length > 0 ? (
                        <ul>
                            {upcomingEvents.map((event) => (
                                <li key={event.id}>
                                    {event.title} -{" "}
                                    {new Date(
                                        event.start.seconds * 1000
                                    ).toLocaleDateString()}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No upcoming events</p>
                    )}
                </div>
            </div>
        </div>
    );
};
