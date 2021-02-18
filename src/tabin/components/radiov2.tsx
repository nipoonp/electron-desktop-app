import React from "react";

export const RadioV2 = (props: IProps) => {
  // callbacks
  const onClick = () => {
    if (!props.disabled) {
      props.onSelect();
    }
  };

  // constants
  const borderColor = "#c8c8c8";
  const disabledBorderColor = "#dcdcdc";

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          cursor: props.disabled ? "default" : "pointer",
          ...props.style,
        }}
      >
        <div
          style={{
            height: "22px",
            width: "22px",
            border: "1px solid",
            borderColor: props.disabled ? disabledBorderColor : borderColor,
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            ...props.radioStyle,
          }}
          onClick={onClick}
          cy-data={props.cyData}
        >
          <div
            style={{
              height: "80%",
              width: "80%",
              backgroundColor: props.selected
                ? "var(--primary-color)"
                : "transparent",
              borderRadius: "50%",
            }}
          />
        </div>
        {props.children && (
          <div style={{ marginLeft: "12px", lineHeight: "1.25" }}>
            {props.children}
          </div>
        )}
      </div>
    </>
  );
};

export interface IProps {
  children?: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  cyData?: string;
  style?: React.CSSProperties;
  radioStyle?: React.CSSProperties;
}
