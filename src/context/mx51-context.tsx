import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRegister } from "./register-context";
import { useRestaurant } from "./restaurant-context";
import {
    EEftposTransactionOutcome,
    IEftposTransactionOutcome,
    EEftposTransactionOutcomeCardType,
    IEftposQuestion,
    IMX51GetPaymentProviders,
    IMX51PairingInput,
    EMX51PairingStatus,
} from "../model/model";
import config from "./../../package.json";
import { delay } from "../model/util";
import { format } from "date-fns";
import { useErrorLogging } from "./errorLogging-context";
import { convertDollarsToCentsReturnInt, toLocalISOString } from "../util/util";
import { Spi as SpiClient, SuccessState, TransactionOptions, TransactionType } from "@mx51/spi-client-js";

const initialLogs = "";

const initialPairingInput = {
    posId: window.localStorage.getItem("registerKey")?.replace(/-/g, "").substring(0, 16) || "R1",
    tenantCode: window.localStorage.getItem("tenantCode") || "gko",
    serialNumber: "500-079-001",
    eftposAddress: window.localStorage.getItem("eftposAddress") || "192.168.1.234",
    autoAddressResolution: true,
    testMode: true,
};

type ContextProps = {
    pairingStatus: EMX51PairingStatus;
    setPairingStatus: (pairingStatus: EMX51PairingStatus) => void;
    pairingMessage: string;
    pairingInput: IMX51PairingInput;
    setPairingInput: (pairingInput: IMX51PairingInput) => void;
    getPaymentProviders: () => Promise<IMX51GetPaymentProviders>;
    sendPairingRequest: (pairingInput: IMX51PairingInput) => Promise<string>;
    sendPairingCancelRequest: () => Promise<string>;
    sendUnpairRequest: () => Promise<string>;
    createTransaction: (
        amount: string,
        merchantId: number,
        terminalId: number,
        customerMessageCallback: (message: string) => void,
        customerQuestionCallback: (question: IEftposQuestion) => void
    ) => Promise<IEftposTransactionOutcome>;
    cancelTransaction: () => void;
};

const MX51Context = createContext<ContextProps>({
    pairingStatus: EMX51PairingStatus.Unpaired,
    setPairingStatus: (pairingStatus: EMX51PairingStatus) => {
        return new Promise(() => {
            console.log("");
        });
    },
    pairingMessage: "",
    pairingInput: initialPairingInput,
    setPairingInput: () => {},
    getPaymentProviders: () => {
        return new Promise(() => {
            console.log("");
        });
    },
    sendPairingRequest: (pairingInput: IMX51PairingInput) => {
        return new Promise(() => {
            console.log("");
        });
    },
    sendPairingCancelRequest: () => {
        return new Promise(() => {
            console.log("");
        });
    },
    sendUnpairRequest: () => {
        return new Promise(() => {
            console.log("");
        });
    },
    createTransaction: (
        amount: string,
        merchantId: number,
        terminalId: number,
        customerMessageCallback: (message: string) => void,
        customerQuestionCallback: (question: IEftposQuestion) => void
    ) => {
        return new Promise(() => {
            console.log("");
        });
    },
    cancelTransaction: () => {
        return new Promise(() => {
            console.log("");
        });
    },
});

