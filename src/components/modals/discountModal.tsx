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

interface IPromotionCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DiscountModal = (props: IPromotionCodeModalProps) => {
    const { restaurant } = useRestaurant();
    const { staticDiscount, setStaticDiscount } = useCart();

    const [value, setValue] = useState<string>(staticDiscount ? convertCentsToDollars(staticDiscount) : "");
    const [error, setError] = useState("");

    const onApply = () => {
        console.log("xxx...", value);
        setStaticDiscount(convertDollarsToCentsReturnInt(parseFloat(value)));
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
                    <Input
                        className="mb-3"
                        type="number"
                        // label="Promo Code:"
                        name="discount"
                        value={value}
                        placeholder="123"
                        onChange={onChangeDiscount}
                    />
                    {error && <div className="text-error mb-3">{error}</div>}
                    <Button onClick={onApply}>Apply</Button>
                </div>
            </ModalV2>
        </>
    );
};
