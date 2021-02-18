import React from "react";

const styles = require("./spaces.module.css");

export const SizedBox = (props: { height?: string; width?: string }) => {
  return <div style={{ display: "inline-block", ...props }}></div>;
};
