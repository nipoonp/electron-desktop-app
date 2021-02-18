import React, { CSSProperties, FC, KeyboardEvent, useCallback } from "react";
import { InputV2Style } from "./inputv2";

const VALID_FIRST = /^[1-9]{1}$/;
const VALID_NEXT = /^[0-9]{1}$/;
const DELETE_KEY_CODE = 8;

// https://github.com/larkintuckerllc/react-currency-input/blob/master/src/components/CurrencyInput.tsx
const CurrencyInput = (props: {
  //   className?: string;
  max?: number;
  onValueChange: (value: number) => void;
  style?: CSSProperties;
  value: number;
  disabled?: boolean;
  error?: boolean;
}) => {
  // check
  const valueAbsTrunc = Math.trunc(Math.abs(props.value));
  if (
    props.value !== valueAbsTrunc ||
    !Number.isFinite(props.value) ||
    Number.isNaN(props.value)
  ) {
    throw new Error(`invalid value property`);
  }

  // callbacks
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>): void => {
      const { key, keyCode } = e;
      if (
        (props.value === 0 && !VALID_FIRST.test(key)) ||
        (props.value !== 0 &&
          !VALID_NEXT.test(key) &&
          keyCode !== DELETE_KEY_CODE)
      ) {
        return;
      }

      const valueString = props.value.toString();
      let nextValue: number;
      if (keyCode !== DELETE_KEY_CODE) {
        const nextValueString: string =
          props.value === 0 ? key : `${valueString}${key}`;
        nextValue = Number.parseInt(nextValueString, 10);
      } else {
        const nextValueString = valueString.slice(0, -1);
        nextValue =
          nextValueString === "" ? 0 : Number.parseInt(nextValueString, 10);
      }
      if (props.max && nextValue > props.max) {
        return;
      }
      props.onValueChange(nextValue);
    },
    [props.max, props.onValueChange, props.value]
  );

  const handleChange = useCallback(() => {
    // dummy so react doesn't complain
  }, []);

  // constants
  const valueDisplay = (props.value / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
  });

  // default style
  let defaultStyle = InputV2Style;

  // disabled style && error style
  if (props.disabled) {
    defaultStyle = {
      ...defaultStyle,
      ...{ backgroundColor: "rgb(240, 240, 240)" }
    };
  } else if (props.error) {
    defaultStyle = {
      ...defaultStyle,
      ...{
        border: "1px solid var(--error-color)",
        backgroundColor: "hsl(var(--error-hue), var(--error-saturation), 98%)"
      }
    };
  }
  // props style
  let style = defaultStyle;
  if (props.style) {
    style = { ...style, ...props.style };
  }

  return (
    <input
      //   className={props.className}
      inputMode="numeric"
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      value={valueDisplay}
      disabled={props.disabled}
      style={style}
    />
  );
};

export default CurrencyInput;
