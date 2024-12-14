import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "../components/NavBar.jsx";
import { EventCard } from "../components/EventCard.jsx";
import { EventModal } from "../components/EventModal.jsx";
import { VolunteerTooltip } from "../components/VolunteerTooltip.jsx";
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
    onSnapshot,
    updateDoc,
} from "firebase/firestore";

import "../styles/Home.css";

export const Home = () => {
    const { user } = UserAuth();
    const [activeEvents, setActiveEvents] = useState([]);
    const [pastEvents, setPastEvents] = useState([]);
    const [cancelledEvents, setCancelledEvents] = useState([]);
    const [volunteerServices, setVolunteerServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const categorizeEvents = (events) => {
        const now = new Date();
        const active = [];
        const past = [];
        const cancelled = [];

        events.forEach((event) => {
            if (event.status === "cancelled") {
                cancelled.push(event);
            } else if (now > event.endTime) {
                past.push(event);
            } else {
                active.push(event);
            }
        });

        return { active, past, cancelled };
    };

    const fetchData = useCallback(() => {
        const fetch = async () => {
            if (user?.uid) {
                setLoading(true);
                setError(null);
                try {
                    const eventsRef = collection(db, "events");
                    let q;
                    if (user.role === "coordinator") {
                        q = query(eventsRef, orderBy("startTime", "desc"));
                    } else if (user.role === "volunteer") {
                        const now = new Date();
                        const oneMonthFromNow = new Date(
                            now.getTime() + 30 * 24 * 60 * 60 * 1000
                        );
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

                    if (user.role === "coordinator") {
                        const unsubscribe = onSnapshot(q, (snapshot) => {
                            const eventsList = snapshot.docs.map((doc) => ({
                                id: doc.id,
                                ...doc.data(),
                                startTime: doc.data().startTime.toDate(),
                                endTime: doc.data().endTime.toDate(),
                            }));
                            const { active, past, cancelled } =
                                categorizeEvents(eventsList);
                            setActiveEvents(active);
                            setPastEvents(past);
                            setCancelledEvents(cancelled);
                            setLoading(false);
                        });
                        return unsubscribe;
                    } else {
                        const eventSnapshot = await getDocs(q);
                        const eventsList = eventSnapshot.docs.map((doc) => ({
                            id: doc.id,
                            ...doc.data(),
                            startTime: doc.data().startTime.toDate(),
                            endTime: doc.data().endTime.toDate(),
                        }));

                        const userDocRef = doc(db, "users", user.email);
                        const userDocSnap = await getDoc(userDocRef);

                        if (userDocSnap.exists()) {
                            const userData = userDocSnap.data();
                            const signedUpServiceIds =
                                userData.signedUpServices || [];

                            const volunteerServicesList = eventsList.filter(
                                (event) => signedUpServiceIds.includes(event.id)
                            );

                            setVolunteerServices(volunteerServicesList);
                            setActiveEvents(
                                eventsList.filter(
                                    (event) =>
                                        !signedUpServiceIds.includes(
                                            event.id
                                        ) &&
                                        event.status === "upcoming" &&
                                        event.startTime > new Date()
                                )
                            );
                        }
                        setLoading(false);
                    }
                } catch (err) {
                    console.error("Error fetching events:", err);
                    setError("Failed to fetch events. Please try again later.");
                    setLoading(false);
                }
            }
        };
        return fetch();
    }, [user?.uid, user?.email, user?.role]);

    useEffect(() => {
        const unsubscribe = fetchData();
        return () => {
            if (typeof unsubscribe === "function") {
                unsubscribe();
            }
        };
    }, [fetchData]);

    const handleOpenModal = (event) => {
        setSelectedEvent(event);
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
        if (user.role !== "coordinator") {
            fetchData();
        }
    };

    const handleUpdateEvent = async (updatedEventData) => {
        try {
            if (!updatedEventData || !updatedEventData.id) {
                console.error("Invalid event data:", updatedEventData);
                return;
            }

            const eventRef = doc(db, "events", updatedEventData.id);
            await updateDoc(eventRef, updatedEventData);

            const updateEventInArray = (prevEvents) =>
                prevEvents.map((event) =>
                    event.id === updatedEventData.id ? updatedEventData : event
                );

            if (updatedEventData.status === "active") {
                setActiveEvents((prevEvents) => updateEventInArray(prevEvents));
            } else if (updatedEventData.status === "past") {
                setPastEvents((prevEvents) => updateEventInArray(prevEvents));
            } else if (updatedEventData.status === "cancelled") {
                setCancelledEvents((prevEvents) =>
                    updateEventInArray(prevEvents)
                );
            }

            const removeEventFromArray = (prevEvents) =>
                prevEvents.filter((event) => event.id !== updatedEventData.id);

            if (updatedEventData.status !== "active") {
                setActiveEvents((prevEvents) =>
                    removeEventFromArray(prevEvents)
                );
            }
            if (updatedEventData.status !== "past") {
                setPastEvents((prevEvents) => removeEventFromArray(prevEvents));
            }
            if (updatedEventData.status !== "cancelled") {
                setCancelledEvents((prevEvents) =>
                    removeEventFromArray(prevEvents)
                );
            }

            if (selectedEvent && selectedEvent.id === updatedEventData.id) {
                setSelectedEvent(updatedEventData);
            }
        } catch (error) {
            console.error("Error updating event:", error);
            setError("Failed to update event. Please try again.");
        }
    };

    const renderEvents = () => {
        if (user.role === "coordinator") {
            return (
                <>
                    <div>
                        <h3>Active Events</h3>
                        <div className="event-grid">
                            {activeEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    onOpenModal={handleOpenModal}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3>Past Events</h3>
                        <div className="event-grid">
                            {pastEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    onOpenModal={handleOpenModal}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3>Cancelled Events</h3>
                        <div className="event-grid">
                            {cancelledEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    onOpenModal={handleOpenModal}
                                />
                            ))}
                        </div>
                    </div>
                </>
            );
        } else if (user.role === "volunteer") {
            const completedServices = volunteerServices.filter(
                (event) => event.status === "completed"
            );
            const upcomingSignedServices = volunteerServices.filter(
                (event) => event.status === "upcoming"
            );
            return (
                <>
                    <div>
                        <h3>Completed Services</h3>
                        <div className="event-grid">
                            {completedServices.map((event) => (
                                <EventCard
                                    key={`completed-${event.id}`}
                                    event={event}
                                    onOpenModal={handleOpenModal}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3>Signed Up Services</h3>
                        <div className="event-grid">
                            {upcomingSignedServices.map((event) => (
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
                            {activeEvents
                                .filter((event) => event.status !== "cancelled")
                                .map((event) => (
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
            {user.role === "volunteer" && <VolunteerTooltip />}
                {loading ? (
                    <p>Loading events...</p>
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : (
                    <div className="events-container">{renderEvents()}</div>
                )}
            </div>
            {selectedEvent && (
                <EventModal
                    event={selectedEvent}
                    onClose={handleCloseModal}
                    onUpdatedEvent={handleUpdateEvent}
                />
            )}
        </div>
    );
};
