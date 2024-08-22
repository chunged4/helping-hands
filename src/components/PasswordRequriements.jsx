import React from "react";
import Icon from "react-icons-kit";
import { info } from "react-icons-kit/typicons/info";
import { RequirementCheckmark } from "./RequirementCheckmark";

import "../styles/PasswordRequirements.css";

export const PasswordRequirements = ({ validateType }) => {
    return (
        <div className="password-info-icon">
            <Icon icon={info} size={18} />
            <div className="password-requirements-popup">
                <p>Password must contain:</p>
                <ul>
                    <li className={validateType.lower ? "valid" : ""}>
                        <RequirementCheckmark
                            validateState={validateType.lower}
                        />
                        <span>Lowercase letter</span>
                    </li>
                    <li className={validateType.upper ? "valid" : ""}>
                        <RequirementCheckmark
                            validateState={validateType.upper}
                        />
                        <span>Uppercase letter</span>
                    </li>
                    <li className={validateType.number ? "valid" : ""}>
                        <RequirementCheckmark
                            validateState={validateType.number}
                        />
                        <span>Number</span>
                    </li>
                    <li className={validateType.symbol ? "valid" : ""}>
                        <RequirementCheckmark
                            validateState={validateType.symbol}
                        />
                        <span>Symbol</span>
                    </li>
                    <li className={validateType.length ? "valid" : ""}>
                        <RequirementCheckmark
                            validateState={validateType.length}
                        />
                        <span>At least 10 characters</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};
