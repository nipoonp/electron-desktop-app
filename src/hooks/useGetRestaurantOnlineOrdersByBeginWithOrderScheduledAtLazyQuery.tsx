import { GET_ONLINE_ORDERS_BY_RESTAURANT_BY_BEGIN_WITH_ORDERSCHEDULEDAT } from "../graphql/customQueries";
import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../graphql/customFragments";

export const useGetRestaurantOnlineOrdersByBeginWithOrderScheduledAtLazyQuery = () => {
    const [data, setSavedData] = useState<IGET_RESTAURANT_ORDER_FRAGMENT[] | null>(null);

    const [getRestaurantOnlineOrdersByBeginWithOrderScheduledAt, { loading, error, data: _data }] = useLazyQuery(
        GET_ONLINE_ORDERS_BY_RESTAURANT_BY_BEGIN_WITH_ORDERSCHEDULEDAT,
        {
            fetchPolicy: "network-only",
        }
    );

    useEffect(() => {
        if (_data) {
            setSavedData(_data.getOrdersByRestaurantByOrderScheduledAt.items);
        }
    }, [_data]);

    return {
        getRestaurantOnlineOrdersByBeginWithOrderScheduledAt,
        data,
        error,
        loading,
    };
};
