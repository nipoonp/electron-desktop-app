import React from "react";
import { Stepper, IProps } from "./stepper";

export const KioskStepper = (props: IProps) => {
  const propDuplicate = { ...props };

  if (props.buttonStyle) {
    propDuplicate.buttonStyle = {
      // cursor: "none",
      ...props.buttonStyle,
    };
  } else {
    // propDuplicate.buttonStyle = { cursor: "none" };
  }

  return <Stepper {...propDuplicate} />;
};
