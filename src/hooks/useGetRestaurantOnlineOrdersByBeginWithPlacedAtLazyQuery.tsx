import { GET_ONLINE_ORDERS_BY_RESTAURANT_BY_BEGIN_WITH_PLACEDAT } from "../graphql/customQueries";
import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../graphql/customFragments";

export const useGetRestaurantOnlineOrdersByBeginWithPlacedAtLazyQuery = () => {
    const [data, setSavedData] = useState<IGET_RESTAURANT_ORDER_FRAGMENT[] | null>(null);

    const [getRestaurantOnlineOrdersByBeginWithPlacedAt, { loading, error, data: _data }] = useLazyQuery(
        GET_ONLINE_ORDERS_BY_RESTAURANT_BY_BEGIN_WITH_PLACEDAT,
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
        getRestaurantOnlineOrdersByBeginWithPlacedAt,
        data,
        error,
        loading,
    };
};
