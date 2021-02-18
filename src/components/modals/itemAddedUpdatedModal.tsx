import React, { useEffect } from "react";
import { Title2Font, NormalFont } from "../../tabin/components/fonts";
import { Space3 } from "../../tabin/components/spaces";
import { useCart } from "../../context/cart-context";
import { convertCentsToDollars } from "../../util/moneyConversion";
import { KioskModal } from "../../tabin/components/kioskModal";

export const ItemAddedUpdatedModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  isProductUpdate: boolean;
}) => {
  const { total } = useCart();

  useEffect(() => {
    setTimeout(() => {
      props.onClose();
    }, 1500);
  }, []);

  const onModalClose = () => {
    props.onClose();
  };

  const content = (
    <>
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <img
          style={{ height: "200px" }}
          src="https://tabin-public.s3-ap-southeast-2.amazonaws.com/images/shopping-bag-success-icon.jpg"
        />
        <Space3 />
        <Title2Font>
          Item {props.isProductUpdate ? "Updated" : "Added"}
        </Title2Font>
        <Space3 />
        <NormalFont>Your total has been updated</NormalFont>
        <Space3 />
        <Title2Font>${convertCentsToDollars(total)}</Title2Font>
      </div>
    </>
  );

  return (
    <>
      <KioskModal isOpen={props.isOpen} onRequestClose={onModalClose}>
        <div
          style={{
            padding: "0 78px 78px 78px",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {content}
        </div>
      </KioskModal>
    </>
  );
};
