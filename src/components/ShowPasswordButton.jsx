export const ShowPasswordButton = ({
    showPassword,
    togglePasswordVisibility,
}) => {
    return (
        <button
            id="toggle-password"
            type="button"
            aria-label={`Show ${showPassword ? "masked" : "plain"} password`}
            onClick={togglePasswordVisibility}
        >
            Show Password
        </button>
    );
};
