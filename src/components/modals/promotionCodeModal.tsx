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

import "./promotionCodeModal.scss";

interface IPromotionCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PromotionCodeModal = (props: IPromotionCodeModalProps) => {
    const { restaurant } = useRestaurant();
    const { setUserAppliedPromotion, orderType, total } = useCart();

    const [promotionCode, setPromotionCode] = useState("");
    const [error, setError] = useState("");

    const {
        getPromotionByCode,
        data: getPromotionByCodeData,
        error: getPromotionByCodeError,
        loading: getPromotionByCodeLoading,
    } = useGetPromotionLazyQuery();

    useEffect(() => {
        if (getPromotionByCodeError) {
            setError("Could not apply discount code. Please try again later");
            return;
        }

        if (getPromotionByCodeData) {
            console.log("Got getPromotionByCodeData", getPromotionByCodeData);

            if (getPromotionByCodeData.length == 0) {
                setError("Invalid promo code applied");
                return;
            } else {
                const appliedPromotion = getPromotionByCodeData[0];

                if (!orderType || !appliedPromotion.availableOrderTypes) {
                    setError("Invalid order type");
                    return;
                }

                if (!appliedPromotion.availableOrderTypes.includes(EOrderType[orderType])) {
                    setError(`This code is not valid for ${orderType.toLowerCase()}. Please try another code`);
                    return;
                }

                if (total < appliedPromotion.minSpend) {
                    setError(`Minimum spend for this promotion is $${convertCentsToDollars(appliedPromotion.minSpend)}`);
                    return;
                }

                const status = setUserAppliedPromotion(appliedPromotion); //Apply the first one if there are many with the same code.

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
    }, [getPromotionByCodeData, getPromotionByCodeError]);

    const onModalClose = () => {
        props.onClose();
    };

    const onApply = () => {
        getPromotionByCode({
            variables: {
                code: promotionCode,
                promotionRestaurantId: restaurant ? restaurant.id : "",
            },
        });
    };

    const onChangePromotionCode = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError("");
        setPromotionCode(event.target.value);
    };

    return (
        <>
            <ModalV2 isOpen={props.isOpen} disableClose={true} onRequestClose={onModalClose}>
                <div>
                    <div className="h3 mb-3">Please enter your promotion code</div>
                    <Input
                        className="mb-2"
                        type="text"
                        // label="Promo Code:"
                        name="promotionCode"
                        value={promotionCode}
                        placeholder="ABC123"
                        onChange={onChangePromotionCode}
                    />
                    {error && <div className="text-error mb-2">{error}</div>}
                    <Button onClick={onApply} loading={getPromotionByCodeLoading}>
                        Apply
                    </Button>
                </div>
            </ModalV2>
        </>
    );
};
