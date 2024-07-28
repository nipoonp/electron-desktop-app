import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRestaurant } from "./restaurant-context";
import {
    EEftposTransactionOutcome,
    IEftposTransactionOutcome,
    EEftposTransactionOutcomeCardType,
    IMX51GetPaymentProviders,
    IMX51PairingInput,
    EMX51PairingStatus,
    EMX51TransactionOutcome,
    IMX51EftposQuestion,
} from "../model/model";
import config from "./../../package.json";
import { delay } from "../model/util";
import { format } from "date-fns";
import { useErrorLogging } from "./errorLogging-context";
import { toLocalISOString } from "../util/util";
import { Spi as SpiClient, SuccessState, TransactionOptions, TransactionType } from "@mx51/spi-client-js";
import { v4 as uuid } from "uuid";

const initialCustomerMessage = "";
const initialReceiptToSign = "";
const initialReceiptToSignCallbackDisplayed = false;
const initialOutcome = null;
const initialOutcomeFailedErrorDetail = "";
const initialEftposReceipt = "";
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
        amount: number,
        eftposTip: number,
        eftposSurcharge: number,
        customerMessageCallback: (message: string) => void,
        customerSignatureRequiredCallback: (answerCallback: IMX51EftposQuestion | null) => void
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
        amount: number,
        eftposTip: number,
        eftposSurcharge: number,
        customerMessageCallback: (message: string) => void,
        customerSignatureRequiredCallback: (answerCallback: IMX51EftposQuestion | null) => void
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

    const customerMessage = useRef<string>(initialCustomerMessage);
    const receiptToSign = useRef<string>(initialReceiptToSign);
    const receiptToSignCallbackDisplayed = useRef<boolean>(initialReceiptToSignCallbackDisplayed);
    const outcome = useRef<{
        cardType: string;
        outcome: EMX51TransactionOutcome;
    } | null>(initialOutcome);
    const outcomeFailedErrorDetail = useRef<string>(initialOutcomeFailedErrorDetail);
    const eftposReceipt = useRef<string>(initialEftposReceipt);
    const logs = useRef<string>(initialLogs);

    const eventListenersConfigured = useRef<boolean>(false);

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
    const receiptOptions = new TransactionOptions();

    const configureAndStartSpi = (spiSecrets, newPairingInput: IMX51PairingInput = pairingInput) => {
        spi.current = new SpiClient(newPairingInput.posId, newPairingInput.serialNumber, newPairingInput.eftposAddress, spiSecrets);

        spi.current.SetPosInfo(spiSettings.posVendorId, spiSettings.posVersion);
        spi.current.SetTenantCode(newPairingInput.tenantCode);
        spi.current.SetDeviceApiKey(spiSettings.deviceApiKey);
        spi.current.SetAutoAddressResolution(newPairingInput.autoAddressResolution);
        spi.current.SetSecureWebSockets(spiSettings.secureWebSockets);
        spi.current.SetTestMode(newPairingInput.testMode);
        spi.current.Config.PrintMerchantCopy = spiSettings.printMerchantCopyOnEftpos;
        spi.current.Config.PromptForCustomerCopyOnEftpos = spiSettings.promptForCustomerCopyOnEftpos;
        spi.current.Config.SignatureFlowOnEftpos = spiSettings.signatureFlowOnEftpos;

        receiptOptions.SetMerchantReceiptHeader(spiSettings.merchantReceiptHeader);
        receiptOptions.SetMerchantReceiptFooter(spiSettings.merchantReceiptFooter);
        receiptOptions.SetCustomerReceiptHeader(spiSettings.customerReceiptHeader);
        receiptOptions.SetCustomerReceiptFooter(spiSettings.customerReceiptFooter);

        spi.current.Start();

        addSpiEventListeners();
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
        } else if (e?.detail === "Unpaired") {
            setPairingStatus(EMX51PairingStatus.Unpaired);
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
            // Display the signature confirmation UI
            receiptToSign.current = e.detail.SignatureRequiredMessage._receiptToSign;
        } else if (e.detail.AwaitingPhoneForAuth) {
            // Display the MOTO phone authentication UI
        } else if (e.detail.Finished) {
            if (e.detail.Response.Data.merchant_receipt && !e.detail.Response.Data.merchant_receipt_printed) {
                // Print and/or store the merchant_receipt
            }

            if (e.detail.Response.Data.customer_receipt && !e.detail.Response.Data.customer_receipt_printed) {
                // Print and/or store the customer_receipt
                eftposReceipt.current = e.detail.Response.Data.customer_receipt;
            }

            switch (e.detail.Success) {
                case SuccessState.Success:
                    // Display the successful transaction UI adding detail for user (e.detail.Response.Data.host_response_text)
                    // Close the sale on the POS
                    switch (e.detail.Type) {
                        case TransactionType.Purchase:
                            outcome.current = {
                                cardType: e.detail.Response.Data.scheme_app_name,
                                outcome: EMX51TransactionOutcome.Success,
                            };
                            // Perform actions after purchases only
                            break;
                        case TransactionType.Refund:
                            // Perform actions after refunds only
                            // Not used right now
                            break;
                        default:
                        // Perform actions after other transaction types
                    }
                    break;
                case SuccessState.Failed:
                    outcome.current = {
                        cardType: e.detail.Response.Data.scheme_app_name,
                        outcome: EMX51TransactionOutcome.Failed,
                    };

                    // Display the failed transaction UI adding detail for user:
                    // e.detail.Response.Data.error_detail
                    // e.detail.Response.Data.error_reason
                    // if (e.detail.Response.Data.host_response_text) {
                    //     e.detail.Response.Data.host_response_text
                    // }
                    if (e.detail.Response.Data.error_reason) outcomeFailedErrorDetail.current = e.detail.Response.Data.error_detail;

                    break;
                case SuccessState.Unknown:
                    outcome.current = {
                        cardType: e.detail.Response.Data.scheme_app_name,
                        outcome: EMX51TransactionOutcome.Unknown,
                    };

                    // Display the manual transaction recovery UI
                    break;
                default:
                // Throw error: invalid success state
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
        if (eventListenersConfigured.current) return;

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

            if (e.Data.display_message_text) customerMessage.current = e.Data.display_message_text;
        };

        spi.current.BatteryLevelChanged = (e) => {
            log("Battery level changed", e);
        };

        eventListenersConfigured.current = true;
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
        customerMessage.current = initialCustomerMessage;
        receiptToSign.current = initialReceiptToSign;
        receiptToSignCallbackDisplayed.current = initialReceiptToSignCallbackDisplayed;
        outcome.current = initialOutcome;
        outcomeFailedErrorDetail.current = initialOutcomeFailedErrorDetail;
        eftposReceipt.current = initialEftposReceipt;
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
                const storedSecrets = window.localStorage.getItem("secrets");
                const spiSecrets = storedSecrets ? JSON.parse(storedSecrets) : null;

                configureAndStartSpi(spiSecrets, newpairingInput);

                if (!spiSecrets) spi.current?.Pair();

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
                window.localStorage.removeItem("secrets");

                setPairingStatus(EMX51PairingStatus.Unpaired);

                resolve("");
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
    };

    const posRefIdGenerator = (type: string) => {
        return new Date().toISOString() + "-" + type + uuid();
    };

    const createTransaction = (
        amount: number,
        eftposTip: number,
        eftposSurcharge: number,
        customerMessageCallback: (message: string) => void,
        customerSignatureRequiredCallback: (answerCallback: IMX51EftposQuestion | null) => void
    ): Promise<IEftposTransactionOutcome> => {
        return new Promise(async (resolve, reject) => {
            console.log("xxx...pairingStatus", pairingStatus);

            if (pairingStatus === EMX51PairingStatus.Unpaired) {
                const storedSecrets = window.localStorage.getItem("secrets");
                const spiSecrets = storedSecrets ? JSON.parse(storedSecrets) : null;

                if (!spiSecrets) {
                    reject("This register is not paired to a device, please pair it first.");
                    return;
                }

                configureAndStartSpi(spiSecrets);
            }

            resetVariables();

            const interval = 100; // 0.1 seconds
            const timeout = 10 * 60 * 1000; // 10 minutes

            const endTime = Number(new Date()) + timeout;

            spi.current?.AckFlowEndedAndBackToIdle();

            spi.current?.InitiatePurchaseTxV2(
                posRefIdGenerator("purchase"), // posRefId
                amount,
                eftposTip, //tip amount
                0, //cashout amount
                false,
                receiptOptions,
                eftposSurcharge //surcharge amount
            );

            try {
                let transactionOutcome: IEftposTransactionOutcome | null = null;

                while (true) {
                    if (Number(new Date()) < endTime) {
                        addToLogs(`Checking for transactionOutcome: ${outcome.current}`);

                        await delay(interval);

                        customerMessageCallback(customerMessage.current);

                        if (receiptToSign.current && !receiptToSignCallbackDisplayed.current) {
                            customerSignatureRequiredCallback({
                                receipt: receiptToSign.current,
                                answerCallback: (accepted: boolean) => {
                                    spi.current?.AcceptSignature(accepted);

                                    customerSignatureRequiredCallback(null);
                                },
                            });
                            receiptToSignCallbackDisplayed.current = true;
                        }

                        if (outcome.current?.outcome === EMX51TransactionOutcome.Success) {
                            transactionOutcome = {
                                platformTransactionOutcome: EMX51TransactionOutcome.Success,
                                transactionOutcome: EEftposTransactionOutcome.Success,
                                message: "Transaction Approved!",
                                eftposReceipt: eftposReceipt.current,
                                eftposCardType: getCardType(outcome.current.cardType),
                                eftposSurcharge: eftposSurcharge,
                                eftposTip: eftposTip,
                            };

                            addToLogs("Success: Transaction Completed.");
                            break;
                        } else if (outcome.current?.outcome === EMX51TransactionOutcome.Failed) {
                            transactionOutcome = {
                                platformTransactionOutcome: EMX51TransactionOutcome.Failed,
                                transactionOutcome: EEftposTransactionOutcome.Fail,
                                message: outcomeFailedErrorDetail.current || "Transaction Failed!",
                                eftposReceipt: eftposReceipt.current,
                                eftposCardType: getCardType(outcome.current.cardType),
                                eftposSurcharge: eftposSurcharge,
                                eftposTip: eftposTip,
                            };
                            break;
                        } else if (outcome.current?.outcome === EMX51TransactionOutcome.Unknown) {
                            transactionOutcome = {
                                platformTransactionOutcome: EMX51TransactionOutcome.Unknown,
                                transactionOutcome: EEftposTransactionOutcome.Fail,
                                message: "Please look at the terminal to determine what happened. Typically indicates a network error.",
                                eftposReceipt: eftposReceipt.current,
                                eftposCardType: getCardType(outcome.current.cardType),
                                eftposSurcharge: eftposSurcharge,
                                eftposTip: eftposTip,
                            };
                            break;
                        }
                    } else {
                        addToLogs("Cancelling transaction due to timeout");
                        cancelTransaction();
                        reject("Transaction timed out");
                        return;
                    }
                }

                if (transactionOutcome) {
                    console.log("TransactionOutcome", transactionOutcome);
                    resolve(transactionOutcome);
                }
            } catch (error) {
                addToLogs(`error.message: ${error.message}`);

                reject(error);
            } finally {
                await createEftposTransactionLog(restaurant ? restaurant.id : "", "Create Transaction", amount);
            }
        });
    };

    const cancelTransaction = () => {
        spi.current?.CancelTransaction();
    };

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
