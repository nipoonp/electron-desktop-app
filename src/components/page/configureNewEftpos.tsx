import React, { useState } from "react";
import { RadioV2 } from "../../tabin/components/radiov2";
import { HomeNav } from "../nav/homeNav";
import { isMobile } from "react-device-detect";
import { Space2, Space4, Space6 } from "../../tabin/components/spaces";
import { Title3Font } from "../../tabin/components/fonts";
import { Verifone } from "./configureNewEftpos/verifone";
import { SmartPay } from "./configureNewEftpos/smartpay";
import { ReceiptPrinter } from "./configureNewEftpos/receiptPrinter";

enum EftposProvider {
  VERIFONE,
  SMARTPAY,
}
export const ConfigureNewEftpos = () => {
  const [eftposProvider, setEftposProvider] = useState(EftposProvider.VERIFONE);

  return (
    <>
      <HomeNav />

      <div
        style={{
          padding: "24px",
          maxWidth: "512px",
          margin: "0 auto",
        }}
      >
        <ReceiptPrinter />
        <Space4 />

        <Title3Font>Select your Eftpos provider</Title3Font>
        <Space4 />

        <RadioV2
          selected={eftposProvider == EftposProvider.VERIFONE}
          onSelect={() => setEftposProvider(EftposProvider.VERIFONE)}
        >
          Verifone
        </RadioV2>

        <Space2 />
        <RadioV2
          selected={eftposProvider == EftposProvider.SMARTPAY}
          onSelect={() => setEftposProvider(EftposProvider.SMARTPAY)}
        >
          Smart Pay
        </RadioV2>

        <Space6 />

        {eftposProvider == EftposProvider.VERIFONE ? (
          <Verifone />
        ) : eftposProvider == EftposProvider.SMARTPAY ? (
          <SmartPay />
        ) : (
          <></>
        )}
      </div>
    </>
  );
};
