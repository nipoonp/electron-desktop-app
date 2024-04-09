import { createContext, useContext, useEffect } from "react";
import { useRegister } from "./register-context";
import { useRestaurant } from "./restaurant-context";
import { IPairTerminalResponseReceivedCallback } from "../model/model";
import config from "./../../package.json";
import { delay } from "../model/util";

var apiKey = "Test API Key"; // API Key not validated test environments
var posProductInfo = {
    posProductVendor: "Tabin",
    posProductName: "Tabin Kiosk",
    posProductVersion: config.version,
};
//@ts-ignore
var iclient = new window.TYRO.IClient(apiKey, posProductInfo);

type ContextProps = {
    sendParingRequest: (merchantId: string, terminalId: string, customerMessageCallback: (message: string) => void) => Promise<string>;
    createTransaction: (amount: number, integrationKey: string) => Promise<string>;
};

const TyroContext = createContext<ContextProps>({
    sendParingRequest: (merchantId: string, terminalId: string, customerMessageCallback: (message: string) => void) => {
        return new Promise(() => {
            console.log("");
        });
    },
    createTransaction: (amount: number, integrationKey: string) => {
        return new Promise(() => {
            console.log("");
        });
    },
});

const TyroProvider = (props: { children: React.ReactNode }) => {
    const { register } = useRegister();
    const { restaurant } = useRestaurant();

    useEffect(() => {
        if (restaurant) setPosBusinessName(restaurant.name);
    }, [restaurant]);

    useEffect(() => {
        if (register) {
            setPosRegisterId(register.id);
            setPosRegisterName(register.name);
        }
    }, [register]);

    const sendParingRequest = (merchantId: string, terminalId: string, customerMessageCallback: (message: string) => {}): Promise<string> => {
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
                iclient.pairTerminal(merchantId, terminalId, (response: IPairTerminalResponseReceivedCallback) => {
                    console.log("Pairing response", response);

                    customerMessageCallback(response.message);

                    if (response.status === "success") {
                        resolve(response.integrationKey);
                        return;
                    } else {
                        reject(response.message);
                    }
                });
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
    };

    const createTransaction = (amount: number, integrationKey: string): Promise<string> => {
        const interval = 2 * 1000; // 2 seconds
        const timeout = 10 * 60 * 1000; // 10 minutes

        const endTime = Number(new Date()) + timeout;

        var checkCondition = async (resolve: any, reject: any) => {
            if (!integrationKey) {
                reject("integrationKey needs to be submitted");
                return;
            }

            try {
                const requestParams = {
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

                const transactionCallbacks = {
                    statusMessageCallback: (message) => {
                        console.log("statusMessageCallback Message:", message);

                        setPurchaseStatus(message);
                    },
                    questionCallback: (question, answerCallback) => {
                        console.log("questionCallback Question:", question);

                        if (question.isError) {
                            setPurchaseError(question.text);
                        } else if (question.isManualCancel) {
                            //Are you sure you want to cancel?
                            answerCallback("YES");
                        } else if (question.text.includes("Signature OK?")) {
                            //APPROVED W/ SIGNATURE. Signature OK?
                            answerCallback("NO");
                        } else if (question.text.includes("Cancel this transaction?")) {
                            //Cancel this transaction?
                            answerCallback("YES");
                        }
                    },
                    receiptCallback: (receipt) => {
                        console.log("receiptCallback Receipt:", receipt);

                        if (receipt.signatureRequired == true) {
                            cancel();
                        } else {
                            console.log("xxx...receipt.merchantReceipt", receipt.merchantReceipt);
                            alert(receipt.merchantReceipt);
                        }
                    },
                    transactionCompleteCallback: (response) => {
                        console.log("transactionCompleteCallback Response:", response);
                        setPurchaseStatus("Complete");
                        setTransactionId(response.transactionId);

                        if (response.customerReceipt) {
                            console.log("xxx...receipt.customerReceipt", response.customerReceipt);
                        }
                    },
                };

                console.log("xxx...requestParams", requestParams);
                iclient.initiatePurchase(requestParams, transactionCallbacks);

                while (true) {
                    if (Number(new Date()) < endTime) {
                        await delay(interval);
                    } else {
                        reject("Polling timed out");
                        return;
                    }
                }
            } catch (error) {
                reject(error);
            }
        };

        return new Promise(checkCondition);
    };

    return (
        <TyroContext.Provider
            value={{
                sendParingRequest: sendParingRequest,
                createTransaction: createTransaction,
                pollForOutcome: pollForOutcome,
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
