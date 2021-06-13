import React, { useState } from "react";
import { Verifone } from "./configureNewEftpos/verifone";
import { SmartPay } from "./configureNewEftpos/smartpay";
import { ReceiptPrinter } from "./configureNewEftpos/receiptPrinter";
import { KioskRadio } from "../../tabin/components/kioskRadio";

import "./configureNewEftpos.scss";

enum EftposProvider {
    VERIFONE,
    SMARTPAY,
}
export const ConfigureNewEftpos = () => {
    const [eftposProvider, setEftposProvider] = useState(EftposProvider.VERIFONE);

    return (
        <>
            <div className="configure-new-eftpos">
                <ReceiptPrinter />

                <div className="h2 mb-4 mt-4">Select your Eftpos provider</div>

                <KioskRadio
                    className="mb-2"
                    selected={eftposProvider == EftposProvider.VERIFONE}
                    onSelect={() => setEftposProvider(EftposProvider.VERIFONE)}
                >
                    Verifone
                </KioskRadio>

                <KioskRadio
                    className="mb-6"
                    selected={eftposProvider == EftposProvider.SMARTPAY}
                    onSelect={() => setEftposProvider(EftposProvider.SMARTPAY)}
                >
                    Smart Pay
                </KioskRadio>

                {eftposProvider == EftposProvider.VERIFONE ? <Verifone /> : eftposProvider == EftposProvider.SMARTPAY ? <SmartPay /> : <></>}
            </div>
        </>
    );
};
