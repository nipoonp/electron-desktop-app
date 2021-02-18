import React from "react";
import { Logger } from "aws-amplify";
import { ErrorMessage } from "./errorMessage";

const styles = require("./radio.module.css");
const logger = new Logger("Radio");

export const Radio = (props: {
  children?: React.ReactNode;
  checked?: boolean;
  onSelect: () => void;
  disabled?: boolean;
  cyData?: string;
  error?: string;
  style?: React.CSSProperties;
  // name: string;
  // value: string;
  // onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const onClick = () => {
    if (!props.disabled) {
      props.onSelect();
    }
  };

  return (
    <>
      <div
        cy-data={props.cyData ? props.cyData : ""}
        className={`${styles.container} ${
          props.disabled ? styles.disabled : ""
        }`}
        style={{ ...props.style }}
      >
        <div
          className={`${styles.boxContainer} ${
            props.disabled ? styles.disabled : ""
          }`}
          onClick={onClick}
        >
          <div
            className={`${styles.box} ${props.checked &&
              !props.disabled &&
              styles.boxChecked}`}
          />
        </div>
        {/* <input
          type="radio"
          checked={props.checked}
          name={props.name}
          value={props.value}
          onChange={props.onChange}
        /> */}
        {props.children && (
          <div className={styles.children}>{props.children}</div>
        )}
      </div>
      {props.error && <ErrorMessage message={props.error} />}
    </>
  );
};
