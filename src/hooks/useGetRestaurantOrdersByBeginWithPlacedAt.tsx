// import { GET_ORDERS_BY_RESTAURANT_BY_BEGIN_WITH_PLACEDAT } from "../graphql/customQueries";
// import { useQuery } from "@apollo/client";
// import { useEffect, useState } from "react";
// import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../graphql/customFragments";

// export const useGetRestaurantOrdersByBeginWithPlacedAt = (orderRestaurantId: string, placedAt: string) => {
//     const [data, setSavedData] = useState<IGET_RESTAURANT_ORDER_FRAGMENT[] | null>(null);

//     const { loading, error, data: _data } = useQuery(GET_ORDERS_BY_RESTAURANT_BY_BEGIN_WITH_PLACEDAT, {
//         variables: {
//             orderRestaurantId: orderRestaurantId,
//             placedAt: placedAt,
//         },
//         fetchPolicy: "network-only",
//     });

//     // pass saved data down when refetching instead of null
//     useEffect(() => {
//         if (!error && !loading) {
//             setSavedData(_data.getOrdersByRestaurantByPlacedAt.items);
//         }
//     }, [_data]);

//     return {
//         data,
//         error,
//         loading,
//     };
// };


import { GET_ORDERS_BY_RESTAURANT_BY_BEGIN_WITH_PLACEDAT } from "../graphql/customQueries";
import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../graphql/customFragments";

export const useGetRestaurantOrdersByBeginWithPlacedAt = () => {
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
