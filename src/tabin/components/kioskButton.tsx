import React from "react";
import { ButtonV2, IProps } from "./buttonv2";

export const KioskButton = (props: IProps) => {
  const propDuplicate = { ...props };

  if (props.style) {
    propDuplicate.style = {
      padding: "24px 48px",
      // cursor: "none",
      ...props.style,
    };
  } else {
    propDuplicate.style = { padding: "24px 48px", /*cursor: "none"*/ };
  }

  return <ButtonV2 {...propDuplicate}>{propDuplicate.children}</ButtonV2>;
};
