/**
 * @fileoverview This component is a modal that asks the user to confirm the 
 *               cancellation of an event. It is used in the EventDetails component.
 */

import React from "react";

import "../styles/CancelConfirmation.css";

export const CancelConfirmation = ({ isOpen, onConfirm, onDeny }) => {
    if (!isOpen) return null;

    return (
        <div className="cancel-confirmation-overlay" onClick={onDeny}>
            <div
                className="cancel-confirmation-dialog"
                onClick={(e) => e.stopPropagation()}
            >
                <h3>Confirm Event Cancellation</h3>
                <p>
                    Are you sure you want to cancel this event? This action
                    cannot be undone.
                </p>
                <div className="cancel-confirmation-actions">
                    <button onClick={onConfirm} className="confirm-button">
                        Yes, Cancel Event
                    </button>
                    <button onClick={onDeny} className="deny-button">
                        No, Keep Event
                    </button>
                </div>
            </div>
        </div>
    );
};
