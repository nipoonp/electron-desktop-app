import { useEffect, useRef, useState } from "react";
import { useCart } from "../../context/cart-context";
import { useRestaurant } from "../../context/restaurant-context";
import { useGetPromotionLazyQuery } from "../../hooks/useGetPromotionLazyQuery";
import { CheckIfPromotionValidResponse, EOrderType } from "../../model/model";
import { Button } from "../../tabin/components/button";
import { Input } from "../../tabin/components/input";
import { ModalV2 } from "../../tabin/components/modalv2";
import { toast } from "../../tabin/components/toast";
import { convertCentsToDollars } from "../../util/util";
import { ELOYALTY_ACTION, IGET_RESTAURANT_LOYALTY_USER } from "../../graphql/customQueries";
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
    const {
        setUserAppliedPromotion,
        setUserAppliedLoyaltyId,
        orderType,
        total,
        customerInformation,
        customerLoyaltyPoints,
        setCustomerLoyaltyPoints,
    } = useCart();

    const [promotionCode, setPromotionCode] = useState("");
    const [error, setError] = useState("");

    const tempLoyaltyId = useRef<string | null>(null);

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
        console.log("xxx...", promoId);
        console.log("xxx...", restaurant?.promotions.items);

        if (restaurant) {
            const promotionCode = restaurant.promotions.items.find((item) => item.id === promoId)?.code;
            console.log("xxx...", promotionCode);

            if (!promotionCode) {
                toast.error("Error in applying reward");
                return;
            }

            //    setPromotionCode(code);

            const userPoints = await onSearchLoyaltyHistory();

            if (!userPoints || userPoints < points) {
                toast.error("You do not have enough points to redeem this reward.");
                return;
            }

            tempLoyaltyId.current = loyaltyId;
            await getPromotionsByCode({
                variables: {
                    code: promotionCode,
                    promotionRestaurantId: restaurant ? restaurant.id : "",
                },
            });
        }
    };

    const onSearchLoyaltyHistory = async () => {
        if (!restaurant) return 0;

        const loyaltyUsers =
            restaurant.loyaltyUsers?.items
                ?.map((link) => link?.loyaltyUser)
                .filter((user): user is IGET_RESTAURANT_LOYALTY_USER => Boolean(user)) || [];

        const sanitizeDigits = (value: string) => value.replace(/\D/g, "");

        let loyaltyUserRes: IGET_RESTAURANT_LOYALTY_USER | undefined;

        if (customerInformation?.phoneNumber) {
            const searchedDigits = sanitizeDigits(customerInformation.phoneNumber);
            if (searchedDigits.length > 0) {
                loyaltyUserRes = loyaltyUsers.find((user) => {
                    if (!user.phoneNumber) return false;
                    return sanitizeDigits(user.phoneNumber).includes(searchedDigits);
                });
            }
        }

        if (!loyaltyUserRes && customerInformation?.email) {
            const searchedEmail = customerInformation.email.toLowerCase();
            loyaltyUserRes = loyaltyUsers.find((user) => user.email?.toLowerCase().includes(searchedEmail));
        }

        let returnPoints = 0;
        if (loyaltyUserRes) {
            const histories = loyaltyUserRes.loyaltyHistories?.items || [];
            histories.forEach((history) => {
                if (history.action === ELOYALTY_ACTION.EARN) {
                    returnPoints += history.points;
                } else if (history.action === ELOYALTY_ACTION.REDEEM) {
                    returnPoints -= history.points;
                }
            });
        }

        setCustomerLoyaltyPoints(returnPoints);

        return returnPoints;
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
                            {`${customerInformation.firstName} has ${customerLoyaltyPoints} point${customerLoyaltyPoints !== 1 ? "s" : ""}`}
                            {restaurant &&
                                restaurant.loyalties &&
                                restaurant.loyalties.items.map((loyalty) => (
                                    <>
                                        {loyalty ? (
                                            loyalty.rewards.map((reward) => (
                                                <div key={reward.promotionId} className="reward-promotion mb-2">
                                                    <div className="reward-promotion-name">
                                                        {restaurant.promotions.items.find((item) => item.id === reward.promotionId)?.name}
                                                    </div>
                                                    <div>
                                                        {reward.points} point{reward.points !== 1 ? "s" : ""}
                                                    </div>
                                                    <Button
                                                        // disabled={loyaltyPoints < reward.points}
                                                        onClick={() => onApply(loyalty.id, reward.promotionId, reward.points)}
                                                    >
                                                        Apply
                                                    </Button>
                                                </div>
                                            ))
                                        ) : (
                                            <div>No rewards available.</div>
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
