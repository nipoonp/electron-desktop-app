import React from "react";
import { IProps, RadioV2 } from "./radiov2";

export const KioskRadio = (props: IProps) => {
  const propDuplicate = { ...props };

  if (props.style) {
    propDuplicate.style = {
      // cursor: "none",
      ...props.style,
    };

    propDuplicate.radioStyle = {
      height: "28px",
      width: "28px",
      ...props.radioStyle,
    };
  } else {
    // propDuplicate.style = { cursor: "none" };
    propDuplicate.radioStyle = { height: "28px", width: "28px" };
  }

  return <RadioV2 {...propDuplicate} />;
};
