import { useEffect, useState } from "react";
import { useCart } from "../../context/cart-context";
import { useRestaurant } from "../../context/restaurant-context";
import { useApolloClient } from "@apollo/client";
import { useGetPromotionByIdLazyQuery } from "../../hooks/useGetPromotionByIdLazyQuery";
import { CheckIfPromotionValidResponse, EOrderType } from "../../model/model";
import { Button } from "../../tabin/components/button";
import { Input } from "../../tabin/components/input";
import { ModalV2 } from "../../tabin/components/modalv2";
import { toast } from "../../tabin/components/toast";
import { convertCentsToDollars } from "../../util/util";
import { GET_FAVOURITE_PROMOTIONS, GET_PROMOTION_BY_CODE, GET_PROMOTION_BY_ID, IGET_RESTAURANT_PROMOTION } from "../../graphql/customQueries";
import "./promotionCodeModal.scss";

interface IPromotionCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type IFavouritePromotion = Pick<IGET_RESTAURANT_PROMOTION, "id" | "name" | "code">;

export const PromotionCodeModal = (props: IPromotionCodeModalProps) => {
    const { restaurant } = useRestaurant();
    const { promotion: appliedPromotion, setUserAppliedPromotion, setUserAppliedLoyaltyId, orderType, total, customerInformation, customerLoyaltyPoints } = useCart();

    const [promotionCode, setPromotionCode] = useState("");
    const [error, setError] = useState("");

    const client = useApolloClient();
    const [applying, setApplying] = useState(false);
    const [favourites, setFavourites] = useState<IFavouritePromotion[]>([]);
    const [loadingFavourites, setLoadingFavourites] = useState(false);
    const [favouritesError, setFavouritesError] = useState("");

    useEffect(() => {
        if (!props.isOpen || !restaurant?.id) return;
        let cancelled = false;
        setError("");
        setFavourites([]);
        setFavouritesError("");
        setLoadingFavourites(true);
        const load = async () => {
            try {
                const items: IFavouritePromotion[] = [];
                let nextToken: string | null = null;
                do {
                    const result = await client.query({
                        query: GET_FAVOURITE_PROMOTIONS,
                        variables: { restaurantId: restaurant.id, nextToken },
                        fetchPolicy: "network-only",
                    });
                    const connection = result.data?.getRestaurant?.promotions;
                    items.push(...(connection?.items ?? []).filter(Boolean));
                    nextToken = connection?.nextToken ?? null;
                } while (nextToken && !cancelled);
                if (!cancelled) setFavourites(items.sort((a, b) => a.name.localeCompare(b.name)));
            } catch (error) {
                if (!cancelled) setFavouritesError("Could not load favourite promotions. You can still enter a code below.");
            } finally {
                if (!cancelled) setLoadingFavourites(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [client, props.isOpen, restaurant?.id]);

    const { getPromotionById, promotionsById: loyaltyPromotionsById } = useGetPromotionByIdLazyQuery();

    useEffect(() => {
        if (!props.isOpen || !restaurant?.loyalties?.items?.length) return;
        if (!customerInformation?.firstName || !customerInformation?.email || !customerInformation?.phoneNumber) return;

        const promotionIds = Array.from(new Set(restaurant.loyalties.items.flatMap((loyalty) => (loyalty.rewards || []).map((reward) => reward.promotionId))));

        promotionIds.forEach((id) => getPromotionById({ variables: { id } }));
    }, [props.isOpen, customerInformation]);

    const onApplyPromo = async (id?: string, loyaltyId?: string) => {
        if (applying || !restaurant) return;
        setError("");
        setApplying(true);
        try {
            const result = await client.query({
                query: id ? GET_PROMOTION_BY_ID : GET_PROMOTION_BY_CODE,
                variables: id ? { id } : { code: promotionCode, promotionRestaurantId: restaurant.id },
                fetchPolicy: "network-only",
            });
            const appliedPromotion: IGET_RESTAURANT_PROMOTION = id ? result.data?.getPromotion : result.data?.getPromotionsByCode?.items?.[0];
            if (!appliedPromotion) {
                setError("Invalid promo code applied");
                return;
            }

            if (appliedPromotion.totalAvailableUses !== null && appliedPromotion.totalNumberUsed >= appliedPromotion.totalAvailableUses) {
                setError("This code has no more uses remaining. Please try another code");
                return;
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

            const status = setUserAppliedPromotion(appliedPromotion);

            if (status === CheckIfPromotionValidResponse.UNAVAILABLE) {
                setError("This code is currently unavailable. Please try again later");
            } else if (status === CheckIfPromotionValidResponse.EXPIRED) {
                setError("This code is expired. Please try another code");
            } else if (status === CheckIfPromotionValidResponse.INVALID_PLATFORM) {
                const platform = process.env.REACT_APP_PLATFORM;

                if (platform) {
                    setError(`This code is not valid for ${platform.toLowerCase()}. Please try another code`);
                } else {
                    setError(`This code is not valid for this platform. Please try another code`);
                }
            } else {
                setUserAppliedLoyaltyId(loyaltyId ?? null);

                toast.success("Your promotion has been applied!");
                props.onClose();
            }
        } catch (error) {
            setError("Could not apply discount code. Please try again later");
        } finally {
            setApplying(false);
        }
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

        await onApplyPromo(promoId, loyaltyId);
    };

    const loyaltyRewards = (restaurant?.loyalties?.items || [])
        .flatMap((loyalty) => (loyalty.rewards || []).map((reward) => ({ loyaltyId: loyalty.id, reward })))
        .filter(({ reward }, index, rewards) => rewards.findIndex((r) => r.reward.promotionId === reward.promotionId) === index);

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
                    {loadingFavourites && <div className="mb-3" role="status">Loading favourites...</div>}
                    {favouritesError && <div className="text-error mb-3" role="alert">{favouritesError}</div>}
                    {favourites.length > 0 && (
                        <div className="promotion-favourites mb-3" aria-label="Favourite promotions">
                            {favourites.map((promotion) => (
                                <Button
                                    key={promotion.id}
                                    className={appliedPromotion?.promotion.id === promotion.id ? "applied" : ""}
                                    disabled={applying}
                                    onClick={() => onApplyPromo(promotion.id)}
                                >
                                    {promotion.name}{promotion.code && ` (${promotion.code})`}
                                </Button>
                            ))}
                        </div>
                    )}
                    <Button onClick={() => onApplyPromo()} loading={applying} disabled={applying || !promotionCode.trim()}>
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
                                (loyaltyRewards.length > 0 ? (
                                    loyaltyRewards.map(({ loyaltyId, reward }) => (
                                        <div key={reward.promotionId} className="reward-promotion mb-2">
                                            <div className="reward-promotion-name">{loyaltyPromotionsById[reward.promotionId]?.name}</div>
                                            <div>
                                                {reward.points} point{reward.points !== 1 ? "s" : ""}
                                            </div>
                                            <Button
                                                disabled={
                                                    applying || !loyaltyPromotionsById[reward.promotionId] ||
                                                    (customerLoyaltyPoints ? customerLoyaltyPoints < reward.points : false)
                                                }
                                                onClick={() => onApply(loyaltyId, reward.promotionId, reward.points)}
                                            >
                                                Apply
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div>No rewards available</div>
                                ))}
                        </div>
                    </>
                )}
            </ModalV2>
        </>
    );
};
