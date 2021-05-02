import React, { useEffect } from "react";
import { IOrderReceipt } from "../model/model";
import { toast } from "../tabin/components/toast";

let electron: any;
let ipcRenderer: any;
try {
    electron = window.require("electron");
    ipcRenderer = electron.ipcRenderer;
} catch (e) {}

type ContextProps = {
    printReceipt: (payload: IOrderReceipt) => void;
};

const ReceiptPrinterContext = React.createContext<ContextProps>({
    printReceipt: (payload: IOrderReceipt) => {},
});

const ReceiptPrinterProvider = (props: { children: React.ReactNode }) => {
    useEffect(() => {
        ipcRenderer &&
            ipcRenderer.on("RECEIPT_PRINTER_ERROR", (event: any, arg: any) => {
                console.log("RECEIPT_PRINTER_ERROR:", arg);
                toast.error("Connection with Receipt Printer 1 failed. Please make sure it is powered on and configured correctly.");
            });
    }, []);

    const printReceipt = (payload: IOrderReceipt) => {
        ipcRenderer && ipcRenderer.send("RECEIPT_PRINTER_DATA", payload);
    };

    return (
        <ReceiptPrinterContext.Provider
            value={{
                printReceipt: printReceipt,
            }}
            children={props.children}
        />
    );
};

const useReceiptPrinter = () => {
    const context = React.useContext(ReceiptPrinterContext);
    if (context === undefined) {
        throw new Error(`useReceiptPrinter must be used within a ReceiptPrinterProvider`);
    }
    return context;
};

export { ReceiptPrinterProvider, useReceiptPrinter };
