import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "../components/NavBar.jsx";
import { UserAuth } from "../context/AuthContext";
import { db } from "../config/firebase.config";
import {
    collection,
    query,
    where,
    getDocs,
    limit,
    doc,
    getDoc,
} from "firebase/firestore";

const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

export const Home = () => {
    const { user } = UserAuth();
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [volunteerServices, setVolunteerServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(() => {
        const fetch = async () => {
            if (user?.uid) {
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
                        const eventSnapshot = await getDocs(q);
                        const eventsList = eventSnapshot.docs.map((doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        }));
                        setUpcomingEvents(eventsList);
                    } else if (
                        user.role === "volunteer" ||
                        user.role === "coordinator"
                    ) {
                        const userDocRef = doc(db, "users", user.email);
                        const userDocSnap = await getDoc(userDocRef);

                        if (userDocSnap.exists()) {
                            const userData = userDocSnap.data();
                            const signedUpServiceIds =
                                userData.signedUpServices || [];

                            const servicePromises = signedUpServiceIds.map(
                                (id) => getDoc(doc(eventsRef, id))
                            );
                            const serviceSnapshots = await Promise.all(
                                servicePromises
                            );
                            const servicesList = serviceSnapshots
                                .filter((snap) => snap.exists())
                                .map((snap) => ({
                                    id: snap.id,
                                    ...snap.data(),
                                }))
                                .filter(
                                    (service) => service.start.toDate() >= now
                                )
                                .sort(
                                    (a, b) =>
                                        a.start.toDate() - b.start.toDate()
                                )
                                .slice(0, 5);

                            setVolunteerServices(servicesList);
                        }

                        q = query(
                            eventsRef,
                            where("start", ">=", now),
                            limit(5)
                        );
                        const upcomingEventSnapshot = await getDocs(q);
                        const upcomingEventsList =
                            upcomingEventSnapshot.docs.map((doc) => ({
                                id: doc.id,
                                ...doc.data(),
                            }));
                        setUpcomingEvents(upcomingEventsList);
                    } else {
                        q = query(
                            eventsRef,
                            where("start", ">=", now),
                            limit(5)
                        );
                        const eventSnapshot = await getDocs(q);
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

        debounce(fetch, 300)();
    }, [user?.uid, user?.email, user?.role]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const renderEventList = (events, title) => (
        <div>
            <h3>{title}</h3>
            {events.length > 0 ? (
                <ul>
                    {events.map((event) => (
                        <li key={event.id}>
                            {event.title} -{" "}
                            {event.start.toDate().toLocaleDateString()}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No {title.toLowerCase()}</p>
            )}
        </div>
    );

    return (
        <div>
            <Navbar />
            <div className="home-container">
                <h2>Dashboard</h2>

                {loading ? (
                    <p>Loading events...</p>
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : (
                    <div className="events-container">
                        {user.role === "volunteer" &&
                            renderEventList(
                                volunteerServices,
                                "Signed Up Services"
                            )}
                        {renderEventList(upcomingEvents, "Upcoming Events")}
                    </div>
                )}
            </div>
        </div>
    );
};
