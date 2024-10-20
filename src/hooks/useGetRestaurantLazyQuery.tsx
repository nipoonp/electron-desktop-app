import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { GET_RESTAURANT, IGET_RESTAURANT } from "../graphql/customQueries";

export const useGetRestaurantLazyQuery = () => {
    const [data, setSavedData] = useState<IGET_RESTAURANT | null>(null);

    const [getRestaurant, { loading, error, data: _data }] = useLazyQuery(GET_RESTAURANT, {
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        if (_data) {
            setSavedData(_data.getRestaurant);
        }
    }, [_data]);

    return {
        getRestaurant,
        data,
        error,
        loading,
    };
};
