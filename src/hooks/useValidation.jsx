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
        } else if (
            !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{10,}$/.test(
                values.password
            )
        ) {
            errors.password = "Password requirements not met";
        }

        setErrors(errors);

        return Object.keys(errors).length === 0;
    };
    return { errors, validate };
};
