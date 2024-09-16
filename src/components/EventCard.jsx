import React from "react";

export const EventCard = ({ event, onOpenModal }) => {
    const formatDate = (date) => {
        if (date instanceof Date) {
            return date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
            });
        } else if (date && typeof date.toDate === "function") {
            return date.toDate().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
            });
        }
        return "Invalid Date";
    };

    const formatTime = (date) => {
        if (date instanceof Date) {
            return date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
            });
        } else if (date && typeof date.toDate === "function") {
            return date.toDate().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
            });
        }
        return "Invalid Time";
    };

    return (
        <div className="event-card" onClick={() => onOpenModal(event)}>
            <h3>{event.title}</h3>
            <p>Date: {formatDate(event.startTime)}</p>
            <p>
                Time: {formatTime(event.startTime)} -{" "}
                {formatTime(event.endTime)}
            </p>
            <p>Location: {event.location}</p>
        </div>
    );
};
