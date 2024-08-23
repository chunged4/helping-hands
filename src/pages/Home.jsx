import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/NavBar.jsx";
import { UserAuth } from "../context/AuthContext";
import { db } from "../config/firebase.config";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

export const Home = () => {
    const navigate = useNavigate();
    const { user } = UserAuth();
    const [upcomingEvents, setUpcomingEvents] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
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
                    q = query(eventsRef, where("start", ">=", now), limit(5));
                }
                const eventSnapshot = await getDocs(q);
                const eventsList = eventSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setUpcomingEvents(eventsList);
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
                    {upcomingEvents.length > 0 ? (
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

                {user.role === "coordinator" && (
                    <div className="coordinator-actions">
                        <h3>Coordinator Actions</h3>
                        <button onClick={() => navigate("/create-event")}>
                            Create New Event
                        </button>
                        <button onClick={() => navigate("/manage-volunteers")}>
                            Manage Volunteers
                        </button>
                    </div>
                )}

                {user.role === "volunteer" && (
                    <div className="volunteer-actions">
                        <h3>Volunteer Actions</h3>
                        <button onClick={() => navigate("/find-opportunities")}>
                            Find Opportunities
                        </button>
                        <button onClick={() => navigate("/my-events")}>
                            My Events
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
