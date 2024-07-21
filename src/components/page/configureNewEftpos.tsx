import { useState } from "react";
import { Verifone } from "./configureNewEftpos/verifone";
import { SmartPay } from "./configureNewEftpos/smartpay";
import { Tyro } from "./configureNewEftpos/tyro";
import { MX51 } from "./configureNewEftpos/mx51";
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
    MX51,
}
export default () => {
    const [eftposProvider, setEftposProvider] = useState(EftposProvider.MX51);

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
                        className="mb-2"
                        selected={eftposProvider == EftposProvider.WINDCAVE}
                        onSelect={() => setEftposProvider(EftposProvider.WINDCAVE)}
                    >
                        Windcave
                    </Radio>

                    <Radio className="mb-2" selected={eftposProvider == EftposProvider.TYRO} onSelect={() => setEftposProvider(EftposProvider.TYRO)}>
                        Tyro
                    </Radio>

                    <Radio className="mb-6" selected={eftposProvider == EftposProvider.MX51} onSelect={() => setEftposProvider(EftposProvider.MX51)}>
                        MX51
                    </Radio>

                    {eftposProvider == EftposProvider.VERIFONE ? (
                        <Verifone />
                    ) : eftposProvider == EftposProvider.SMARTPAY ? (
                        <SmartPay />
                    ) : eftposProvider == EftposProvider.WINDCAVE ? (
                        <Windcave />
                    ) : eftposProvider == EftposProvider.TYRO ? (
                        <Tyro />
                    ) : eftposProvider == EftposProvider.MX51 ? (
                        <MX51 />
                    ) : (
                        <></>
                    )}
                </div>
            </PageWrapper>
        </>
    );
};
