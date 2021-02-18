import React, {
  useState,
  useRef,
  MutableRefObject,
  FunctionComponent,
} from "react";
import { NormalFont } from "./fonts";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import { InputV2Style } from "./inputv2";
import { KeyboardWrapper } from "./keyboardWrapper";
import { KeyboardNumericWrapper } from "./keyboardNumericWrapper";

const styles = require("./keyboardTextArea.module.css");

export const KeyboardTextArea = (props: {
  kioskMode?: boolean;
  onChangeKeyboard?: (text: string) => void;
  // onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  // onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  showOnlyNumeric?: boolean;
  rows?: number;
  value: string | null;
  name?: string;
  error?: boolean;
  placeholder?: string;
  disabled?: boolean;
  cyData?: string;
  style?: React.CSSProperties;
}) => {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const keyboardRef: any = useRef(null);

  const onChangeKeyboard = (value: string) => {
    props.onChangeKeyboard && props.onChangeKeyboard(value);
  };

  // default style
  let defaultStyle = InputV2Style;
  defaultStyle = {
    ...defaultStyle,
    ...{ resize: "none" },
  };

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
      <NormalFont>
        <textarea
          cy-data={props.cyData}
          className={`${styles.textarea} ${styles.kioskMode}`} // for placeholder
          rows={props.rows ? props.rows : 1}
          placeholder={props.placeholder}
          name={props.name}
          // onChange={() => console.log("props.onChange")}
          // onBlur={props.onBlur}
          value={props.value ?? ""}
          disabled={props.disabled}
          style={style}
        />
        <div style={{ display: showKeyboard ? "" : "none" }}>
          {props.showOnlyNumeric ? (
            <KeyboardNumericWrapper
              keyboardRef={keyboardRef}
              initialValue={props.value}
              onChange={onChangeKeyboard}
            />
          ) : (
            <KeyboardWrapper
              keyboardRef={keyboardRef}
              initialValue={props.value}
              onChange={onChangeKeyboard}
            />
          )}
        </div>
        {/* We need to make sure the keyboard is visible when we click on the input field */}
        <div id="dummyDiv"></div>
      </NormalFont>
    </div>
  );
};
