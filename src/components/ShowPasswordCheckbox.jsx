export const ShowPasswordCheckbox = ({
    showPassword,
    togglePasswordVisibility,
}) => {
    return (
        <div>
            <input
                id="show-password"
                type="checkbox"
                checked={showPassword}
                onClick={togglePasswordVisibility}
            />
            <label htmlFor="show-password">Show Password</label>
        </div>
    );
};
