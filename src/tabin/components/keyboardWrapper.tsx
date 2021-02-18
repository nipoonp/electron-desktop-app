import React, { FunctionComponent, useState, MutableRefObject } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";

const layout = {
  default: [
    "q w e r t y u i o p",
    "a s d f g h j k l",
    "{shift} z x c v b n m {backspace}",
    "{numbers} {space} {ent}",
  ],
  shift: [
    "Q W E R T Y U I O P",
    "A S D F G H J K L",
    "{shift} Z X C V B N M {backspace}",
    "{numbers} {space} {ent}",
  ],
  numbers: ["1 2 3", "4 5 6", "7 8 9", "{abc} 0 {backspace}"],
};

const display = {
  "{numbers}": "123",
  "{ent}": "return",
  "{escape}": "esc ⎋",
  "{tab}": "tab ⇥",
  "{backspace}": "⌫",
  "{capslock}": "caps lock ⇪",
  "{shift}": "⇧",
  "{controlleft}": "ctrl ⌃",
  "{controlright}": "ctrl ⌃",
  "{altleft}": "alt ⌥",
  "{altright}": "alt ⌥",
  "{metaleft}": "cmd ⌘",
  "{metaright}": "cmd ⌘",
  "{abc}": "ABC",
};

export const KeyboardWrapper: FunctionComponent<IProps> = ({
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
    if (button === "{numbers}" || button === "{abc}") handleNumbers();
  }

  function handleShift() {
    let shiftToggle = layoutName === "default" ? "shift" : "default";

    setLayoutName(shiftToggle);
  }

  function handleNumbers() {
    let numbersToggle = layoutName !== "numbers" ? "numbers" : "default";

    setLayoutName(numbersToggle);
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
      display={display}
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
