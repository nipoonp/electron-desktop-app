import { GET_RESTAURANT_PREPRATION_TIME, IGET_RESTAURANT_PREPRATION_TIME } from "../graphql/customQueries";
import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";

export const useGetRestaurantPreparationTimeLazyQuery = () => {
    const [data, setSavedData] = useState<IGET_RESTAURANT_PREPRATION_TIME[] | null>(null);

    const [getRestaurantPreparationTime, { loading, error, data: _data }] = useLazyQuery(GET_RESTAURANT_PREPRATION_TIME, {
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
