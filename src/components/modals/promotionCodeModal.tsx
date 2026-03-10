import { useEffect, useRef, useState } from "react";
import { useCart } from "../../context/cart-context";
import { useRestaurant } from "../../context/restaurant-context";
import { useGetPromotionLazyQuery } from "../../hooks/useGetPromotionLazyQuery";
import { useGetPromotionByIdLazyQuery } from "../../hooks/useGetPromotionByIdLazyQuery";
import { CheckIfPromotionValidResponse, EOrderType } from "../../model/model";
import { Button } from "../../tabin/components/button";
import { Input } from "../../tabin/components/input";
import { ModalV2 } from "../../tabin/components/modalv2";
import { toast } from "../../tabin/components/toast";
import { checkIfPromotionValid, convertCentsToDollars } from "../../util/util";
import { useUser } from "../../context/user-context";
import "./promotionCodeModal.scss";

interface IPromotionCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface IUserLoyalty {
    [key: string]: {
        restaurantName: string;
        points: number;
    };
}

export const PromotionCodeModal = (props: IPromotionCodeModalProps) => {
    const { restaurant } = useRestaurant();
    const { setUserAppliedPromotion, setUserAppliedLoyaltyId, orderType, total, customerInformation, customerLoyaltyPoints } = useCart();

    const [promotionCode, setPromotionCode] = useState("");
    const [error, setError] = useState("");

    const tempLoyaltyId = useRef<string | null>(null);

    const { getPromotionById, promotionsById: loyaltyPromotionsById } = useGetPromotionByIdLazyQuery();

    useEffect(() => {
        if (!props.isOpen || !restaurant?.loyalties?.items?.length) return;
        if (!customerInformation?.firstName || !customerInformation?.email || !customerInformation?.phoneNumber) return;

        const promotionIds = Array.from(
            new Set(restaurant.loyalties.items.flatMap((loyalty) => loyalty.rewards.map((reward) => reward.promotionId))),
        );

        promotionIds.forEach((id) => getPromotionById({ variables: { id } }));
    }, [props.isOpen, customerInformation]);

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
                const appliedPromotion = getPromotionsByCodeData[0];

                if (appliedPromotion.totalAvailableUses !== null) {
                    if (appliedPromotion.totalNumberUsed >= appliedPromotion.totalAvailableUses) {
                        setError("This code has no more uses remaining. Please try another code");
                        return;
                    }
                }

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
                    if (tempLoyaltyId.current) setUserAppliedLoyaltyId(tempLoyaltyId.current);

                    toast.success("Your promotion has been applied!");
                    props.onClose();
                }
            }
        }
    }, [getPromotionsByCodeData, getPromotionsByCodeError]);

    const onApplyPromo = async () => {
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

    const onApply = async (loyaltyId: string, promoId: string, points: number) => {
        if (!customerLoyaltyPoints || customerLoyaltyPoints < points) {
            toast.error("You do not have enough points to redeem this reward.");
            return;
        }

        const promotion = loyaltyPromotionsById[promoId];
        console.log("onApply promotion:", promotion, "promoId:", promoId, "loyaltyPromotionsById:", loyaltyPromotionsById);
        if (!promotion?.code || !restaurant) {
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
            <ModalV2 padding="24px" isOpen={props.isOpen} disableClose={false} onRequestClose={props.onClose}>
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
                    <Button onClick={onApplyPromo} loading={getPromotionsByCodeLoading}>
                        Apply
                    </Button>
                </div>

                {customerInformation && customerInformation.firstName && customerInformation.email && customerInformation.phoneNumber && (
                    <>
                        <div className="separator-4"></div>
                        <div className="mt-3">
                            <div className="h3 mb-2">Please select your reward</div>
                            <div className="mb-2">{`${customerInformation.firstName} has ${customerLoyaltyPoints} point${customerLoyaltyPoints !== 1 ? "s" : ""}`}</div>
                            {restaurant &&
                                restaurant.loyalties &&
                                restaurant.loyalties.items.map((loyalty) => (
                                    <>
                                        {loyalty && loyalty.rewards.length > 0 ? (
                                            loyalty.rewards.map((reward) => (
                                                <div key={reward.promotionId} className="reward-promotion mb-2">
                                                    <div className="h3 reward-promotion-name">{loyaltyPromotionsById[reward.promotionId]?.name}</div>
                                                    <div>
                                                        {reward.points} point{reward.points !== 1 ? "s" : ""}
                                                    </div>
                                                    <Button
                                                        disabled={
                                                            !loyaltyPromotionsById[reward.promotionId] ||
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
                    </>
                )}
            </ModalV2>
        </>
    );
};
