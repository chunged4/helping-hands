import React, { useState, useEffect } from "react";

import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";

import moment from "moment";
import { Navbar } from "../components/NavBar.jsx";
import { UserAuth } from "../context/AuthContext";
import { db } from "../config/firebase.config";
import { collection, query, where, getDocs } from "firebase/firestore";

import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

export const Calendar = () => {
    const [events, setEvents] = useState([]);
    const { user } = UserAuth();

    useEffect(() => {
        const fetchEvents = async () => {
            if (user) {
                const eventsRef = collection(db, "events");
                let q;
                if (user.role === "coordinator") {
                    q = query(eventsRef, where("creatorId", "==", user.uid));
                } else {
                    q = query(eventsRef);
                }
                const querySnapshot = await getDocs(q);
                const fetchedEvents = querySnapshot.docs.map((doc) => {
                    return {
                        id: doc.id,
                        ...doc.data(),
                        start: doc.data().start.toDate(),
                        end: doc.data().end.toDate(),
                    };
                });
                setEvents(fetchedEvents);
            }
        };
        fetchEvents();
    }, [user]);

    const handleSelectEvent = (event) => {
        console.log(event);
    };

    const handleSelectSlot = (slotInfo) => {
        if (user.role === "coordinator") {
            // create event
        }
    };

    return (
        <div>
            <Navbar />
            <h1>Calendar</h1>
            <div style={{ height: "500px" }}>
                <BigCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    selectable={user.role === "coordinator"}
                />
            </div>
        </div>
    );
};
