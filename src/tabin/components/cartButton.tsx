import React from "react";
import { useCart } from "../../context/cart-context";
import { CartIcon } from "./cartIcon";
import { useSmallScreen } from "../../hooks/useWindowSize";
import { ReceiptIcon } from "./receipt";

export const CartButton = (props: { onClick?: () => void }) => {
  // context
  const { isSmallScreen } = useSmallScreen();
  const { products } = useCart();

  // constant
  const cartLength =
    (products &&
      products.reduce((sum, p) => {
        return sum + p.quantity;
      }, 0)) ||
    0;

  return (
    <>
      {cartLength > 0 && (
        <>
          <div style={{ position: "fixed", top: "40px", right: "0px" }}>
            <div
              onClick={props.onClick}
              style={{
                display: "flex",
                alignItems: "center",
                position: "relative",
                padding: "18px 24px",
                margin: "36px",
                backgroundColor: "var(--primary-color)",
                color: "#ffffff",
                // background: "var(--primary-color)",
                borderRadius: "50px",
                boxShadow:
                  "rgba(0, 0, 0, 0.1) 0px 0px 8px, rgba(0, 0, 0, 0.04) 0px 4px 4px",
                zIndex: 2,
                marginBottom: isSmallScreen ? "80px" : "36px",
                marginRight: isSmallScreen ? "24px" : "36px",
              }}
            >
              <div style={{ color: "#ffffff" }}>
                <ReceiptIcon height={"20px"} />
              </div>
              <div style={{ paddingLeft: "16px" }}>
                Order {cartLength} {cartLength > 1 ? "items" : "item"}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
