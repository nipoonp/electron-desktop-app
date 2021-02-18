import React from "react";

const styles = require("./selectv2.module.css");

export const SelectV2 = (props: {
  value?: string | number | string[];
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  name: string;
  style?: React.CSSProperties;
  error?: boolean;
  children?: React.ReactNode;
}) => {
  // just for naming
  const className = styles.select;

  // default style
  let defaultStyle: React.CSSProperties = {
    border: "1px solid hsl(0, 0%, 80%)",
    borderRadius: "4px",
    padding: "10px",
    lineHeight: "24px",
    transition: "border 150ms ease-out 0s !important",
    width: "100%",
    backgroundColor: "white"
  };

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
      <select
        className={className}
        name={props.name}
        onChange={props.onChange}
        value={props.value}
        disabled={props.disabled}
        style={style}
      >
        {props.children}
      </select>
    </>
  );
};
