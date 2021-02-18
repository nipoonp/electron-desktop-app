import React from "react";
import { NormalFont } from "./fonts";
import { ErrorMessage } from "./errorMessage";

const styles = require("./inputv2.module.css");

export const InputV2 = (props: {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  value?: string | number | string[];
  name?: string;
  type?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  cyData?: string;
  style?: React.CSSProperties;
}) => {
  // just for naming
  const className = styles.input;

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
    <>
      <NormalFont>
        <input
          cy-data={props.cyData}
          className={className}
          placeholder={props.placeholder}
          name={props.name}
          type={props.type}
          onChange={props.onChange}
          onBlur={props.onBlur}
          value={props.value}
          disabled={props.disabled}
          style={style}
        ></input>
      </NormalFont>
      {props.error && <ErrorMessage message={props.error} />}
    </>
  );
};

export const InputV2Style: React.CSSProperties = {
  border: "1px solid hsl(0, 0%, 80%)",
  borderRadius: "4px",
  padding: "10px",
  lineHeight: "24px",
  transition: "border 150ms ease-out 0s !important",
  width: "100%",
  backgroundColor: "white"
};
