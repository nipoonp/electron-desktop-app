import React from "react";
import styles from "./paragraph.module.css";

export const P = (props: IProps) => {
  return (
    <p className={`${styles.p} ${props.className ? props.className : ""}`}>
      {props.children}
    </p>
  );
};

interface IProps {
  children: React.ReactNode;
  className?: string;
}
