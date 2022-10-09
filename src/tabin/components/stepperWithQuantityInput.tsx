import { PlusIcon } from "./icons/plusIcon";
import { MinusIcon } from "./icons/minusIcon";

import "./stepper.scss";
import { Input } from "./input";
import { useState } from "react";

export const StepperWithQuantityInput = (props: IProps) => {
    const [value, setValue] = useState(props.count.toString());

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
        setValue(newCount.toString());
    };

    const onPlusClick = () => {
        if (props.disabled) return;
        if (props.max == props.count) return;

        let newCount = props.count + props.stepAmount;

        if (props.max && newCount > props.max) newCount = props.max;

        props.setCount && props.setCount(newCount);
        props.onUpdate && props.onUpdate(newCount);
        props.onIncrement && props.onIncrement(newCount);
        setValue(newCount.toString());
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

    const onQuantityUpdateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newCount = parseInt(e.target.value);

        if (props.disabled) return;

        if (isNaN(newCount)) {
            newCount = props.min || 1;
        } else {
            if (!props.allowNegative && newCount < 0) return;
            if (props.min && newCount < props.min) newCount = props.min;
            if (props.max && newCount > props.max) newCount = props.max;
        }

        props.setCount && props.setCount(newCount);
        props.onUpdate && props.onUpdate(newCount);

        if (props.count < newCount) {
            props.onIncrement && props.onIncrement(newCount);
        } else if (props.count > newCount) {
            props.onDecrement && props.onDecrement(newCount);
        }

        setValue(newCount.toString());
    };

    const onChangeValue = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
    };

    return (
        <>
            <div className="stepper-container">
                <div className={`stepper ${props.className}`} style={props.style}>
                    {minusButton}
                    <div
                        style={{
                            textAlign: "center",
                            padding: `0 ${props.size / (1.8 * 4)}px`,
                            fontSize: props.size / 1.8,
                        }}
                    >
                        {/* {props.count} */}
                        <Input
                            className="stepper-input"
                            type="number"
                            size="small"
                            onBlur={onQuantityUpdateInput}
                            value={value}
                            onChange={onChangeValue}
                        />
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

StepperWithQuantityInput.defaultProps = {
    stepAmount: 1,
};
