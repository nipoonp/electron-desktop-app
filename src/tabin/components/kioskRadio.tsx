import React from "react";

import "./kioskRadio.scss";

export const KioskRadio = (props: IProps) => {
    const onClick = () => {
        if (!props.disabled) {
            props.onSelect();
        }
    };

    return (
        <>
            <div className={`radio-container ${props.className}`} onClick={onClick}>
                <div className={`radio ${props.disabled ? "disabled" : ""}`}>
                    <div className={`dot ${props.selected ? "selected" : ""}`} />
                </div>
                {props.children && <div className="radio-children">{props.children}</div>}
                {/* {props.error && <ErrorMessage message={props.error} />} */}
            </div>
        </>
    );
};

export interface IProps {
    children?: React.ReactNode;
    selected?: boolean;
    onSelect: () => void;
    disabled?: boolean;
    error?: string;
    style?: React.CSSProperties;
    className?: string;
    // boxStyle?: React.CSSProperties;
}
