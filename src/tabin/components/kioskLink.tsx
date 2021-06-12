import React from "react";
import "./kioskLink.scss";

export const KioskLink = (props: {
    children: React.ReactNode;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
    href?: string;
    className?: string;
    style?: React.CSSProperties;
}) => {
    return (
        <a href={props.href} onClick={props.onClick} className={`link ${props.className}`}>
            {props.children}
        </a>
    );
};
