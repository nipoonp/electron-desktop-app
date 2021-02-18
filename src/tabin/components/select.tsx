import React from "react";
import { ErrorMessage } from "./errorMessage";

const styles = require("./select.module.css");

export default (props: {
  className?: string;
  title?: string;
  showOptionalInTitle?: boolean;
  name?: string;
  disabled?: boolean;
  children: React.ReactNode;
  value?: string | number | string[];
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string | null;
  cyData?: string;
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
      <div className={`${styles.selectContainer}`}>
        <select
          cy-data={props.cyData ? props.cyData : ""}
          className={`${styles.select} ${
            props.disabled ? styles.disabled : ""
          } ${props.error ? styles.selectError : ""} ${
            props.className ? props.className : ""
          }`}
          name={props.name}
          value={props.value}
          onChange={props.onChange}
          disabled={props.disabled}
        >
          {props.children}
        </select>
        <span className={styles.selectArrow}>
          <svg
            viewBox="0 0 18 18"
            role="presentation"
            aria-hidden="true"
            focusable="false"
            style={{
              height: "16px",
              width: "16px",
              display: "block",
              fill: "rgb(72, 72, 72)"
            }}
          >
            <path
              d="m16.29 4.3a1 1 0 1 1 1.41 1.42l-8 8a1 1 0 0 1 -1.41 0l-8-8a1 1 0 1 1 1.41-1.42l7.29 7.29z"
              fillRule="evenodd"
            />
          </svg>
        </span>
      </div>
      {props.error && <ErrorMessage message={props.error} />}
    </>
  );
};
