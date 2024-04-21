import { GET_ORDERS_BY_RESTAURANT_BY_BEGIN_WITH_PLACEDAT } from "../graphql/customQueries";
import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../graphql/customFragments";

export const useGetRestaurantOrdersByBeginWithPlacedAtLazyQuery = () => {
    const [data, setSavedData] = useState<IGET_RESTAURANT_ORDER_FRAGMENT[] | null>(null);

    const [getRestaurantOrdersByBeginWithPlacedAt, { loading, error, data: _data }] = useLazyQuery(
        GET_ORDERS_BY_RESTAURANT_BY_BEGIN_WITH_PLACEDAT,
        {
            fetchPolicy: "network-only",
        }
    );

    useEffect(() => {
        if (_data) {
            setSavedData(_data.getOrdersByRestaurantByPlacedAt.items);
        }
    }, [_data]);

    return {
        getRestaurantOrdersByBeginWithPlacedAt,
        data,
        error,
        loading,
    };
};
