import React from "react";

export const GrayColor = (props: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => {
  let style = { color: "var(--primary-color-gray)" };
  if (props.style) {
    style = { ...style, ...props.style };
  }

  return <div style={style}>{props.children}</div>;
};

export const BlackColor = (props: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => {
  let style = { color: "var(--primary-color-black)" };
  if (props.style) {
    style = { ...style, ...props.style };
  }
  return <div style={style}>{props.children}</div>;
};

export const PrimaryColor = (props: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => {
  let style = { color: "var(--primary-color)" };
  if (props.style) {
    style = { ...style, ...props.style };
  }
  return <div style={style}>{props.children}</div>;
};

export const ErrorColor = (props: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => {
  let style = { color: "var(--error-color)" };
  if (props.style) {
    style = { ...style, ...props.style };
  }
  return <div style={style}>{props.children}</div>;
};
