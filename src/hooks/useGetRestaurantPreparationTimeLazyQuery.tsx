import { GET_RESTAURANT_PING_DATA, IGET_RESTAURANT_PING_DATA } from "../graphql/customQueries";
import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";

export const useGetRestaurantPreparationTimeLazyQuery = () => {
    const [data, setSavedData] = useState<IGET_RESTAURANT_PING_DATA[] | null>(null);

    const [getRestaurantPreparationTime, { loading, error, data: _data }] = useLazyQuery(GET_RESTAURANT_PING_DATA, {
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        if (_data) {
            setSavedData(_data.getRestaurant);
        }
    }, [_data]);

    return {
        getRestaurantPreparationTime,
        data,
        error,
        loading,
    };
};
