import { useEffect, useRef, useState } from "react";
import { useCart } from "../../context/cart-context";
import { useRestaurant } from "../../context/restaurant-context";
import { useGetPromotionLazyQuery } from "../../hooks/useGetPromotionLazyQuery";
import { useGetPromotionByIdLazyQuery } from "../../hooks/useGetPromotionByIdLazyQuery";
import { CheckIfPromotionValidResponse, EOrderType } from "../../model/model";
import { Button } from "../../tabin/components/button";
import { ModalV2 } from "../../tabin/components/modalv2";
import { toast } from "../../tabin/components/toast";
import { convertCentsToDollars } from "../../util/util";

import "./rewardsModal.scss";
interface IRewardsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RewardsModal = (props: IRewardsModalProps) => {
    const { restaurant } = useRestaurant();
    const { setUserAppliedPromotions, setUserAppliedLoyaltyId, orderType, total, customerLoyaltyPoints } = useCart();

    const [error, setError] = useState("");
    const tempLoyaltyId = useRef<string | null>(null);

    const {
        getPromotionsByCode,
        data: getPromotionsByCodeData,
        error: getPromotionsByCodeError,
        loading: getPromotionsByCodeLoading,
    } = useGetPromotionLazyQuery();

    const { getPromotionById, promotionsById } = useGetPromotionByIdLazyQuery();

    // Fetch loyalty reward promotions only when modal opens
    useEffect(() => {
        if (!restaurant?.loyalties?.items?.length) return;

        const promotionIds = Array.from(
            new Set(restaurant.loyalties.items.flatMap((loyalty) => loyalty.rewards.map((reward) => reward.promotionId))),
        );

        promotionIds.forEach((id) => getPromotionById({ variables: { id } }));
    }, []);

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
                const appliedPromotion = getPromotionsByCodeData[0];

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

                const status = setUserAppliedPromotions([appliedPromotion]);

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
                    setUserAppliedLoyaltyId(tempLoyaltyId.current);
                    toast.success("Your promotion has been applied!");
                    props.onClose();
                }
            }
        }
    }, [getPromotionsByCodeData, getPromotionsByCodeError]);

    const onModalClose = () => {
        props.onClose();
    };

    const onApply = async (loyaltyId: string, promoId: string, points: number) => {
        if (!restaurant) return;

        if (!customerLoyaltyPoints || customerLoyaltyPoints < points) {
            toast.error("You do not have enough points to redeem this reward.");
            return;
        }

        const promotion = promotionsById[promoId];

        if (!promotion?.code) {
            toast.error("Error in applying reward");
            return;
        }

        tempLoyaltyId.current = loyaltyId;
        await getPromotionsByCode({
            variables: {
                code: promotion.code,
                promotionRestaurantId: restaurant.id,
            },
        });
    };

    return (
        <>
            <ModalV2 isOpen={props.isOpen} width="90%" padding="24px" disableClose={false} onRequestClose={onModalClose}>
                <div>
                    <div className="h2 mb-2">Please select your reward</div>
                    {restaurant &&
                        restaurant.loyalties &&
                        restaurant.loyalties.items.map((loyalty) => (
                            <>
                                {loyalty && loyalty.rewards.length > 0 ? (
                                    loyalty.rewards.map((reward) => (
                                        <div key={reward.promotionId} className="reward-promotion mb-2">
                                            <div className="h3 reward-promotion-name">{promotionsById[reward.promotionId]?.name}</div>
                                            <div>
                                                {reward.points} point{reward.points !== 1 ? "s" : ""}
                                            </div>
                                            <Button
                                                disabled={
                                                    !promotionsById[reward.promotionId] ||
                                                    (customerLoyaltyPoints ? customerLoyaltyPoints < reward.points : false)
                                                }
                                                onClick={() => onApply(loyalty.id, reward.promotionId, reward.points)}
                                            >
                                                Apply
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div>No rewards available</div>
                                )}
                            </>
                        ))}
                </div>
            </ModalV2>
        </>
    );
};
