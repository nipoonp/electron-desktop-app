import { useState } from "react";

import { Input } from "../../../tabin/components/input";
import { FullScreenSpinner } from "../../../tabin/components/fullScreenSpinner";
import { useMX51 } from "../../../context/mx51-context";
import { Button } from "../../../tabin/components/button";
import { IEftposTransactionOutcome } from "../../../model/model";
import { useRegister } from "../../../context/register-context";
import { useMutation } from "@apollo/client";
import { UPDATE_REGISTER_TYRO } from "../../../graphql/customMutations";
import { Select } from "../../../tabin/components/select";

export const MX51 = () => {
    const { register } = useRegister();

    const [paymnetProivderList, setPaymentProviderList] = useState<string[]>([]);
    const [paymentProvider, setPaymentProvider] = useState("");
    const [posId, setPosId] = useState(register?.id);
    const [eftposSerialNumber, setEftposSerialNumber] = useState("123-456-789");
    const [ipAddress, setIPAdress] = useState("192.168.0.1");

    const [pairingMessage, setPairingMessage] = useState("");

    const [showSpinner, setShowSpinner] = useState(false);

    const { getPaymentProviders, sendParingRequest } = useMX51();

    const [updateRegisterMX51, { data, loading, error }] = useMutation(UPDATE_REGISTER_TYRO, {
        update: (proxy, mutationResult) => {},
    });

    const doPairing = async () => {
        if (!register || !eftposSerialNumber || !ipAddress) return;

        try {
            setShowSpinner(true);
            // const integrationKey = await sendParingRequest(eftposSerialNumber, ipAddress, (eftposMessage) => {
            //     setPairingMessage(eftposMessage);
            // });

            // console.log("MX51 Integration Key", integrationKey);

            // await updateRegisterMX51({
            //     variables: {
            //         id: register.id,
            //         mx51EftposSerialNumber: eftposSerialNumber,
            //         mx51IPAddress: ipAddress,
            //     },
            // });

            // alert("Pairing complete! Your device should now show it is paired.");
        } catch (errorMessage) {
            console.error("Error! Message: " + errorMessage);
            setPairingMessage(errorMessage + " Please try again");
        } finally {
            setShowSpinner(false);
        }
    };

    const onSelectPaymentProvider = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setPaymentProvider(event.target.value);
    };

    const onClickGetPaymentProviders = async () => {
        try {
            await getPaymentProviders();
        } catch (error) {
            console.error(error);
        }
    };

    const onChangeEftposSerialNumber = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEftposSerialNumber(event.target.value);
    };

    const onChangeIPAddress = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIPAdress(event.target.value);
    };

    return (
        <>
            <FullScreenSpinner show={showSpinner} text={pairingMessage} />
            <div>
                <div className="h3 mb-4">Pair to a device</div>

                <Select label="Payment Provider" name="paymentProvider" value={paymentProvider} onChange={onSelectPaymentProvider}>
                    <option value="" label="Select or get payment providers"></option>
                </Select>
                <Button className="mt-2 mb-2" onClick={onClickGetPaymentProviders}>
                    Get Payment Providers
                </Button>
                <div className="mb-2">POS Id</div>
                <div className="mb-2">{posId}</div>
                <Input
                    className="mb-2"
                    type="number"
                    label="Eftpos Serial Number"
                    name="eftposSerialNumber"
                    value={eftposSerialNumber ?? ""}
                    onChange={onChangeEftposSerialNumber}
                    placeholder="123-456-789"
                />
                <Input
                    className="mb-4"
                    type="number"
                    label="IP Address"
                    name="ipAddress"
                    value={ipAddress ?? ""}
                    onChange={onChangeIPAddress}
                    placeholder="192.168.0.1"
                />
                <div className="mb-4">{pairingMessage && <div>{pairingMessage}</div>}</div>
                <Button className="mb-6" onClick={doPairing}>
                    Pair to Device
                </Button>
            </div>
        </>
    );
};
