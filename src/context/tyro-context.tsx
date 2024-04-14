import { createContext, useContext, useEffect } from "react";
import { useRegister } from "./register-context";
import { useRestaurant } from "./restaurant-context";
import {
    EEftposTransactionOutcome,
    ETyroTransactionOutcome,
    IEftposTransactionOutcome,
    ITyroTransactionCallback,
    ITyroInitiatePurchaseInput,
    ITyroInitiateRefundInput,
    ITyroPairTerminalResponseReceivedCallback,
} from "../model/model";
import config from "./../../package.json";
import { delay } from "../model/util";

const apiKey = "Test API Key"; // API Key not validated test environments
const posProductInfo = {
    posProductVendor: "Tabin",
    posProductName: "Tabin Kiosk",
    posProductVersion: config.version,
};
//@ts-ignore
const iclient = new window.TYRO.IClient(apiKey, posProductInfo);

type ContextProps = {
    sendParingRequest: (merchantId: string, terminalId: string, customerMessageCallback: (message: string) => void) => Promise<string>;
    createTransaction: (
        amount: string,
        integrationKey: string,
        customerMessageCallback: (message: string) => void
    ) => Promise<IEftposTransactionOutcome>;
    cancelTransaction: () => void;
    createRefund: (amount: string, integrationKey: string, customerMessageCallback: (message: string) => void) => Promise<IEftposTransactionOutcome>;
};

const TyroContext = createContext<ContextProps>({
    sendParingRequest: (merchantId: string, terminalId: string, customerMessageCallback: (message: string) => void) => {
        return new Promise(() => {
            console.log("");
        });
    },
    createTransaction: (amount: string, integrationKey: string, customerMessageCallback: (message: string) => void) => {
        return new Promise(() => {
            console.log("");
        });
    },
    cancelTransaction: () => {
        return new Promise(() => {
            console.log("");
        });
    },
    createRefund: (amount: string, integrationKey: string, customerMessageCallback: (message: string) => void) => {
        return new Promise(() => {
            console.log("");
        });
    },
});

