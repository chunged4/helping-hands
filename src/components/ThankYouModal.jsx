import React from "react";

import "../styles/ThankYouModal.css";

export const ThankYouModal = ({ onClose }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Thank you for reaching out!</h2>
                <p>
                    We have received your request and will get back to you as
                    soon as possible.
                </p>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};
