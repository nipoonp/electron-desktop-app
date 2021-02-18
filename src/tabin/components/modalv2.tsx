import React from "react";
import ReactModal, { Props } from "react-modal";
import { Space2 } from "./spaces";
import { CloseIcon } from "./closeIcon";

// Styles
// 2 styles: centered or with 40px on top
// for small modals: use centered
// otherwise: use 40px on top

// https://medium.com/react-camp/how-to-fight-the-body-scroll-2b00267b37ac
// To prevent body scrolling when modal is open
// copy paste the code below
/*
  // ref for body-scroll-lock
  // https://codesandbox.io/embed/recursing-night-s8dqc?fontsize=14
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wrapperRef.current) {
      // disable when open
      if (showServiceFeeInfoModal) {
        disableBodyScroll(wrapperRef.current, {
          allowTouchMove: element => element.id === "no-scroll-lock"
        });
      } else {
        // enable when closed
        enableBodyScroll(wrapperRef.current);
        clearAllBodyScrollLocks();
      }
    }
    // listen for modalShown state
  }, [showServiceFeeInfoModal]);

  return (
    <>
      <div ref={wrapperRef}>
        ...
      </div>
    </>
  )
  */
//
export const ModalV2 = (
  props: Props & {
    centered?: boolean;
    disableClose?: boolean;
    children: React.ReactNode;
  }
) => {
  // constants
  const closeIcon = (
    <div
      onClick={props.onRequestClose}
      style={{
        cursor: "pointer",
        display: "inline-block",
      }}
    >
      <CloseIcon height={"14px"} />
    </div>
  );

  return (
    <>
      <ReactModal
        style={{
          overlay: {
            display: "flex",
            justifyContent: "center",
            zIndex: 102 /* above homeNav */,
            alignItems: props.centered ? "center" : "align-start",
            overflow: "scroll",
            // all properties must be defined (to overwrite defaults)
            position: "fixed",
            top: "0px",
            left: "0px",
            right: "0px",
            bottom: "0px",
            backgroundColor: "hsl(0, 0%, 0%, 0.7)",
            cursor: "pointer",
          },
          content: {
            marginBottom: props.centered ? "none" : "80px",
            // all properties must be defined (to overwrite defaults)
            position: "absolute",
            top: props.centered ? "none" : "40px",
            left: "none",
            right: "none",
            bottom: "none",
            border: "1px solid rgb(204, 204, 204)",
            backgroundColor: "rgb(255, 255, 255)",
            overflow: "auto",
            borderTopLeftRadius: "4px",
            borderTopRightRadius: "4px",
            borderBottomRightRadius: "4px",
            borderBottomLeftRadius: "4px",
            outline: "none",
            padding: "24px",
            backgroundPosition: "initial initial",
            backgroundRepeat: "initial initial",
          },
        }}
        {...props}
      >
        {!props.disableClose && closeIcon}
        {!props.disableClose && <Space2 />}
        <div>{props.children}</div>
      </ReactModal>
    </>
  );
};
