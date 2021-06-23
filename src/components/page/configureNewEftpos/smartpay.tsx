import { useState } from "react";

import { Input } from "../../../tabin/components/input";
import { FullScreenSpinner } from "../../../tabin/components/fullScreenSpinner";
import { SmartpayTransactionOutcome, useSmartpay } from "../../../context/smartpay-context";
import { Button } from "../../../tabin/components/button";
import { Select } from "../../../tabin/components/select";

export const SmartPay = () => {
    const [pairingCode, setPairingCode] = useState("");
    const [amount, setAmount] = useState(0);
    const [transactionType, setTransactionType] = useState("Card.Purchase");
    const [showSpinner, setShowSpinner] = useState(false);
    const { sendParingRequest, createTransaction, pollForOutcome } = useSmartpay();

    const doPairing = async () => {
        try {
            setShowSpinner(true);
            await sendParingRequest(pairingCode);
            setPairingCode("");
            alert("Pairing complete! Your device should now show it is paired.");
        } catch (errorMessage) {
            alert("Error! Message: " + errorMessage);
        } finally {
            setShowSpinner(false);
        }
    };

    const doTransaction = async () => {
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
            let pollingUrl = await createTransaction(amount, transactionType);

            let transactionOutcome: SmartpayTransactionOutcome = await pollForOutcome(pollingUrl, delayed);

            setAmount(0);

            if (transactionOutcome == SmartpayTransactionOutcome.Accepted) {
                alert("Transaction Accepted!");
            } else if (transactionOutcome == SmartpayTransactionOutcome.Declined) {
                alert("Transaction Declined!");
            } else if (transactionOutcome == SmartpayTransactionOutcome.Cancelled) {
                alert("Transaction Cancelled!");
            } else if (transactionOutcome == SmartpayTransactionOutcome.DeviceOffline) {
                alert("Transaction Cancelled! Please check if the device is powered on and online.");
            } else {
                alert("Transaction Failed!");
            }
        } catch (errorMessage) {
            alert("Error! Message: " + errorMessage);
        } finally {
            // Enable button back (always executed)
            setShowSpinner(false);
        }
    };

    return (
        <>
            <FullScreenSpinner show={showSpinner} />
            <div>
                <div className="h3 mb-4">Pair to a device</div>

                <label htmlFor="pairing-code"></label>
                <Input
                    className="mb-4"
                    type="text"
                    label="Pairing Code:"
                    name="pairing-code"
                    value={pairingCode}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPairingCode(event.target.value)}
                    placeholder="123456"
                />
                <Button className="mb-6" onClick={doPairing}>
                    Pair to Device
                </Button>

                <div className="h3 mb-4">Send a Transaction</div>
                <label htmlFor="amount"></label>
                <Input
                    className="mb-4"
                    type="number"
                    label="Amount in cents ($1.99 = 199):"
                    name="amount"
                    value={amount}
                    placeholder="199"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setAmount(Number(event.target.value))}
                />

                <Select
                    className="mb-4"
                    label="Transaction Type:"
                    name="transaction-type"
                    value={transactionType}
                    onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setTransactionType(event.target.value)}
                >
                    <option value="Card.Purchase">Card.Purchase</option>
                    <option value="Card.Refund">Card.Refund</option>
                    <option value="QR.Merchant.Purchase">QR.Merchant.Purchase</option>
                    <option value="QR.Refund">QR.Refund</option>
                </Select>

                <Button onClick={doTransaction} disabled={showSpinner}>
                    Send Transaction
                </Button>
            </div>
        </>
    );
};
