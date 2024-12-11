/**
 * @fileoverview This component is a tooltip that appears when a user first visits the volunteer page.
 */

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export const VolunteerTooltip = () => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const tooltipDismissed = localStorage.getItem(
            "volunteerTooltipDismissed"
        );
        if (tooltipDismissed === "true") {
            setIsVisible(false);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem("volunteerTooltipDismissed", "true");
    };

    if (!isVisible) return null;

    return (
        <div className="volunteer-tooltip">
            <button
                className="tooltip-close-btn"
                onClick={handleDismiss}
                aria-label="Close tooltip"
            >
                <X size={20} />
            </button>
            <p>
                👋 Click on event cards to view specific details and start
                lending a helping hand!
                <br />
                If you have any questions, look for a coordinator's email and
                send them a message!
            </p>
        </div>
    );
};
