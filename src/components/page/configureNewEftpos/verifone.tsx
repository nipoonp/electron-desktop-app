import { useState } from "react";
import { Input } from "../../../tabin/components/input";
import { FullScreenSpinner } from "../../../tabin/components/fullScreenSpinner";
import { useVerifone } from "../../../context/verifone-context";
import { Button } from "../../../tabin/components/button";
import { IEftposTransactionOutcome } from "../../../model/model";

export const Verifone = () => {
    const [showSpinner, setShowSpinner] = useState(false);
    const [ipAddress, setIPAddress] = useState("192.168.1.251");
    const [portNumber, setPortNumber] = useState("20001");
    const [amount, setAmount] = useState(1);

    const { createTransaction } = useVerifone();

    const performEftposTransaction = async () => {
        setShowSpinner(true);

        try {
            const res: IEftposTransactionOutcome = await createTransaction(amount, ipAddress, portNumber, "TEST-CONFIGURE");

            alert(res.message);
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
                <Button onClick={performEftposTransaction}>Send Transaction</Button>
            </div>
        </>
    );
};
