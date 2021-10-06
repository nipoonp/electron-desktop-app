import { useState, useEffect, createContext, useContext, useRef } from "react";

import { Logger } from "aws-amplify";
import { delay, getVerifoneSocketErrorMessage, getVerifoneTimeBasedTransactionId } from "../model/util";
import { useMutation } from "@apollo/client";
import { CREATE_EFTPOS_TRANSACTION_LOG } from "../graphql/customMutations";
import { toLocalISOString } from "../util/util";
import { EEftposTransactionOutcome, IEftposTransactionOutcome, EVerifoneTransactionOutcome } from "../model/model";
import { useErrorLogging } from "./errorLogging-context";

let electron: any;
let ipcRenderer: any;
try {
    electron = window.require("electron");
    ipcRenderer = electron.ipcRenderer;
} catch (e) {}

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

interface IEftposData {
    type: VMT;
    payload: string;
}

const initialLastMessageReceived = 0;
const initialIsEftposConnected = false;
const initialEftposError = "";
const initialEftposData = {
    type: VMT.INITIAL,
    payload: "",
};
const initialEftposReceipt = "";
const initialLogs = "";

type ContextProps = {
    createTransaction: (amount: number, ipAddress: string, portNumber: string, restaurantId: string) => Promise<IEftposTransactionOutcome>;
};

const VerifoneContext = createContext<ContextProps>({
    createTransaction: (amount: number, ipAddress: string, portNumber: string, restaurantId: string) => {
        return new Promise(() => {
            console.log("");
        });
    },
});

