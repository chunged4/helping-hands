import Icon from "react-icons-kit";
import { arrows_circle_check } from "react-icons-kit/linea/arrows_circle_check";
import { arrows_circle_remove } from "react-icons-kit/linea/arrows_circle_remove";

export const RequirementCheckmark = ({ validateState }) => {
    return (
        <div>
            {validateState === true ? (
                <span>
                    <Icon icon={arrows_circle_check} size={15} />
                </span>
            ) : (
                <span>
                    <Icon icon={arrows_circle_remove} size={15} />
                </span>
            )}
        </div>
    );
};
