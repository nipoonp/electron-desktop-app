import { useState } from "react";

import { Input } from "../../../tabin/components/input";
import { FullScreenSpinner } from "../../../tabin/components/fullScreenSpinner";
import { useTyro } from "../../../context/tyro-context";
import { Button } from "../../../tabin/components/button";
import { IEftposTransactionOutcome } from "../../../model/model";

export const Tyro = () => {
    const [merchantId, setMerchantId] = useState("1");
    const [terminalId, setTerminalId] = useState("123");
    const [amount, setAmount] = useState(10208);
    const [showSpinner, setShowSpinner] = useState(false);
    const [status, setStatus] = useState("");
    const [message, setMessage] = useState("");
    const [integrationKey, setIntegrationKey] = useState(false);

    const [purchaseStatus, setPurchaseStatus] = useState("");
    const [purchaseError, setPurchaseError] = useState("");
    const [transactionId, setTransactionId] = useState("");

    const { sendParingRequest, createTransaction } = useTyro();

    const doPairing = async () => {
        try {
            setMessage("Pairing in progress... Please perform the Authorize POS function on the terminal.");

            const integrationKey = await sendParingRequest(merchantId, terminalId, (customerMessage) => {
                setMessage(customerMessage);
            });

            alert("Pairing complete! Your device should now show it is paired.");
        } catch (errorMessage) {
            alert("Error! Message: " + errorMessage);
        }
    };

    const cancel = () => {
        try {
            iclient.cancelCurrentTransaction();
        } catch (err) {
            console.log(err.message);
        }
    };

    const performEftposTransaction = async () => {
        setShowSpinner(true);

        let delayedShown = false;

        let delayed = () => {
            if (!delayedShown) {
                // Don't show it more than once per request...
                delayedShown = true;

                // Might want to let the user know to check if everything is ok with the device
                alert("Transaction delayed! Check if the device is powered on and online.");
            }
        };

        try {
            // let pollingUrl = await createTransaction(amount, transactionType);

            // const res: IEftposTransactionOutcome = await pollForOutcome(pollingUrl, delayed);

            const requestParams = {
                amount: "10208", //The purchase amount (amount to charge the customer) in cents.
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
        } catch (errorMessage) {
            alert("Error! Message: " + errorMessage);
        } finally {
            setShowSpinner(false);
        }
    };

    return (
        <>
            <FullScreenSpinner show={showSpinner} />
            <div>
                <div className="h3 mb-4">Pair to a device</div>

                <Input
                    className="mb-2"
                    type="text"
                    label="MerchantId"
                    name="merchantId"
                    value={merchantId}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setMerchantId(event.target.value)}
                    placeholder="123456"
                />
                <Input
                    className="mb-4"
                    type="text"
                    label="TerminalId"
                    name="terminalId"
                    value={terminalId}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTerminalId(event.target.value)}
                    placeholder="123456"
                />
                <div className="mb-4">
                    {status && <div>Status: {status}</div>}
                    {message && <div>Message: {message}</div>}
                    {integrationKey && <div>IntegrationKey: {integrationKey}</div>}
                </div>
                <Button className="mb-6" onClick={doPairing}>
                    Pair to Device
                </Button>

                <div className="h3 mb-4">Send a Transaction</div>

                <Input
                    className="mb-4"
                    type="number"
                    label="Amount in cents ($1.99 = 199):"
                    name="amount"
                    value={amount}
                    placeholder="199"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setAmount(Number(event.target.value))}
                />
                <div className="mb-4">
                    {purchaseStatus && <div>Purchase Status: {purchaseStatus}</div>}
                    {purchaseError && <div>Purchase Error: {purchaseError}</div>}
                    {transactionId && <div>Transaction ID: {transactionId}</div>}
                </div>
                <Button onClick={performEftposTransaction} disabled={showSpinner}>
                    Send Transaction
                </Button>
            </div>
        </>
    );
};
