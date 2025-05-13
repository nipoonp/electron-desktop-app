import { useEffect, useState } from "react";

import { Input } from "../../../tabin/components/input";
import { FullScreenSpinner } from "../../../tabin/components/fullScreenSpinner";
import { useMX51 } from "../../../context/mx51-context";
import { Button } from "../../../tabin/components/button";
import { EMX51PairingStatus, IEftposTransactionOutcome, IMX51GetPaymentProviders, IMX51PairingInput } from "../../../model/model";
import { useRegister } from "../../../context/register-context";
import { useMutation } from "@apollo/client";
import { UPDATE_REGISTER_TYRO } from "../../../graphql/customMutations";
import { Select } from "../../../tabin/components/select";
import { Checkbox } from "../../../tabin/components/checkbox";

export const MX51 = () => {
    const { register } = useRegister();

    const [paymnetProivderList, setPaymentProviderList] = useState<
        {
            code: string;
            name: string;
        }[]
    >([]);
    const [showSpinner, setShowSpinner] = useState(false);

    const {
        pairingStatus,
        setPairingStatus,
        pairingMessage,
        getPaymentProviders,
        sendPairingRequest,
        sendPairingCancelRequest,
        pairingInput,
        setPairingInput,
        sendUnpairRequest,
    } = useMX51();

    const doPairing = async () => {
        try {
            setShowSpinner(true);
            await sendPairingRequest({ ...pairingInput, posId: register ? register.id.replace(/-/g, "").substring(0, 16) : "" });

            // alert("Pairing complete! Your device should now show it is paired.");
        } catch (errorMessage) {
            console.error("Error! Message: " + errorMessage);
        } finally {
            setShowSpinner(false);
        }
    };

    const doPairingCancel = async () => {
        try {
            setShowSpinner(true);
            await sendPairingCancelRequest();

            // alert("Pairing complete! Your device should now show it is paired.");
        } catch (errorMessage) {
            console.error("Error! Message: " + errorMessage);
        } finally {
            setShowSpinner(false);
        }
    };

    const doUnpair = async () => {
        try {
            setShowSpinner(true);
            await sendUnpairRequest();

            // alert("Pairing complete! Your device should now show it is paired.");
        } catch (errorMessage) {
            console.error("Error! Message: " + errorMessage);
        } finally {
            setShowSpinner(false);
        }
    };

    const doPairingFailedOk = () => {
        setPairingStatus(EMX51PairingStatus.Unpaired);
    };

    const doPairingSucessfulOk = () => {
        setPairingStatus(EMX51PairingStatus.Paired);
    };

    const onSelectPaymentProvider = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setPairingInput({ ...pairingInput, tenantCode: event.target.value });
    };

    const onClickGetPaymentProviders = async () => {
        try {
            const paymentProviders: IMX51GetPaymentProviders = await getPaymentProviders();

            setPaymentProviderList(paymentProviders.paymnetProivderList);
            setPairingInput({ ...pairingInput, tenantCode: paymentProviders.paymentProvider });
        } catch (error) {
            console.error(error);
        }
    };

    const onChangePOSId = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPairingInput({ ...pairingInput, posId: event.target.value });
    };

    const onChangeEftposSerialNumber = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPairingInput({ ...pairingInput, serialNumber: event.target.value });
    };

    const onChangeEftposAddress = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPairingInput({ ...pairingInput, eftposAddress: event.target.value });
    };

    const onCheckTestMode = () => {
        setPairingInput({ ...pairingInput, testMode: true });
    };

    const onUnCheckTestMode = () => {
        setPairingInput({ ...pairingInput, testMode: false });
    };

    const onCheckAutoAddressResolution = () => {
        setPairingInput({ ...pairingInput, autoAddressResolution: true });
    };

    const onUnCheckAutoAddressResolution = () => {
        setPairingInput({ ...pairingInput, autoAddressResolution: false });
    };

    return (
        <>
            <FullScreenSpinner show={showSpinner} text={pairingMessage} />
            <div>
                <div className="h3 mb-4">Pair to a device</div>

                {pairingStatus === EMX51PairingStatus.Unpaired ||
                pairingStatus === EMX51PairingStatus.PairedAndDisconnected ||
                pairingStatus === EMX51PairingStatus.Paired ? (
                    <div>
                        <Select label="Payment Provider" name="paymentProvider" value={pairingInput.tenantCode} onChange={onSelectPaymentProvider}>
                            <option value="" label="Select or get payment providers"></option>
                            {paymnetProivderList.map((provider) => (
                                <option key={`${provider.name}-${provider.code}`} value={provider.code} label={provider.name}></option>
                            ))}
                        </Select>
                        <Button className="mt-2 mb-2" onClick={onClickGetPaymentProviders}>
                            Get Payment Providers
                        </Button>
                        <Input
                            className="mb-2"
                            label="POS ID"
                            name="posId"
                            value={pairingInput.posId ?? ""}
                            onChange={onChangePOSId}
                            placeholder="123456789"
                        />
                        <Input
                            className="mb-2"
                            label="Eftpos Serial Number"
                            name="eftposSerialNumber"
                            value={pairingInput.serialNumber ?? ""}
                            onChange={onChangeEftposSerialNumber}
                            placeholder="123-456-789"
                        />
                        <Input
                            className="mb-2"
                            label="Eftpos Address"
                            name="eftposAddress"
                            value={pairingInput.eftposAddress ?? ""}
                            onChange={onChangeEftposAddress}
                            placeholder="192.168.0.1"
                        />
                        <Checkbox className="mb-2" onCheck={onCheckTestMode} onUnCheck={onUnCheckTestMode} checked={pairingInput.testMode}>
                            Test mode
                        </Checkbox>
                        <Checkbox
                            className="mb-2"
                            onCheck={onCheckAutoAddressResolution}
                            onUnCheck={onUnCheckAutoAddressResolution}
                            checked={pairingInput.autoAddressResolution}
                        >
                            Auto address mode
                        </Checkbox>
                        <div className="mb-4">{pairingStatus && <div>{pairingStatus}</div>}</div>
                        <div className="mb-4">{pairingMessage && <div>{pairingMessage}</div>}</div>
                        {pairingStatus === EMX51PairingStatus.Unpaired ? (
                            <Button className="mb-6" onClick={doPairing}>
                                Pair to Device
                            </Button>
                        ) : pairingStatus === EMX51PairingStatus.PairedAndDisconnected ? (
                            <Button className="mb-6" onClick={doUnpair}>
                                Unpair
                            </Button>
                        ) : pairingStatus === EMX51PairingStatus.Paired ? (
                            <Button className="mb-6" onClick={doUnpair}>
                                Unpair
                            </Button>
                        ) : (
                            <></>
                        )}
                    </div>
                ) : pairingStatus === EMX51PairingStatus.PairingProgress ? (
                    <>
                        <div className="mb-4">{pairingStatus && <div>{pairingStatus}</div>}</div>
                        <div className="mb-4">{pairingMessage && <div>{pairingMessage}</div>}</div>
                        <Button className="mb-6" onClick={doPairingCancel}>
                            Cancel
                        </Button>
                    </>
                ) : pairingStatus === EMX51PairingStatus.PairingConfirmation ? (
                    <>
                        <div className="mb-4">{pairingStatus && <div>{pairingStatus}</div>}</div>
                        <div className="mb-4">{pairingMessage && <div>{pairingMessage}</div>}</div>
                    </>
                ) : pairingStatus === EMX51PairingStatus.PairingFailed ? (
                    <>
                        <div className="mb-4">{pairingStatus && <div>{pairingStatus}</div>}</div>
                        <div className="mb-4">{pairingMessage && <div>{pairingMessage}</div>}</div>
                        <Button className="mb-6" onClick={doPairingFailedOk}>
                            Ok
                        </Button>
                    </>
                ) : pairingStatus === EMX51PairingStatus.PairingSuccessful ? (
                    <>
                        <div className="mb-4">{pairingStatus && <div>{pairingStatus}</div>}</div>
                        <div className="mb-4">{pairingMessage && <div>{pairingMessage}</div>}</div>
                        <Button className="mb-6" onClick={doPairingSucessfulOk}>
                            Ok
                        </Button>
                    </>
                ) : (
                    <></>
                )}
            </div>
        </>
    );
};