const TyroProvider = (props: { children: React.ReactNode }) => {
    const { register, isPOS } = useRegister();

    const sendParingRequest = (merchantId: string, terminalId: string, customerMessageCallback: (message: string) => void): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            if (!merchantId) {
                reject("A merchantId has to be supplied.");
                return;
            }

            if (!terminalId) {
                reject("A terminalId has to be supplied.");
                return;
            }

            try {
                iclient.pairTerminal(merchantId, terminalId, (response: ITyroPairTerminalResponseReceivedCallback) => {
                    console.log("Pairing response", response);

                    customerMessageCallback(response.message);

                    if (response.status === "success") {
                        resolve(response.integrationKey);
                        return;
                    } else if (response.status === "failure") {
                        reject(response.message);
                    }
                });
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
    };

    const createTransaction = (
        amount: string,
        integrationKey: string,
        customerMessageCallback: (message: string) => void
    ): Promise<IEftposTransactionOutcome> => {
        const interval = 10 * 1000; // 10 seconds
        const timeout = 10 * 60 * 1000; // 10 minutes

        const endTime = Number(new Date()) + timeout;

        let approvedWithSignature = false;

        const checkCondition = async (resolve: any, reject: any) => {
            if (!integrationKey) {
                reject("integrationKey needs to be submitted");
                return;
            }

            try {
                const requestParams: ITyroInitiatePurchaseInput = {
                    amount: amount, //The purchase amount (amount to charge the customer) in cents.
                    // cashout: "0", //Cash out amount in cents.
                    integratedReceipt: true, //indicate whether receipts will be printed on the POS (true) or on the terminal (false).
                    // mid: 1, //Override the configured mid for multi-merchant terminals or if your browser does not support local storage.
                    // tid: 123, //Override the configured tid for multi-merchant terminals or if your browser does not support local storage.
                    integrationKey: integrationKey, //Supply the integration key if your browser does not support local storage.
                    // transactionId: "", //Supply a transaction Id to be used for the transaction.
                    // healthpointTransactionId: "", //The integrated transaction ID of the original HealthPoint Claim (used for gap payments).
                    enableSurcharge: true, //Apply a surcharge to this transaction (if the card used attracts a surcharge).
                    // requestCardToken: true, //Request a token representing the card used for the current purchase.
                };

                const transactionCallbacks: ITyroTransactionCallback = {
                    //Invoked when the terminal requires the merchant to answer a question in order to proceed with the transaction. Called with the following parameters:
                    questionCallback: (question, answerCallback) => {
                        console.log("questionCallback Question:", question);

                        if (question.text.includes("APPROVED W/ SIGNATURE. Signature OK?")) {
                            approvedWithSignature = true;
                            console.log("Answer back with NO");
                            answerCallback("NO");
                        } else if (question.text.includes("Are you sure you want to cancel?")) {
                            console.log("Answer back with YES");
                            answerCallback("YES");
                        } else if (question.text.includes("Cancel this transaction?")) {
                            console.log("Answer back with YES");
                            answerCallback("YES");
                        } else if (question.text.includes("POS is not paired with a terminal.")) {
                            console.log("Answer back with OK");
                            answerCallback("OK");
                        } else if (question.text.includes("Invalid transaction details (400).")) {
                            console.log("Answer back with OK");
                            answerCallback("OK");
                        }

                        if (question.isError) {
                            console.log("Returning with error");

                            resolve({
                                platformTransactionOutcome: ETyroTransactionOutcome.UNKNOWN,
                                transactionOutcome: EEftposTransactionOutcome.Fail,
                                message: question.text,
                                eftposReceipt: "",
                            });
                        }
                    },
                    //Invoked to advertise what is happening on terminal, which is typically facing the customer rather than the merchant. Called with a single String argument. For example "Select account".
                    statusMessageCallback: (message: string) => {
                        console.log("statusMessageCallback Message:", message);

                        customerMessageCallback(message);
                    },
                    //Invoked when integrated receipts are enabled and a merchant copy of the receipt is available. Ignored if integrated receipt printing is disabled. Called with the following parameters:
                    receiptCallback: (receipt) => {
                        console.log("receiptCallback Receipt:", receipt);
                    },
                    //Invoked when the transaction has been completed on the terminal. Called with a subset of the following parameters:
                    transactionCompleteCallback: (response) => {
                        console.log("transactionCompleteCallback Response:", response);

                        let transactionOutcome: IEftposTransactionOutcome | null = null;

                        switch (response.result) {
                            case "APPROVED":
                                transactionOutcome = {
                                    platformTransactionOutcome: ETyroTransactionOutcome.APPROVED,
                                    transactionOutcome: EEftposTransactionOutcome.Success,
                                    message: "Transaction Approved!",
                                    eftposReceipt: response.customerReceipt || "",
                                };
                                break;
                            case "CANCELLED":
                                transactionOutcome = {
                                    platformTransactionOutcome: ETyroTransactionOutcome.CANCELLED,
                                    transactionOutcome: EEftposTransactionOutcome.Fail,
                                    message: "Transaction Cancelled!",
                                    eftposReceipt: response.customerReceipt || "",
                                };
                                break;
                            case "REVERSED":
                                let message = "Transaction Reversed!";

                                // Approved with signature not allowed in kiosk mode
                                if (approvedWithSignature && (register?.skipEftposReceiptSignature || isPOS)) {
                                    message = "Transaction Reversed! Approved with signature not allowed in kiosk mode";
                                }

                                transactionOutcome = {
                                    platformTransactionOutcome: ETyroTransactionOutcome.REVERSED,
                                    transactionOutcome: EEftposTransactionOutcome.Fail,
                                    message: message,
                                    eftposReceipt: response.customerReceipt || "",
                                };

                                break;
                            case "DECLINED":
                                transactionOutcome = {
                                    platformTransactionOutcome: ETyroTransactionOutcome.DECLINED,
                                    transactionOutcome: EEftposTransactionOutcome.Fail,
                                    message: "Transaction Declined! Please try again.",
                                    eftposReceipt: response.customerReceipt || "",
                                };
                                break;
                            case "SYSTEM ERROR":
                                // You should never come in this state. Don't even know what settledOk is. Cannot find any references in docs as well.
                                transactionOutcome = {
                                    platformTransactionOutcome: ETyroTransactionOutcome.SYSTEMERROR,
                                    transactionOutcome: EEftposTransactionOutcome.Fail,
                                    message: "System Error.",
                                    eftposReceipt: response.customerReceipt || "",
                                };
                                break;
                            case "NOT STARTED":
                                transactionOutcome = {
                                    platformTransactionOutcome: ETyroTransactionOutcome.NOTSTARTED,
                                    transactionOutcome: EEftposTransactionOutcome.Fail,
                                    message: "Transaction Not Started",
                                    eftposReceipt: response.customerReceipt || "",
                                };
                                break;
                            case "UNKNOWN":
                                transactionOutcome = {
                                    platformTransactionOutcome: ETyroTransactionOutcome.UNKNOWN,
                                    transactionOutcome: EEftposTransactionOutcome.Fail,
                                    message: "Please look at the terminal to determine what happened. Typically indicates a network error.",
                                    eftposReceipt: response.customerReceipt || "",
                                };
                                break;
                            default:
                                transactionOutcome = {
                                    platformTransactionOutcome: ETyroTransactionOutcome.UNKNOWN,
                                    transactionOutcome: EEftposTransactionOutcome.Fail,
                                    message: "Unknown. Invalid State...",
                                    eftposReceipt: response.customerReceipt || "",
                                };
                                break;
                        }

                        resolve(transactionOutcome);
                    },
                };

                console.log("RequestParams", requestParams);
                iclient.initiatePurchase(requestParams, transactionCallbacks);

                while (true) {
                    if (Number(new Date()) < endTime) {
                        await delay(interval);
                    } else {
                        console.log("Cancelling transaction due to timeout");
                        cancelTransaction();
                        reject("Transaction timed out");
                        return;
                    }
                }
            } catch (error) {
                reject(error);
            }
        };

        return new Promise(checkCondition);
    };

    const cancelTransaction = () => {
        try {
            iclient.cancelCurrentTransaction();
        } catch (err) {
            console.log(err.message);
        }
    };

    const createRefund = (
        amount: string,
        integrationKey: string,
        customerMessageCallback: (message: string) => void
    ): Promise<IEftposTransactionOutcome> => {
        const interval = 2 * 1000; // 2 seconds
        const timeout = 10 * 60 * 1000; // 10 minutes

        const endTime = Number(new Date()) + timeout;

        const checkCondition = async (resolve: any, reject: any) => {
            reject("TODO: Still need to be implemented");
        };

        return new Promise(checkCondition);
    };

    return (
        <TyroContext.Provider
            value={{
                sendParingRequest: sendParingRequest,
                createTransaction: createTransaction,
                cancelTransaction: cancelTransaction,
                createRefund: createRefund,
            }}
            children={props.children}
        />
    );
};

const useTyro = () => {
    const context = useContext(TyroContext);
    if (context === undefined) {
        throw new Error(`useTyro must be used within a TyroProvider`);
    }
    return context;
};

export { TyroProvider, useTyro };
