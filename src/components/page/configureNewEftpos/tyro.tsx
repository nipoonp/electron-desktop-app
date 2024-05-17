import { useState } from "react";

import { Input } from "../../../tabin/components/input";
import { FullScreenSpinner } from "../../../tabin/components/fullScreenSpinner";
import { useTyro } from "../../../context/tyro-context";
import { Button } from "../../../tabin/components/button";
import { IEftposTransactionOutcome } from "../../../model/model";
import { useRegister } from "../../../context/register-context";
import { useMutation } from "@apollo/client";
import { UPDATE_REGISTER_TYRO_INTEGRATION_KEY } from "../../../graphql/customMutations";

export const Tyro = () => {
    const { register } = useRegister();

    const [merchantId, setMerchantId] = useState("1");
    const [terminalId, setTerminalId] = useState("123");
    const [amount, setAmount] = useState(10208);

    const [pairingMessage, setPairingMessage] = useState("");
    const [tansactionMessage, setTansactionMessage] = useState("");
    const [showSpinner, setShowSpinner] = useState(false);

    const { sendParingRequest, createTransaction, cancelTransaction } = useTyro();

    const [updateRegisterTyroIntegrationKey, { data, loading, error }] = useMutation(UPDATE_REGISTER_TYRO_INTEGRATION_KEY, {
        update: (proxy, mutationResult) => {},
    });

    const doPairing = async () => {
        if (!register) return;

        try {
            setShowSpinner(true);
            const integrationKey = await sendParingRequest(merchantId, terminalId, (eftposMessage) => {
                setPairingMessage(eftposMessage);
            });

            console.log("Tyro Integration Key", integrationKey);

            await updateRegisterTyroIntegrationKey({
                variables: {
                    id: register.id,
                    tyroIntegrationKey: integrationKey,
                },
            });

            alert("Pairing complete! Your device should now show it is paired.");
        } catch (errorMessage) {
            alert("Error! Message: " + errorMessage);
        } finally {
            setShowSpinner(false);
        }
    };

    const performEftposTransaction = async () => {
        if (!register) return;

        try {
            // setShowSpinner(true);
            const res: IEftposTransactionOutcome = await createTransaction(amount.toString(), register.tyroIntegrationKey, (eftposMessage) => {
                setTansactionMessage(eftposMessage);
            });

            console.log("xxx...res", res);
            alert(res.message);
        } catch (errorMessage) {
            alert("Error! Message: " + errorMessage);
        } finally {
            // setShowSpinner(false);
        }
    };

    const cancelEftposTransaction = () => {
        try {
            cancelTransaction();
        } catch (errorMessage) {
            alert("Error! Message: " + errorMessage);
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
                <div className="mb-4">{pairingMessage && <div>Pairing Message: {pairingMessage}</div>}</div>
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
                <div className="mb-4">{tansactionMessage && <div>Transaction Message: {tansactionMessage}</div>}</div>
                <Button className="mb-1" onClick={performEftposTransaction}>
                    Send Transaction
                </Button>
                <Button onClick={cancelEftposTransaction}>Cancel Transaction</Button>
            </div>
        </>
    );
};
