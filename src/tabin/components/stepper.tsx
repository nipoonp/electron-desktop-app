import { PlusIcon } from "./icons/plusIcon";
import { MinusIcon } from "./icons/minusIcon";

import "./stepper.scss";

export const Stepper = (props: IProps) => {
    const iconHeight = String(props.size / 1.8) + "px";
    const borderHeight = String(props.size) + "px";

    // callbacks
    const onMinusClick = () => {
        if (props.disabled) return;
        if (!props.allowNegative && props.count == 0) return;
        if (props.min == props.count) return;

        let newCount = props.count - props.stepAmount;

        if (props.min && newCount < props.min) newCount = props.min;

        props.setCount && props.setCount(newCount);
        props.onUpdate && props.onUpdate(newCount);
        props.onDecrement && props.onDecrement(newCount);
    };

    const onPlusClick = () => {
        if (props.disabled) return;
        if (props.max == props.count) return;

        let newCount = props.count + props.stepAmount;

        if (props.max && newCount > props.max) newCount = props.max;

        props.setCount && props.setCount(newCount);
        props.onUpdate && props.onUpdate(newCount);
        props.onIncrement && props.onIncrement(newCount);
    };

    const minusButtonDisabled = props.count === props.min || props.disabled;

    const minusButton = (
        <div
            className={`stepper-button ${minusButtonDisabled ? "disabled" : ""}`}
            style={{ height: borderHeight, width: borderHeight }}
            onClick={onMinusClick}
        >
            <MinusIcon height={iconHeight} />
        </div>
    );

    const plusButtonDisabled = props.count === props.max || props.disabled;

    const plusButton = (
        <div
            className={`stepper-button ${plusButtonDisabled ? "disabled" : ""}`}
            style={{ height: borderHeight, width: borderHeight }}
            onClick={onPlusClick}
        >
            <PlusIcon height={iconHeight} />
        </div>
    );

    return (
        <>
            <div className={`stepper-container ${props.className}`}>
                <div className="stepper" style={props.style}>
                    {minusButton}
                    <div
                        style={{
                            textAlign: "center",
                            padding: `0 ${props.size / (1.8 * 4)}px`,
                            fontSize: props.size / 1.8,
                        }}
                    >
                        {props.count}
                    </div>
                    {plusButton}
                </div>
                {props.children && <div className="stepper-children ml-3">{props.children}</div>}
            </div>
        </>
    );
};

export interface IProps {
    children?: React.ReactNode;
    count: number;
    setCount?: (count: number) => void;
    stepAmount: number;
    allowNegative?: boolean; // default false
    min?: number;
    max?: number;
    onUpdate?: (count: number) => void;
    onIncrement?: (count: number) => void;
    onDecrement?: (count: number) => void;
    disabled?: boolean;
    size: number; // pixels
    style?: React.CSSProperties;
    className?: string;
}

Stepper.defaultProps = {
    stepAmount: 1,
};
