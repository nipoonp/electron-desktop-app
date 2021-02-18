import React, { useEffect } from "react";
import { Logger } from "aws-amplify";
import {
  delay,
  getVerifoneSocketErrorMessage,
  getVerifoneTimeBasedTransactionId,
} from "../model/util";
import { useMutation } from "react-apollo-hooks";
import { CREATE_VERIFONE_TRANSACTION_LOG } from "../graphql/customMutations";

const electron = window.require("electron");
const ipcRenderer = electron.ipcRenderer;

const logger = new Logger("verifoneContext");

enum VMT {
  Purchase = "PR", //PR,txid,mid,amount
  /*---not used*/ PurchasePlusCash = "PC", //PC,txid,mid,amnt,cash
  /*---not used*/ CashOut = "CO", //CO,txid,mid, amount
  /*---not used*/ Refund = "RF", //RF,txid,mid, amount
  /*---not used*/ Logon = "LO", //LO,txid,mid
  /*---not used*/ SettlementCutover = "SC", //SC,txid,mid
  /*---not used*/ ReprintReceipt = "RR", //RR,txid,mid
  /*---not used*/ DisplayAdministrationMenu = "DA", //DA,txid,mid
  GetReceiptRequest = "GR?", //GR?,txid,mid
  GetReceiptResponse = "GR", //GR,txid,mid,receipt-text
  /*---not used*/ ResultRequest = "RS?", //RS?,txid,mid
  /*---not used*/ ResultResponse = "RS", //RS,txid,mid,resp-code,resp-text,card-type,online-flag
  ResultAndExtrasRequest = "RE?", //RE?,txid,mid
  ResultAndExtrasResponse = "RE", //RE,txid,mid,resp-code,resp-text,card-type,onlineflag,tip-amount
  ConfigurePrinting = "CP?", //CP?,on-off
  ConfigurePrintingResponse = "CP", //CP,on-off
  ReadyToPrintRequest = "RP?", //RP?
  ReadyToPrintResponse = "RP", //RP,print-result
  PrintRequest = "PT?", //PT?,print-text
  PrintResponse = "PT", //PT,print-result
  /*---not used*/ TerminalStatusRequest = "TS?", //TS?
  /*---not used*/ TerminalStatusResponse = "TS", //TS,terminal-status
  /*---not used*/ ReadCard = "RC", //RC,txid
  /*---not used*/ CardReadResultRequest = "CR?", //CR?,txid
  /*---not used*/ CardReadResultResponse = "CR", //CR,txid,card-read-result,card-PAN-data
  /*---not used*/ CardDetectionRequest = "CD?", //CD?,on-off
  /*---not used*/ CardDetectionResponse = "CD", //CD,on-off
  /*---not used*/ CardDetectionEvent = "CE", //CE,DETECTED
  INITIAL = "INITIAL", // This is to give it an initial value, should not be used elsewhere.
}

export enum VerifoneTransactionOutcome {
  Approved, // 00
  ApprovedWithSignature, // 09
  Cancelled, // CC
  Declined, // 55
  SettledOk, // 90
  HostUnavailable, // 91
  SystemError, // 99
  TransactionInProgress, // ??
  TerminalBusy, // BB
}

interface VerifoneTransactionOutcomeResult {
  transactionOutcome: VerifoneTransactionOutcome;
  eftposReceipt: string;
}

interface IEftposData {
  type: VMT;
  payload: string;
}

type ContextProps = {
  createTransaction: (
    amount: number,
    ipAddress: string,
    portNumber: string,
    restaurantId: string
  ) => Promise<VerifoneTransactionOutcomeResult>;
};

const VerifoneContext = React.createContext<ContextProps>({
  createTransaction: (
    amount: number,
    ipAddress: string,
    portNumber: string,
    restaurantId: string
  ) => {
    return new Promise(() => {
      console.log("");
    });
  },
});

