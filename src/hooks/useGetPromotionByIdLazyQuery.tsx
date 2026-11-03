import { GET_PROMOTION_BY_ID, IGET_RESTAURANT_PROMOTION } from "../graphql/customQueries";
import { useLazyQuery } from "@apollo/client/react";
import { useState } from "react";

export const useGetPromotionByIdLazyQuery = () => {
    const [promotionsById, setPromotionsById] = useState<Record<string, IGET_RESTAURANT_PROMOTION>>({});

    const [_getPromotionById, { loading, error }] = useLazyQuery(GET_PROMOTION_BY_ID, {
        fetchPolicy: "network-only",
    });

    const getPromotionById = async (options: { variables: { id: string } }) => {
        const result = await _getPromotionById(options);

        const promotion = result.data?.getPromotion;
        if (promotion) {
            setPromotionsById((prev) => ({ ...prev, [promotion.id]: promotion }));
        }

        return result;
    };

    return {
        getPromotionById,
        promotionsById,
        error,
        loading,
    };
};
