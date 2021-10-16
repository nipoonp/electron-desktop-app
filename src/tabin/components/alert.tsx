// import { Button } from "./button";

// import { FiX } from "react-icons/fi";
// import { ModalV2 } from "./modalv2";

// // import "./alert.scss";

// export const Alert = (props: IProps) => {
//     return (
//         <ModalV2 isOpen={true} disableClose={false} onRequestClose={props.onFalse}>
//             <div className={`alert ${props.className}`} style={props.style}>
//                 <FiX style={{ cursor: "pointer", display: "inline-block", float: "right" }} size={30} onClick={props.onFalse} />

//                 <div className="mb-3">
//                     <div className="h3 mb-2">{props.heading}</div>
//                     <div>{props.body}</div>
//                 </div>

//                 <div>
//                     <Button onClick={props.onFalse}>Cancel</Button>
//                     <Button onClick={props.onTrue}>Continue</Button>
//                 </div>
//             </div>
//         </ModalV2>
//     );
// };

// export const alert = {
//     success(heading: string, body: string, onFalse: () => void, onTrue: () => void) {
//         return <Alert heading={heading} body={body} onFalse={onFalse} onTrue={onTrue}></Alert>;
//     },
// };

// export interface IProps {
//     heading: string;
//     body: string;
//     onFalse: () => void;
//     onTrue: () => void;
//     children?: React.ReactNode;
//     style?: React.CSSProperties;
//     className?: string;
// }

import { ToastContainer as _AlertContainer } from "react-toastify";
import { toast as _alert, Slide } from "react-toastify";
import { CheckIcon } from "./icons/checkIcon";
import { TimesCircleIcon } from "./icons/timesCircleIcon";
import { CloseThickIcon } from "./icons/closeThickIcon";
import { FiX } from "react-icons/fi";
import { Button } from "./button";

const styles = require("./alert.scss");

export const AlertContainer = () => {
    return (
        <_AlertContainer
            style={{
                top: "0",
                right: "0",
                padding: "12px",
                width: "400px",
            }}
            transition={Slide}
            hideProgressBar
            position={"top-right"}
            draggable={false}
            autoClose={2000000000}
            closeOnClick={false}
        />
    );
};

export const alert = {
    success(heading: string, body: string, onFalse: () => void, onTrue: () => void) {
        return _alert(<CustomAlert heading={heading} body={body} onFalse={onFalse} onTrue={onTrue} />, {
            closeButton: false,
            className: styles.alert,
        });
    },
};

const CustomAlert = (props: {
    heading: string;
    body: string;
    onFalse: () => void;
    onTrue: () => void;
    closeToast?: () => void; // passed in by react-toastify
}) => {
    const onFalse = () => {
        props.closeToast && props.closeToast();
        props.onFalse();
    };

    const onTrue = () => {
        props.closeToast && props.closeToast();
        props.onTrue();
    };

    return (
        <>
            <div className="alert-wrapper">
                <div className="alert">
                    <FiX className="alert-close-button" size={30} onClick={onFalse} />

                    <div className="mb-3">
                        <div className="h3 mb-2">{props.heading}</div>
                        <div className="alert-body">{props.body}</div>
                    </div>

                    <div className="alert-button-wrapper">
                        <Button className="alert-false-button mr-2" onClick={onFalse}>
                            Cancel
                        </Button>
                        <Button className="alert-true-button" onClick={onTrue}>
                            Continue
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};
