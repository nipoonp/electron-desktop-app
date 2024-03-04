import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { ILIST_PRODUCTS_BY_RESTAURANT, LIST_PRODUCTS_BY_RESTAURANT } from "../graphql/customQueries";

export const useListProductsByRestaurantLazyQuery = () => {
    const [data, setSavedData] = useState<ILIST_PRODUCTS_BY_RESTAURANT[] | null>(null);

    const [listProductsByRestaurantByName, { loading, error, data: _data }] = useLazyQuery(LIST_PRODUCTS_BY_RESTAURANT, {
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        if (_data) {
            setSavedData(_data.listProductsByRestaurantByName.items);
        }
    }, [_data]);

    return {
        listProductsByRestaurantByName,
        data,
        error,
        loading,
    };
};
