// https://tobiasahlin.com/spinkit/

import React from "react";
import styles from "./spinner.module.css";

export const Spinner = (props: {
  spinnerDotsStyle?: React.CSSProperties;
  text?: string;
}) => {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column"
      }}
    >
      <div
        style={{
          width: "100px",
          textAlign: "center",
          display: "flex",
          justifyContent: "space-evenly",
          padding: "0px 12px"
        }}
        className={styles.spinner}
      >
        <div
          className={styles.bounce1}
          style={props.spinnerDotsStyle ? props.spinnerDotsStyle : {}}
        />
        <div
          className={styles.bounce2}
          style={props.spinnerDotsStyle ? props.spinnerDotsStyle : {}}
        />
        <div
          className={styles.bounce3}
          style={props.spinnerDotsStyle ? props.spinnerDotsStyle : {}}
        />
      </div>
    </div>
  );
};
