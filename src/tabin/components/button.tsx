import React from "react";
import { Spinner } from "./spinner";

import "./button.css";

export const Button = (props: IProps) => {
    return (
        <button
            className={`button ${props.disabled ? "disabled" : ""} ${props.className}`}
            style={props.style}
            onClick={props.onClick}
            disabled={props.disabled}
        >
            {props.loading ? <Spinner /> : props.children}
        </button>
    );
};

export interface IProps {
    loading?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
}
