import { createContext, useContext, useRef } from "react";
import axios from "axios";
import { convertCentsToDollars, toLocalISOString } from "../util/util";
import { useRestaurant } from "./restaurant-context";
import { EEftposTransactionOutcome, EWindcaveTransactionOutcome, IEftposTransactionOutcome, EEftposTransactionOutcomeCardType } from "../model/model";
import { useRegister } from "./register-context";
import { format } from "date-fns";
import { useErrorLogging } from "./errorLogging-context";
import { delay } from "../model/util";

var convert = require("xml-js");

export enum EWindcaveStatus {
    Initiating = "1",
    TransactionStarted_2 = "2",
    TransactionStarted_3 = "3",
    Processing = "4",
    Authenticating = "5",
    TransactionCompleted = "6",
}

export enum EWindcaveTxnStatus {
    Idle = "1",
    PresentOrInsertCard = "2",
    SelectAccount = "3",
    SelectApp = "4",
    EnterPin = "5",
    Processing = "6",
    VerifyingSignature = "7",
    DisplayResult = "8",
}

interface IWindcaveInitTransactionResponse {
    Scr: {
        TxnType?: {
            _text?: string;
        };
        TxnRef?: {
            _text?: string;
        };
        StatusId?: {
            _text?: string;
        };
        TxnStatusId?: {
            _text?: string;
        };
        Complete?: {
            _text?: string;
        };
        ReCo?: {
            _text?: string;
        };
        //This is for button request response
        Success?: {
            _text?: string;
        };
        //Not in spec but it is returned at times
        Result?: {
            AP?: {
                _text?: string;
            };
            RC?: {
                _text?: string;
            };
            RT?: {
                _text?: string;
            };
        };
    };
}

interface IWindcaveStatusResponse {
    Scr: {
        TxnType?: {
            _text?: string;
        };
        TxnRef?: {
            _text?: string;
        };
        StatusId?: {
            _text?: string;
        };
        TxnStatusId?: {
            _text?: string;
        };
        Complete?: {
            _text?: string;
        };
        RcptW?: {
            _text?: string;
        };
        Rcpt?: {
            _text?: string;
        };
        ReCo?: {
            _text?: string;
        };
        Result?: {
            AP?: {
                _text?: string;
            };
            RC?: {
                _text?: string;
            };
            RT?: {
                _text?: string;
            };
            CT?: {
                _text?: string;
            };
            AmtS?: {
                _text?: string;
            };
            AmtT?: {
                _text?: string;
            };
        };
    };
}

const windcaveResponseCodeMessages = {
    P4: "PosDeviceId is greater than 32 characters",
    P5: "PosDeviceId not matched",
    P7: "Invalid transaction type",
    P8: "Authentication error",
    P9: "Authentication error—Station Id mismatch",
    PA: "Status request error",
    PB: "SCRHIT Init Session Error",
    PC: "Existing Transaction In progress. Please complete previous transaction before continuing.",
    PD: "SCRHIT Transmit Error— network connection issue, ensure the terminal has performed a Logon to the Windcave HOST.",
    PE: "SCRHIT Transmit Error— network connection issue, ensure the terminal has performed a Logon to the Windcave HOST.",
    PF: "SCRHIT Transmit Error— network connection issue, ensure the terminal has performed a Logon to the Windcave HOST.",
    PG: "Init Wait Timeout. Please check if the device is powered on correctly and online.",
    PJ: "TxnRef not matched",
    PK: "SCRHIT not enabled",
    PL: "Invalid input parameter",
    PM: "Txn type not allowed",
    PO: "Invalid Station Id. Please check if the device is powered on and online.",
    TQ: "HIT Start Failed— connection lost, ensure the terminal has performed a Logon to the Windcave HOST.",
    VB: "Transaction timed out. Please check if the device is powered on correctly and online.",
    VW: "Transaction cancelled. Please try again.",
    V6: "Card read error. Please try again.",
    PH: "User Error",
};

// --- FOR PROD ---
const ACTION: string = "doScrHIT";
const BASE_URL: string = "https://sec.windcave.com/hit/pos.aspx";
const CURRENCY: string = "NZD";

