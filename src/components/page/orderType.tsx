import React from "react";
import { Space, Space4 } from "../../tabin/components/spaces";
import { useHistory } from "react-router";
import { useUser } from "../../context/user-context";
import { beginOrderPath, checkoutPath, tableNumberPath } from "../main";
import {
  Title3Font,
  Title2Font,
  BoldFont,
  Title1Font,
} from "../../tabin/components/fonts";
import { EOrderType } from "../../model/model";
import { useCart } from "../../context/cart-context";
import { KioskPageWrapper } from "../../tabin/components/kioskPageWrapper";
import { useRegister } from "../../context/register-context";

const styles = require("./orderType.module.css");

export const OrderType = (props: {}) => {
  const history = useHistory();
  const { user } = useUser();
  const { restaurant, setOrderType, clearCart } = useCart();
  const {register} = useRegister();

  if (restaurant == null) {
    throw "Restaurant is invalid!";
  }

  if (!register) {
    throw "Register is not valid";
  }

  const onSelectOrderType = (orderType: EOrderType) => {
    setOrderType(orderType);

    if (register.enableTableFlags && orderType == EOrderType.DINEIN) {
      history.push(tableNumberPath);
    } else {
      history.push(checkoutPath);
    }
  };

  return (
    <>
      <KioskPageWrapper>
        <div className={styles.container}>
          <Title1Font>Are you staying or going?</Title1Font>
          <Space size={100} />
          <div className={styles.imagesWrapper}>
            <div onClick={() => onSelectOrderType(EOrderType.DINEIN)}>
              <img
                className={styles.dineinImage}
                src="https://tabin-public.s3-ap-southeast-2.amazonaws.com/images/order-type-dine-in.png"
              />
              <Space4 />
              <BoldFont>
                <Title2Font>Dine In</Title2Font>
              </BoldFont>
            </div>
            <div className={styles.sizedBox}></div>
            <div onClick={() => onSelectOrderType(EOrderType.TAKEAWAY)}>
              <img
                className={styles.takeawayImage}
                src="https://tabin-public.s3-ap-southeast-2.amazonaws.com/images/order-type-take-away.png"
              />
              <Space4 />
              <BoldFont>
                <Title2Font>Takeaway</Title2Font>
              </BoldFont>
            </div>
          </div>
        </div>
      </KioskPageWrapper>
    </>
  );
};
