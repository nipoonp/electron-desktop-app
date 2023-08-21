import { useState } from "react";

import { Input } from "../../../tabin/components/input";
import { FullScreenSpinner } from "../../../tabin/components/fullScreenSpinner";
import { Button } from "../../../tabin/components/button";
import { useWindcave } from "../../../context/windcave-context";
import { IEftposTransactionOutcome } from "../../../model/model";

export const Windcave = () => {
    const [action, setAction] = useState("doScrHIT");
    const [user, setUser] = useState("TabinHIT_Dev");
    const [key, setKey] = useState("6b06b931c1942fa4222903055c9ac749c77fa4b86471d91b2909da74a69d928c");
    const [stationId, setStationId] = useState("3801585856");
    const [amount, setAmount] = useState(199);

    const [showSpinner, setShowSpinner] = useState(false);
    const { createTransaction } = useWindcave();

    const performEftposTransaction = async () => {
        setShowSpinner(true);

        try {
            const res: IEftposTransactionOutcome = await createTransaction(stationId, user, key, amount, "Purchase", action);

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

                <Button onClick={performEftposTransaction} disabled={showSpinner}>
                    Send Transaction
                </Button>
            </div>
        </>
    );
};
