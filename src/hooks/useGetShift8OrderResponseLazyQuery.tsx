import { GET_SHIFT8_ORDER_RESPONSE, IGET_SHIFT8_ORDER_RESPONSE } from "../graphql/customQueries";
import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";

export const useGetShift8OrderResponseLazyQuery = () => {
    const [data, setSavedData] = useState<IGET_SHIFT8_ORDER_RESPONSE[] | null>(null);

    const [getShift8OrderResponse, { loading, error, data: _data }] = useLazyQuery(GET_SHIFT8_ORDER_RESPONSE, {
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        if (_data) {
            setSavedData(_data.getOrder);
        }
    }, [_data]);

    return {
        getShift8OrderResponse,
        data,
        error,
        loading,
    };
};
