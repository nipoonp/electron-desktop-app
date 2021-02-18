import React, { useState, useRef } from "react";
import { NormalFont } from "./fonts";
import "react-simple-keyboard/build/css/index.css";
import { KeyboardWrapper } from "./keyboardWrapper";
import { KeyboardNumericWrapper } from "./keyboardNumericWrapper";

const styles = require("./keyboardInput.module.css");

export const KeyboardInput = (props: {
  onChangeKeyboard?: (text: string) => void;
  // onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  // onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  showOnlyNumeric?: boolean;
  value: string;
  name?: string;
  type?: string;
  error?: boolean;
  placeholder?: string;
  disabled?: boolean;
  cyData?: string;
  style?: React.CSSProperties;
}) => {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const keyboard: any = useRef(null);

  const onChangeKeyboard = (value: string) => {
    props.onChangeKeyboard && props.onChangeKeyboard(value);
  };

  // just for naming
  const className = styles.input;

  // default style
  let defaultStyle = InputV2Style;

  // disabled style && error style
  if (props.disabled) {
    defaultStyle = {
      ...defaultStyle,
      ...{ backgroundColor: "rgb(240, 240, 240)" },
    };
  } else if (props.error) {
    defaultStyle = {
      ...defaultStyle,
      ...{
        border: "1px solid var(--error-color)",
        backgroundColor: "hsl(var(--error-hue), var(--error-saturation), 98%)",
      },
    };
  }

  // props style
  let style = defaultStyle;
  if (props.style) {
    style = { ...style, ...props.style };
  }

  return (
    <NormalFont>
      <div
        onMouseDown={() => {
          setShowKeyboard(true);

          setTimeout(() => {
            var element = document.getElementById("dummyDiv");
            element!.scrollIntoView({ block: "end" });
          }, 500);
        }}
        onMouseLeave={() => setShowKeyboard(false)}
      >
        <input
          cy-data={props.cyData}
          className={className}
          placeholder={props.placeholder}
          name={props.name}
          type={props.type}
          // onChange={props.onChange}
          // onBlur={props.onBlur}
          value={props.value}
          disabled={props.disabled}
          style={style}
        />
        <div style={{ display: showKeyboard ? "" : "none" }}>
          {props.showOnlyNumeric ? (
            <KeyboardNumericWrapper
              keyboardRef={keyboard}
              initialValue={props.value}
              onChange={onChangeKeyboard}
            />
          ) : (
            <KeyboardWrapper
              keyboardRef={keyboard}
              initialValue={props.value}
              onChange={onChangeKeyboard}
            />
          )}
        </div>
        {/* We need to make sure the keyboard is visible when we click on the input field */}
        <div id="dummyDiv"></div>
      </div>
    </NormalFont>
  );
};

export const InputV2Style: React.CSSProperties = {
  border: "1px solid hsl(0, 0%, 80%)",
  borderRadius: "4px",
  padding: "10px",
  lineHeight: "24px",
  transition: "border 150ms ease-out 0s !important",
  width: "100%",
  backgroundColor: "white",
};
