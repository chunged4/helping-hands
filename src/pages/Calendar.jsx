import React, { useState, useEffect, useCallback } from "react";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import { Navbar } from "../components/NavBar.jsx";
import { UserAuth } from "../context/AuthContext";
import { db } from "../config/firebase.config";
import { collection, query, getDocs, doc, updateDoc } from "firebase/firestore";
import { EventModal } from "../components/EventModal";

import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../styles/Calendar.css";

const localizer = momentLocalizer(moment);

const eventStatusColors = {
    upcoming: "#4CAF50",
    ongoing: "#2196F3",
    completed: "#9E9E9E",
    cancelled: "#F44336",
};

const Legend = () => (
    <div className="legend">
        {Object.entries(eventStatusColors).map(([status, color]) => (
            <div key={status} className="legend-item">
                <span
                    className="legend-color"
                    style={{ backgroundColor: color }}
                ></span>
                <span className="legend-label">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
            </div>
        ))}
    </div>
);

export const Calendar = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [view, setView] = useState("month");
    const { user } = UserAuth();

    const fetchEvents = useCallback(async () => {
        if (user) {
            const eventsRef = collection(db, "events");
            const q = query(eventsRef);
            const querySnapshot = await getDocs(q);
            const fetchedEvents = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                start: doc.data().startTime.toDate(),
                end: doc.data().endTime.toDate(),
                title: doc.data().title || "Untitled Event",
            }));
            setEvents(fetchedEvents);
        }
    }, [user]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleSelectEvent = (event) => {
        setSelectedEvent({ ...event });
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
        fetchEvents();
    };

    const handleUpdateEvent = async (updatedEvent) => {
        try {
            const eventRef = doc(db, "events", updatedEvent.id);
            await updateDoc(eventRef, { status: updatedEvent.status });
            fetchEvents();
        } catch (error) {}
    };

    const eventStyleGetter = (event) => {
        return {
            style: {
                backgroundColor: eventStatusColors[event.status],
                borderRadius: "3px",
                opacity: 0.8,
                color: "white",
                border: "0px",
                display: "block",
            },
        };
    };

    const onView = (newView) => setView(newView);

    return (
        <div className="calendar-container">
            <Navbar />
            <Legend />
            <div className="calendar-wrapper">
                <BigCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    onSelectEvent={handleSelectEvent}
                    selectable={user && user.role === "coordinator"}
                    eventPropGetter={eventStyleGetter}
                    views={["month", "week", "day"]}
                    view={view}
                    onView={onView}
                    formats={{
                        dayFormat: (date, culture, localizer) =>
                            localizer.format(date, "D", culture),
                    }}
                />
            </div>
            {selectedEvent && (
                <EventModal
                    event={selectedEvent}
                    onClose={handleCloseModal}
                    onUpdateEvent={handleUpdateEvent}
                />
            )}
        </div>
    );
};
