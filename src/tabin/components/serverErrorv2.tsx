import React from "react";
import { NormalFont } from "./fonts";

export const ServerErrorV2 = (props: { message: string }) => {
  const iconStyle = {
    width: "48px",
    backgroundColor: "rgb(252, 100, 45)",
    borderColor: "rgb(252, 100, 45)",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "0px",
    borderBottomRightRadius: "0px",
    borderBottomLeftRadius: "8px",
    borderTopWidth: "2px",
    borderRightWidth: "0px",
    borderBottomWidth: "2px",
    borderLeftWidth: "2px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };

  const textStyle = {
    width: "100%",
    backgroundColor: "white",
    borderTopLeftTadius: "0px",
    borderTopTightTadius: "8px",
    borderBottomTightTadius: "8px",
    borderBottomLeftTadius: "0px",
    borderStyle: "solid",
    borderColor: "rgb(235, 235, 235)",
    borderTopWidth: "2px",
    borderTightWidth: "2px",
    borderBottomWidth: "2px",
    borderLeftWidth: "0px",
    padding: "20px 8px"
  };

  return (
    <div style={{ display: "flex" }}>
      <div style={iconStyle}>
        <svg
          viewBox="0 0 24 24"
          role="presentation"
          aria-hidden="true"
          focusable="false"
          style={{
            height: "24px",
            width: "24px",
            display: "block",
            fill: "rgb(255, 255, 255)"
          }}
        >
          <path d="m23.49 20.79c.39.73.12 1.64-.61 2.03-.22.12-.46.18-.71.18h-20.33c-.83 0-1.5-.67-1.5-1.5 0-.25.06-.49.18-.71l10.16-18.94c.39-.73 1.3-1 2.03-.61.26.14.47.35.61.61zm-11.05-18.47c-.05-.09-.12-.16-.2-.2-.24-.13-.55-.04-.68.2l-10.16 18.94c-.04.07-.06.15-.06.24 0 .28.22.5.5.5h20.33c.08 0 .16-.02.24-.06.24-.13.33-.43.2-.68zm-.48 4.68c-.58.02-1.04.51-1.02 1.1l.29 7.42c.01.27.23.48.5.48h.54c.27 0 .49-.21.5-.48l.29-7.42c0-.01 0-.03 0-.04 0-.58-.47-1.06-1.06-1.06-.01 0-.03 0-.04 0zm-.96 12c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1-1 .45-1 1z" />
        </svg>
      </div>
      <div style={textStyle}>
        <NormalFont>{props.message}</NormalFont>
      </div>
    </div>
  );
};
