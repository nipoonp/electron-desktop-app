import React, { useState } from "react";
import { ButtonV2 } from "../../../tabin/components/buttonv2";
import { Title3Font } from "../../../tabin/components/fonts";
import { Space4, Space2 } from "../../../tabin/components/spaces";
import { InputV2 } from "../../../tabin/components/inputv2";
import { FullScreenSpinner } from "../../../tabin/components/fullScreenSpinner";
import {
    useVerifone,
    VerifoneTransactionOutcome,
} from "../../../context/verifone-context";

export const Verifone = () => {
    const [showSpinner, setShowSpinner] = useState(false);
    const [ipAddress, setIPAddress] = useState("");
    const [portNumber, setPortNumber] = useState("");
    const [amount, setAmount] = useState(0);

    const { createTransaction } = useVerifone();

    const doTransaction = async () => {
        setShowSpinner(true);

        try {
            let { transactionOutcome } = await createTransaction(
                amount,
                ipAddress,
                portNumber,
                "TEST-CONFIGURE"
            );

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
            } else if (
                transactionOutcome == VerifoneTransactionOutcome.HostUnavailable
            ) {
                alert("Transaction Host Unavailable!");
            } else if (transactionOutcome == VerifoneTransactionOutcome.SystemError) {
                alert("Transaction System Error!");
            } else if (
                transactionOutcome == VerifoneTransactionOutcome.TransactionInProgress
            ) {
                // You should never come in this state
                // alert("Transaction Transaction In Progress!");
            } else if (
                transactionOutcome == VerifoneTransactionOutcome.TerminalBusy
            ) {
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
                <Title3Font>Send a Transaction</Title3Font>
                <Space4 />
                <label>Eftpos IP Address:</label>
                <Space2 />
                <InputV2
                    type="text"
                    name="ipAddress"
                    value={ipAddress}
                    placeholder="192.168.0.1"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setIPAddress(event.target.value)
                    }
                />
                <Space4 />
                <label>Eftpos Port Number:</label>
                <Space2 />
                <InputV2
                    type="text"
                    name="portNumber"
                    value={portNumber}
                    placeholder="40001"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setPortNumber(event.target.value)
                    }
                />
                <Space4 />
                <label htmlFor="amount">Amount in cents ($1.99 = 199):</label>
                <Space2 />
                <InputV2
                    type="text"
                    name="amount"
                    value={amount}
                    placeholder="199"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setAmount(Number(event.target.value))
                    }
                />
                <Space4 />
                <ButtonV2 onClick={doTransaction}>Send Transaction</ButtonV2>
            </div>
        </>
    );
};