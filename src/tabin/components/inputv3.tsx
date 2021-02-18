import React from "react";
import { NormalFont } from "./fonts";

const styles = require("./inputv3.module.css");

export const InputV3 = (props: {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  label: string; //required
  value?: string | number | string[];
  name: string; //required
  type?: string;
  error?: boolean;
  // placeholder?: string;
  disabled?: boolean;
  cyData?: string;
  style?: React.CSSProperties;
}) => {
  // just for naming
  const className = styles.input;

  // default style
  let defaultStyle = InputV3Style;

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
        borderRadius: "8px",
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
    <NormalFont>
      <div style={InputContainerV3Style}>
        <input
          id={props.name}
          cy-data={props.cyData}
          className={className}
          // placeholder={props.placeholder}
          name={props.name}
          type={props.type}
          onChange={props.onChange}
          onKeyPress={props.onKeyPress}
          onBlur={props.onBlur}
          value={props.value}
          disabled={props.disabled}
          style={style}
          required
        />
        <label className={styles.label} htmlFor={props.name}>
          {props.label}
        </label>
      </div>
    </NormalFont>
  );
};

export const InputContainerV3Style: React.CSSProperties = {
  position: "relative",
  width: "100%",
  lineHeight: "32px"
};

export const InputV3Style: React.CSSProperties = {
  width: "100%",
  padding: "22px 12px 0 12px",
  borderRadius: "8px",
  border: "1px solid #b0b0b0"
};
