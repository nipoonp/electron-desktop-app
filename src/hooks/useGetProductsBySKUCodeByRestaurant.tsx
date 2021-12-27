import { GET_PRODUCTS_BY_SKUCODE_BY_EQ_RESTAURANT } from "../graphql/customQueries";
import { useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../graphql/customFragments";

export const useGetProductsBySKUCodeByRestaurant = (skuCode: string, productRestaurantId: string) => {
    const [data, setSavedData] = useState<IGET_RESTAURANT_ORDER_FRAGMENT[] | null>(null);

    const { loading, error, data: _data, refetch } = useQuery(GET_PRODUCTS_BY_SKUCODE_BY_EQ_RESTAURANT, {
        variables: {
            skuCode: skuCode,
            productRestaurantId: productRestaurantId,
        },
        fetchPolicy: "network-only",
    });

    // pass saved data down when refetching instead of null
    useEffect(() => {
        if (!error && !loading) {
            setSavedData(_data.getProductsBySKUCodeByRestaurant.items);
        }
    }, [_data]);

    return {
        data,
        error,
        loading,
        refetch,
    };
};
