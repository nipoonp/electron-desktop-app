import React from "react";
import styles from "./headings.module.css";

export const H1 = (props: IProps) => {
  return (
    <h1 className={`${styles.h1} ${props.className ? props.className : ""}`}>
      {props.children}
    </h1>
  );
};

export const H2 = (props: IProps) => {
  return (
    <h2 className={`${styles.h2} ${props.className ? props.className : ""}`}>
      {props.children}
    </h2>
  );
};

export const H3 = (props: IProps) => {
  return (
    <h3 className={`${styles.h3} ${props.className ? props.className : ""}`}>
      {props.children}
    </h3>
  );
};

export const H4 = (props: IProps) => {
  return (
    <h4 className={`${styles.h4} ${props.className ? props.className : ""}`}>
      {props.children}
    </h4>
  );
};

export const H5 = (props: IProps) => {
  return (
    <h5 className={`${styles.h5} ${props.className ? props.className : ""}`}>
      {props.children}
    </h5>
  );
};

export const H6 = (props: IProps) => {
  return (
    <h6 className={`${styles.h6} ${props.className ? props.className : ""}`}>
      {props.children}
    </h6>
  );
};

interface IProps {
  children: React.ReactNode;
  className?: string;
}
