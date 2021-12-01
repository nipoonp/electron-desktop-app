import { useState, createContext, useContext } from "react";
import { Button } from "./button";
import { ModalV2 } from "./modalv2";

type ContextProps = {
    showAlert: (heading: string, body: string, onFalse: () => void, onTrue: () => void) => void;
};

const AlertContext = createContext<ContextProps>({
    showAlert: (heading: string, body: string, onFalse: () => void, onTrue: () => void) => {},
});

let onTrueFunc;
let onFalseFunc;

const AlertProvider = (props: { children: React.ReactNode }) => {
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [heading, setHeading] = useState("");
    const [body, setBody] = useState("");

    const showAlert = (heading: string, body: string, onFalse: () => void, onTrue: () => void) => {
        setIsAlertVisible(true);
        setHeading(heading);
        setBody(body);
        onTrueFunc = onTrue;
        onFalseFunc = onFalse;
    };

    const _onTrue = () => {
        setIsAlertVisible(false);
        onTrueFunc && onTrueFunc();
    };

    const _onFalse = () => {
        setIsAlertVisible(false);
        onFalseFunc && onFalseFunc();
    };

    return (
        <AlertContext.Provider
            value={{
                showAlert: showAlert,
            }}
            children={
                <>
                    {props.children}
                    {isAlertVisible && <Alert heading={heading} body={body} onTrue={_onTrue} onFalse={_onFalse} />}
                </>
            }
        />
    );
};

export const Alert = (props: IProps) => {
    return (
        <ModalV2 isOpen={true} disableClose={false} onRequestClose={props.onFalse}>
            <div className={`alert ${props.className}`} style={props.style}>
                <div className="mb-3">
                    <div className="h3 mb-2">{props.heading}</div>
                    <div style={{ lineHeight: 1.4 }}>{props.body}</div>
                </div>

                <div style={{ display: "flex" }}>
                    <Button
                        style={{
                            width: "50%",
                            backgroundColor: "#ffffff",
                            color: "#484848",
                            border: "1px solid #e0e0e0",
                            padding: "16px 30px",
                            fontWeight: 300,
                        }}
                        className="mr-2"
                        onClick={props.onFalse}
                    >
                        {props.falseButtonText}
                    </Button>
                    <Button style={{ width: "50%" }} onClick={props.onTrue}>
                        {props.trueButtonText}
                    </Button>
                </div>
            </div>
        </ModalV2>
    );
};

export interface IProps {
    heading: string;
    body: string;
    falseButtonText: string;
    trueButtonText: string;
    onFalse: () => void;
    onTrue: () => void;
    children?: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
}

Alert.defaultProps = {
    falseButtonText: "No",
    trueButtonText: "Yes",
};

const useAlert = () => {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error(`useAlert must be used within a AlertProvider`);
    }
    return context;
};

export { AlertProvider, useAlert };
