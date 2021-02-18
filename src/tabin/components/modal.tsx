import React from "react";
import ReactModal, { Props } from "react-modal";
import { Logger } from "aws-amplify";
import { CloseIcon } from "./closeIcon";
import { useSmallScreen } from "../../hooks/useWindowSize";

const styles = require("./modal.module.css");
const logger = new Logger("Modal");

// bigscreen: fixed width, dark overlay, close button
// smallscreen: covers full screen, white overlay, close button
export const Modal = (
  props: Props & {
    children: React.ReactNode;
    hideCloseButton?: Boolean;
  }
) => {
  // context
  const { isSmallScreen } = useSmallScreen();

  // callbacks
  const onClose = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.preventDefault();
    props.onRequestClose && props.onRequestClose(event);
  };

  const onContentClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
  };

  // constants
  const overlayStyles = {
    backgroundColor: "hsl(0, 0%, 0%, 0.6)",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    overflowY: "scroll",
    zIndex: 102 /* above homeNav */,
    position: "fixed",
    WebkitOverflowScrolling: "touch",
  };

  const smallScreenOverlayStyles = {
    /* Background color of modal set to white for small screens because of iPhones rubber band effect */
    backgroundColor: "white",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    overflowY: "scroll",
    zIndex: 102 /* above homeNav */,
    position: "fixed",
    WebkitOverflowScrolling: "touch",
  };

  const contentStyles = {
    background: "none",
    // override defaults from reactModal
    position: "relative",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    border: "none",
    overflow: "auto",
    WebkitOverflowScrolling: "touch",
    borderRadius: 0,
    outline: "none",
    padding: 0,
  };

  const smallScreenContentStyles = {
    /* for mobile rubber banding effect */
    /* even when content is not long enough */
    height: "100%",
    // override defaults from reactModal
    position: "relative",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    border: "none",
    background: "white",
    overflow: "auto",
    WebkitOverflowScrolling: "touch",
    borderRadius: 0,
    outline: "none",
    padding: 0,
  };

  return (
    <ReactModal
      // style={
      //   isSmallScreen
      //     ? {
      //         overlay: smallScreenOverlayStyles,
      //         content: smallScreenContentStyles
      //       }
      //     : { overlay: overlayStyles, content: contentStyles }
      // }
      // overlayClassName={styles.modalOverlay}
      // className={styles.modal}
      {...props}
    >
      <div className={styles.modalContainer} onClick={onClose}>
        <div className={styles.modalContent} onClick={onContentClick}>
          {!props.hideCloseButton && (
            <div className={styles.closeButton} onClick={onClose}>
              <CloseIcon height={"16px"} />
            </div>
          )}
          {props.children}
        </div>
      </div>
    </ReactModal>
  );
};
