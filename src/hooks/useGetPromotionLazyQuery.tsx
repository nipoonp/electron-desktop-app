import { GET_PROMOTION_BY_CODE, GET_USER, IGET_RESTAURANT_PROMOTION, IGET_USER } from "../graphql/customQueries";
import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";

export const useGetPromotionLazyQuery = () => {
    const [data, setSavedData] = useState<IGET_RESTAURANT_PROMOTION[] | null>(null);

    const [getPromotionsByCode, { loading, error, data: _data }] = useLazyQuery(GET_PROMOTION_BY_CODE, {
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        if (_data) {
            setSavedData(_data.getPromotionsByCode.items);
        }
    }, [_data]);

    return {
        getPromotionsByCode,
        data,
        error,
        loading,
    };
};
