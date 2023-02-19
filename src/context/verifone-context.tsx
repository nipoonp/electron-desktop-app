import { useState, useEffect, createContext, useContext, useRef } from "react";

import { Logger } from "aws-amplify";
import { delay, getVerifoneSocketErrorMessage, getVerifoneTimeBasedTransactionId } from "../model/util";
import { useMutation } from "@apollo/client";
import { CREATE_EFTPOS_TRANSACTION_LOG } from "../graphql/customMutations";
import { toLocalISOString } from "../util/util";
import { EEftposTransactionOutcome, IEftposTransactionOutcome, EVerifoneTransactionOutcome } from "../model/model";
import { useErrorLogging } from "./errorLogging-context";
import { useRegister } from "./register-context";
import { format } from "date-fns";
import { useRestaurant } from "./restaurant-context";

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

export interface IVerifoneEftposTransactionInProgress {
    [transactionId: string]: {
        transactionId: string;
        amount: number;
        logs: string;
        retryDate: string;
        retryAmount: number;
        totalRetryAmount: number;
    };
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
    createTransaction: (
        amount: number,
        ipAddress: string,
        portNumber: string,
        restaurantId: string,
        delayed?: () => void
    ) => Promise<IEftposTransactionOutcome>;
    refetchTransaction: (
        amount: number,
        ipAddress: string,
        portNumber: string,
        restaurantId: string,
        transactionId: string,
        existingLogs: string
    ) => Promise<IEftposTransactionOutcome>;
};

const VerifoneContext = createContext<ContextProps>({
    createTransaction: (amount: number, ipAddress: string, portNumber: string, restaurantId: string, delayed?: () => void) => {
        return new Promise(() => {
            console.log("");
        });
    },
    refetchTransaction: (
        amount: number,
        ipAddress: string,
        portNumber: string,
        restaurantId: string,
        transactionId: string,
        existingLogs: string
    ) => {
        return new Promise(() => {
            console.log("");
        });
    },
});

