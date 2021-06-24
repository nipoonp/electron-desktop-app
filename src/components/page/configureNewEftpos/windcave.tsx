import { useState } from "react";

import { Input } from "../../../tabin/components/input";
import { FullScreenSpinner } from "../../../tabin/components/fullScreenSpinner";
import { Button } from "../../../tabin/components/button";
import { useWindcave, WindcaveTransactionOutcome, WindcaveTransactionOutcomeResult } from "../../../context/windcave-context";

export const Windcave = () => {
    const [stationId, setStationId] = useState("3801585856");
    const [amount, setAmount] = useState(199);

    const [showSpinner, setShowSpinner] = useState(false);
    const { createTransaction, pollForOutcome } = useWindcave();

    const doTransaction = async () => {
        setShowSpinner(true);

        try {
            const txnRef = await createTransaction(stationId, amount, "Purchase");

            let transactionOutcome: WindcaveTransactionOutcomeResult = await pollForOutcome(stationId, txnRef);

            setAmount(199);

            if (transactionOutcome.transactionOutcome == WindcaveTransactionOutcome.Accepted) {
                alert("Transaction Accepted!\n\n" + transactionOutcome.eftposReceipt);
            } else if (transactionOutcome.transactionOutcome == WindcaveTransactionOutcome.Declined) {
                alert("Transaction Declined!\n\n" + transactionOutcome.eftposReceipt);
            } else if (transactionOutcome.transactionOutcome == WindcaveTransactionOutcome.Cancelled) {
                alert("Transaction Cancelled!");
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
                <div className="h3 mb-4">Send a Transaction</div>
                <label htmlFor="stationId"></label>
                <Input
                    className="mb-4"
                    type="number"
                    label="StationId"
                    name="stationId"
                    value={stationId}
                    placeholder="3801585856"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setStationId(event.target.value)}
                />

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

                <Button onClick={doTransaction} disabled={showSpinner}>
                    Send Transaction
                </Button>
            </div>
        </>
    );
};
