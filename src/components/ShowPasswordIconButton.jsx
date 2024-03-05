import Icon from "react-icons-kit";
import { basic_eye } from "react-icons-kit/linea/basic_eye";
import { basic_eye_closed } from "react-icons-kit/linea/basic_eye_closed";

export const ShowPasswordIconButton = ({ passwordType, setPasswordType }) => {
    return (
        <div>
            {passwordType === "password" ? (
                <span onClick={() => setPasswordType("text")}>
                    <Icon icon={basic_eye} size={18} />
                </span>
            ) : (
                <span onClick={() => setPasswordType("password")}>
                    <Icon icon={basic_eye_closed} size={18} />
                </span>
            )}
        </div>
    );
};
