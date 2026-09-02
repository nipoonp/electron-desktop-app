import { useEffect, useState } from "react";
import { useCart } from "../../context/cart-context";
import { useRestaurant } from "../../context/restaurant-context";
import { useGetPromotionLazyQuery } from "../../hooks/useGetPromotionLazyQuery";
import { CheckIfPromotionValidResponse, EOrderType } from "../../model/model";
import { Button } from "../../tabin/components/button";
import { Input } from "../../tabin/components/input";
import { ModalV2 } from "../../tabin/components/modalv2";
import { toast } from "../../tabin/components/toast";
import { convertCentsToDollars } from "../../util/util";
import { IGET_RESTAURANT_PROMOTION } from "../../graphql/customQueries";

interface IPromotionCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PromotionCodeModal = (props: IPromotionCodeModalProps) => {
    const { restaurant } = useRestaurant();
    const { setUserAppliedPromotions, orderType, total } = useCart();

    const [promotionCode, setPromotionCode] = useState("");
    const [error, setError] = useState("");

    const {
        getPromotionsByCode,
        data: getPromotionsByCodeData,
        error: getPromotionsByCodeError,
        loading: getPromotionsByCodeLoading,
    } = useGetPromotionLazyQuery();

    useEffect(() => {
        if (getPromotionsByCodeError) {
            setError("Could not apply discount code. Please try again later");
            return;
        }

        if (getPromotionsByCodeData) {
            console.log("Got getPromotionsByCodeData", getPromotionsByCodeData);

            if (getPromotionsByCodeData.length == 0) {
                setError("Invalid promo code applied");
                return;
            } else {
                const appliedPromotions: IGET_RESTAURANT_PROMOTION[] = getPromotionsByCodeData;
                const availablePromotions: IGET_RESTAURANT_PROMOTION[] = [];

                appliedPromotions.forEach((appliedPromotion) => {
                    let errorMessage = "";

                    if (appliedPromotion.totalAvailableUses !== null) {
                        if (appliedPromotion.totalNumberUsed >= appliedPromotion.totalAvailableUses) {
                            errorMessage = "This code has no more uses remaining. Please try another code";
                        }
                    }

                    if (!orderType || !appliedPromotion.availableOrderTypes) {
                        errorMessage = "Invalid order type";
                    }

                    if (orderType && !appliedPromotion.availableOrderTypes.includes(EOrderType[orderType])) {
                        errorMessage = `This code is not valid for ${orderType.toLowerCase()}. Please try another code`;
                    }

                    if (total < appliedPromotion.minSpend) {
                        errorMessage = `Minimum spend for this promotion is $${convertCentsToDollars(appliedPromotion.minSpend)}`;
                    }

                    if (availablePromotions.length === 0 && errorMessage) {
                        setError(errorMessage);
                    } else {
                        availablePromotions.push(appliedPromotion);
                    }
                });

                const status = setUserAppliedPromotions(availablePromotions); //Apply the first one if there are many with the same code.

                if (status == CheckIfPromotionValidResponse.UNAVAILABLE) {
                    setError("This code is currently unavailable. Please try again later");
                } else if (status == CheckIfPromotionValidResponse.EXPIRED) {
                    setError("This code is expired. Please try another code");
                } else if (status == CheckIfPromotionValidResponse.INVALID_PLATFORM) {
                    const platform = process.env.REACT_APP_PLATFORM;

                    if (platform) {
                        setError(`This code is not valid for ${platform.toLowerCase()}. Please try another code`);
                    } else {
                        setError(`This code is not valid for this platform. Please try another code`);
                    }
                } else {
                    toast.success("Your promotion has been applied!");
                    props.onClose();
                }
            }
        }
    }, [getPromotionsByCodeData, getPromotionsByCodeError]);

    const onApply = async () => {
        await getPromotionsByCode({
            variables: {
                code: promotionCode,
                promotionRestaurantId: restaurant ? restaurant.id : "",
            },
        });
    };

    const onChangePromotionCode = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError("");
        setPromotionCode(event.target.value.toUpperCase());
    };

    return (
        <>
            <ModalV2 padding="0" isOpen={props.isOpen} disableClose={false} onRequestClose={props.onClose}>
                <div className="promo-code-modal">
                    <div className="h3 mb-3">Please enter your promotion code</div>
                    <Input
                        className="mb-3"
                        type="text"
                        // label="Promo Code:"
                        name="promotionCode"
                        value={promotionCode}
                        placeholder="ABC123"
                        onChange={onChangePromotionCode}
                    />
                    {error && <div className="text-error mb-3">{error}</div>}
                    <Button onClick={onApply} loading={getPromotionsByCodeLoading}>
                        Apply
                    </Button>
                </div>
            </ModalV2>
        </>
    );
};
