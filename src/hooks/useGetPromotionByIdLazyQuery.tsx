import { GET_PROMOTION_BY_ID, IGET_RESTAURANT_PROMOTION } from "../graphql/customQueries";
import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";

export const useGetPromotionByIdLazyQuery = () => {
    const [promotionsById, setPromotionsById] = useState<Record<string, IGET_RESTAURANT_PROMOTION>>({});

    const [getPromotionById, { loading, error, data: _data }] = useLazyQuery(GET_PROMOTION_BY_ID, {
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        if (_data?.getPromotion) {
            setPromotionsById((prev) => ({ ...prev, [_data.getPromotion.id]: _data.getPromotion }));
        }
    }, [_data]);

    return {
        getPromotionById,
        promotionsById,
        error,
        loading,
    };
};
