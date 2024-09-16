import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "../components/NavBar.jsx";
import { EventCard } from "../components/EventCard.jsx";
import { EventModal } from "../components/EventModal.jsx";
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
    orderBy,
    Timestamp,
} from "firebase/firestore";

import "../styles/Home.css";

const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

const getEventStatus = (startTime, endTime) => {
    const now = new Date();
    if (now < startTime) return "upcoming";
    if (now >= startTime && now <= endTime) return "ongoing";
    return "completed";
};

const canSignUp = (startTime) => {
    const now = new Date();
    const timeDiff = startTime.getTime() - now.getTime();
    return timeDiff > 12 * 60 * 60 * 1000;
};

export const Home = () => {
    const { user } = UserAuth();
    const [events, setEvents] = useState([]);
    const [volunteerServices, setVolunteerServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const fetchData = useCallback(() => {
        const fetch = async () => {
            const fetch = async () => {
                if (user?.uid) {
                    setLoading(true);
                    setError(null);
                    try {
                        const eventsRef = collection(db, "events");
                        const now = new Date();
                        const oneMonthFromNow = new Date(
                            now.getTime() + 30 * 24 * 60 * 60 * 1000
                        );

                        let q;
                        if (user.role === "coordinator") {
                            q = query(
                                eventsRef,
                                orderBy("startTime", "asc"),
                                limit(50)
                            );
                        } else if (user.role === "volunteer") {
                            q = query(
                                eventsRef,
                                where(
                                    "startTime",
                                    "<=",
                                    Timestamp.fromDate(oneMonthFromNow)
                                ),
                                orderBy("startTime", "asc"),
                                limit(24)
                            );
                        }

                        const eventSnapshot = await getDocs(q);
                        const eventsList = eventSnapshot.docs
                            .map((doc) => {
                                const data = doc.data();
                                const startTime = data.startTime.toDate();
                                const endTime = data.endTime.toDate();
                                return {
                                    id: doc.id,
                                    ...data,
                                    startTime,
                                    endTime,
                                    status: getEventStatus(startTime, endTime),
                                    canSignUp: canSignUp(startTime),
                                    currentParticipants:
                                        data.currentParticipants || 0,
                                    participantList: data.participantList || [],
                                };
                            })
                            .filter(
                                (event) =>
                                    event.status !== "completed" &&
                                    event.status !== "cancelled"
                            );

                        if (user.role === "coordinator") {
                            setEvents(eventsList);
                        } else if (user.role === "volunteer") {
                            const userDocRef = doc(db, "users", user.email);
                            const userDocSnap = await getDoc(userDocRef);

                            if (userDocSnap.exists()) {
                                const userData = userDocSnap.data();
                                const signedUpServiceIds =
                                    userData.signedUpServices || [];

                                const volunteerServicesList = eventsList.filter(
                                    (event) =>
                                        signedUpServiceIds.includes(event.id)
                                );

                                setVolunteerServices(volunteerServicesList);
                                setEvents(
                                    eventsList.filter(
                                        (event) =>
                                            !signedUpServiceIds.includes(
                                                event.id
                                            )
                                    )
                                );
                            }
                        }
                    } catch (err) {
                        console.error("Error fetching events:", err);
                        setError(
                            "Failed to fetch events. Please try again later."
                        );
                    } finally {
                        setLoading(false);
                    }
                }
            };

            debounce(fetch, 300)();
        };

        debounce(fetch, 300)();
    }, [user?.uid, user?.email, user?.role]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = async (event) => {
        setSelectedEvent(event);
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
        fetchData();
    };

    const renderEvents = () => {
        if (user.role === "coordinator") {
            return (
                <div>
                    <h3>All Events</h3>
                    <div className="event-grid">
                        {events.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                onOpenModal={handleOpenModal}
                            />
                        ))}
                    </div>
                </div>
            );
        } else if (user.role === "volunteer") {
            return (
                <>
                    <div>
                        <h3>Signed Up Services</h3>
                        <div className="event-grid">
                            {volunteerServices.map((event) => (
                                <EventCard
                                    key={`signed-${event.id}`}
                                    event={event}
                                    onOpenModal={handleOpenModal}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3>Upcoming Events</h3>
                        <div className="event-grid">
                            {events.map((event) => (
                                <EventCard
                                    key={`upcoming-${event.id}`}
                                    event={event}
                                    onOpenModal={handleOpenModal}
                                />
                            ))}
                        </div>
                    </div>
                </>
            );
        }
    };

    return (
        <div>
            <Navbar />
            <div className="home-container">
                {loading ? (
                    <p>Loading events...</p>
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : (
                    <div className="events-container">{renderEvents()}</div>
                )}
            </div>
            {selectedEvent && (
                <EventModal event={selectedEvent} onClose={handleCloseModal} />
            )}
        </div>
    );
};
