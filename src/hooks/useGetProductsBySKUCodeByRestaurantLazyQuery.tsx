import { GET_PRODUCTS_BY_SKUCODE_BY_EQ_RESTAURANT, IGET_RESTAURANT_PRODUCT } from "../graphql/customQueries";
import { useLazyQuery } from "@apollo/client/react";
import { useEffect, useState } from "react";

export const useGetProductsBySKUCodeByRestaurantLazyQuery = () => {
    const [data, setSavedData] = useState<IGET_RESTAURANT_PRODUCT[] | null>(null);

    const [getProductsBySKUCodeByRestaurant, { loading, error, data: _data }] = useLazyQuery(GET_PRODUCTS_BY_SKUCODE_BY_EQ_RESTAURANT, {
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        if (_data) {
            setSavedData(_data.getProductsBySKUCodeByRestaurant.items);
        }
    }, [_data]);

    return {
        getProductsBySKUCodeByRestaurant,
        data,
        error,
        loading,
    };
};
