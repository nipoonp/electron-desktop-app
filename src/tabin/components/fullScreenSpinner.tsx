import React from "react";
import { Space2 } from "./spaces";
import { Title3Font } from "./fonts";
import { Spinner } from "./spinner";

export const FullScreenSpinner = (props: { show: boolean; text?: string }) => {
  return (
    <>
      {props.show && (
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            display: "flex",
            zIndex: 103
            /* above homeNav and modal  */
          }}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column"
            }}
          >
            <Spinner
              spinnerDotsStyle={{
                backgroundColor: "var(--primary-color)",
                height: "15px",
                width: "15px"
              }}
            />
            {props.text && (
              <>
                <Space2 />
                <Title3Font style={{ fontWeight: 500 }}>
                  {props.text}
                </Title3Font>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
