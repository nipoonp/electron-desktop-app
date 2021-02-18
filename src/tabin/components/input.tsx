import React from "react";
import { ErrorMessage } from "./errorMessage";

const styles = require("./input.module.css");

export default (props: {
  autoFocus?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  title?: string;
  showOptionalInTitle?: boolean;
  value?: string | number | string[];
  name?: string;
  type?: string;
  error?: string | null;
  children?: React.ReactNode;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  cyData?: string;
  min?: string;
  max?: string;
}) => {
  return (
    <>
      {props.title && (
        <div className={styles.titleContainer}>
          <span className={styles.title}>{props.title}</span>
          {props.showOptionalInTitle && (
            <span className={styles.optional}>(optional)</span>
          )}
        </div>
      )}
      <input
        autoFocus={props.autoFocus}
        cy-data={props.cyData ? props.cyData : ""}
        className={`${styles.input} ${props.error ? styles.inputError : ""} ${
          props.className ? props.className : ""
          } ${props.disabled ? styles.disabled : ""}`}
        placeholder={props.placeholder}
        name={props.name}
        type={props.type}
        onChange={props.onChange}
        onBlur={props.onBlur}
        value={props.value}
        disabled={props.disabled}
        min={props.min}
        max={props.max}
      >
        {props.children && props.children}
      </input>
      {props.error && <ErrorMessage message={props.error} />}
    </>
  );
};
