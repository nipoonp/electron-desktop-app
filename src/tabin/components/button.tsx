import React from "react";
import { Spinner } from "./spinner";
const styles = require("./button.module.css");

export const Button = (props: {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
  showSpinner?: boolean;
  onClick?: () => void;
  cyData?: string;
}) => {
  const onClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (!props.disabled) {
      props.onClick && props.onClick();
    }
  };

  return (
    <button
      cy-data={props.cyData ? props.cyData : ""}
      className={`${styles.button} ${props.className}`}
      onClick={onClick}
      type={props.type}
      disabled={props.disabled ? props.disabled : false}
    >
      {props.showSpinner ? <Spinner /> : props.children}
    </button>
  );
};
