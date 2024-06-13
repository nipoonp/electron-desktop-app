import { useState } from "react";

import { Input } from "../../../tabin/components/input";
import { FullScreenSpinner } from "../../../tabin/components/fullScreenSpinner";
import { useTyro } from "../../../context/tyro-context";
import { Button } from "../../../tabin/components/button";
import { IEftposTransactionOutcome } from "../../../model/model";
import { useRegister } from "../../../context/register-context";
import { useMutation } from "@apollo/client";
import { UPDATE_REGISTER_TYRO } from "../../../graphql/customMutations";

export const Tyro = () => {
    const { register } = useRegister();

    const [merchantId, setMerchantId] = useState(register?.tyroMerchantId || undefined);
    const [terminalId, setTerminalId] = useState(register?.tyroTerminalId || undefined);
    const [amount, setAmount] = useState(10208);

    const [pairingMessage, setPairingMessage] = useState("");
    const [displayTyroLogs, setDisplayTyroLogs] = useState(false);

    const [tansactionMessage, setTansactionMessage] = useState("");
    const [showSpinner, setShowSpinner] = useState(false);

    const { sendParingRequest, createTransaction, cancelTransaction } = useTyro();

    const [updateRegisterTyro, { data, loading, error }] = useMutation(UPDATE_REGISTER_TYRO, {
        update: (proxy, mutationResult) => {},
    });

    const doPairing = async () => {
        if (!register || !merchantId || !terminalId) return;

        try {
            setShowSpinner(true);
            const integrationKey = await sendParingRequest(merchantId, terminalId, (eftposMessage) => {
                setPairingMessage(eftposMessage);
            });

            console.log("Tyro Integration Key", integrationKey);

            await updateRegisterTyro({
                variables: {
                    id: register.id,
                    tyroMerchantId: merchantId,
                    tyroTerminalId: terminalId,
                },
            });

            // alert("Pairing complete! Your device should now show it is paired.");
        } catch (errorMessage) {
            console.error("Error! Message: " + errorMessage);
            setPairingMessage(errorMessage + " Please try again");
        } finally {
            setShowSpinner(false);
        }
    };

    const performEftposTransaction = async () => {
        if (!register || !merchantId || !terminalId) return;

        try {
            // setShowSpinner(true);
            const res: IEftposTransactionOutcome = await createTransaction(amount.toString(), terminalId, merchantId, (eftposMessage) => {
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

    const onChangeMerchantId = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        const numericValue = value ? parseInt(value) : undefined;

        if (numericValue && !isNaN(numericValue)) {
            setMerchantId(numericValue);
        } else {
            setMerchantId(undefined);
        }
    };

    const onChangeTerminalId = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        const numericValue = value ? parseInt(value) : undefined;

        if (numericValue && !isNaN(numericValue)) {
            setTerminalId(numericValue);
        } else {
            setTerminalId(undefined);
        }
    };

    return (
        <>
            <FullScreenSpinner show={showSpinner} text={pairingMessage} />
            <div>
                <div className="h3 mb-4">Pair to a device</div>

                <Input
                    className="mb-2"
                    type="number"
                    label="MerchantId"
                    name="merchantId"
                    value={merchantId ?? ""}
                    onChange={onChangeMerchantId}
                    placeholder="123456"
                />
                <Input
                    className="mb-4"
                    type="number"
                    label="TerminalId"
                    name="terminalId"
                    value={terminalId ?? ""}
                    onChange={onChangeTerminalId}
                    placeholder="123456"
                />
                <div className="mb-4">{pairingMessage && <div>{pairingMessage}</div>}</div>
                <Button className="mb-6" onClick={doPairing}>
                    Pair to Device
                </Button>

                <Button className="mb-6" onClick={() => setDisplayTyroLogs(!displayTyroLogs)}>
                    Display Tyro Logs
                </Button>

                {displayTyroLogs && (
                    <iframe
                        className="mb-4"
                        src="https://iclientsimulator.test.tyro.com/logs.html"
                        width="100%"
                        height="600px"
                        title="Tyro Client Simulator Logs"
                    />
                )}

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
                <div className="mb-4">{tansactionMessage && <div>{tansactionMessage}</div>}</div>
                <Button className="mb-1" onClick={performEftposTransaction}>
                    Send Transaction
                </Button>
                <Button onClick={cancelEftposTransaction}>Cancel Transaction</Button>
            </div>
        </>
    );
};
