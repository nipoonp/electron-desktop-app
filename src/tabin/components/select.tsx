import "./select.scss";

export const Select = (props: {
    className?: string;
    label?: string;
    showOptionalInTitle?: boolean;
    name?: string;
    disabled?: boolean;
    children: React.ReactNode;
    value?: string | number | string[];
    onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    error?: string | null;
}) => {
    return (
        <>
            {props.label && <div className="text-bold mb-2">{props.label}</div>}
            <div className="select-container">
                <select
                    className={`select ${props.disabled ? "disabled" : ""} ${props.error ? "error" : ""} ${props.className ? props.className : ""}`}
                    name={props.name}
                    value={props.value}
                    onChange={props.onChange}
                    disabled={props.disabled}
                >
                    {props.children}
                </select>
                <span className="arrow">
                    <svg
                        viewBox="0 0 18 18"
                        role="presentation"
                        aria-hidden="true"
                        focusable="false"
                        style={{
                            height: "10px",
                            width: "10px",
                            display: "block",
                            fill: "rgb(72, 72, 72)",
                        }}
                    >
                        <path d="m16.29 4.3a1 1 0 1 1 1.41 1.42l-8 8a1 1 0 0 1 -1.41 0l-8-8a1 1 0 1 1 1.41-1.42l7.29 7.29z" fillRule="evenodd" />
                    </svg>
                </span>
            </div>
            {props.error && <div className="text-error">{props.error}</div>}
        </>
    );
};
