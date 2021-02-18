import React from "react";
import { BoldFont, NormalFont } from "./fonts";

const styles = require("./textArea.module.css");

export const TextArea = (props: {
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  title?: string;
  rows?: number;
  showOptionalInTitle?: boolean;
  value?: string | number | string[];
  name?: string;
  error?: boolean;
  // error?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}) => {
  return (
    <>
      {props.title && (
        <div className={styles.titleContainer}>
          <BoldFont className={styles.title}>{props.title}</BoldFont>
          {props.showOptionalInTitle && (
            <NormalFont
              className={styles.optional}
              style={{ marginLeft: "10px" }}
            >
              (optional)
            </NormalFont>
          )}
        </div>
      )}
      <NormalFont>
        <textarea
          rows={props.rows ? props.rows : 1}
          className={`${styles.textArea} ${props.error &&
            styles.textAreaError} ${props.className ? props.className : ""} ${
            props.disabled ? styles.disabled : ""
          }`}
          placeholder={props.placeholder}
          name={props.name}
          onChange={props.onChange}
          onBlur={props.onBlur}
          value={props.value}
          disabled={props.disabled}
        ></textarea>
      </NormalFont>
      {/* {props.error && <ErrorMessage message={props.error} />} */}
    </>
  );
};
