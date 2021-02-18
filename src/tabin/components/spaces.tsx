import React from "react";

const styles = require("./spaces.module.css");

export const Space1 = () => {
  return <div className={styles.space1}></div>;
};

export const Space2 = () => {
  return <div className={styles.space2}></div>;
};

export const Space3 = () => {
  return <div className={styles.space3}></div>;
};

export const Space4 = () => {
  return <div className={styles.space4}></div>;
};

export const Space5 = () => {
  return <div className={styles.space5}></div>;
};

export const Space6 = () => {
  return <div className={styles.space6}></div>;
};

export const Space = (props: { size: number }) => {
  return <div style={{ marginBottom: String(props.size) + "px" }}></div>;
};
