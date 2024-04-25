import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { GET_RESTAURANT, IGET_RESTAURANT } from "../graphql/customQueries";

export const useListRestaurantsLazyQuery = () => {
    const [data, setSavedData] = useState<IGET_RESTAURANT | null>(null);
   
    const [restaurantDetail, { loading, error, data: _data }] = useLazyQuery(GET_RESTAURANT, {
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        if (_data) {
            setSavedData(_data.getRestaurant);
        }
    }, [_data]);

    return {
        restaurantDetail,
        data,
        error,
        loading,
    };


};


