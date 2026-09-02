import { GET_PROMOTION_BY_ID, IGET_RESTAURANT_PROMOTION } from "../graphql/customQueries";
import { useLazyQuery } from "@apollo/client";
import { useState } from "react";

export const useGetPromotionByIdLazyQuery = () => {
    const [promotionsById, setPromotionsById] = useState<Record<string, IGET_RESTAURANT_PROMOTION>>({});

    const [_getPromotionById, { loading, error }] = useLazyQuery(GET_PROMOTION_BY_ID, {
        fetchPolicy: "network-only",
    });

    const getPromotionById = async (options: { variables: { id: string } }) => {
        const result = await _getPromotionById(options);

        if (result.data?.getPromotion) {
            setPromotionsById((prev) => ({ ...prev, [result.data.getPromotion.id]: result.data.getPromotion }));
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
