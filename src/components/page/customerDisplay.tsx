import { useEffect, useRef } from "react";
import { OrderSummary } from "./checkout/orderSummary";
import { useCart } from "../../context/cart-context";
import { convertCentsToDollars } from "../../util/util";

import "./customerDisplay.scss";

export default () => {
    const { products, promotion, paidSoFar, surcharge, subTotal, staticDiscount, percentageDiscount, orderTypeSurcharge } = useCart();

    const orderSummaryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (orderSummaryRef.current) {
            orderSummaryRef.current.scrollTop = orderSummaryRef.current.scrollHeight;
        }
    }, [products]);

    const customerDisplayFooter = (
        <>
            {promotion ? (
                <div className="mb-1">
                    {`Discount${promotion.promotion.code ? ` (${promotion.promotion.code})` : ""}: -$${convertCentsToDollars(
                        promotion.discountedAmount
                    )}`}
                </div>
            ) : null}
            {surcharge ? <div className="mb-1">Surcharge: ${convertCentsToDollars(surcharge)}</div> : null}
            {paidSoFar > 0 ? <div className="mb-1">Paid So Far: ${convertCentsToDollars(paidSoFar)}</div> : null}
            {orderTypeSurcharge > 0 ? <div className="mb-1">Order Type Surcharge: ${convertCentsToDollars(orderTypeSurcharge)}</div> : null}
            {staticDiscount ? <div className="mb-1">Fixed Discount: ${convertCentsToDollars(staticDiscount)}</div> : null}
            {percentageDiscount ? <div className="mb-1">Percentage Discount: ${convertCentsToDollars(percentageDiscount)}</div> : null}
            <div className="h3 mb-2">Total: ${convertCentsToDollars(subTotal)}</div>
        </>
    );

    return (
        <div className="p-4">
            <div className="h1 mb-4">Your Order</div>
            <div className="customer-display-order-summary-wrapper" ref={orderSummaryRef}>
                <OrderSummary
                    products={products || []}
                    onEditProduct={() => {}}
                    onUpdateProductQuantity={() => {}}
                    onApplyProductDiscount={() => {}}
                />
            </div>
            <div className="customer-display-footer p-4">{customerDisplayFooter}</div>
        </div>
    );
};
