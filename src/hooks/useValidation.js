import { useState } from "react";

export const useValidation = () => {
    const [errors, setErrors] = useState({});

    const validate = (values) => {
        let errors = {};

        if (!values.firstName) {
            errors.firstName = "Please enter a first name ";
        }

        if (!values.lastName) {
            errors.lastName = "Please enter a last name ";
        }

        if (!values.email) {
            errors.email = "Please enter an email";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
            errors.email = "Invalid email format";
        }

        if (!values.password) {
            errors.password = "Please enter a password";
        }
        // live validation for multiple requirements here:
        // 8 characters long
        // uppercase, lowercase, special characters, numbers

        if (!values.confirmPassword) {
            errors.confirmPassword = "Please confirm your password";
        } else if (values.confirmPassword !== values.password) {
            errors.confirmPassword = "Passwords do not match";
        }

        setErrors(errors);

        return Object.keys(errors).length === 0;
    };
    return { errors, validate };
};
