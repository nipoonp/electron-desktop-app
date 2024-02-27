import { useQuery ,useLazyQuery} from "@apollo/client";
import { useState,useEffect } from "react";
import { IGET_RESTAURANT_PRODUCT } from "../graphql/customQueries";
import { GET_PRODUCT_BY_ID } from "../graphql/customMutations";

export const useGetProductByIdQuery = () => {
    const [data, setSavedData] = useState<IGET_RESTAURANT_PRODUCT[] | null>(null);

    const [getProduct, { loading, error, data: _data }] = useLazyQuery(GET_PRODUCT_BY_ID, {
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        if (_data) {
            setSavedData(_data.getProduct);
        }
    }, [_data]);

    return {
        getProduct,
        data,
        error,
        loading,
    };
};

