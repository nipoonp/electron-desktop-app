import React from "react";

export const Card = (props: {
  cardBrandPFClass: string;
  cardLast4: string;
}) => {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center"
        }}
      >
        <i
          className={`pf ${props.cardBrandPFClass}`}
          style={{ marginRight: "8px", fontSize: "18px" }}
        />
        <div>•••• •••• •••• {props.cardLast4}</div>
      </div>
    </>
  );
};
