import React from "react";

import "./textArea.scss";

export const TextArea = (props: {
    onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
    label?: string;
    rows?: number;
    showOptionalInTitle?: boolean;
    value?: string | number | string[];
    name?: string;
    error?: string;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}) => {
    return (
        <>
            {props.label && <div className="text-bold mb-2">{props.label}</div>}
            <textarea
                rows={props.rows ? props.rows : 1}
                className={`textarea ${props.error ? "error" : ""} ${props.disabled ? "disabled" : ""} ${props.className ? props.className : ""} `}
                placeholder={props.placeholder}
                name={props.name}
                onChange={props.onChange}
                onBlur={props.onBlur}
                value={props.value}
                disabled={props.disabled}
            />
            {props.error && <div className="text-error">{props.error}</div>}
        </>
    );
};