const VerifoneProvider = (props: { children: React.ReactNode }) => {
  const interval = 1 * 1000; // 1 seconds
  const timeout = 3 * 60 * 1000; // 3 minutes
  const noResponseTimeout = 10 * 1000; // 10 seconds
  let lastMessageReceived: number;

  let isEftposConnected = false;
  let eftposError: string = "";
  let eftposData: IEftposData = {
    type: VMT.INITIAL,
    payload: "",
  };
  let eftposReceipt: string = "";

  const createVerifoneTransactionLogMutation = useMutation(
    CREATE_VERIFONE_TRANSACTION_LOG,
    {
      update: (proxy, mutationResult) => { },
    }
  );

  useEffect(() => {
    ipcRenderer.on("EFTPOS_CONNECT", (event: any, arg: any) => {
      console.log("EFTPOS_CONNECT:", arg);
      isEftposConnected = true;
    });

    ipcRenderer.on("EFTPOS_DATA", (event: any, arg: any) => {
      console.log("EFTPOS_DATA:", arg);

      const payloadArray = arg.split(",");
      const type = payloadArray[0];
      const dataPayload = payloadArray.slice(1).join(",");

      eftposData = {
        type: type as VMT,
        payload: dataPayload,
      };

      if (type == VMT.ReadyToPrintRequest) {
        ipcRenderer.send("BROWSER_DATA", `${VMT.ReadyToPrintResponse},OK`);
      } else if (type == VMT.PrintRequest) {
        eftposReceipt = dataPayload;
        ipcRenderer.send("BROWSER_DATA", `${VMT.PrintResponse},OK`);
      }

      lastMessageReceived = Number(new Date());
    });

    ipcRenderer.on("EFTPOS_ERROR", (event: any, arg: any) => {
      console.log("EFTPOS_ERROR:", arg);
      eftposError = arg;
    });

    ipcRenderer.on("EFTPOS_CLOSE", (event: any, arg: any) => {
      console.log("EFTPOS_CLOSE:", arg);
      isEftposConnected = false;
    });
  }, []);

  // useEffect(() => {
  //   (async function getUnfinishedTransactionResult() {
  //     const currDate = Number(new Date());
  //     const transactionId = localStorage.getItem("verifoneTransactionId");
  //     const merchantId = localStorage.getItem("verifoneMerchantId");

  //     if (transactionId == null || merchantId == null) return;

  //     // Connect To EFTPOS -------------------------------------------------------------------------------------------------------------------------------- //
  //     await connectToEftpos("192.168.1.43", "40001");
  //     const errorMessage = checkForErrors();
  //     if (errorMessage) {
  //       console.log(errorMessage);
  //       return;
  //     }

  //     ipcRenderer.send(
  //       "BROWSER_DATA",
  //       `${VMT.ResultAndExtrasRequest},${transactionId},${merchantId}`
  //     );

  //     while (eftposData.type != VMT.ResultAndExtrasResponse) {
  //       const errorMessage = checkForErrors();
  //       if (errorMessage) {
  //         console.log("Eftpos error: ", errorMessage);
  //         return;
  //       }

  //       console.log("Getting result of a previous unfinished transaction...");
  //       await delay(interval);
  //     }

  //     try {
  //       await createVerifoneTransactionLogMutation({
  //         variables: {
  //           transactionId: transactionId,
  //           merchantId: merchantId,
  //           type: eftposData.type,
  //           payload: eftposData.payload,
  //           restaurantId: "UNFINISHED-TRANSACTION",
  //           timestampEpoch: Number(Math.floor(currDate / 1000)),
  //         },
  //       });
  //     } catch (e) {
  //       console.log("Error in creating verifone transaction log", e);
  //     }

  //     ipcRenderer.send(
  //       "BROWSER_DATA",
  //       `${VMT.GetReceiptRequest},${transactionId},${merchantId}`
  //     );

  //     const getReceiptTimeoutEndTime = Number(new Date()) + noResponseTimeout;
  //     // @ts-ignore - suppress typescript warning because typescript does not understand that eftposData changes from within the socket hooks
  //     while (eftposData.type != VMT.GetReceiptResponse) {
  //       const errorMessage = checkForErrors();
  //       if (errorMessage) {
  //         console.log("Eftpos error: ", errorMessage);
  //         return;
  //       }

  //       if (!(Number(new Date()) < getReceiptTimeoutEndTime)) {
  //         disconnectEftpos();
  //         console.log(
  //           "There was an error getting the receipt of the unfinished transaction."
  //         );
  //         return;
  //       }

  //       console.log("Getting receipt of a previous unfinished transaction...");
  //       await delay(interval);
  //     }

  //     try {
  //       await createVerifoneTransactionLogMutation({
  //         variables: {
  //           transactionId: transactionId,
  //           merchantId: merchantId,
  //           type: eftposData.type,
  //           payload: eftposData.payload,
  //           restaurantId: "UNFINISHED-TRANSACTION",
  //           timestampEpoch: Number(Math.floor(currDate / 1000)),
  //         },
  //       });
  //     } catch (e) {
  //       console.log("Error in creating verifone transaction log", e);
  //     }

  //     localStorage.removeItem("verifoneTransactionId");
  //     localStorage.removeItem("verifoneMerchantId");

  //     // Disconnect Eftpos -------------------------------------------------------------------------------------------------------------------------------- //
  //     disconnectEftpos();
  //   })();
  // });

  const connectToEftpos = async (ipAddress: String, portNumber: String) => {
    eftposError = "";

    ipcRenderer.send("BROWSER_EFTPOS_CONNECT", {
      ipAddress: ipAddress,
      portNumber: portNumber,
    });

    while (!isEftposConnected) {
      await delay(interval);
      console.log("Waiting to connect to the Eftpos...");
      if (eftposError) return;
    }
  };

  const disconnectEftpos = async () => {
    ipcRenderer.send("BROWSER_EFTPOS_DISCONNECT");

    while (isEftposConnected) {
      console.log("Waiting for Eftpos to disconnect...");
      await delay(interval);
      if (eftposError) return;
    }

    console.log("Eftpos disconnected!");
  };

  const checkForErrors = () => {
    if (eftposError != "") {
      const error = getVerifoneSocketErrorMessage(eftposError);
      console.error(error);
      return error;
    }
  };

  const createTransaction = (
    amount: number,
    ipAddress: string,
    portNumber: string,
    restaurantId: string
  ): Promise<VerifoneTransactionOutcomeResult> => {
    return new Promise(async (resolve, reject) => {
      if (!amount) {
        reject("The amount has to be supplied");
        return;
      } else if (amount == 0) {
        reject("The amount must be greater than 0");
        return;
      } else if (!ipAddress) {
        reject("The IP address has to be supplied");
        return;
      } else if (!portNumber) {
        reject("The port number has to be supplied");
        return;
      }

      // Create Variables -------------------------------------------------------------------------------------------------------------------------------- //
      const endTime = Number(new Date()) + timeout;
      const transactionId = getVerifoneTimeBasedTransactionId();
      const merchantId = 0;
      let iSO8583ResponseCode;

      // Connect To EFTPOS -------------------------------------------------------------------------------------------------------------------------------- //
      await connectToEftpos(ipAddress, portNumber);
      const errorMessage = checkForErrors();
      if (errorMessage) {
        reject(errorMessage);
        return;
      }

      // Configure Printing -------------------------------------------------------------------------------------------------------------------------------- //
      ipcRenderer.send("BROWSER_DATA", `${VMT.ConfigurePrinting},ON`);

      const printingTimeoutEndTime = Number(new Date()) + noResponseTimeout;
      while (
        eftposData.type != VMT.ConfigurePrintingResponse // What if this is OFF?
      ) {
        const errorMessage = checkForErrors();
        if (errorMessage) {
          reject(errorMessage);
          return;
        }

        console.log("Waiting to receive ConfigurePrintingResponse (CP,ON)...");
        await delay(interval);

        if (!(Number(new Date()) < printingTimeoutEndTime)) {
          disconnectEftpos();
          reject("There was an issue configuring Eftpos Printing.");
          return;
        }
      }

      // Create A Transaction -------------------------------------------------------------------------------------------------------------------------------- //
      ipcRenderer.send(
        "BROWSER_DATA",
        `${VMT.Purchase},${transactionId},${merchantId},${amount}`
      );
      // localStorage.setItem("verifoneTransactionId", transactionId.toString());
      // localStorage.setItem("verifoneMerchantId", merchantId.toString());

      // Poll For Transaction Result -------------------------------------------------------------------------------------------------------------------------------- //
      while (true) {
        const loopDate = Number(new Date());

        const errorMessage = checkForErrors();
        if (errorMessage) {
          reject(errorMessage);
          return;
        }

        console.log("Polling for result...");
        await delay(interval);

        if (!(loopDate < endTime)) {
          disconnectEftpos();
          reject("Transaction timed out.");
          return;
        }

        if (!(loopDate < lastMessageReceived + noResponseTimeout)) {
          disconnectEftpos();
          reject(
            "Eftpos unresponsive. Please make sure your Eftpos is powered on and working."
          );
          return;
        }

        try {
          await createVerifoneTransactionLogMutation({
            variables: {
              transactionId: transactionId,
              merchantId: merchantId,
              amount: amount,
              type: eftposData.type,
              payload: eftposData.payload,
              restaurantId: restaurantId,
              timestampEpoch: Number(Math.floor(loopDate / 1000) + 2592000), // Add 30 days to timeStamp for DynamoDB TTL
            },
          });
        } catch (e) {
          console.log("Error in creating verifone transaction log", e);
        }

        // @ts-ignore - suppress typescript warning because typescript does not understand that eftposData changes from within the socket hooks
        if (eftposData.type == VMT.ResultAndExtrasResponse) {
          const verifonePurchaseResultArray = eftposData.payload.split(",");
          iSO8583ResponseCode = verifonePurchaseResultArray[2];

          if (iSO8583ResponseCode != "??") {
            // localStorage.removeItem("verifoneTransactionId");
            // localStorage.removeItem("verifoneMerchantId");
            break;
          }
        }

        ipcRenderer.send(
          "BROWSER_DATA",
          `${VMT.ResultAndExtrasRequest},${transactionId},${merchantId}`
        );
      }

      // Disconnect Eftpos -------------------------------------------------------------------------------------------------------------------------------- //
      disconnectEftpos();

      // Return Transaction Outcome -------------------------------------------------------------------------------------------------------------------------------- //
      let transactionOutcome: VerifoneTransactionOutcome;
      switch (iSO8583ResponseCode) {
        case "00":
          transactionOutcome = VerifoneTransactionOutcome.Approved;
          break;
        case "09":
          transactionOutcome = VerifoneTransactionOutcome.ApprovedWithSignature;
          break;
        case "CC":
          transactionOutcome = VerifoneTransactionOutcome.Cancelled;
          break;
        case "55":
          transactionOutcome = VerifoneTransactionOutcome.Declined;
          break;
        case "90":
          transactionOutcome = VerifoneTransactionOutcome.SettledOk;
          break;
        case "91":
          transactionOutcome = VerifoneTransactionOutcome.HostUnavailable;
          break;
        case "99":
          transactionOutcome = VerifoneTransactionOutcome.SystemError;
          break;
        case "??":
          transactionOutcome = VerifoneTransactionOutcome.TransactionInProgress;
          break;
        case "BB":
          transactionOutcome = VerifoneTransactionOutcome.TerminalBusy;
          break;
        default:
          transactionOutcome = VerifoneTransactionOutcome.SystemError;
          break;
      }

      resolve({
        transactionOutcome: transactionOutcome,
        eftposReceipt: eftposReceipt,
      });
    });
  };

  return (
    <VerifoneContext.Provider
      value={{
        createTransaction,
      }}
      children={props.children}
    />
  );
};

const useVerifone = () => {
  const context = React.useContext(VerifoneContext);

  if (context === undefined) {
    throw new Error(`useVerifone must be used within a VerifoneContext`);
  }

  return context;
};

export { VerifoneProvider, useVerifone };
