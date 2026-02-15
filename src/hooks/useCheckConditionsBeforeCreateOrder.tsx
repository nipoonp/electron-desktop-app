import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { GET_RESTAURANT_AVAILABILITY, IGET_RESTAURANT_AVAILABILITY } from "../graphql/customQueries";

export const useCheckConditionsBeforeCreateOrder = () => {
    const [data, setSavedData] = useState<IGET_RESTAURANT_AVAILABILITY["getRestaurant"] | null>(null);

    const [getRestaurantDataAvailability, { loading, error, data: _data }] = useLazyQuery<IGET_RESTAURANT_AVAILABILITY>(GET_RESTAURANT_AVAILABILITY, {
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        if (_data) {
            setSavedData(_data.getRestaurant);
        }
    }, [_data]);

    return {
        getRestaurantDataAvailability,
        data,
        error,
        loading,
    };
};
