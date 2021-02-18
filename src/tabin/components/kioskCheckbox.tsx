import React from "react";
import { IProps, Checkbox } from "./checkbox";

export const KioskCheckbox = (props: IProps) => {
  const propDuplicate = { ...props };

  if (props.style) {
    propDuplicate.style = {
      // cursor: "none",
      ...props.style,
    };

    propDuplicate.boxStyle = {
      height: "28px",
      width: "28px",
      ...props.boxStyle,
    };
  } else {
    // propDuplicate.style = { cursor: "none" };
    propDuplicate.boxStyle = { height: "28px", width: "28px" };
  }

  return <Checkbox {...propDuplicate} />;
};
