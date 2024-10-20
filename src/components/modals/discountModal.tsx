import { useEffect, useState } from "react";
import { useCart } from "../../context/cart-context";
import { useRestaurant } from "../../context/restaurant-context";
import { useGetPromotionLazyQuery } from "../../hooks/useGetPromotionLazyQuery";
import { CheckIfPromotionValidResponse, EOrderType } from "../../model/model";
import { Button } from "../../tabin/components/button";
import { Input } from "../../tabin/components/input";
import { ModalV2 } from "../../tabin/components/modalv2";
import { toast } from "../../tabin/components/toast";
import { convertCentsToDollars, convertDollarsToCents, convertDollarsToCentsReturnInt } from "../../util/util";
import { FaDollarSign, FaPercentage } from "react-icons/fa";

import "./discountModal.scss";

interface IPromotionCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DiscountModal = (props: IPromotionCodeModalProps) => {
    const { staticDiscount, setStaticDiscount, percentageDiscount, setPercentageDiscount, total } = useCart();

    const [type, setType] = useState<"static" | "percentage">(staticDiscount ? "static" : percentageDiscount ? "percentage" : "static");
    const [value, setValue] = useState<string>(
        staticDiscount ? convertCentsToDollars(staticDiscount) : percentageDiscount ? ((percentageDiscount * 100) / total).toString() : ""
    );
    const [error, setError] = useState("");

    const onApply = () => {
        const floatValue = parseFloat(value);

        if (type === "static") {
            setStaticDiscount(convertDollarsToCentsReturnInt(floatValue));
        } else if (type === "percentage") {
            if (floatValue > 100) {
                setPercentageDiscount(total);
            } else if (floatValue < 0) {
                setPercentageDiscount(0);
            } else {
                const calculatedDiscount = total * (floatValue / 100);

                setPercentageDiscount(calculatedDiscount);
            }
        }

        props.onClose();
    };

    const onChangeDiscount = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError("");
        setValue(event.target.value);
    };

    return (
        <>
            <ModalV2 padding="24px" isOpen={props.isOpen} disableClose={false} onRequestClose={props.onClose}>
                <div className="discount-modal">
                    <div className="h3 mb-3">Please enter your discount amount</div>
                    <div className="discount-field-wrapper mb-3">
                        <Input
                            type="number"
                            // label="Promo Code:"
                            name="discount"
                            value={value}
                            placeholder="123"
                            onChange={onChangeDiscount}
                        />
                        <div className={`discount-field-type ${type === "static" ? "selected" : ""}`} onClick={() => setType("static")}>
                            <FaDollarSign size="24px" />
                        </div>
                        <div className={`discount-field-type ${type === "percentage" ? "selected" : ""}`} onClick={() => setType("percentage")}>
                            <FaPercentage size="24px" />
                        </div>
                    </div>
                    {error && <div className="text-error mb-3">{error}</div>}
                    <Button onClick={onApply}>Apply</Button>
                </div>
            </ModalV2>
        </>
    );
};
