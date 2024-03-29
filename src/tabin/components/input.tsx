import "./input.scss";

export const Input = (props: {
    autoFocus?: boolean;
    onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
    label?: string;
    value?: string | number | string[];
    name?: string;
    type?: string;
    error?: string | null;
    children?: React.ReactNode;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    min?: string;
    max?: string;
}) => {
    return (
        <>
            {props.label && <div className="text-bold mb-2">{props.label}</div>}
            <input
                autoFocus={props.autoFocus}
                className={`input ${props.error ? "error" : ""} ${props.disabled ? "disabled" : ""} ${props.className ? props.className : ""} `}
                placeholder={props.placeholder}
                name={props.name}
                type={props.type}
                onKeyPress={props.onKeyPress}
                onKeyDown={props.onKeyDown}
                onChange={props.onChange}
                onWheel={(event) => event.currentTarget.blur()} //This disables the scroll/wheel event on input when type of number
                onBlur={props.onBlur}
                value={props.value}
                disabled={props.disabled}
                min={props.min}
                max={props.max}
            >
                {props.children && props.children}
            </input>
            {props.error && <div className="text-error mt-2">{props.error}</div>}
        </>
    );
};
