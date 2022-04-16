import ReactModal, { Props } from "react-modal";
import { FiX } from "react-icons/fi";

export const ModalV2 = (
    props: Props & {
        // centered?: boolean;
        width?: string;
        padding?: string;
        disableClose?: boolean;
        children: React.ReactNode;
    }
) => {
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
                        borderRadius: "10px",
                        padding: props.padding || "0",
                        margin: "40px",
                        inset: "auto",
                        width: props.width || "450px",
                    },
                }}
                {...props}
            >
                {!props.disableClose && (
                    <FiX style={{ cursor: "pointer", display: "inline-block", float: "right" }} size={30} onClick={props.onRequestClose} />
                )}
                <div>{props.children}</div>
            </ReactModal>
        </>
    );
};
