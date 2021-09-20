import ReactModal, { Props } from "react-modal";
import { CloseIcon } from "./icons/closeIcon";

export const ModalV2 = (
    props: Props & {
        // centered?: boolean;
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
                float: "right",
                padding: "6px",
            }}
        >
            <CloseIcon height="14px" />
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
                        // alignItems: props.centered ? "center" : "align-start",
                        overflow: "scroll",
                        // all properties must be defined (to overwrite defaults)
                        position: "fixed",
                        top: "0px",
                        left: "0px",
                        right: "0px",
                        bottom: "0px",
                        backgroundColor: "hsl(0, 0%, 0%, 0.7)",
                        alignItems: "center",
                    },
                    content: {
                        // all properties must be defined (to overwrite defaults)
                        position: "absolute",
                        backgroundColor: "rgb(255, 255, 255)",
                        overflow: "auto",
                        borderRadius: "20px",
                        padding: "24px",
                        margin: "40px",
                        inset: "auto",
                        width: "420px",
                    },
                }}
                {...props}
            >
                {!props.disableClose && closeIcon}
                <div>{props.children}</div>
            </ReactModal>
        </>
    );
};
