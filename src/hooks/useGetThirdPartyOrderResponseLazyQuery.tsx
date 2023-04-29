import { GET_THIRD_PARTY_ORDER_RESPONSE, IGET_THIRD_PARTY_ORDER_RESPONSE } from "../graphql/customQueries";
import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";

export const useGetThirdPartyOrderResponseLazyQuery = () => {
    const [data, setSavedData] = useState<IGET_THIRD_PARTY_ORDER_RESPONSE[] | null>(null);

    const [getThirdPartyOrderResponse, { loading, error, data: _data }] = useLazyQuery(GET_THIRD_PARTY_ORDER_RESPONSE, {
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        if (_data) {
            setSavedData(_data.getOrder);
        }
    }, [_data]);

    return {
        getThirdPartyOrderResponse,
        data,
        error,
        loading,
    };
};
