import React, { useEffect, useRef, useState } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";

import "./textArea.scss";

export const TextArea = (props: {
    onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
    label?: string;
    rows?: number;
    showOptionalInTitle?: boolean;
    value?: string | number | string[];
    name?: string;
    error?: string;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}) => {
    const [showKeyboard, setShowKeyboard] = useState(false);
    const [layoutName, setLayoutName] = useState("default");
    const [value, setValue] = useState("");

    const keyboard = useRef();

    useEffect(() => {
        const clickHanlder = (e) => {
            if (!(e.target.nodeName === "TEXTAREA") && !e.target.classList.contains("hg-button")) {
                setShowKeyboard(false);
            }
        };

        window.addEventListener("click", clickHanlder);
        return window.removeEventListener("click", clickHanlder, true);
    }, []);

    const onChange = (input) => {
        setValue(input);
    };

    const onKeyPress = (button) => {
        if (button === "{shift}" || button === "{lock}") handleShift();
    };

    const handleShift = () => {
        setLayoutName(layoutName === "default" ? "shift" : "default");
    };

    const onChangeInput = (event) => {
        setValue(event.target.value);
        //@ts-ignore
        keyboard.current.setInput(event.target.value);

        props.onChange && props.onChange(event);
    };

    const onFocus = (event) => {
        setShowKeyboard(true);

        props.onFocus && props.onFocus(event);
    };

    return (
        <>
            {props.label && <div className="text-bold mb-2">{props.label}</div>}
            <textarea
                rows={props.rows ? props.rows : 1}
                className={`textArea ${props.error ? "error" : ""} ${props.disabled ? "disabled" : ""} ${props.className ? props.className : ""}`}
                placeholder={props.placeholder}
                name={props.name}
                onChange={(e) => onChangeInput(e)}
                onBlur={props.onBlur}
                onFocus={onFocus}
                value={value}
                disabled={props.disabled}
            />
            {props.error && <div className="text-error">{props.error}</div>}
            {/* <input value={input} placeholder={"Tap on the virtual keyboard to start"} onChange={(e) => onChangeInput(e)} /> */}
            {showKeyboard && (
                <Keyboard
                    keyboardRef={(r) => (keyboard.current = r)}
                    onChange={(input) => onChange(input)}
                    onKeyPress={(button) => onKeyPress(button)}
                    theme={"hg-theme-default hg-layout-default myTheme"}
                    layoutName={layoutName}
                    layout={{
                        default: ["Q W E R T Y U I O P @", "A S D F G H J K L ~ {enter}", "Z X C V B N M . - + {enter}", "{tab} {space} {bksp}"],
                        shift: [
                            "~ ! @ # $ % ^ & * ( ) _ + {bksp}",
                            "{tab} Q W E R T Y U I O P { } |",
                            '{lock} A S D F G H J K L : " {enter}',
                            "{shift} Z X C V B N M < > ? {shift}",
                            ".com @ {space}",
                        ],
                    }}
                    display={{
                        "{bksp}": "del",
                        "{enter}": " ",
                        "{shift}": "123",
                        "{tab}": "123",
                        "{space}": "_",
                    }}

                    // buttonTheme={[
                    //     {
                    //         class: "hg-red",
                    //         buttons: "Q W E R T Y q w e r t y",
                    //     },
                    //     {
                    //         class: "hg-highlight",
                    //         buttons: "Q q",
                    //     },
                    // ]}
                />
            )}
        </>
    );
};
