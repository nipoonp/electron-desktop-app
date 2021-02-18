import React from "react";
import { isMobile } from "react-device-detect";

export const Title1Font = (props: {
  children: React.ReactNode;
  key?: string | number;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}) => {
  return (
    <div
      style={{
        WebkitTextSizeAdjust: "none",
        fontSize: isMobile ? "28px" : "36px",
        lineHeight: isMobile ? "30px" : "40px",
        fontWeight: 600,
      }}
      onClick={props.onClick}
    >
      <div className={props.className} style={props.style}>
        {props.children}
      </div>
    </div>
  );
};

export const Title2Font = (props: {
  children: React.ReactNode;
  key?: string | number;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}) => {
  return (
    <div
      style={{
        WebkitTextSizeAdjust: "none",
        fontSize: isMobile ? "22px" : "24px",
        lineHeight: isMobile ? "30px" : "34px",
        fontWeight: 600,
      }}
      onClick={props.onClick}
    >
      <div className={props.className} style={props.style}>
        {props.children}
      </div>
    </div>
  );
};

export const Title3Font = (props: {
  children: React.ReactNode;
  key?: string | number;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}) => {
  return (
    <div
      style={{
        WebkitTextSizeAdjust: "none",
        fontSize: isMobile ? "18px" : "20px",
        lineHeight: isMobile ? "26px" : "30px",
        fontWeight: 600,
      }}
      onClick={props.onClick}
    >
      <div className={props.className} style={props.style}>
        {props.children}
      </div>
    </div>
  );
};

export const Title4Font = (props: {
  children: React.ReactNode;
  key?: string | number;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}) => {
  return (
    <div
      style={{
        WebkitTextSizeAdjust: "none",
        fontSize: isMobile ? "24px" : "28px",
        lineHeight: isMobile ? "30px" : "36px",
        fontWeight: 600,
      }}
      onClick={props.onClick}
    >
      <div className={props.className} style={props.style}>
        {props.children}
      </div>
    </div>
  );
};

export const BoldFont = (props: {
  children: React.ReactNode;
  key?: string | number;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}) => {
  return (
    <div
      style={{
        WebkitTextSizeAdjust: "none",
        fontSize: isMobile ? "14px" : "16px",
        lineHeight: isMobile ? "18px" : "20px",
        fontWeight: 600,
      }}
      onClick={props.onClick}
    >
      <div className={props.className} style={props.style}>
        {props.children}
      </div>
    </div>
  );
};

export const NormalFont = (props: {
  children: React.ReactNode;
  key?: string | number;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}) => {
  return (
    <div
      key={props.key}
      style={{
        WebkitTextSizeAdjust: "none",
        fontSize: isMobile ? "14px" : "16px",
        lineHeight: isMobile ? "21px" : "24px",
        fontWeight: 400,
      }}
      onClick={props.onClick}
    >
      <div className={props.className} style={props.style}>
        {props.children}
      </div>
    </div>
  );
};
