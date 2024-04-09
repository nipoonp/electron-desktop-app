import { useState } from "react";
import { Verifone } from "./configureNewEftpos/verifone";
import { SmartPay } from "./configureNewEftpos/smartpay";
import { Tyro } from "./configureNewEftpos/tyro";
import { ReceiptPrinter } from "./configureNewEftpos/receiptPrinter";
import { Radio } from "../../tabin/components/radio";

import "./configureNewEftpos.scss";
import { Windcave } from "./configureNewEftpos/windcave";
import { PageWrapper } from "../../tabin/components/pageWrapper";

enum EftposProvider {
    SMARTPAY,
    VERIFONE,
    WINDCAVE,
    TYRO,
}
export default () => {
    const [eftposProvider, setEftposProvider] = useState(EftposProvider.WINDCAVE);

    return (
        <>
            <PageWrapper>
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

                    <Radio className="mb-2" selected={eftposProvider == EftposProvider.TYRO} onSelect={() => setEftposProvider(EftposProvider.TYRO)}>
                        Tyro
                    </Radio>

                    {eftposProvider == EftposProvider.VERIFONE ? (
                        <Verifone />
                    ) : eftposProvider == EftposProvider.SMARTPAY ? (
                        <SmartPay />
                    ) : eftposProvider == EftposProvider.WINDCAVE ? (
                        <Windcave />
                    ) : eftposProvider == EftposProvider.TYRO ? (
                        <Tyro />
                    ) : (
                        <></>
                    )}
                </div>
            </PageWrapper>
        </>
    );
};
