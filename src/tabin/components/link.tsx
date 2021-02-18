import React, { CSSProperties } from "react";
/** @jsx jsx */
// when using emotion, can't use <>, instead use <React.Fragment>
// https://github.com/emotion-js/emotion/issues/1549
import { css, jsx } from "@emotion/core";
import { NormalFont } from "./fonts";

export const Link = (props: {
  kioskMode?: boolean;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  href?: string;
  style?: CSSProperties;
  destructive?: boolean;
  color?: string;
  hoverColor?: string;
}) => {
  // states

  // default styles
  let defaultStyle = {
    cursor: props.kioskMode ? "" : "pointer",
    display: "inline-block",
  };

  const defaultColor = "var(--lnk-color)";
  const hoverColor = "hsl(var(--lnk-hue), var(--lnk-saturation), 15%)";
  const destructiveColor = "hsl(0, 100%, 70%)";
  const desctructiveHoverColor = "hsl(0, 100%, 40%)";

  // props style
  let style = defaultStyle;
  if (props.style) {
    style = { ...style, ...props.style };
  }

  return (
    <React.Fragment>
      <a href={props.href} onClick={props.onClick}>
        <div
          style={style}
          css={css`
            color: ${props.color
              ? props.color
              : props.destructive
              ? destructiveColor
              : defaultColor};
            &:hover {
              color: ${props.hoverColor
                ? props.hoverColor
                : props.destructive
                ? desctructiveHoverColor
                : hoverColor};
            }
          `}
        >
          {props.children}
        </div>
      </a>
    </React.Fragment>
  );
};

export const NoWrapLink = (props: {
  children: React.ReactNode;
  onClick?:
    | ((event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void)
    | undefined;
  href?: string | undefined;
  style?: React.CSSProperties | undefined;
  destructive?: boolean | undefined;
  color?: string | undefined;
  hoverColor?: string | undefined;
}) => {
  return (
    <Link
      onClick={props.onClick}
      href={props.href}
      destructive={props.destructive}
      color={props.color}
      hoverColor={props.hoverColor}
      style={{ display: "block" }} // needs block so text truncates to ellipses
    >
      <div
        style={{
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {props.children}
      </div>
    </Link>
  );
};
