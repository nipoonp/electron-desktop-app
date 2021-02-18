import React, { useState } from "react";
import { PlusIcon } from "./plusIcon";
import { MinusIcon } from "./minusIcon";

export const Stepper = (props: IProps) => {
  const iconHeight = String(props.size / 1.8) + "px";
  const borderHeight = String(props.size) + "px";

  // callbacks
  const onMinusClick = () => {
    if (props.disabled) {
      return;
    }

    if (!props.allowNegative && props.count == 0) {
      return;
    }

    if (props.min == props.count) {
      return;
    }

    const cnt = props.count - 1;
    props.setCount && props.setCount(cnt);
    props.onUpdate && props.onUpdate(cnt);
    props.onDecrement && props.onDecrement(cnt);
  };

  const onPlusClick = () => {
    if (props.disabled) {
      return;
    }

    if (props.max == props.count) {
      return;
    }

    const cnt = props.count + 1;
    props.setCount && props.setCount(cnt);
    props.onUpdate && props.onUpdate(cnt);
    props.onIncrement && props.onIncrement(cnt);
  };

  // default style
  let defaultStyle: React.CSSProperties = {
    display: "grid",
    alignItems: "center",
    gridTemplateColumns: "auto 1fr auto",
    gridColumnGap: "8px",
  };

  // props style
  let style = defaultStyle;
  if (props.style) {
    style = { ...style, ...props.style };
  }

  const minusButtonDisabled = props.count === props.min || props.disabled;

  const minusButton = (
    <div
      onClick={onMinusClick}
      style={{
        border: minusButtonDisabled ? "1px solid #dcdcdc" : "1px solid #c8c8c8",
        color: minusButtonDisabled ? "#dcdcdc" : "",
        borderRadius: "50%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        width: borderHeight,
        height: borderHeight,
        ...props.buttonStyle,
      }}
    >
      <MinusIcon height={iconHeight} />
    </div>
  );

  const plusButtonDisabled = props.count === props.max || props.disabled;

  const plusButton = (
    <div
      onClick={onPlusClick}
      style={{
        border: plusButtonDisabled ? "1px solid #dcdcdc" : "1px solid #c8c8c8",
        color: plusButtonDisabled ? "#dcdcdc" : "",
        borderRadius: "50%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        width: borderHeight,
        height: borderHeight,
        ...props.buttonStyle,
      }}
    >
      <PlusIcon height={iconHeight} />
    </div>
  );

  return (
    <>
      <div style={style}>
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
    </>
  );
};

export interface IProps {
  count: number;
  setCount?: (count: number) => void;
  allowNegative?: boolean; // default false
  min?: number;
  max?: number;
  onUpdate?: (count: number) => void;
  onIncrement?: (count: number) => void;
  onDecrement?: (count: number) => void;
  disabled?: boolean;
  size: number; // pixels
  style?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
}