const VerifoneProvider = (props: { children: React.ReactNode }) => {
    const { addVerifoneLog } = useErrorLogging();

    const interval = 1 * 500; // 0.5 seconds
    const timeout = 3 * 60 * 1000; // 3 minutes
    const noResponseTimeout = 10 * 1000; // 10 seconds

    const lastMessageReceived = useRef<number>(initialLastMessageReceived);
    const isEftposConnected = useRef<boolean>(initialIsEftposConnected);
    const eftposError = useRef<string>(initialEftposError);
    const eftposData = useRef<IEftposData>(initialEftposData);
    const eftposReceipt = useRef<string>(initialEftposReceipt);
    const logs = useRef<string>(initialLogs);

    const resetVariables = () => {
        //Add new reset if new variables are added above.
        lastMessageReceived.current = initialLastMessageReceived;
        isEftposConnected.current = initialIsEftposConnected;
        eftposError.current = initialEftposError;
        eftposData.current = initialEftposData;
        eftposReceipt.current = initialEftposReceipt;
        logs.current = initialLogs;
    };

    useEffect(() => {
        ipcRenderer &&
            ipcRenderer.on("EFTPOS_CONNECT", (event: any, arg: any) => {
                console.log("EFTPOS_CONNECT:", arg);
                addToLogs(`EFTPOS_CONNECT: ${arg}`);

                isEftposConnected.current = true;
            });

        ipcRenderer &&
            ipcRenderer.on("EFTPOS_DATA", (event: any, arg: any) => {
                console.log("EFTPOS_DATA:", arg);
                addToLogs(`EFTPOS_DATA: ${arg}`);

                const payloadArray = arg.split(",");
                const type = payloadArray[0];
                const dataPayload = payloadArray.slice(1).join(",");

                eftposData.current = {
                    type: type as VMT,
                    payload: dataPayload,
                };

                if (type == VMT.ReadyToPrintRequest) {
                    ipcRenderer && ipcRenderer.send("BROWSER_DATA", `${VMT.ReadyToPrintResponse},OK`);
                    addToLogs(`BROWSER_DATA: ${VMT.ReadyToPrintResponse},OK`);
                } else if (type == VMT.PrintRequest) {
                    eftposReceipt.current = dataPayload;
                    ipcRenderer && ipcRenderer.send("BROWSER_DATA", `${VMT.PrintResponse},OK`);
                    addToLogs(`BROWSER_DATA ${VMT.PrintResponse},OK`);
                }

                lastMessageReceived.current = Number(new Date());
            });

        ipcRenderer &&
            ipcRenderer.on("EFTPOS_ERROR", (event: any, arg: any) => {
                console.log("EFTPOS_ERROR:", arg);
                addToLogs(`EFTPOS_ERROR: ${arg}`);

                eftposError.current = arg;
            });

        ipcRenderer &&
            ipcRenderer.on("EFTPOS_CLOSE", (event: any, arg: any) => {
                console.log("EFTPOS_CLOSE:", arg);
                addToLogs(`EFTPOS_CLOSE: ${arg}`);

                isEftposConnected.current = false;
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

    //     ipcRenderer && ipcRenderer.send(
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
    //       createEftposTransactionLogMutation({
    //         variables: {
    //           eftposProvider: "VERIFONE",
    //           transactionId: transactionId,
    //           merchantId: merchantId,
    //           type: eftposData.type,
    //           payload: eftposData.payload,
    //           restaurantId: "UNFINISHED-TRANSACTION",
    //           expiry: Number(Math.floor(currDate / 1000)),
    //         },
    //       });
    //     } catch (e) {
    //       console.log("Error in creating verifone transaction log", e);
    //     }

    //     ipcRenderer &&ipcRenderer.send(
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
    //       createEftposTransactionLogMutation({
    //         variables: {
    //           eftposProvider: "VERIFONE",
    //           transactionId: transactionId,
    //           merchantId: merchantId,
    //           type: eftposData.type,
    //           payload: eftposData.payload,
    //           restaurantId: "UNFINISHED-TRANSACTION",
    //           expiry: Number(Math.floor(currDate / 1000)),
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

    const addToLogs = (log: string) => {
        logs.current += log + "\n";
    };

    const createEftposTransactionLog = async (restaurantId: string, amount: number) => {
        const now = new Date();

        await addVerifoneLog({
            eftposProvider: "VERIFONE",
            amount: amount,
            type: eftposData.current.type,
            payload: logs.current,
            restaurantId: restaurantId,
            timestamp: toLocalISOString(now),
            expiry: Number(Math.floor(Number(now) / 1000) + 7776000), // Add 90 days to timeStamp for DynamoDB TTL
        });
    };

    const connectToEftpos = async (ipAddress: String, portNumber: String) => {
        const connectTimeoutEndTime = Number(new Date()) + noResponseTimeout;

        eftposError.current = "";

        ipcRenderer &&
            ipcRenderer.send("BROWSER_EFTPOS_CONNECT", {
                ipAddress: ipAddress,
                portNumber: portNumber,
            });
        addToLogs(`BROWSER_EFTPOS_CONNECT: ${ipAddress}:${portNumber}`);

        while (!isEftposConnected.current) {
            await delay(interval);

            console.log("Waiting to connect to the Eftpos...");
            addToLogs("Waiting to connect to the Eftpos...");

            if (!(Number(new Date()) < connectTimeoutEndTime)) {
                return true;
            }

            if (eftposError.current) return false;
        }

        console.log("Eftpos connected!");
        addToLogs("Eftpos connected!");

        return false;
    };

    const disconnectEftpos = async () => {
        const disconnectTimeoutEndTime = Number(new Date()) + noResponseTimeout;

        ipcRenderer && ipcRenderer.send("BROWSER_EFTPOS_DISCONNECT");
        addToLogs("BROWSER_EFTPOS_DISCONNECT");

        while (isEftposConnected.current) {
            await delay(interval);

            console.log("Waiting for Eftpos to disconnect...");
            addToLogs("Waiting for Eftpos to disconnect...");

            if (!(Number(new Date()) < disconnectTimeoutEndTime)) {
                return true;
            }

            if (eftposError.current) return false;
        }

        console.log("Eftpos disconnected!");
        addToLogs("Eftpos disconnected!");

        return false;
    };

    const checkForErrors = () => {
        if (eftposError.current != "") {
            const error = getVerifoneSocketErrorMessage(eftposError.current);

            console.error(error);
            addToLogs(`Error: ${error}`);

            return error;
        }
    };

    const createTransaction = (amount: number, ipAddress: string, portNumber: string, restaurantId: string): Promise<IEftposTransactionOutcome> => {
        resetVariables();

        return new Promise(async (resolve, reject) => {
            addToLogs("Transaction Started.");

            if (!amount) {
                addToLogs("Reject: The amount has to be supplied");
                await createEftposTransactionLog(restaurantId, amount);

                reject("The amount has to be supplied");
                return;
            } else if (amount == 0) {
                addToLogs("Reject: The amount must be greater than 0");
                await createEftposTransactionLog(restaurantId, amount);

                reject("The amount must be greater than 0");
                return;
            } else if (!ipAddress) {
                addToLogs("Reject: The IP address has to be supplied");
                await createEftposTransactionLog(restaurantId, amount);

                reject("The IP address has to be supplied");
                return;
            } else if (!portNumber) {
                addToLogs("Reject: The port number has to be supplied");
                await createEftposTransactionLog(restaurantId, amount);

                reject("The port number has to be supplied");
                return;
            }

            // Create Variables -------------------------------------------------------------------------------------------------------------------------------- //
            const endTime = Number(new Date()) + timeout;
            const transactionId = getVerifoneTimeBasedTransactionId();
            const merchantId = 0;
            let iSO8583ResponseCode;

            // Connect To EFTPOS -------------------------------------------------------------------------------------------------------------------------------- //
            const connectTimedOut = await connectToEftpos(ipAddress, portNumber);
            if (connectTimedOut) {
                addToLogs("Reject: There was an issue connecting to the Eftpos.");
                await createEftposTransactionLog(restaurantId, amount);

                reject("There was an issue connecting to the Eftpos.");
                return;
            }

            const errorMessage = checkForErrors();
            if (errorMessage) {
                addToLogs(`Reject: ${errorMessage}`);
                await createEftposTransactionLog(restaurantId, amount);

                reject(errorMessage);
                return;
            }

            // Configure Printing -------------------------------------------------------------------------------------------------------------------------------- //
            ipcRenderer && ipcRenderer.send("BROWSER_DATA", `${VMT.ConfigurePrinting},ON`);
            addToLogs(`BROWSER_DATA: ${VMT.ConfigurePrinting},ON`);

            const printingTimeoutEndTime = Number(new Date()) + noResponseTimeout;
            while (
                eftposData.current.type != VMT.ConfigurePrintingResponse // What if this is OFF?
            ) {
                const errorMessage = checkForErrors();
                if (errorMessage) {
                    addToLogs(`Reject: ${errorMessage}`);
                    await createEftposTransactionLog(restaurantId, amount);

                    reject(errorMessage);
                    return;
                }

                console.log("Waiting to receive Configure Printing Response (CP,ON)...");
                addToLogs("Waiting to receive Configure Printing Response (CP,ON)...");

                await delay(interval);

                if (!(Number(new Date()) < printingTimeoutEndTime)) {
                    const disconnectTimedOut = await disconnectEftpos();
                    if (disconnectTimedOut) {
                        addToLogs("Reject: There was an issue disconnecting to the Eftpos.");
                        await createEftposTransactionLog(restaurantId, amount);

                        reject("There was an issue disconnecting to the Eftpos.");
                        return;
                    }

                    addToLogs("Reject: There was an issue configuring Eftpos Printing.");
                    await createEftposTransactionLog(restaurantId, amount);

                    reject("There was an issue configuring Eftpos Printing.");
                    return;
                }
            }

            // Create A Transaction -------------------------------------------------------------------------------------------------------------------------------- //
            ipcRenderer && ipcRenderer.send("BROWSER_DATA", `${VMT.Purchase},${transactionId},${merchantId},${amount}`);
            addToLogs(`BROWSER_DATA: ${VMT.Purchase},${transactionId},${merchantId},${amount}`);
            // localStorage.setItem("verifoneTransactionId", transactionId.toString());
            // localStorage.setItem("verifoneMerchantId", merchantId.toString());

            // Poll For Transaction Result -------------------------------------------------------------------------------------------------------------------------------- //
            while (true) {
                const now = new Date();
                const loopDate = Number(now);

                const errorMessage = checkForErrors();
                if (errorMessage) {
                    addToLogs(`Reject: ${errorMessage}`);
                    await createEftposTransactionLog(restaurantId, amount);

                    reject(errorMessage);
                    return;
                }

                console.log("Polling for result...");
                addToLogs("Polling for result...");

                await delay(interval);

                if (!(loopDate < endTime)) {
                    const disconnectTimedOut = await disconnectEftpos();
                    if (disconnectTimedOut) {
                        addToLogs("Reject: There was an issue disconnecting to the Eftpos.");
                        await createEftposTransactionLog(restaurantId, amount);

                        reject("There was an issue disconnecting to the Eftpos.");
                        return;
                    }

                    addToLogs("Reject: Transaction timed out.");
                    await createEftposTransactionLog(restaurantId, amount);

                    reject("Transaction timed out.");
                    return;
                }

                if (!(loopDate < lastMessageReceived.current + noResponseTimeout)) {
                    const disconnectTimedOut = await disconnectEftpos();
                    if (disconnectTimedOut) {
                        addToLogs("Reject: There was an issue disconnecting to the Eftpos.");
                        await createEftposTransactionLog(restaurantId, amount);

                        reject("There was an issue disconnecting to the Eftpos.");
                        return;
                    }

                    addToLogs("Reject: Eftpos unresponsive. Please make sure your Eftpos is powered on and working.");
                    await createEftposTransactionLog(restaurantId, amount);

                    reject("Eftpos unresponsive. Please make sure your Eftpos is powered on and working.");
                    return;
                }

                // @ts-ignore - suppress typescript warning because typescript does not understand that eftposData changes from within the socket hooks
                if (eftposData.current.type == VMT.ResultAndExtrasResponse) {
                    const verifonePurchaseResultArray = eftposData.current.payload.split(",");
                    iSO8583ResponseCode = verifonePurchaseResultArray[2];

                    if (iSO8583ResponseCode != "??") {
                        // localStorage.removeItem("verifoneTransactionId");
                        // localStorage.removeItem("verifoneMerchantId");
                        break;
                    }
                }

                ipcRenderer && ipcRenderer.send("BROWSER_DATA", `${VMT.ResultAndExtrasRequest},${transactionId},${merchantId}`);
                addToLogs(`BROWSER_DATA: ${VMT.ResultAndExtrasRequest},${transactionId},${merchantId}`);
            }

            // Disconnect Eftpos -------------------------------------------------------------------------------------------------------------------------------- //
            const disconnectTimedOut = await disconnectEftpos();
            if (disconnectTimedOut) {
                addToLogs("Reject: There was an issue disconnecting to the Eftpos.");
                await createEftposTransactionLog(restaurantId, amount);

                reject("There was an issue disconnecting to the Eftpos.");
                return;
            }

            // Return Transaction Outcome -------------------------------------------------------------------------------------------------------------------------------- //
            let transactionOutcome: IEftposTransactionOutcome | null = null;

            switch (iSO8583ResponseCode) {
                case "00":
                    transactionOutcome = {
                        platformTransactionOutcome: EVerifoneTransactionOutcome.Approved,
                        transactionOutcome: EEftposTransactionOutcome.Success,
                        message: "Transaction Approved!",
                        eftposReceipt: eftposReceipt.current,
                    };
                    break;
                case "09":
                    // We should not come in here if its on kiosk mode, unattended mode for Verifone
                    transactionOutcome = {
                        platformTransactionOutcome: EVerifoneTransactionOutcome.ApprovedWithSignature,
                        transactionOutcome: EEftposTransactionOutcome.Fail,
                        message: "Transaction Approved With Signature Not Allowed In Kiosk Mode!",
                        eftposReceipt: eftposReceipt.current,
                    };
                    break;
                case "CC":
                    transactionOutcome = {
                        platformTransactionOutcome: EVerifoneTransactionOutcome.Cancelled,
                        transactionOutcome: EEftposTransactionOutcome.Fail,
                        message: "Transaction Cancelled!",
                        eftposReceipt: eftposReceipt.current,
                    };
                    break;
                case "55":
                    transactionOutcome = {
                        platformTransactionOutcome: EVerifoneTransactionOutcome.Declined,
                        transactionOutcome: EEftposTransactionOutcome.Fail,
                        message: "Transaction Declined! Please try again.",
                        eftposReceipt: eftposReceipt.current,
                    };
                    break;
                case "90":
                    // You should never come in this state. Don't even know what settledOk is. Cannot find any references in docs as well.
                    transactionOutcome = {
                        platformTransactionOutcome: EVerifoneTransactionOutcome.SettledOk,
                        transactionOutcome: EEftposTransactionOutcome.Fail,
                        message: "Settled Ok! Invalid State..",
                        eftposReceipt: eftposReceipt.current,
                    };
                    break;
                case "91":
                    transactionOutcome = {
                        platformTransactionOutcome: EVerifoneTransactionOutcome.HostUnavailable,
                        transactionOutcome: EEftposTransactionOutcome.Fail,
                        message: "Transaction Host Unavailable! Please check if the device is powered on and online.",
                        eftposReceipt: eftposReceipt.current,
                    };
                    break;
                case "99":
                    transactionOutcome = {
                        platformTransactionOutcome: EVerifoneTransactionOutcome.SystemError,
                        transactionOutcome: EEftposTransactionOutcome.Fail,
                        message: "Transaction System Error! Please try again later.",
                        eftposReceipt: eftposReceipt.current,
                    };
                    break;
                case "??":
                    // You should never come in this state. The transaction should not have reached this point if response code is still ??
                    transactionOutcome = {
                        platformTransactionOutcome: EVerifoneTransactionOutcome.TransactionInProgress,
                        transactionOutcome: EEftposTransactionOutcome.Fail,
                        message: "Transaction Still In Process! Invalid State..",
                        eftposReceipt: eftposReceipt.current,
                    };
                    break;
                case "BB":
                    transactionOutcome = {
                        platformTransactionOutcome: EVerifoneTransactionOutcome.TerminalBusy,
                        transactionOutcome: EEftposTransactionOutcome.Fail,
                        message: "Terminal Is Busy! Please cancel the previous transaction before proceeding.",
                        eftposReceipt: eftposReceipt.current,
                    };
                    break;
                default:
                    transactionOutcome = {
                        platformTransactionOutcome: EVerifoneTransactionOutcome.SystemError,
                        transactionOutcome: EEftposTransactionOutcome.Fail,
                        message: "Transaction System Error! Please try again later.",
                        eftposReceipt: eftposReceipt.current,
                    };
                    break;
            }

            addToLogs("Success: Transaction Completed.");
            await createEftposTransactionLog(restaurantId, amount);

            resolve(transactionOutcome);
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
    const context = useContext(VerifoneContext);

    if (context === undefined) {
        throw new Error(`useVerifone must be used within a VerifoneContext`);
    }

    return context;
};

export { VerifoneProvider, useVerifone };
