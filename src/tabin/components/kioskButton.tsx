import React from "react";
import { Spinner } from "./spinner";

export const KioskButton = (props: IProps) => {
    // const propDuplicate = { ...props };

    // if (props.style) {
    //     propDuplicate.style = {
    //         padding: "24px 48px",
    //         // cursor: "none",
    //         ...props.style,
    //     };
    // } else {
    //     propDuplicate.style = { padding: "24px 48px" /*cursor: "none"*/ };
    // }

    // let defaultStyle: React.CSSProperties = {};

    // // props style
    // let style = defaultStyle;
    // if (props.style) {
    //     style = { ...style, ...props.style };
    // }

    return (
        <button
            className={`button ${props.disabled ? "disabled" : ""} ${props.className}`}
            style={props.style}
            onClick={props.onClick}
            disabled={props.disabled}
            cy-data={props.cyData}
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
    cyData?: string;
    style?: React.CSSProperties;
    className?: string;
}