const MX51Provider = (props: { children: React.ReactNode }) => {
    const { addEftposLog } = useErrorLogging();
    const { restaurant } = useRestaurant();

    const [pairingInput, _setPairingInput] = useState<IMX51PairingInput>(initialPairingInput);
    const [pairingStatus, _setPairingStatus] = useState(EMX51PairingStatus.Unpaired);
    const [pairingMessage, setPairingMessage] = useState("");

    const logs = useRef<string>(initialLogs);

    const spiSettings = {
        posVendorId: "Tabin", // your POS company name/id
        posVersion: config.version, // your POS version
        deviceApiKey: process.env.REACT_APP_MX51_API_KEY || "", // ask the integration support team for your API key
        countryCode: "AU", // if unsure check with integration support team
        secureWebSockets: window.location.protocol === "https:" ? true : false, // checks for HTTPs
        printMerchantCopyOnEftpos: false, // prints merchant receipt from terminal instead of POS
        promptForCustomerCopyOnEftpos: false, // prints customer receipt from terminal instead of POS
        signatureFlowOnEftpos: false, // signature flow and receipts on terminal instead of POS
        merchantReceiptHeader: "", // custom text to be added to merchant receipt header
        merchantReceiptFooter: "", // custom text to be added to merchant receipt footer
        customerReceiptHeader: "", // custom text to be added to customer receipt header
        customerReceiptFooter: "", // custom text to be added to customer receipt footer
    };
    const spi = useRef<SpiClient>();

    const configureAndStartSpi = (newPairingInput: IMX51PairingInput) => {
        spi.current = new SpiClient(newPairingInput.posId, newPairingInput.serialNumber, newPairingInput.eftposAddress, null);
        // JSON.parse(window.localStorage.getItem("secrets") || "")

        spi.current.SetPosInfo(spiSettings.posVendorId, spiSettings.posVersion);
        spi.current.SetTenantCode(newPairingInput.tenantCode);
        spi.current.SetDeviceApiKey(spiSettings.deviceApiKey);
        spi.current.SetAutoAddressResolution(newPairingInput.autoAddressResolution);
        spi.current.SetSecureWebSockets(spiSettings.secureWebSockets);
        spi.current.SetTestMode(newPairingInput.testMode);
        spi.current.Config.PrintMerchantCopy = spiSettings.printMerchantCopyOnEftpos;
        spi.current.Config.PromptForCustomerCopyOnEftpos = spiSettings.promptForCustomerCopyOnEftpos;
        spi.current.Config.SignatureFlowOnEftpos = spiSettings.signatureFlowOnEftpos;

        const receiptOptions = new TransactionOptions();

        receiptOptions.SetMerchantReceiptHeader(spiSettings.merchantReceiptHeader);
        receiptOptions.SetMerchantReceiptFooter(spiSettings.merchantReceiptFooter);
        receiptOptions.SetCustomerReceiptHeader(spiSettings.customerReceiptHeader);
        receiptOptions.SetCustomerReceiptFooter(spiSettings.customerReceiptFooter);

        spi.current.Start();
    };

    const log = (message: string, event?: Event) => {
        if (event) {
            spi.current?._log.info(`xxx...SPI LOG: ${message} -> `, event);
        } else {
            spi.current?._log.info(`xxx...SPI LOG: ${message}`);
        }
    };

    const handleStatusChanged = (e) => {
        log("Status changed", e);
        if (e?.detail === "PairedConnected") {
            setPairingStatus(EMX51PairingStatus.Paired);
        } else if (e?.detail === "PairedConnecting") {
            setPairingStatus(EMX51PairingStatus.PairingProgress);
        } else {
        }
    };

    const handleSecretsChanged = (e) => {
        log("Secrets changed", e);
        if (e?.detail) {
            window.localStorage.setItem("secrets", JSON.stringify(e.detail));
        }
    };

    const handlePairingFlowStateChanged = (e) => {
        const message =
            e?.detail?.AwaitingCheckFromEftpos && e?.detail?.AwaitingCheckFromPos
                ? `${e?.detail?.Message}: ${e?.detail?.ConfirmationCode}`
                : e?.detail?.Message;
        // log("Pairing flow state changed", e);
        log(message);
        setPairingMessage(message);

        if (e?.detail?.AwaitingCheckFromPos) {
            setPairingStatus(EMX51PairingStatus.PairingConfirmation);
        }

        if (e?.detail?.Successful && e?.detail?.Finished) {
            spi.current?.AckFlowEndedAndBackToIdle();
            setPairingStatus(EMX51PairingStatus.PairingSuccessful);
        }

        if (e?.detail?.Finished && !e?.detail?.Successful) {
            setPairingStatus(EMX51PairingStatus.PairingFailed);
        }
    };

    const handleTxFlowStateChanged = (e) => {
        log("Transaction flow state changed", e);
        if (e.detail.AwaitingSignatureCheck) {
        } else if (e.detail.AwaitingPhoneForAuth) {
        } else if (e.detail.Finished) {
            if (e.detail.Response.Data.merchant_receipt && !e.detail.Response.Data.merchant_receipt_printed) {
            }
            if (e.detail.Response.Data.customer_receipt && !e.detail.Response.Data.customer_receipt_printed) {
            }
            switch (e.detail.Success) {
                case SuccessState.Success:
                    switch (e.detail.Type) {
                        case TransactionType.Purchase:
                            break;
                        case TransactionType.Refund:
                            break;
                        default:
                    }
                    break;
                case SuccessState.Failed:
                    break;
                case SuccessState.Unknown:
                    break;
                default:
            }
        }
    };

    const handleDeviceAddressChanged = (e) => {
        log("Device address changed", e);
        if (e?.detail.ip) {
            window.localStorage.setItem("eftposAddress", JSON.stringify(e.detail.ip));
        } else if (e?.detail.fqdn) {
            window.localStorage.setItem("eftposAddress", JSON.stringify(e.detail.fqdn));
        }
    };

    const addSpiEventListeners = () => {
        document.addEventListener("StatusChanged", handleStatusChanged);
        document.addEventListener("SecretsChanged", handleSecretsChanged);
        document.addEventListener("PairingFlowStateChanged", handlePairingFlowStateChanged);
        document.addEventListener("TxFlowStateChanged", handleTxFlowStateChanged);
        document.addEventListener("DeviceAddressChanged", handleDeviceAddressChanged);

        if (!spi.current) return;

        spi.current.TerminalConfigurationResponse = (e) => {
            log("Terminal configuration response", e);
            spi.current?.GetTerminalStatus();
        };

        spi.current.TerminalStatusResponse = (e) => {
            log("Terminal status response", e);
        };

        spi.current.TransactionUpdateMessage = (e) => {
            log("Transaction update", e);
        };

        spi.current.BatteryLevelChanged = (e) => {
            log("Battery level changed", e);
        };
    };

    useEffect(() => {
        return () => {
            document.removeEventListener("StatusChanged", handleStatusChanged);
            document.removeEventListener("SecretsChanged", handleSecretsChanged);
            document.removeEventListener("PairingFlowStateChanged", handlePairingFlowStateChanged);
            document.removeEventListener("TxFlowStateChanged", handleTxFlowStateChanged);
            document.removeEventListener("DeviceAddressChanged", handleDeviceAddressChanged);
        };
    }, []);

    const resetVariables = () => {
        //Add new reset if new variables are added above.
        logs.current = initialLogs;
    };

    const addToLogs = (log) => {
        const newLog = format(new Date(), "dd/MM/yy HH:mm:ss.SSS ") + log;

        console.log(log);
        logs.current += newLog + "\n";
    };

    const getCardType = (cardType?: string) => {
        let type = EEftposTransactionOutcomeCardType.EFTPOS;

        if (cardType) {
            if (cardType.toLowerCase() === "visa") {
                type = EEftposTransactionOutcomeCardType.VISA;
            } else if (cardType.toLowerCase() === "mastercard") {
                type = EEftposTransactionOutcomeCardType.MASTERCARD;
            } else if (cardType.toLowerCase() === "amex") {
                type = EEftposTransactionOutcomeCardType.AMEX;
            } else if (cardType.toLowerCase() === "alipay") {
                type = EEftposTransactionOutcomeCardType.ALIPAY;
            }
        }

        return type;
    };

    const createEftposTransactionLog = async (restaurantId: string, transactionType: string, amount: number) => {
        const now = new Date();

        await addEftposLog({
            eftposProvider: "MX51",
            amount: amount,
            type: transactionType,
            payload: logs.current,
            restaurantId: restaurantId,
            timestamp: toLocalISOString(now),
            expiry: Number(Math.floor(Number(now) / 1000) + 2592000), // Add 30 days to timeStamp for DynamoDB TTL
        });
    };

    const setPairingInput = (pairingInput: IMX51PairingInput) => {
        _setPairingInput(pairingInput);
    };

    const setPairingStatus = (pairingStatus: EMX51PairingStatus) => {
        _setPairingStatus(pairingStatus);
    };

    const getPaymentProviders = async (): Promise<IMX51GetPaymentProviders> => {
        return new Promise(async (resolve, reject) => {
            try {
                const { Data: tenants } = await SpiClient.GetAvailableTenants(
                    spiSettings.countryCode,
                    spiSettings.posVendorId,
                    spiSettings.deviceApiKey
                );
                // store the list of tenants
                localStorage.setItem("tenants", JSON.stringify(tenants));
                // store the desired tenant code
                localStorage.setItem("tenantCode", tenants[0].code);

                const paymentProviders: IMX51GetPaymentProviders = {
                    paymnetProivderList: tenants,
                    paymentProvider: tenants[0].code,
                };

                resolve(paymentProviders);
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
    };

    const sendPairingRequest = (newpairingInput: IMX51PairingInput): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            try {
                configureAndStartSpi(newpairingInput);
                addSpiEventListeners();

                spi.current?.Pair();

                resolve("");
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
    };

    const sendPairingCancelRequest = (): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            try {
                spi.current?.PairingCancel();

                resolve("");
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
    };

    const sendUnpairRequest = (): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            try {
                spi.current?.Unpair();

                setPairingStatus(EMX51PairingStatus.Unpaired);

                resolve("");
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
    };

    const createTransaction = (
        amount: string,
        merchantId: number,
        terminalId: number,
        customerMessageCallback: (message: string) => void,
        customerQuestionCallback: (question: IEftposQuestion) => void
    ): Promise<IEftposTransactionOutcome> => {
        resetVariables();

        const interval = 10 * 1000; // 10 seconds
        const timeout = 10 * 60 * 1000; // 10 minutes

        const endTime = Number(new Date()) + timeout;

        let approvedWithSignature = false;

        const checkCondition = async (resolve: any, reject: any) => {
            if (!merchantId) {
                reject("A merchantId has to be supplied.");
                return;
            }

            if (!terminalId) {
                reject("A terminalId has to be supplied.");
                return;
            }

            try {
                // const requestParams: IMX51InitiatePurchaseInput = {
                //     amount: amount, //The purchase amount (amount to charge the customer) in cents.
                //     // cashout: "0", //Cash out amount in cents.
                //     integratedReceipt: true, //indicate whether receipts will be printed on the POS (true) or on the terminal (false).
                //     mid: merchantId, //Override the configured mid for multi-merchant terminals or if your browser does not support local storage.
                //     tid: terminalId, //Override the configured tid for multi-merchant terminals or if your browser does not support local storage.
                //     // integrationKey: integrationKey, //Supply the integration key if your browser does not support local storage.
                //     // transactionId: "", //Supply a transaction Id to be used for the transaction.
                //     // healthpointTransactionId: "", //The integrated transaction ID of the original HealthPoint Claim (used for gap payments).
                //     enableSurcharge: true, //Apply a surcharge to this transaction (if the card used attracts a surcharge).
                //     // requestCardToken: true, //Request a token representing the card used for the current purchase.
                // };

                const transactionCallbacks = {
                    //Invoked when the terminal requires the merchant to answer a question in order to proceed with the transaction. Called with the following parameters:
                    questionCallback: (question, answerCallback) => {
                        addToLogs(`xxx...questionCallback Question: ${JSON.stringify(question)}`);

                        if (question.text.includes("APPROVED W/ SIGNATURE. Signature OK?")) {
                            approvedWithSignature = true;
                            addToLogs("Answer back with YES");
                            answerCallback("YES");
                        } else if (question.text.includes("Are you sure you want to cancel?")) {
                            addToLogs("Answer back with YES");
                            answerCallback("YES");
                        } else {
                            customerQuestionCallback({ text: question.text, options: question.options, answerCallback: answerCallback });
                        }

                        // if (question.text.includes("APPROVED W/ SIGNATURE. Signature OK?")) {
                        //     approvedWithSignature = true;
                        //     addToLogs("Answer back with NO");
                        //     answerCallback("NO");
                        // } else if (question.text.includes("Are you sure you want to cancel?")) {
                        //     addToLogs("Answer back with YES");
                        //     answerCallback("YES");
                        // } else if (question.text.includes("Cancel this transaction?")) {
                        //     addToLogs("Answer back with YES");
                        //     answerCallback("YES");
                        // } else if (question.text.includes("POS is not paired with a terminal.")) {
                        //     addToLogs("Answer back with OK");
                        //     answerCallback("OK");
                        // } else if (question.text.includes("Invalid transaction details (400).")) {
                        //     addToLogs("Answer back with OK");
                        //     answerCallback("OK");
                        // }

                        // if (question.isError) {
                        //     addToLogs("Returning with error");

                        //     resolve({
                        //         platformTransactionOutcome: EMX51TransactionOutcome.UNKNOWN,
                        //         transactionOutcome: EEftposTransactionOutcome.Fail,
                        //         message: question.text,
                        //         eftposReceipt: "",
                        //     });
                        // }
                    },
                    //Invoked to advertise what is happening on terminal, which is typically facing the customer rather than the merchant. Called with a single String argument. For example "Select account".
                    statusMessageCallback: (message: string) => {
                        addToLogs(`xxx...statusMessageCallback Message: ${JSON.stringify(message)}`);

                        customerMessageCallback(message);
                    },
                    //Invoked when integrated receipts are enabled and a merchant copy of the receipt is available. Ignored if integrated receipt printing is disabled. Called with the following parameters:
                    receiptCallback: (receipt) => {
                        addToLogs(`xxx...receiptCallback Receipt: ${JSON.stringify(receipt)}`);

                        if (receipt.signatureRequired == true) {
                            approvedWithSignature = true;
                            cancelTransaction();
                        }
                    },
                    //Invoked when the transaction has been completed on the terminal. Called with a subset of the following parameters:
                    transactionCompleteCallback: (response) => {
                        addToLogs(`xxx...transactionCompleteCallback Response: ${JSON.stringify(response)}`);

                        console.log(response.customerReceipt);
                        let transactionOutcome: IEftposTransactionOutcome | null = null;

                        // switch (response.result) {
                        //     case "APPROVED":
                        //         transactionOutcome = {
                        //             platformTransactionOutcome: EMX51TransactionOutcome.APPROVED,
                        //             transactionOutcome: EEftposTransactionOutcome.Success,
                        //             message: "Transaction Approved!",
                        //             eftposReceipt: response.customerReceipt || "",
                        //             eftposCardType: getCardType(response.cardType),
                        //             eftposSurcharge: response.surchargeAmount
                        //                 ? convertDollarsToCentsReturnInt(parseFloat(response.surchargeAmount))
                        //                 : 0,
                        //             eftposTip: response.tipAmount ? convertDollarsToCentsReturnInt(parseFloat(response.tipAmount)) : 0,
                        //         };
                        //         break;
                        //     case "CANCELLED":
                        //         transactionOutcome = {
                        //             platformTransactionOutcome: EMX51TransactionOutcome.CANCELLED,
                        //             transactionOutcome: EEftposTransactionOutcome.Fail,
                        //             message: "Transaction Cancelled!",
                        //             eftposReceipt: response.customerReceipt || "",
                        //             eftposCardType: getCardType(response.cardType),
                        //             eftposSurcharge: response.surchargeAmount
                        //                 ? convertDollarsToCentsReturnInt(parseFloat(response.surchargeAmount))
                        //                 : 0,
                        //             eftposTip: response.tipAmount ? convertDollarsToCentsReturnInt(parseFloat(response.tipAmount)) : 0,
                        //         };
                        //         break;
                        //     case "REVERSED":
                        //         let message = "Transaction Reversed!";

                        //         // Approved with signature not allowed in kiosk mode
                        //         if (approvedWithSignature && (register?.skipEftposReceiptSignature || isPOS)) {
                        //             message =
                        //                 "Signature transactions are not allowed on the Kiosk, please go to the counter or use another card to make the payment";
                        //         }

                        //         transactionOutcome = {
                        //             platformTransactionOutcome: EMX51TransactionOutcome.REVERSED,
                        //             transactionOutcome: EEftposTransactionOutcome.Fail,
                        //             message: message,
                        //             eftposReceipt: response.customerReceipt || "",
                        //             eftposCardType: getCardType(response.cardType),
                        //             eftposSurcharge: response.surchargeAmount
                        //                 ? convertDollarsToCentsReturnInt(parseFloat(response.surchargeAmount))
                        //                 : 0,
                        //             eftposTip: response.tipAmount ? convertDollarsToCentsReturnInt(parseFloat(response.tipAmount)) : 0,
                        //         };

                        //         break;
                        //     case "DECLINED":
                        //         transactionOutcome = {
                        //             platformTransactionOutcome: EMX51TransactionOutcome.DECLINED,
                        //             transactionOutcome: EEftposTransactionOutcome.Fail,
                        //             message: "Transaction Declined! Please try again.",
                        //             eftposReceipt: response.customerReceipt || "",
                        //             eftposCardType: getCardType(response.cardType),
                        //             eftposSurcharge: response.surchargeAmount
                        //                 ? convertDollarsToCentsReturnInt(parseFloat(response.surchargeAmount))
                        //                 : 0,
                        //             eftposTip: response.tipAmount ? convertDollarsToCentsReturnInt(parseFloat(response.tipAmount)) : 0,
                        //         };
                        //         break;
                        //     case "SYSTEM ERROR":
                        //         // You should never come in this state. Don't even know what settledOk is. Cannot find any references in docs as well.
                        //         transactionOutcome = {
                        //             platformTransactionOutcome: EMX51TransactionOutcome.SYSTEMERROR,
                        //             transactionOutcome: EEftposTransactionOutcome.Fail,
                        //             message: "System Error.",
                        //             eftposReceipt: response.customerReceipt || "",
                        //             eftposCardType: getCardType(response.cardType),
                        //             eftposSurcharge: response.surchargeAmount
                        //                 ? convertDollarsToCentsReturnInt(parseFloat(response.surchargeAmount))
                        //                 : 0,
                        //             eftposTip: response.tipAmount ? convertDollarsToCentsReturnInt(parseFloat(response.tipAmount)) : 0,
                        //         };
                        //         break;
                        //     case "NOT STARTED":
                        //         transactionOutcome = {
                        //             platformTransactionOutcome: EMX51TransactionOutcome.NOTSTARTED,
                        //             transactionOutcome: EEftposTransactionOutcome.Fail,
                        //             message: "Transaction Not Started",
                        //             eftposReceipt: response.customerReceipt || "",
                        //             eftposCardType: getCardType(response.cardType),
                        //             eftposSurcharge: response.surchargeAmount
                        //                 ? convertDollarsToCentsReturnInt(parseFloat(response.surchargeAmount))
                        //                 : 0,
                        //             eftposTip: response.tipAmount ? convertDollarsToCentsReturnInt(parseFloat(response.tipAmount)) : 0,
                        //         };
                        //         break;
                        //     case "UNKNOWN":
                        //         transactionOutcome = {
                        //             platformTransactionOutcome: EMX51TransactionOutcome.UNKNOWN,
                        //             transactionOutcome: EEftposTransactionOutcome.Fail,
                        //             message: "Please look at the terminal to determine what happened. Typically indicates a network error.",
                        //             eftposReceipt: response.customerReceipt || "",
                        //             eftposCardType: getCardType(response.cardType),
                        //             eftposSurcharge: response.surchargeAmount
                        //                 ? convertDollarsToCentsReturnInt(parseFloat(response.surchargeAmount))
                        //                 : 0,
                        //             eftposTip: response.tipAmount ? convertDollarsToCentsReturnInt(parseFloat(response.tipAmount)) : 0,
                        //         };
                        //         break;
                        //     default:
                        //         transactionOutcome = {
                        //             platformTransactionOutcome: EMX51TransactionOutcome.UNKNOWN,
                        //             transactionOutcome: EEftposTransactionOutcome.Fail,
                        //             message: "Unknown. Invalid State...",
                        //             eftposReceipt: response.customerReceipt || "",
                        //             eftposCardType: getCardType(response.cardType),
                        //             eftposSurcharge: response.surchargeAmount
                        //                 ? convertDollarsToCentsReturnInt(parseFloat(response.surchargeAmount))
                        //                 : 0,
                        //             eftposTip: response.tipAmount ? convertDollarsToCentsReturnInt(parseFloat(response.tipAmount)) : 0,
                        //         };
                        //         break;
                        // }

                        resolve(transactionOutcome);
                    },
                };

                // addToLogs(`RequestParams: ${JSON.stringify(requestParams)}`);
                // iclient.initiatePurchase(requestParams, transactionCallbacks);

                while (true) {
                    if (Number(new Date()) < endTime) {
                        await delay(interval);
                    } else {
                        addToLogs("Cancelling transaction due to timeout");
                        cancelTransaction();
                        reject("Transaction timed out");
                        return;
                    }
                }
            } catch (error) {
                addToLogs(`error.message: ${error.message}`);

                reject(error);
            } finally {
                await createEftposTransactionLog(restaurant ? restaurant.id : "", "Create Transaction", parseInt(amount));
            }
        };

        return new Promise(checkCondition);
    };

    const cancelTransaction = () => {};

    return (
        <MX51Context.Provider
            value={{
                pairingStatus: pairingStatus,
                setPairingStatus: setPairingStatus,
                pairingMessage: pairingMessage,
                pairingInput: pairingInput,
                setPairingInput: setPairingInput,
                getPaymentProviders: getPaymentProviders,
                sendPairingRequest: sendPairingRequest,
                sendPairingCancelRequest: sendPairingCancelRequest,
                sendUnpairRequest: sendUnpairRequest,
                createTransaction: createTransaction,
                cancelTransaction: cancelTransaction,
            }}
            children={props.children}
        />
    );
};

const useMX51 = () => {
    const context = useContext(MX51Context);
    if (context === undefined) {
        throw new Error(`useMX51 must be used within a MX51Provider`);
    }
    return context;
};

export { MX51Provider, useMX51 };
