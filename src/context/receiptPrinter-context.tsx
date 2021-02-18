import React, { useEffect } from "react";
import { IOrderReceipt } from "../model/model";
import { toast } from "../tabin/components/toast";

const electron = window.require("electron");
const ipcRenderer = electron.ipcRenderer;

type ContextProps = {
  printReceipt1: (payload: IOrderReceipt) => void;
  printReceipt2: (payload: IOrderReceipt) => void;
  printReceipt3: (payload: IOrderReceipt) => void;
};

const ReceiptPrinterContext = React.createContext<ContextProps>({
  printReceipt1: (payload: IOrderReceipt) => { },
  printReceipt2: (payload: IOrderReceipt) => { },
  printReceipt3: (payload: IOrderReceipt) => { },
});

const ReceiptPrinterProvider = (props: { children: React.ReactNode }) => {
  useEffect(() => {
    ipcRenderer.on("RECEIPT_PRINTER_1_ERROR", (event: any, arg: any) => {
      console.log("RECEIPT_PRINTER_1_ERROR:", arg);
      toast.error(
        "Connection with Receipt Printer 1 failed. Please make sure it is powered on and configured correctly."
      );
    });

    ipcRenderer.on("RECEIPT_PRINTER_2_ERROR", (event: any, arg: any) => {
      console.log("RECEIPT_PRINTER_2_ERROR:", arg);
      toast.error(
        "Connection with Receipt Printer 2 failed. Please make sure it is powered on and configured correctly."
      );
    });

    ipcRenderer.on("RECEIPT_PRINTER_3_ERROR", (event: any, arg: any) => {
      console.log("RECEIPT_PRINTER_3_ERROR:", arg);
      toast.error(
        "Connection with Receipt Printer 3 failed. Please make sure it is powered on and configured correctly."
      );
    });
  }, []);

  const printReceipt1 = (payload: IOrderReceipt) => {
    ipcRenderer.send("RECEIPT_PRINTER_1_DATA", payload);
  };

  const printReceipt2 = (payload: IOrderReceipt) => {
    ipcRenderer.send("RECEIPT_PRINTER_2_DATA", payload);
  };

  const printReceipt3 = (payload: IOrderReceipt) => {
    ipcRenderer.send("RECEIPT_PRINTER_3_DATA", payload);
  };

  return (
    <ReceiptPrinterContext.Provider
      value={{
        printReceipt1: printReceipt1,
        printReceipt2: printReceipt2,
        printReceipt3: printReceipt3,
      }}
      children={props.children}
    />
  );
};

const useReceiptPrinter = () => {
  const context = React.useContext(ReceiptPrinterContext);
  if (context === undefined) {
    throw new Error(
      `useReceiptPrinter must be used within a ReceiptPrinterProvider`
    );
  }
  return context;
};

export { ReceiptPrinterProvider, useReceiptPrinter };