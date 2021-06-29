import { useState } from "react";

import { Input } from "../../../tabin/components/input";
import { FullScreenSpinner } from "../../../tabin/components/fullScreenSpinner";
import { Button } from "../../../tabin/components/button";
import { useWindcave, WindcaveTransactionOutcome, WindcaveTransactionOutcomeResult } from "../../../context/windcave-context";

export const Windcave = () => {
    const [action, setAction] = useState("doScrHIT");
    const [user, setUser] = useState("TabinHIT_Dev");
    const [key, setKey] = useState("6b06b931c1942fa4222903055c9ac749c77fa4b86471d91b2909da74a69d928c");
    const [stationId, setStationId] = useState("3801585856");
    const [amount, setAmount] = useState(199);

    const [showSpinner, setShowSpinner] = useState(false);
    const { createTransaction, pollForOutcome } = useWindcave();

    const doTransaction = async () => {
        setShowSpinner(true);

        try {
            const txnRef = await createTransaction(stationId, amount, "Purchase", action, user, key);

            let transactionOutcome: WindcaveTransactionOutcomeResult = await pollForOutcome(stationId, txnRef, action, user, key);

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

                <label htmlFor="action"></label>
                <Input
                    className="mb-4"
                    label="Action"
                    name="action"
                    value={action}
                    placeholder="doScrHIT"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setAction(event.target.value)}
                />

                <label htmlFor="user"></label>
                <Input
                    className="mb-4"
                    label="user"
                    name="user"
                    value={user}
                    placeholder="TabinHIT_Dev"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setUser(event.target.value)}
                />

                <label htmlFor="key"></label>
                <Input
                    className="mb-4"
                    label="key"
                    name="key"
                    value={key}
                    placeholder="6b06b931c1942fa4222903055c9ac749c77fa4b86471d91b2909da74a69d928c"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setKey(event.target.value)}
                />

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
