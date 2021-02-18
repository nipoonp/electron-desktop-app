import React, { useState, useEffect } from "react";
import { ButtonV2 } from "../../../tabin/components/buttonv2";
import { SelectV2 } from "../../../tabin/components/selectv2";
import { InputV2 } from "../../../tabin/components/inputv2";
import {
    Space4,
    Space2,
    Space,
    Space6,
} from "../../../tabin/components/spaces";
import { isMobile } from "react-device-detect";
import { HomeNav } from "../../nav/homeNav";
import { FullScreenSpinner } from "../../../tabin/components/fullScreenSpinner";
import { Title3Font } from "../../../tabin/components/fonts";
import {
    SmartpayTransactionOutcome,
    useSmartpay,
} from "../../../context/smartpay-context";

export const SmartPay = () => {
    const [pairingCode, setPairingCode] = useState("");
    const [amount, setAmount] = useState(0);
    const [transactionType, setTransactionType] = useState("Card.Purchase");
    const [showSpinner, setShowSpinner] = useState(false);
    const {
        sendParingRequest,
        createTransaction,
        pollForOutcome,
    } = useSmartpay();

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
                alert(
                    "Transaction delayed! Check if the device is powered on and online."
                );
            }
        };

        try {
            let pollingUrl = await createTransaction(amount, transactionType);

            let transactionOutcome: SmartpayTransactionOutcome = await pollForOutcome(
                pollingUrl,
                delayed
            );

            setAmount(0);

            if (transactionOutcome == SmartpayTransactionOutcome.Accepted) {
                alert("Transaction Accepted!");
            } else if (transactionOutcome == SmartpayTransactionOutcome.Declined) {
                alert("Transaction Declined!");
            } else if (transactionOutcome == SmartpayTransactionOutcome.Cancelled) {
                alert("Transaction Cancelled!");
            } else if (
                transactionOutcome == SmartpayTransactionOutcome.DeviceOffline
            ) {
                alert(
                    "Transaction Cancelled! Please check if the device is powered on and online."
                );
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
                <Title3Font>Pair to a device</Title3Font>
                <Space4 />

                <label htmlFor="pairing-code">Pairing Code:</label>
                <Space2 />
                <InputV2
                    type="text"
                    name="pairing-code"
                    value={pairingCode}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setPairingCode(event.target.value)
                    }
                    placeholder="123456"
                />
                <Space4 />
                <ButtonV2 onClick={doPairing}>Pair to Device</ButtonV2>

                <Space6 />

                <Title3Font>Send a Transaction</Title3Font>
                <Space4 />
                <label htmlFor="amount">Amount in cents ($1.99 = 199):</label>
                <Space2 />
                <InputV2
                    type="number"
                    name="amount"
                    value={amount}
                    placeholder="199"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setAmount(Number(event.target.value))
                    }
                />
                <Space4 />

                <label htmlFor="transaction-type">Transaction Type:</label>
                <Space2 />

                <SelectV2
                    name="transaction-type"
                    value={transactionType}
                    onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                        setTransactionType(event.target.value)
                    }
                >
                    <option value="Card.Purchase">Card.Purchase</option>
                    <option value="Card.Refund">Card.Refund</option>
                    <option value="QR.Merchant.Purchase">QR.Merchant.Purchase</option>
                    <option value="QR.Refund">QR.Refund</option>
                </SelectV2>
                <Space4 />

                <ButtonV2 onClick={doTransaction} disabled={showSpinner}>
                    Send Transaction
        </ButtonV2>
            </div>
        </>
    );
};