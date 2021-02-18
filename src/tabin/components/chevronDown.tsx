import React from "react";

export const ChevronDown = (props: { height: string }) => {
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
        <path d="M28,10.21,16.71,21.5a1,1,0,0,1-1.41,0L4,10.21"></path>
      </g>
    </svg>
  );
};
