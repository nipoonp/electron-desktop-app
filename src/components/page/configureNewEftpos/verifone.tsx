import React, { useState } from "react";
import { Input } from "../../../tabin/components/input";
import { FullScreenSpinner } from "../../../tabin/components/fullScreenSpinner";
import { useVerifone, VerifoneTransactionOutcome } from "../../../context/verifone-context";
import { Button } from "../../../tabin/components/button";

export const Verifone = () => {
    const [showSpinner, setShowSpinner] = useState(false);
    const [ipAddress, setIPAddress] = useState("192.168.1.251");
    const [portNumber, setPortNumber] = useState("20001");
    const [amount, setAmount] = useState(1);

    const { createTransaction } = useVerifone();

    const doTransaction = async () => {
        setShowSpinner(true);

        try {
            let { transactionOutcome } = await createTransaction(amount, ipAddress, portNumber, "TEST-CONFIGURE");

            // setAmount(0);

            if (transactionOutcome == VerifoneTransactionOutcome.Approved) {
                alert("Transaction Approved!");
            } else if (
                // Should not reach here if your operating an unattended service
                transactionOutcome == VerifoneTransactionOutcome.ApprovedWithSignature
            ) {
                alert("Transaction Approved With Signature!");
            } else if (transactionOutcome == VerifoneTransactionOutcome.Cancelled) {
                alert("Transaction Cancelled!");
            } else if (transactionOutcome == VerifoneTransactionOutcome.Declined) {
                alert("Transaction Declined!");
            } else if (transactionOutcome == VerifoneTransactionOutcome.SettledOk) {
                // Should not reach here unless your getting the settlement cutover. And this is a success code.
                alert("Transaction Settled Ok!");
            } else if (transactionOutcome == VerifoneTransactionOutcome.HostUnavailable) {
                alert("Transaction Host Unavailable!");
            } else if (transactionOutcome == VerifoneTransactionOutcome.SystemError) {
                alert("Transaction System Error!");
            } else if (transactionOutcome == VerifoneTransactionOutcome.TransactionInProgress) {
                // You should never come in this state
                // alert("Transaction Transaction In Progress!");
            } else if (transactionOutcome == VerifoneTransactionOutcome.TerminalBusy) {
                alert("Transaction Terminal Is Busy!");
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
                <Input
                    className="mb-2"
                    type="text"
                    label="Eftpos IP Address:"
                    name="ipAddress"
                    value={ipAddress}
                    placeholder="192.168.0.1"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setIPAddress(event.target.value)}
                />
                <Input
                    className="mb-2"
                    type="text"
                    label="Eftpos Port Number:"
                    name="portNumber"
                    value={portNumber}
                    placeholder="40001"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPortNumber(event.target.value)}
                />
                <Input
                    className="mb-4"
                    type="text"
                    label="Amount in cents ($1.99 = 199):"
                    name="amount"
                    value={amount}
                    placeholder="199"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setAmount(Number(event.target.value))}
                />
                <Button onClick={doTransaction}>Send Transaction</Button>
            </div>
        </>
    );
};
