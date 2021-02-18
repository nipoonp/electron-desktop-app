import React from "react";
import ReactModal, { Props } from "react-modal";

export const KioskModal = (
  props: Props & {
    children: React.ReactNode;
  }
) => {
  return (
    <>
      <ReactModal
        style={{
          overlay: {
            zIndex: 102 /* above homeNav */,
            overflow: "scroll",
            // all properties must be defined (to overwrite defaults)
            position: "fixed",
            // cursor: "none",
          },
          content: {
            marginBottom: "none",
            // all properties must be defined (to overwrite defaults)
            position: "absolute",
            top: "0",
            right: "0",
            bottom: "0",
            left: "0",
            border: "none",
            borderRadius: "0",
            backgroundColor: "#FFFFFF",
            overflow: "auto",
            padding: "0",
          },
        }}
        {...props}
      >
        {props.children}
      </ReactModal>
    </>
  );
};
