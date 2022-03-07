import { useState } from "react";
import { Verifone } from "./configureNewEftpos/verifone";
import { SmartPay } from "./configureNewEftpos/smartpay";
import { ReceiptPrinter } from "./configureNewEftpos/receiptPrinter";
import { Radio } from "../../tabin/components/radio";

import "./configureNewEftpos.scss";
import { Windcave } from "./configureNewEftpos/windcave";

enum EftposProvider {
    VERIFONE,
    SMARTPAY,
    WINDCAVE,
}
export default () => {
    const [eftposProvider, setEftposProvider] = useState(EftposProvider.WINDCAVE);

    return (
        <>
            <div className="configure-new-eftpos">
                <ReceiptPrinter />

                <div className="h2 mb-4 mt-4">Select your Eftpos provider</div>

                <Radio
                    className="mb-2"
                    selected={eftposProvider == EftposProvider.VERIFONE}
                    onSelect={() => setEftposProvider(EftposProvider.VERIFONE)}
                >
                    Verifone
                </Radio>

                <Radio
                    className="mb-2"
                    selected={eftposProvider == EftposProvider.SMARTPAY}
                    onSelect={() => setEftposProvider(EftposProvider.SMARTPAY)}
                >
                    Smart Pay
                </Radio>

                <Radio
                    className="mb-6"
                    selected={eftposProvider == EftposProvider.WINDCAVE}
                    onSelect={() => setEftposProvider(EftposProvider.WINDCAVE)}
                >
                    Windcave
                </Radio>

                {eftposProvider == EftposProvider.VERIFONE ? (
                    <Verifone />
                ) : eftposProvider == EftposProvider.SMARTPAY ? (
                    <SmartPay />
                ) : eftposProvider == EftposProvider.WINDCAVE ? (
                    <Windcave />
                ) : (
                    <></>
                )}
            </div>
        </>
    );
};
