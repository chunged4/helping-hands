/**
 * @fileoverview This page shows all of the events on a calendar, imported from the
 *               react library.
 */

import React, { useState, useEffect } from "react";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { Navbar } from "../components/NavBar.jsx";
import { UserAuth } from "../context/AuthContext";
import { db } from "../config/firebase.config";
import { collection, query, getDocs } from "firebase/firestore";
import { EventModal } from "../components/EventModal";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../styles/Calendar.css";

const localizer = momentLocalizer(moment);

export const Calendar = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const { user, getEventStatus } = UserAuth();

    useEffect(() => {
        const fetchEvents = async () => {
            if (user) {
                const eventsRef = collection(db, "events");
                const q = query(eventsRef);
                const querySnapshot = await getDocs(q);
                const fetchedEvents = querySnapshot.docs.map((doc) => {
                    const data = doc.data();
                    const startTime = data.startTime
                        ? data.startTime.toDate()
                        : new Date();
                    const endTime = data.endTime
                        ? data.endTime.toDate()
                        : new Date();
                    return {
                        id: doc.id,
                        ...data,
                        start: startTime,
                        end: endTime,
                        title: data.title || "Untitled Event",
                        status: getEventStatus({ ...data, startTime, endTime }),
                    };
                });
                setEvents(fetchedEvents);
            }
        };
        fetchEvents();
    }, [user, getEventStatus]);

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
    };

    const eventStyleGetter = (event, start, end, isSelected) => {
        let style = {
            backgroundColor: "#3174ad",
            borderRadius: "0px",
            opacity: 0.8,
            color: "white",
            border: "0px",
            display: "block",
        };

        if (
            event.status === "locked" ||
            event.status === "cancelled" ||
            event.status === "completed"
        ) {
            style.backgroundColor = "#888";
            style.opacity = 0.6;
        }

        return {
            style: style,
        };
    };

    return (
        <div className="calendar-container">
            <Navbar />
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
                    defaultView="month"
                    formats={{
                        dayFormat: (date, culture, localizer) =>
                            localizer.format(date, "D", culture),
                    }}
                />
            </div>
            {selectedEvent && (
                <EventModal event={selectedEvent} onClose={handleCloseModal} />
            )}
        </div>
    );
};
