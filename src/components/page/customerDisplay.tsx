import { useEffect, useRef, useState } from "react";
import { OrderSummary } from "./checkout/orderSummary";
import { convertCentsToDollars } from "../../util/util";
import { ICartPromotion } from "../../model/model";
import "./customerDisplay.scss";

let electron: any;
let ipcRenderer: any;
try {
    electron = window.require("electron");
    ipcRenderer = electron.ipcRenderer;
} catch (e) {}

export default () => {
    const [products, setProducts] = useState([]);
    const [promotion, setPromotion] = useState<ICartPromotion | null>(null);
    const [surcharge, setSurcharge] = useState(0);
    const [subTotal, setSubTotal] = useState(0);
    const [staticDiscount, setStaticDiscount] = useState(0);
    const [percentageDiscount, setPercentageDiscount] = useState(0);
    const [orderTypeSurcharge, setOrderTypeSurcharge] = useState(0);

    const orderSummaryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        ipcRenderer &&
            ipcRenderer.on("RECEIVE_CUSTOMER_DISPLAY_DATA", (_, data) => {
                console.log("Recevied Data", data);

                const cartData = JSON.parse(data);

                setProducts(cartData.products);
                setPromotion(cartData.promotion);
                setSurcharge(cartData.surcharge);
                setSubTotal(cartData.subTotal);
                setStaticDiscount(cartData.staticDiscount);
                setPercentageDiscount(cartData.percentageDiscount);
                setOrderTypeSurcharge(cartData.orderTypeSurcharge);
            });

        return () => {
            ipcRenderer.removeAllListeners("RECEIVE_CUSTOMER_DISPLAY_DATA");
        };
    }, []);

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
            {/* {paidSoFar > 0 ? <div className="mb-1">Paid So Far: ${convertCentsToDollars(paidSoFar)}</div> : null} */}
            {orderTypeSurcharge > 0 ? <div className="mb-1">Order Type Surcharge: ${convertCentsToDollars(orderTypeSurcharge)}</div> : null}
            {staticDiscount ? <div className="mb-1">Fixed Discount: ${convertCentsToDollars(staticDiscount)}</div> : null}
            {percentageDiscount ? <div className="mb-1">Percentage Discount: ${convertCentsToDollars(percentageDiscount)}</div> : null}
            <div className="h2 mb-2">Total: ${convertCentsToDollars(subTotal)}</div>
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
            <div className="customer-display-footer p-4">
                {customerDisplayFooter}
                <div className="powered-by-tabin-wrapper">
                    <div className="powered-by-tabin">Powered by tabin.co.nz</div>
                </div>
            </div>
        </div>
    );
};
