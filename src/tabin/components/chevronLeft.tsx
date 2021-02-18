import React from "react";

export const ChevronLeft = () => {
  return (
    <svg
      style={{
        display: "block",
        fill: "none",
        height: "16px",
        width: "16px",
        stroke: "currentcolor",
        strokeWidth: "4px"
      }}
      aria-hidden="true"
      role="presentation"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="none">
        {/* <path d="m20 28-11.29289322-11.2928932c-.39052429-.3905243-.39052429-1.0236893 0-1.4142136l11.29289322-11.2928932"></path> */}
        <path d="M20,28,8.71,16.71a1,1,0,0,1,0-1.41L20,4" />
      </g>
    </svg>
  );
};
