import React, { useState } from "react";
import styles from "./dock.module.css";
import Modal from "react-modal";

export default props => {
  return (
    <Modal
      overlayClassName={styles.dockOverlay}
      className={styles.dock}
      {...props}
    >
      <div className={styles.dockBody}>{props.children}</div>
    </Modal>
  );
};
