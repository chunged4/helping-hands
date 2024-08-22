import React from "react";
import Icon from "react-icons-kit";
import { basic_eye } from "react-icons-kit/linea/basic_eye";
import { basic_eye_closed } from "react-icons-kit/linea/basic_eye_closed";

export const ShowPasswordIconButton = ({ passwordType, setPasswordType }) => {
    const togglePasswordVisibility = () => {
        setPasswordType(passwordType === "password" ? "text" : "password");
    };

    return (
        <button
            onClick={togglePasswordVisibility}
            className="show-password-button"
        >
            <Icon
                icon={
                    passwordType === "password" ? basic_eye_closed : basic_eye
                }
                size={18}
            />
        </button>
    );
};
