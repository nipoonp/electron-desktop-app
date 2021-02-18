import React from "react";
import { NormalFont } from "./fonts";

const styles = require("./errorMessage.module.css");

export const ErrorMessage = (props: {
  message: string;
  className?: string;
}) => {
  return (
    <NormalFont className={`${styles.errorMessage} ${props.className}`}>
      {props.message}
    </NormalFont>
  );
};
