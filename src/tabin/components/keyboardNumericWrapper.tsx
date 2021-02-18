import React, { FunctionComponent, useState, MutableRefObject } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";

const layout = {
  default: ["1 2 3", "4 5 6", "7 8 9", "{shift} 0 _", "{bksp}"],
  shift: ["! / #", "$ % ^", "& * (", "{shift} ) +", "{bksp}"],
};

export const KeyboardNumericWrapper: FunctionComponent<IProps> = ({
  onChange,
  keyboardRef,
  initialValue,
}) => {
  const [layoutName, setLayoutName] = useState("default");

  function onKeyPress(button: string) {
    /**
     * If you want to handle the shift and caps lock buttons
     */
    if (button === "{shift}" || button === "{lock}") handleShift();
  }

  function handleShift() {
    let shiftToggle = layoutName === "default" ? "shift" : "default";

    setLayoutName(shiftToggle);
  }

  return (
    <Keyboard
      keyboardRef={(r) => {
        r.input.default = initialValue;
        keyboardRef.current = r;
      }}
      mergeDisplay={true}
      layoutName={layoutName}
      layout={layout}
      theme="hg-theme-default hg-layout-numeric numeric-theme"
      onChange={onChange}
      onKeyPress={onKeyPress}
      onRender={() => console.log("Rendered")}
    />
  );
};

interface IProps {
  onChange: (input: string) => void;
  keyboardRef: MutableRefObject<Keyboard>;
  initialValue: string | null;
}
