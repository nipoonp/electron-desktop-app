import { GET_ORDERS_BY_RESTAURANT_BY_BEGIN_WITH_PLACEDAT } from "../graphql/customQueries";
import { useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../graphql/customFragments";

export const useGetRestaurantOrdersByBeginWithPlacedAt = (orderRestaurantId: string, placedAt: string) => {
    const [data, setSavedData] = useState<IGET_RESTAURANT_ORDER_FRAGMENT[] | null>(null);

    const { loading, error, data: _data, refetch } = useQuery(GET_ORDERS_BY_RESTAURANT_BY_BEGIN_WITH_PLACEDAT, {
        variables: {
            orderRestaurantId: orderRestaurantId,
            placedAt: placedAt,
        },
        fetchPolicy: "network-only",
        skip: !orderRestaurantId || !placedAt,
    });

    // Keep the previous list while refetching, but guard the empty-input case before touching nested query data.
    useEffect(() => {
        if (!orderRestaurantId || !placedAt) {
            setSavedData(null);
            return;
        }

        if (!error && !loading && _data?.getOrdersByRestaurantByPlacedAt?.items) {
            setSavedData(_data.getOrdersByRestaurantByPlacedAt.items);
        }
    }, [_data, error, loading, orderRestaurantId, placedAt]);

    return {
        data,
        error,
        loading,
        refetch,
    };
};
