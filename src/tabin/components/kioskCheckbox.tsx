import React from "react";

export const KioskCheckbox = (props: IProps) => {
    const propDuplicate = { ...props };

    if (props.style) {
        propDuplicate.style = {
            // cursor: "none",
            ...props.style,
        };

        propDuplicate.boxStyle = {
            height: "28px",
            width: "28px",
            ...props.boxStyle,
        };
    } else {
        // propDuplicate.style = { cursor: "none" };
        propDuplicate.boxStyle = { height: "28px", width: "28px" };
    }

    return <Checkbox {...propDuplicate} />;
};

export const Checkbox = (props: IProps) => {
    const onClick = (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
        if (!props.disabled) {
            props.checked ? props.onUnCheck && props.onUnCheck() : props.onCheck();
        }
    };

    return (
        <>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    ...props.style,
                }}
            >
                <div
                    style={{
                        minHeight: "22px",
                        minWidth: "22px",
                        height: "22px",
                        width: "22px",
                        border: props.disabled ? "1px solid #dbdbdb" : "1px solid #c8c8c8",
                        borderRadius: "5px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        ...props.boxStyle,
                    }}
                    onClick={onClick}
                >
                    <div
                        style={{
                            height: "80%",
                            width: "80%",
                            backgroundColor: props.checked ? "var(--primary-color)" : "transparent",
                            borderRadius: "3px",
                        }}
                    />
                </div>
                {props.children && <div style={{ marginLeft: "12px", lineHeight: "1.25" }}>{props.children}</div>}
            </div>
            {/* {props.error && <ErrorMessage message={props.error} />} */}
        </>
    );
};

export interface IProps {
    children?: React.ReactNode;
    checked?: boolean;
    onCheck: () => void;
    onUnCheck?: () => void;
    disabled?: boolean;
    error?: string;
    style?: React.CSSProperties;
    boxStyle?: React.CSSProperties;
}
