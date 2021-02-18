import React from "react";
import { Space1 } from "./spaces";
import { Title3Font, NormalFont } from "./fonts";

const styles = require("./messageBox.module.css");

export const MessageBox = (props: { title?: string; message?: string }) => {
  return (
    <>
      <div className={styles.message}>
        {props.title && props.message ? (
          <>
            <Title3Font className={styles.messageTitle}>
              {props.title}
            </Title3Font>
            <Space1 />
            <NormalFont className={styles.messageParagraph}>
              {props.message}
            </NormalFont>
          </>
        ) : props.title && !props.message ? (
          <Title3Font className={styles.messageTitle}>{props.title}</Title3Font>
        ) : (
          <NormalFont className={styles.messageParagraph}>
            {props.message}
          </NormalFont>
        )}
      </div>
    </>
  );
};