const VerifoneProvider = (props: { children: React.ReactNode }) => {
    const { addVerifoneLog } = useErrorLogging();
    const { register, isPOS } = useRegister();
    const { restaurant } = useRestaurant();

    const interval = 1 * 1000; // 1 second
    const timeout = 3 * 60 * 1000; // 3 minutes
    const noResponseTimeout = 20 * 1000; // 20 seconds
    const refetchFailedTransactionsTimeout = 10 * 60 * 1000; //10 minutes

    const lastMessageReceived = useRef<number>(initialLastMessageReceived);
    const isEftposConnected = useRef<boolean>(initialIsEftposConnected);
    const eftposError = useRef<string>(initialEftposError);
    const eftposData = useRef<IEftposData>(initialEftposData);
    const eftposReceipt = useRef<string>(initialEftposReceipt);
    const logs = useRef<string>(initialLogs);

    const resetVariables = (existingLogs?: string) => {
        //Add new reset if new variables are added above.
        lastMessageReceived.current = initialLastMessageReceived;
        isEftposConnected.current = initialIsEftposConnected;
        eftposError.current = initialEftposError;
        eftposData.current = initialEftposData;
        eftposReceipt.current = initialEftposReceipt;
        logs.current = existingLogs ? existingLogs : initialLogs;
    };

    useEffect(() => {
        const timerId = setInterval(async () => {
            if (!restaurant || !register) return;

            //If an existing transaction is already in progress then return
            const verifoneEftposTransactionInProgress = sessionStorage.getItem("verifoneEftposTransactionInProgress");
            if (verifoneEftposTransactionInProgress === "true") return;

            console.log("Looping to refetch failed verifone eftpos transactions");

            const unresolvedVerifoneTransactions: string | null = localStorage.getItem("unresolvedVerifoneTransactions");
            const unresolvedVerifoneTransactionsObj: IVerifoneEftposTransactionInProgress = unresolvedVerifoneTransactions
                ? JSON.parse(unresolvedVerifoneTransactions)
                : {};

            for (var i = 0; i < Object.values(unresolvedVerifoneTransactionsObj).length; i++) {
                const unresolvedTransaction = Object.values(unresolvedVerifoneTransactionsObj)[i];
                const currentDate = format(new Date(), "yyyy/MM/dd");

                //Don't retry more than 10 times
                if (unresolvedTransaction.totalRetryAmount >= 10) continue;

                //If you tried more than 3 times for the same txn on the same day then return
                if (unresolvedTransaction.retryDate === currentDate && unresolvedTransaction.retryAmount >= 3) continue;

                //If its a different day then reset counter and set new date
                if (unresolvedTransaction.retryDate !== currentDate) {
                    unresolvedVerifoneTransactionsObj[unresolvedTransaction.transactionId].retryAmount = 0;
                    unresolvedVerifoneTransactionsObj[unresolvedTransaction.transactionId].retryDate = currentDate;
                }

                console.log("looping", unresolvedTransaction);

                try {
                    const res = await refetchTransaction(
                        unresolvedTransaction.amount,
                        register.eftposIpAddress,
                        register.eftposPortNumber,
                        restaurant.id,
                        unresolvedTransaction.transactionId,
                        unresolvedTransaction.logs
                    );

                    delete unresolvedVerifoneTransactionsObj[unresolvedTransaction.transactionId];

                    console.log("In Success", res);
                    // resolve(res);
                } catch (e) {
                    // reject(e);

                    unresolvedVerifoneTransactionsObj[unresolvedTransaction.transactionId].retryAmount += 1;
                    unresolvedVerifoneTransactionsObj[unresolvedTransaction.transactionId].totalRetryAmount += 1;

                    console.log("In Reject", e);
                } finally {
                }
            }

            localStorage.setItem("unresolvedVerifoneTransactions", JSON.stringify(unresolvedVerifoneTransactionsObj));
        }, refetchFailedTransactionsTimeout);

        return () => {
            clearInterval(timerId);
        };
    }, [restaurant, register]);

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

    const addToLogs = (log: string) => {
        logs.current += format(new Date(), "dd/MM/yy HH:mm:ss ") + log + "\n";
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

    const createOrRefetchTransaction = (
        amount: number,
        ipAddress: string,
        portNumber: string,
        refetchOutcomeTransactionId?: string
    ): Promise<IEftposTransactionOutcome> => {
        return new Promise(async (resolve, reject) => {
            // Create Variables -------------------------------------------------------------------------------------------------------------------------------- //
            const endTime = Number(new Date()) + timeout;
            const transactionId = refetchOutcomeTransactionId ? refetchOutcomeTransactionId : getVerifoneTimeBasedTransactionId();
            const merchantId = 0;
            let iSO8583ResponseCode;

            // Connect To EFTPOS -------------------------------------------------------------------------------------------------------------------------------- //
            const connectTimedOut = await connectToEftpos(ipAddress, portNumber);
            if (connectTimedOut) {
                reject({
                    transactionId: null, //Set value only after perform transaction command has actually been sent
                    message: "There was an issue connecting to the Eftpos.",
                });
                return;
            }

            const errorMessage = checkForErrors();
            if (errorMessage) {
                reject({
                    transactionId: null,
                    message: errorMessage,
                });
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
                    reject({
                        transactionId: null,
                        message: errorMessage,
                    });
                    return;
                }

                addToLogs("Waiting to receive Configure Printing Response (CP,ON)...");

                await delay(interval);

                if (!(Number(new Date()) < printingTimeoutEndTime)) {
                    const disconnectTimedOut = await disconnectEftpos();
                    if (disconnectTimedOut) {
                        reject({ transactionId: null, message: "There was an issue disconnecting to the Eftpos." });
                        return;
                    }

                    reject({ transactionId: null, message: "There was an issue configuring Eftpos Printing." });
                    return;
                }
            }

            // Create A Transaction -------------------------------------------------------------------------------------------------------------------------------- //
            // We only want to create a new transaction if we are not refetching the result of an existing one
            if (!refetchOutcomeTransactionId) {
                ipcRenderer && ipcRenderer.send("BROWSER_DATA", `${VMT.Purchase},${transactionId},${merchantId},${amount}`);
                addToLogs(`BROWSER_DATA: ${VMT.Purchase},${transactionId},${merchantId},${amount}`);
                // localStorage.setItem("verifoneTransactionId", transactionId.toString());
                // localStorage.setItem("verifoneMerchantId", merchantId.toString());
            }

            // Poll For Transaction Result -------------------------------------------------------------------------------------------------------------------------------- //
            while (true) {
                const now = new Date();
                const loopDate = Number(now);

                const errorMessage = checkForErrors();
                if (errorMessage) {
                    reject({ transactionId: transactionId, message: errorMessage });
                    return;
                }

                console.log("Polling for result...");
                addToLogs("Polling for result...");

                await delay(interval);

                if (!(loopDate < endTime)) {
                    const disconnectTimedOut = await disconnectEftpos();
                    if (disconnectTimedOut) {
                        reject({ transactionId: transactionId, message: "There was an issue disconnecting to the Eftpos." });
                        return;
                    }

                    reject({ transactionId: transactionId, message: "Transaction timed out." });
                    return;
                }

                if (!(loopDate < lastMessageReceived.current + noResponseTimeout)) {
                    const disconnectTimedOut = await disconnectEftpos();
                    if (disconnectTimedOut) {
                        reject({ transactionId: transactionId, message: "There was an issue disconnecting to the Eftpos." });
                        return;
                    }

                    reject({ transactionId: transactionId, message: "Eftpos unresponsive. Please make sure your Eftpos is powered on and working." });
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
                reject({ transactionId: transactionId, message: "There was an issue disconnecting to the Eftpos." });
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
                    if ((register && register.skipEftposReceiptSignature) || isPOS) {
                        transactionOutcome = {
                            platformTransactionOutcome: EVerifoneTransactionOutcome.Approved,
                            transactionOutcome: EEftposTransactionOutcome.Success,
                            message: "Transaction Approved With Signature!",
                            eftposReceipt: eftposReceipt.current,
                        };
                    } else {
                        transactionOutcome = {
                            platformTransactionOutcome: EVerifoneTransactionOutcome.ApprovedWithSignature,
                            transactionOutcome: EEftposTransactionOutcome.Fail,
                            message: "Transaction Approved With Signature Not Allowed In Kiosk Mode!",
                            eftposReceipt: eftposReceipt.current,
                        };
                    }
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
            resolve(transactionOutcome);
        });
    };

    const createOrRefetchTransactionWrapper = (
        amount: number,
        ipAddress: string,
        portNumber: string,
        restaurantId: string,
        delayed?: () => void,
        transactionId?: string,
        existingLogs?: string
    ): Promise<IEftposTransactionOutcome> => {
        const isRefetch = transactionId ? true : false;
        resetVariables(existingLogs);

        return new Promise(async (resolve, reject) => {
            addToLogs("Transaction Started.");

            if (!amount) {
                addToLogs("Reject: The amount has to be supplied");
                await createEftposTransactionLog(restaurantId, amount);

                reject("The amount has to be supplied");
                return;
            } else if (amount <= 0) {
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

            if (!isRefetch) {
                try {
                    const outcome = await createOrRefetchTransaction(amount, ipAddress, portNumber);

                    await createEftposTransactionLog(restaurantId, amount);

                    resolve(outcome);
                } catch (error) {
                    addToLogs("Reject Error:" + error.message);

                    if (error.transactionId) {
                        //The txn failed after the create transaction command was sent to the eftpos. So we must figure out the end result
                        transactionId = error.transactionId;
                    } else {
                        await createEftposTransactionLog(restaurantId, amount);

                        console.log("error.message", error.message);
                        reject(error.message);
                        return;
                    }
                }
            }

            //Only run refetch transaction if we either have the id from previous block of code or if we receive it from function args.
            if (transactionId) {
                try {
                    addToLogs("Refetching transaction outcome ------------------");
                    console.log("Refetching transaction outcome ------------------");

                    delayed && delayed();

                    const outcome = await createOrRefetchTransaction(amount, ipAddress, portNumber, transactionId);

                    await createEftposTransactionLog(restaurantId, amount);

                    resolve(outcome);
                } catch (error2) {
                    addToLogs("Reject Error2: " + error2.message);

                    await createEftposTransactionLog(restaurantId, amount);

                    //If we are in this condition then it means our retry failed as well. So we would like to store this transaction to sessionStorage so we can come back and get the result later on.
                    addToUnresolvedVerifoneTransactions(amount, transactionId, logs.current);

                    console.log("error2.message", error2.message);
                    reject(error2.message);
                    return;
                }
            }
        });
    };

    const addToUnresolvedVerifoneTransactions = (amount: number, transactionId: string, logs: string) => {
        const storedUnresolvedVerifoneTransactions: string | null = localStorage.getItem("unresolvedVerifoneTransactions");
        const storedUnresolvedVerifoneTransactionsObj: IVerifoneEftposTransactionInProgress = storedUnresolvedVerifoneTransactions
            ? JSON.parse(storedUnresolvedVerifoneTransactions)
            : {};

        let newUnresolvedVerifoneTransactions: IVerifoneEftposTransactionInProgress = storedUnresolvedVerifoneTransactionsObj;

        if (storedUnresolvedVerifoneTransactionsObj[transactionId] !== undefined) {
            storedUnresolvedVerifoneTransactionsObj[transactionId].logs = storedUnresolvedVerifoneTransactionsObj[transactionId].logs + logs;
        } else {
            newUnresolvedVerifoneTransactions = {
                ...storedUnresolvedVerifoneTransactionsObj,
                [transactionId]: {
                    transactionId: transactionId,
                    amount: amount,
                    logs: logs,
                    retryDate: format(new Date(), "yyyy/MM/dd"),
                    retryAmount: 0,
                    totalRetryAmount: 0,
                },
            };
        }

        localStorage.setItem("unresolvedVerifoneTransactions", JSON.stringify(newUnresolvedVerifoneTransactions));
    };

    const createTransaction = (
        amount: number,
        ipAddress: string,
        portNumber: string,
        restaurantId: string,
        delayed?: () => void
    ): Promise<IEftposTransactionOutcome> => {
        return new Promise(async (resolve, reject) => {
            sessionStorage.setItem("verifoneEftposTransactionInProgress", "true");

            try {
                const res = await createOrRefetchTransactionWrapper(amount, ipAddress, portNumber, restaurantId, delayed);

                resolve(res);
            } catch (e) {
                reject(e);
            } finally {
                sessionStorage.removeItem("verifoneEftposTransactionInProgress");
            }
        });
    };

    const refetchTransaction = (
        amount: number,
        ipAddress: string,
        portNumber: string,
        restaurantId: string,
        transactionId: string,
        existingLogs: string,
        delayed?: () => void
    ): Promise<IEftposTransactionOutcome> => {
        return new Promise(async (resolve, reject) => {
            sessionStorage.setItem("verifoneEftposTransactionInProgress", "true");

            try {
                const res = await createOrRefetchTransactionWrapper(
                    amount,
                    ipAddress,
                    portNumber,
                    restaurantId,
                    delayed,
                    transactionId,
                    existingLogs
                );

                resolve(res);
            } catch (e) {
                reject(e);
            } finally {
                sessionStorage.removeItem("verifoneEftposTransactionInProgress");
            }
        });
    };

    return (
        <VerifoneContext.Provider
            value={{
                createTransaction: createTransaction,
                refetchTransaction: refetchTransaction,
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
