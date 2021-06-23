import "./checkbox.scss";

export const Checkbox = (props: IProps) => {
    const onClick = (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
        if (!props.disabled) {
            props.checked ? props.onUnCheck && props.onUnCheck() : props.onCheck();
        }
    };

    return (
        <>
            <div className={`checkbox-container ${props.className}`} onClick={onClick}>
                <div className={`checkbox ${props.disabled ? "disabled" : ""}`}>
                    <div className={`tick ${props.checked ? "checked" : ""}`} />
                </div>
                {props.children && <div className="checkbox-children">{props.children}</div>}
                {/* {props.error && <ErrorMessage message={props.error} />} */}
            </div>
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
    className?: string;
    // boxStyle?: React.CSSProperties;
}