// --- FOR DEV ---
// const ACTION: string = "doScrHIT";
// const BASE_URL: string = "https://uat.windcave.com/pxmi3/pos.aspx";
// const CURRENCY: string = "NZD";
//// ScrHITUserId: TabinHIT_Dev
//// ScrHITKey: 6b06b931c1942fa4222903055c9ac749c77fa4b86471d91b2909da74a69d928c
//// StationId: 3801585856

const initialLogs = "";

type ContextProps = {
    createTransaction: (
        stationId: string,
        user: string,
        key: string,
        amount: number,
        transactionType: string,
        action?: string
    ) => Promise<IEftposTransactionOutcome>;
};

const WindcaveContext = createContext<ContextProps>({
    createTransaction: (stationId: string, user: string, key: string, amount: number, transactionType: string, action?: string) => {
        return new Promise(() => {
            console.log("");
        });
    },
});

const WindcaveProvider = (props: { children: React.ReactNode }) => {
    const { addEftposLog } = useErrorLogging();
    const { restaurant } = useRestaurant();
    const { register } = useRegister();
    const { logError } = useErrorLogging();

    const logs = useRef<string>(initialLogs);

    const getCardType = (cardType?: string) => {
        let type = EEftposTransactionOutcomeCardType.EFTPOS;

        console.log("xxx...cardType", cardType);

        if (cardType) {
            if (cardType.toLowerCase() === "visa") {
                type = EEftposTransactionOutcomeCardType.VISA;
            } else if (cardType.toLowerCase() === "mastercard") {
                type = EEftposTransactionOutcomeCardType.MASTERCARD;
            } else if (cardType.toLowerCase() === "amex") {
                type = EEftposTransactionOutcomeCardType.AMEX;
            }
        }

        return type;
    };

    const formatReceipt = (receipt: string, width: number) => {
        let result = "";

        while (receipt.length > 0) {
            result += receipt.substring(0, width) + "\n";
            receipt = receipt.substring(width);
        }

        if (result.length > width) {
            receipt = receipt.substr(0, result.length - 2);
        }

        return result;
    };

    const createEftposTransactionLog = async (restaurantId: string, transactionType: string, amount: number) => {
        const now = new Date();

        await addEftposLog({
            eftposProvider: "WINDCAVE",
            amount: amount,
            type: transactionType,
            payload: logs.current,
            restaurantId: restaurantId,
            timestamp: toLocalISOString(now),
            expiry: Number(Math.floor(Number(now) / 1000) + 2592000), // Add 30 days to timeStamp for DynamoDB TTL
        });
    };

    const resetVariables = () => {
        //Add new reset if new variables are added above.
        logs.current = initialLogs;
    };

    const addToLogs = (log: string) => {
        logs.current += format(new Date(), "dd/MM/yy HH:mm:ss.SSS ") + log + "\n";
    };

    const sendTransaction = async (
        stationId: string,
        user: string,
        key: string,
        amount: number,
        transactionType: string,
        action: string = ACTION
    ): Promise<string> => {
        if (!amount) {
            throw "The amount has to be supplied";
        } else if (amount <= 0) {
            throw "The amount must be greater than 0";
        } else if (!transactionType) {
            throw "The transactionType has to be supplied";
        }

        const d = new Date();
        const txnRef = Math.round(d.getTime() / 1000).toString(); //secondsSinceEpoch

        const params = {
            Scr: {
                _attributes: {
                    action: action,
                    user: user,
                    key: key,
                },
                Amount: {
                    _text: convertCentsToDollars(amount),
                },
                Cur: {
                    _text: CURRENCY,
                },
                TxnType: {
                    _text: transactionType,
                },
                Station: {
                    _text: stationId,
                },
                TxnRef: {
                    _text: txnRef,
                },
                DeviceId: {
                    _text: stationId,
                },
                PosName: {
                    _text: stationId,
                },
                PosVersion: {
                    _text: stationId,
                },
                VendorId: {
                    _text: stationId,
                },
                MRef: {
                    _text: `Tabin-${txnRef}`,
                },
            },
        };

        addToLogs(JSON.stringify({ url: BASE_URL, data: params }));

        const paramsXML = convert.json2xml(params, { compact: true, spaces: 4 });

        try {
            const response = await axios.post(BASE_URL, paramsXML, {
                headers: {
                    "Content-Type": "application/xml",
                },
            });

            console.log(`Transaction POST response received (${response.status}) ${response.data}`);
            addToLogs(JSON.stringify({ url: BASE_URL, data: response }));

            if (response.status === 200) {
                const resJSON = convert.xml2json(response.data, { compact: true, spaces: 4 });
                const res = JSON.parse(resJSON) as IWindcaveInitTransactionResponse;

                if (res.Scr.Complete) {
                    const transactionComplete = res.Scr.Complete._text === "1"; //If transaction is completed this field will be set to 1.

                    //Some other misc error
                    if (transactionComplete && res.Scr.ReCo && res.Scr.ReCo._text) {
                        throw windcaveResponseCodeMessages[res.Scr.ReCo._text] || "Unknown error";
                    }

                    //Not in spec but result is returned at times
                    if (transactionComplete && res.Scr.Result && res.Scr.Result.RC && res.Scr.Result.RC._text) {
                        throw windcaveResponseCodeMessages[res.Scr.Result.RC._text] || "Unknown error";
                    }
                }

                return txnRef;
            } else {
                throw "Invalid status code received. Please retry or contact Windcave support.";
            }
        } catch (e) {
            console.log("Error", e);
            addToLogs(`SendTransactionError: ${JSON.stringify(e)}`);
            throw e.message || e || "There was an unknown error. Please retry or contact Windcave support.";
        }
    };

    const sendButtonRequest = async (
        stationId: string,
        user: string,
        key: string,
        action: string = ACTION,
        name: string,
        val: string,
        txnRef: string
    ): Promise<string> => {
        const params = {
            Scr: {
                _attributes: {
                    action: action,
                    user: user,
                    key: key,
                },
                Station: {
                    _text: stationId,
                },
                TxnType: {
                    _text: "UI",
                },
                UiType: {
                    _text: "Bn",
                },
                Name: {
                    _text: name,
                },
                Val: {
                    _text: val,
                },
                TxnRef: {
                    _text: txnRef,
                },
            },
        };

        addToLogs(JSON.stringify({ url: BASE_URL, data: params }));

        const paramsXML = convert.json2xml(params, { compact: true, spaces: 4 });

        try {
            const response = await axios.post(BASE_URL, paramsXML, {
                headers: {
                    "Content-Type": "application/xml",
                },
            });

            console.log(`Transaction POST response received (${response.status}) ${response.data}`);
            addToLogs(JSON.stringify({ url: BASE_URL, data: response }));

            if (response.status === 200) {
                const resJSON = convert.xml2json(response.data, { compact: true, spaces: 4 });
                const res = JSON.parse(resJSON) as IWindcaveInitTransactionResponse;

                if (res.Scr && res.Scr.Success) {
                    return txnRef;
                } else {
                    throw "SendButtonRequest: Button request unsuccessful";
                }
            } else {
                throw "SendButtonRequest: Invalid status code received";
            }
        } catch (e) {
            console.log("Error", e);
            addToLogs(`SendButtonRequestError: ${JSON.stringify(e)}`);
            throw e.message || e || "There was an unknown error. Please retry or contact Windcave support.";
        }
    };

    const pollForOutcome = (
        stationId: string,
        user: string,
        key: string,
        txnRef: string,
        action: string = ACTION
    ): Promise<IEftposTransactionOutcome> => {
        const interval = 2 * 1000; // 2 seconds
        const timeout = 3 * 60 * 1000; // 3 minutes

        const maxRetryCount = 5; // Maximum number of retry attempts
        let retryCount = 0; // Initial count of retry attempts

        const endTime = Number(new Date()) + timeout;

        const checkCondition = async (resolve: any, reject: any) => {
            try {
                const params = {
                    Scr: {
                        _attributes: {
                            action: action,
                            user: user,
                            key: key,
                        },
                        Station: {
                            _text: stationId,
                        },
                        TxnType: {
                            _text: "Status",
                        },
                        TxnRef: {
                            _text: txnRef,
                        },
                    },
                };

                addToLogs(JSON.stringify({ url: BASE_URL, data: params }));

                const paramsXML = convert.json2xml(params, { compact: true, spaces: 4 });

                const response = await axios.post(BASE_URL, paramsXML, {
                    headers: {
                        "Content-Type": "application/xml",
                    },
                });

                console.log(`Transaction GET response received (${response.status}) ${response.data}`);
                addToLogs(JSON.stringify({ url: BASE_URL, data: response }));

                let transactionComplete = false;
                let transactionOutcome: IEftposTransactionOutcome | null = null;
                let eftposReceipt;

                if (response.status === 200) {
                    const resJSON = convert.xml2json(response.data, { compact: true, spaces: 4 });
                    const res = JSON.parse(resJSON) as IWindcaveStatusResponse;

                    if (res.Scr.Complete && res.Scr.Complete._text === "1") {
                        transactionComplete = res.Scr.Complete._text === "1"; //If transaction is completed this field will be set to 1.

                        console.log("xxx...res.Scr.Result.CT._text", res.Scr.Result?.CT?._text);

                        if (res.Scr.Result && res.Scr.Result.AP) {
                            if (res.Scr.Result.AP._text === "1") {
                                //Accepted
                                transactionOutcome = {
                                    platformTransactionOutcome: EWindcaveTransactionOutcome.Accepted,
                                    transactionOutcome: EEftposTransactionOutcome.Success,
                                    message: "Transaction Accepted!",
                                    eftposReceipt: eftposReceipt,
                                    eftposCardType: res.Scr.Result.CT
                                        ? getCardType(res.Scr.Result.CT._text)
                                        : EEftposTransactionOutcomeCardType.EFTPOS,
                                    eftposSurcharge: res.Scr.Result.AmtS ? parseInt(res.Scr.Result.AmtS._text || "0") : 0,
                                    eftposTip: res.Scr.Result.AmtT ? parseInt(res.Scr.Result.AmtT._text || "0") : 0,
                                };
                            } else if (res.Scr.Result.AP._text === "0") {
                                //Declined or some other issue
                                if (
                                    (res.Scr.Result && res.Scr.Result.RC && res.Scr.Result.RC._text === "VW") ||
                                    (res.Scr.ReCo && res.Scr.ReCo._text === "VW")
                                ) {
                                    transactionOutcome = {
                                        platformTransactionOutcome: EWindcaveTransactionOutcome.Cancelled,
                                        transactionOutcome: EEftposTransactionOutcome.Fail,
                                        message: "Transaction Cancelled!",
                                        eftposReceipt: eftposReceipt,
                                    };
                                } else if (
                                    (res.Scr.Result && res.Scr.Result.RC && res.Scr.Result.RC._text === "76") ||
                                    (res.Scr.ReCo && res.Scr.ReCo._text === "76")
                                ) {
                                    transactionOutcome = {
                                        platformTransactionOutcome: EWindcaveTransactionOutcome.Declined,
                                        transactionOutcome: EEftposTransactionOutcome.Fail,
                                        message: "Transaction Declined! Please try again.",
                                        eftposReceipt: eftposReceipt,
                                    };
                                } else if (transactionComplete && res.Scr.ReCo && res.Scr.ReCo._text) {
                                    reject(windcaveResponseCodeMessages[res.Scr.ReCo._text] || "Unknown error");
                                    return;
                                } else if (transactionComplete && res.Scr.Result && res.Scr.Result.RC && res.Scr.Result.RC._text) {
                                    reject(windcaveResponseCodeMessages[res.Scr.Result.RC._text] || "Unknown error");
                                    return;
                                }
                            }

                            if (res.Scr.Rcpt) {
                                eftposReceipt = res.Scr.Rcpt._text;

                                if (res.Scr.RcptW && res.Scr.RcptW._text) {
                                    eftposReceipt = formatReceipt(eftposReceipt, parseInt(res.Scr.RcptW._text));
                                }
                            }
                        } else {
                            //Some other misc error
                            if (res.Scr.Result && res.Scr.Result.RC && res.Scr.Result.RC._text) {
                                reject(windcaveResponseCodeMessages[res.Scr.Result.RC._text] || "Unknown error");
                                return;
                            }
                        }
                    } else {
                        //Transaction still processing, we need to handle signature stage
                        if (
                            res.Scr.StatusId &&
                            res.Scr.TxnStatusId &&
                            res.Scr.StatusId._text == EWindcaveStatus.Processing &&
                            res.Scr.TxnStatusId._text == EWindcaveTxnStatus.VerifyingSignature
                        ) {
                            if (register && register.skipEftposReceiptSignature) {
                                //Auto send "YES" button press on signature stage
                                const sendButtonRequestTxnRef = await sendButtonRequest(stationId, user, key, action, "B1", "YES", txnRef);
                                addToLogs(`SendButtonRequestTxnRef: ${sendButtonRequestTxnRef}`);
                            } else {
                                //Fail any transaction approved with signature
                                transactionOutcome = transactionOutcome = {
                                    platformTransactionOutcome: EWindcaveTransactionOutcome.Failed,
                                    transactionOutcome: EEftposTransactionOutcome.Fail,
                                    message: "Transaction Approved With Signature Not Allowed!",
                                    eftposReceipt: eftposReceipt,
                                };
                            }
                        }
                    }
                } else {
                    //Should not come here for 4xx or 5xx errors. Will go directly into the catch block.
                    console.log("Ignoring failed request...");
                    reject("Invalid status code received. Please retry or contact Windcave support.");
                    return;
                }

                console.log(`transactionComplete: ${transactionComplete}, transactionOutcome: ${transactionOutcome}`);

                if (transactionComplete && transactionOutcome != null) {
                    addToLogs(`TransactionOutcome: ${JSON.stringify(transactionOutcome)}`);
                    resolve(transactionOutcome);
                    return;
                } else if (Number(new Date()) < endTime) {
                    await delay(interval);

                    setTimeout(checkCondition, interval, resolve, reject);
                    return;
                } else {
                    reject("Polling timed out");
                    return;
                }
            } catch (e) {
                console.log("Error", e);
                addToLogs(`TransactionError: ${JSON.stringify(e)}`);

                // Retry mechanism
                if (retryCount < maxRetryCount) {
                    console.log(`Retrying (${retryCount + 1}/${maxRetryCount})...`);
                    await logError(
                        `Retrying (${retryCount + 1}/${maxRetryCount})...`,
                        JSON.stringify({
                            restaurantId: restaurant ? restaurant.id : "",
                            restaurantName: restaurant ? restaurant.name : "",
                            logs: logs,
                        })
                    );
                    addToLogs(`Retrying (${retryCount + 1}/${maxRetryCount})...`);

                    retryCount++;

                    await delay(interval); // Wait a bit before retrying

                    setTimeout(checkCondition, interval, resolve, reject);
                } else {
                    await logError(
                        e.message || e || "There was an unknown error. Please retry or contact Windcave support.",
                        JSON.stringify({
                            restaurantId: restaurant ? restaurant.id : "",
                            restaurantName: restaurant ? restaurant.name : "",
                            logs: logs,
                        })
                    );

                    reject(e.message || e || "There was an unknown error. Please retry or contact Windcave support.");
                }
            }
        };

        return new Promise(checkCondition);
    };

    const createTransaction = (
        stationId: string,
        user: string,
        key: string,
        amount: number,
        transactionType: string,
        action: string = ACTION
    ): Promise<IEftposTransactionOutcome> => {
        return new Promise(async (resolve, reject) => {
            try {
                resetVariables();

                const txnRef = await sendTransaction(stationId, user, key, amount, transactionType, action);
                const outcome: IEftposTransactionOutcome = await pollForOutcome(stationId, user, key, txnRef);

                resolve(outcome);
            } catch (e) {
                console.log("Error", e);
                addToLogs(`Error ${e}`);

                reject(e);
            } finally {
                await createEftposTransactionLog(restaurant ? restaurant.id : "", transactionType, amount);
            }
        });
    };

    return (
        <WindcaveContext.Provider
            value={{
                createTransaction: createTransaction,
            }}
            children={props.children}
        />
    );
};

const useWindcave = () => {
    const context = useContext(WindcaveContext);
    if (context === undefined) {
        throw new Error(`useWindcave must be used within a WindcaveProvider`);
    }
    return context;
};

export { WindcaveProvider, useWindcave };
