import React from "react";
import { Space, Space2 } from "../../tabin/components/spaces";
import { useHistory } from "react-router";
import { beginOrderPath, checkoutPath } from "../main";
import { Title2Font, Title3Font } from "../../tabin/components/fonts";
import { useCart } from "../../context/cart-context";
import { KioskPageWrapper } from "../../tabin/components/kioskPageWrapper";
import { KeyboardInput } from "../../tabin/components/keyboardInput";
import { Button } from "../../tabin/components/button";

export const TableNumber = () => {
  const history = useHistory();
  const { restaurant, clearCart, tableNumber, setTableNumber } = useCart();

  if (restaurant == null) {
    throw "Restaurant is invalid!";
  }

  const onNext = () => {
    history.push(checkoutPath);
  };

  const onChangeKeyboard = (text: string) => {
    setTableNumber(text);
  };

  return (
    <>
      <KioskPageWrapper>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            marginTop: "152px",
          }}
        >
          <Title2Font>
            Enter the table number you wish to dine on (click next if you are
            unsure)
          </Title2Font>
          <Space size={100} />
          <div style={{ width: "300px" }}>
            <Title3Font>Table Number</Title3Font>
            <Space2 />
            <KeyboardInput
              showOnlyNumeric={true}
              onChangeKeyboard={onChangeKeyboard}
              value={tableNumber ?? ""}
            />
          </div>
          <Space size={100} />
          <Button onClick={onNext}>Next</Button>
        </div>
      </KioskPageWrapper>
    </>
  );
};
