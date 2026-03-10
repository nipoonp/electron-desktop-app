import { GET_PROMOTION_BY_ID, IGET_RESTAURANT_PROMOTION } from "../graphql/customQueries";
import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";

export const useGetPromotionByIdLazyQuery = () => {
    const [promotionsById, setPromotionsById] = useState<Record<string, IGET_RESTAURANT_PROMOTION>>({});

    const [getPromotionById, { loading, error, data: _data }] = useLazyQuery(GET_PROMOTION_BY_ID, {
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        const promotion = _data?.getPromotion;
        if (promotion) {
            setPromotionsById((prev) => ({ ...prev, [promotion.id]: promotion }));
        }
    }, [_data]);

    return {
        getPromotionById,
        promotionsById,
        error,
        loading,
    };
};
