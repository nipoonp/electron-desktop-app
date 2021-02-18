import React from "react";
import { ToastContainer as _ToastContainer } from "react-toastify";
import { toast as _toast, Slide } from "react-toastify";
import { isMobile } from "react-device-detect";
import { CheckIcon } from "./checkIcon";
import { TimesIcon } from "./timesIcon";
import { TimesCircleIcon } from "./timesCircleIcon";
import { NormalFont } from "./fonts";
import { CloseThickIcon } from "./closeThickIcon";
import { BlackColor } from "./colors";

const styles = require("./toast.module.css");

export const ToastContainer = () => {
  return (
    <_ToastContainer
      style={{
        top: "0",
        right: "0",
        padding: "12px",
        width: isMobile ? "100%" : "400px",
      }}
      transition={Slide}
      hideProgressBar
      draggablePercent={60}
      position={isMobile ? "top-center" : "top-right"}
      draggable={false}
      autoClose={2000}
      closeOnClick={false}
    />
  );
};

export const toast = {
  success(message: string) {
    return _toast(<CustomToast message={message} type="success" />, {
      closeButton: false,
      className: styles.toast,
    });
  },
  error(message: string) {
    return _toast(<CustomToast message={message} type="error" />, {
      closeButton: false,
      className: styles.toast,
    });
  },
};

const CustomToast = (props: {
  message: string;
  type: "success" | "error";
  closeToast?: () => void; // passed in by react-toastify
}) => {
  // constants
  const color =
    props.type === "success"
      ? "#0dbd6f"
      : props.type === "error"
      ? "#D91115"
      : "";

  // displays
  const floatingCloseButton = (
    <div
      style={{
        position: "absolute",
        right: "10px",
        top: "10px",
      }}
      onClick={props.closeToast}
    >
      <div style={{ cursor: "pointer", color: "hsl(0,0%,50%)" }}>
        <CloseThickIcon height={"12px"} />
      </div>
    </div>
  );

  const messageDisplay = <NormalFont>{props.message}</NormalFont>;

  const iconDisplay = (
    <>
      <div style={{ color: color }}>
        {props.type === "success" && <CheckIcon height="20px" />}
        {props.type === "error" && <TimesCircleIcon height="20px" />}
      </div>
    </>
  );

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          position: "relative",
          padding: "20px",
          borderLeft: "5px solid" + color,
        }}
      >
        <BlackColor>
          {floatingCloseButton}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gridColumnGap: "10px",
              alignItems: "center",
            }}
          >
            {iconDisplay}
            {messageDisplay}
          </div>
        </BlackColor>
      </div>
    </>
  );
};
