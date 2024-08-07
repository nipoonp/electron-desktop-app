import { createContext, useContext, useEffect, useRef, useState } from "react";

import axios from "axios";
import { useRegister } from "./register-context";
import { useRestaurant } from "./restaurant-context";
import { EEftposTransactionOutcome, ESmartpayTransactionOutcome, IEftposTransactionOutcome, EEftposTransactionOutcomeCardType } from "../model/model";
import { format } from "date-fns";
import { toLocalISOString } from "../util/util";
import { useErrorLogging } from "./errorLogging-context";
// ******************************************************************************
// The code below will handle the SmartConnect API endpoint communication.
// SmartConnect API endpoints are CORS-enabled, so the calls can be made from the front-end.
// ******************************************************************************

// This base URL points to the DEV environment, against which all development and testing should be done.
// When deploying your app to production, make sure to remember to have a way to change this URL to use PROD endpoints.
// const baseUrl = "https://api-dev.smart-connect.cloud/POS";

// Register ID. *Must* be unique across *all* of your customers using your POS. The same ID must be sent for both
// pairing and transaction requests. A UUID is generally convenient here, though it doesn't need to be a UUID.
// const posRegisterId = "6bd3bf1c-11cb-42ae-92c7-46ac39680166";

// The name of the register. Only used during pairing. This will be displayed on the device itself (to easily
// visually identify where it is paired to).
// const posRegisterName = "Register 1";

// The merchant name of your customer. *Must* be consistent between pairing and transaction requests.
// Side note: If the customer chooses to change their business name, a new pairing request needs to be issued.
// const posBusinessName = "Demo Shop";

// The name of your POS application. *Must* be consistent between pairing and transaction requests.
// const posVendorName = "Test POS";

// This "enum" will be used to return back the final transaction outcome after polling is complete.
//
// The transaction outcome is generally decided by two parameters inside the result JSON: TransactionResult and data.Result.
//
// *TransactionResult* is the actual outcome of the transaction.
// Possible values are: OK-ACCEPTED, OK-DECLINED, OK-UNAVAILABLE, OK-DELAYED, CANCELLED, FAILED, FAILED-INTERFACE
//
// *Result* indicates if the function was performed successfully (a Declined outcome is also a function performed successfully).
// Possible values are: OK, CANCELLED, DELAYED-TRANSACTION, FAILED, FAILED-INTERFACE.
//
// For a full reference on these parameters, see: http://www.smartpayinvestor.com/smartconnect-api-integration-guide/
//
// From the point of view of the POS, TransactionResult is the main determinant of the outcome of the transaction.
// Result can be used as a complementary field, the major use being to distinguish Cancelled transactions between
// the user pressing Cancel on the device, from the device being offline.
//
// The scenarios below capture the outcomes we'd want to handle on the interface.

const initialLogs = "";

type ContextProps = {
    sendPairingRequest: (pairingCode: string) => Promise<void>;
    createTransaction: (amount: number, transactionType: string) => Promise<string>;
    pollForOutcome: (pollingUrl: string, delayed: () => void) => Promise<IEftposTransactionOutcome>;
};

const SmartpayContext = createContext<ContextProps>({
    sendPairingRequest: (pairingCode: string) => {
        return new Promise(() => {
            console.log("");
        });
    },
    createTransaction: (amount: number, transactionType: string) => {
        return new Promise(() => {
            console.log("");
        });
    },
    pollForOutcome: (pollingUrl: string, delayed: (eftposTransactionOutcome: IEftposTransactionOutcome) => void) => {
        return new Promise(() => {
            console.log("");
        });
    },
});

