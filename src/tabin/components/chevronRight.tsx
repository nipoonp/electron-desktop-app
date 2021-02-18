import React from "react";

export const ChevronRight = (props: { height: string }) => {
  return (
    <svg
      style={{
        display: "block",
        fill: "none",
        height: props.height,
        width: props.height,
        stroke: "currentcolor",
        strokeWidth: "4px"
      }}
      aria-hidden="true"
      role="presentation"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="none">
        <path d="M10.21,4,21.5,15.29a1,1,0,0,1,0,1.41L10.21,28"></path>
      </g>
    </svg>
  );
};