const SmartpayProvider = (props: { children: React.ReactNode }) => {
    const { addEftposLog } = useErrorLogging();

    const { register } = useRegister();
    const { restaurant } = useRestaurant();

    const [baseUrl, setBaseUrl] = useState<string>("https://api.smart-connect.cloud/POS");
    let [posRegisterId, setPosRegisterId] = useState<string | null>(null);
    const [posRegisterName, setPosRegisterName] = useState<string | null>(null);
    let [posBusinessName, setPosBusinessName] = useState<string | null>(null);
    const [posVendorName, setPosVendorName] = useState<string>("Tabin");

    const logs = useRef<string>(initialLogs);

    useEffect(() => {
        if (restaurant) setPosBusinessName(restaurant.name);
    }, [restaurant]);

    useEffect(() => {
        if (register) {
            setPosRegisterId(register.id);
            setPosRegisterName(register.name);
        }
    }, [register]);

    const getCardType = (cardType: string) => {
        let type = EEftposTransactionOutcomeCardType.EFTPOS;

        if (cardType.toLowerCase() === "visa") {
            type = EEftposTransactionOutcomeCardType.VISA;
        } else if (cardType.toLowerCase() === "mcard") {
            type = EEftposTransactionOutcomeCardType.MASTERCARD;
        } else if (cardType.toLowerCase() === "amex") {
            type = EEftposTransactionOutcomeCardType.AMEX;
        }

        return type;
    };

    const addToLogs = (log) => {
        const newLog = format(new Date(), "dd/MM/yy HH:mm:ss.SSS ") + log;

        console.log(log);
        logs.current += newLog + "\n";
    };

    const createEftposTransactionLog = async (restaurantId: string, transactionType: string, amount: number) => {
        const now = new Date();

        await addEftposLog({
            eftposProvider: "SMARTPAY",
            amount: amount,
            type: transactionType,
            payload: logs.current,
            restaurantId: restaurantId,
            timestamp: toLocalISOString(now),
            expiry: Number(Math.floor(Number(now) / 1000) + 2592000), // Add 30 days to timeStamp for DynamoDB TTL
        });
    };

    // ======================================================
    // PAIRING REQUEST
    //
    // Parameters:
    // - pairingCode (required) - The code as displayed on the device, and inputted by the user
    //
    // Returns:
    // - a JS Promise with the outcome (resolve, no object passed back / reject, error message passed back)
    // ======================================================
    const sendPairingRequest = (pairingCode: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            if (!pairingCode) {
                reject("A pairing code has to be supplied.");
                return;
            }

            if (!posRegisterId) {
                reject("A posRegisterId has to be supplied.");
                return;
            }

            if (!posRegisterName) {
                reject("A posRegisterName has to be supplied.");
                return;
            }

            if (!posBusinessName) {
                reject("A posBusinessName has to be supplied.");
                return;
            }

            const pairingEndpoint = baseUrl + "/Pairing/" + pairingCode;

            const params = new URLSearchParams();
            params.append("POSRegisterID", posRegisterId);
            params.append("POSRegisterName", posRegisterName);
            params.append("POSBusinessName", posBusinessName);
            params.append("POSVendorName", posVendorName);

            console.log("Sending pairing request to: " + pairingEndpoint);
            console.log("Pairing parameters: " + params.toString());

            try {
                // Note that a PUT is required. Any other method will return with a 404 Not Found.
                let response = await axios.put(pairingEndpoint, params, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    },
                });

                // success function invoked when 2xx OK is received
                try {
                    console.log(`Pairing response received (${response.status}) ${response.data.result}`);

                    // Trust, but verify
                    if (response.status == 200) {
                        // No object passed back
                        resolve();
                        return;
                    } else {
                        // We don't really expect anything other than 200 in here, but you never know...
                        reject("Invalid status code received");
                        return;
                    }
                } catch (error) {
                    // Catch code errors (parsing failure, etc.)
                    reject(error);
                }
            } catch (error) {
                //  error function invoked when anything other than 2xx OK is received
                console.log(`Pairing response received (${error.response.status}) ${error.response.data.result}`);

                // Generally, if it's an "expected" error (e.g. invalid/expired pairing code), a 4xx will be returned
                // and a JSON description of the error provided (except for 404 Not Found). For example:
                //
                // { "error": "Invalid Pairing Code. Please make sure you entered the code correctly" } (400 Bad Request)
                //
                // We will only fall back to errorThrown if this is not present (i.e. if a 5xx server error happens instead).
                // errorThrown will be a generic "Internal Server Error" etc. as per the status code.
                let errorThrow = error.response.data && error.response.data.error ? error.response.data.error : "Internal Server Error";

                // For the purpose of this example, we will treat all errors "equally" and just surface the error
                // message back, however you may wish to at least differentiate between 4xx and 5xx errors in a
                // production implementation (i.e. errors that have a message and can be caught versus call/server failure).
                reject(errorThrow);
            }
        });
    };

    // ======================================================
    // CREATE TRANSACTION
    //
    // Parameters:
    // - amount (required) - The amount in cents ($1.99 should be supplied as 199). Currency is not required,
    //     will fall back to the default currency on the device
    // - transactionType (required) - The function on the device to invoke (e.g. Card.Purchase, Card.Refund, etc.)
    //
    // Returns:
    // - a JS Promise with the outcome:
    //     - resolve(string) - the string will contain the polling url
    //     - reject(string) - the string will contain the error message
    // ======================================================
    const createTransaction = (amount: number, transactionType: string): Promise<string> => {
        // The first request will POST the transaction parameters to the endpoint, and obtain a
        // polling URL. The client will then continue polling (executing GET against that URL)
        // until the actual final outcome of the transaction is received.

        // This function will return that polling URL via the resolve function.

        return new Promise((resolve, reject) => {
            if (!amount) {
                reject("The amount has to be supplied");
                return;
            } else if (amount <= 0) {
                reject("The amount must be greater than 0");
                return;
            } else if (!transactionType) {
                reject("The transactionType has to be supplied");
                return;
                // Will not perform additional validation on TransactionType here, the server will reject it
                // in case it is invalid.
            }

            if (!posRegisterId) {
                reject("A posRegisterId has to be supplied.");
                return;
            }

            if (!posBusinessName) {
                reject("A posBusinessName has to be supplied.");
                return;
            }

            const transactionEndpoint = baseUrl + "/Transaction";

            // Some transaction types allow for additional fields (e.g. Card.PurchasePlusCash will require the
            // AmountCash value to be supplied as well), however for simplicity reasons those will be omitted here.
            // For the full API reference, see: http://www.smartpayinvestor.com/smartconnect-api-integration-guide/
            const params = new URLSearchParams();
            params.append("POSRegisterID", posRegisterId);
            params.append("POSBusinessName", posBusinessName);
            params.append("POSVendorName", posVendorName);
            params.append("TransactionMode", "ASYNC");
            params.append("TransactionType", transactionType);
            params.append("AmountTotal", String(amount));

            console.log("Sending transaction POST request to: " + transactionEndpoint);
            console.log("Transaction parameters: " + params.toString());

            // Note that a POST is required. Any other method will return with a 404 Not Found.
            axios
                .post(transactionEndpoint, params, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    },
                })
                .then((response) => {
                    try {
                        console.log(`Transaction POST response received (${response.status}) ${response.data.result}`);

                        // Trust, but verify
                        if (response.status == 200) {
                            // Extract the polling URL
                            let res = response.data;

                            if (res.data && res.data.PollingUrl) {
                                // return the polling URL
                                resolve(res.data.PollingUrl);
                                return;
                            } else {
                                // Something's not quite right here - not very likely to happen, but you never know...
                                reject("Returned 200 but Polling URL missing");
                                return;
                            }
                        } else {
                            // We don't really expect anything other than 200 in here, but you never know...
                            reject("Invalid status code received");
                            return;
                        }
                    } catch (error) {
                        // Catch code errors (parsing failure, etc.)
                        reject(error);
                    }
                })
                .catch((error) => {
                    // error function invoked when anything other than 2xx OK is received
                    console.log(`Transaction POST response received (${error.response.status}) ${error.response.data.result}`);

                    // Generally, if it's an "expected" error (e.g. no device is paired), a 4xx will be returned
                    // and a JSON description of the error provided (except for 404 Not Found). For example:
                    //
                    // { "error": "This register is not paired to a device, please pair it first." } (400 Bad Request)
                    // or
                    // { "error": "device is busy" } (429 Too Many Requests)
                    //
                    // We will only fall back to errorThrown if this is not present (i.e. if a 5xx server error happens instead).
                    // errorThrown will be a generic "Internal Server Error" etc. as per the status code.
                    let errorThrow = error.response.data && error.response.data.error ? error.response.data.error : "Internal Server Error";

                    // For the purpose of this example, we will treat all errors "equally" and just surface the error
                    // message back, however you may wish to at least differentiate between 4xx and 5xx errors in a
                    // production implementation (i.e. errors that have a message and can be caught versus call/server failure).
                    reject(errorThrow);
                });
        });
    };

    // =====================================================
    // POLL FOR THE FINAL OUTCOME OF THE TRANSACTION
    //
    // Parameters:
    // - pollingUrl (required) - URL obtained through the createTransaction() function
    // - delayed (optional) - the function to invoke if the transaction enters a "Delayed" state
    //     See the API reference for information on the Delayed state.
    //
    // Returns:
    // - a JS Promise with the outcome:
    //     - resolve(ESmartpayTransactionOutcome, responseData) - one of the outcomes to handle on the "interface" and
    //       the response data from the jqXHR object
    //     - reject(string) - the string will contain the error message
    // =====================================================
    const pollForOutcome = (pollingUrl: string, delayed: () => void): Promise<IEftposTransactionOutcome> => {
        // Polling interval on the PROD server will be rate limited to 2 seconds.

        // It's a bad idea to let the polling run indefinitely, so will set an overall timeout to
        // 10 minutes. Generally, no customer will wait for 10 minutes for an outcome, so ideally
        // in production code there would be a way to interrupt the polling and finish the transaction
        // manually (in case the device got completely bricked or something went wrong the API server).

        // Generally, if the device temporarily dies (temporary Internet outage, power loss, etc) - it will
        // upload the result to the API server the moment it comes back online.

        const interval = 2 * 1000; // 2 seconds
        const timeout = 10 * 60 * 1000; // 10 minutes

        const endTime = Number(new Date()) + timeout;

        let transactionType = "";
        let amount = "0";

        var checkCondition = async (resolve: any, reject: any) => {
            if (!pollingUrl) {
                reject("Polling URL needs to be submitted");
                addToLogs("Polling URL needs to be submitted");
                return;
            }

            addToLogs("Polling for outcome: " + pollingUrl);

            try {
                // Note that a GET is required. Any other method will return with a 404 Not Found.
                let response = await axios.get(pollingUrl, {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    },
                });

                // Gets called after *either* success or error are called
                try {
                    addToLogs(`Transaction GET response received (${response.status}) ${response.data.result}`);
                    addToLogs(`Transaction GET response received ${JSON.stringify(response)}`);

                    let transactionComplete = false;
                    let transactionOutcome: IEftposTransactionOutcome | null = null;

                    if (response.status == 200) {
                        let res = response.data;

                        if (res && res.data) {
                            let transactionStatus = res.transactionStatus;
                            let transactionResult = res.data.TransactionResult;
                            let result = res.data.Result;
                            transactionType = res.data.Function;
                            amount = res.data.AmountTotal;
                            let eftposCardType = res.data.CardType; //TODO Double check this field
                            let eftposSurcharge = res.data.AmountSurcharge;
                            let eftposTip = res.data.AmountTip; //TODO Double check this field

                            if (transactionStatus == "COMPLETED") {
                                // Transaction is concluded, no need to continue polling
                                transactionComplete = true;

                                // Determine the outcome of the transaction
                                if (transactionResult == "OK-ACCEPTED") {
                                    transactionOutcome = {
                                        platformTransactionOutcome: ESmartpayTransactionOutcome.Accepted,
                                        transactionOutcome: EEftposTransactionOutcome.Success,
                                        message: "Transaction Accepted!",
                                        eftposReceipt: null,
                                        eftposCardType: getCardType(eftposCardType),
                                        eftposSurcharge: parseInt(eftposSurcharge || "0"),
                                        eftposTip: parseInt(eftposTip || "0"),
                                    };
                                } else if (transactionResult == "OK-DECLINED") {
                                    transactionOutcome = {
                                        platformTransactionOutcome: ESmartpayTransactionOutcome.Declined,
                                        transactionOutcome: EEftposTransactionOutcome.Fail,
                                        message: "Transaction Declined! Please try again.",
                                        eftposReceipt: null,
                                    };
                                } else if (transactionResult == "CANCELLED" && result != "FAILED-INTERFACE") {
                                    transactionOutcome = {
                                        platformTransactionOutcome: ESmartpayTransactionOutcome.Cancelled,
                                        transactionOutcome: EEftposTransactionOutcome.Fail,
                                        message: "Transaction Cancelled!",
                                        eftposReceipt: null,
                                    };
                                } else if (transactionResult == "CANCELLED" && result == "FAILED-INTERFACE") {
                                    transactionOutcome = {
                                        platformTransactionOutcome: ESmartpayTransactionOutcome.DeviceOffline,
                                        transactionOutcome: EEftposTransactionOutcome.Fail,
                                        message: "Transaction Cancelled! Please check if the device is powered on and online.",
                                        eftposReceipt: null,
                                    };
                                } else {
                                    // Everything else is pretty-much a failed outcome
                                    transactionOutcome = {
                                        platformTransactionOutcome: ESmartpayTransactionOutcome.Failed,
                                        transactionOutcome: EEftposTransactionOutcome.Fail,
                                        message: "Unknown transaction result. Please try again later.",
                                        eftposReceipt: null,
                                    };
                                }
                            } else if (transactionStatus == "PENDING" && transactionResult == "OK-DELAYED" && delayed) {
                                // Transaction still not done, but server reporting it's taking longer than usual
                                // Invoke the delayed function - POS may choose to display a visual indication to the user
                                // (in case e.g. the device lost connectivity and is not able to upload the outcome)
                                // transactionOutcome = {
                                //     platformTransactionOutcome: ESmartpayTransactionOutcome.Delayed,
                                //     transactionOutcome: EEftposTransactionOutcome.ProcessMessage,
                                //     message: "Transaction delayed! Check if the device is powered on and online.",
                                //     eftposReceipt: null,
                                // };
                                delayed();

                                // Will still continue to poll...
                            }
                        } else {
                            // Something's not quite right here - not very likely to happen, but you never know...
                            reject("Returned 200 but data structure not as expected");
                            return;
                        }
                    } else {
                        // We do not expect the server to return a 4xx error for a "known" reason at this stage
                        // If the request has failed, it's most likely with something on the infrastructure level
                        // (e.g. Internet down on client or server offline/unreachable)

                        // We will silently ignore this and continue polling
                        addToLogs("Ignoring failed request...");
                    }

                    console.log(transactionComplete, transactionOutcome);

                    // Determine if we should continue with the recursion (polling) or not
                    if (transactionComplete && transactionOutcome != null) {
                        // All done!
                        // resolve(transactionOutcome, response.data.result);
                        resolve(transactionOutcome);
                        return;
                    } else if (Number(new Date()) < endTime) {
                        // If the condition isn't met but the timeout hasn't elapsed, go again
                        setTimeout(checkCondition, interval, resolve, reject);
                        return;
                    } else {
                        // Didn't match and too much time, reject!
                        reject("Polling timed out");
                        return;
                    }
                } catch (error) {
                    // Catch code errors (parsing failure, etc.)
                    reject(error);
                }
            } catch (error) {
                // Catch code errors (parsing failure, etc.)
                reject(error);
            } finally {
                await createEftposTransactionLog(restaurant ? restaurant.id : "", transactionType, parseInt(amount));
            }
        };

        return new Promise(checkCondition);
    };

    return (
        <SmartpayContext.Provider
            value={{
                sendPairingRequest: sendPairingRequest,
                createTransaction: createTransaction,
                pollForOutcome: pollForOutcome,
            }}
            children={props.children}
        />
    );
};

const useSmartpay = () => {
    const context = useContext(SmartpayContext);
    if (context === undefined) {
        throw new Error(`useSmartpay must be used within a SmartpayProvider`);
    }
    return context;
};

export { SmartpayProvider, useSmartpay };
