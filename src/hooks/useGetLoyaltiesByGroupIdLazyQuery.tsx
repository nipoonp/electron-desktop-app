import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { GET_LOYALTIES_BY_GROUP_ID, IGET_LOYALTIES_BY_GROUP_ID_ITEM } from "../graphql/customQueries";

export const useGetLoyaltiesByGroupIdLazyQuery = () => {
    const [loyaltyIds, setLoyaltyIds] = useState<string[]>([]);

    const [getLoyaltiesByGroupIdLazyQuery, { loading, error, data }] = useLazyQuery(GET_LOYALTIES_BY_GROUP_ID, {
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        if (data?.getLoyaltiesByGroupId?.items) {
            setLoyaltyIds((data.getLoyaltiesByGroupId.items as IGET_LOYALTIES_BY_GROUP_ID_ITEM[]).map((loyalty) => loyalty.id));
        }
    }, [data]);

    return {
        getLoyaltiesByGroupIdLazyQuery,
        loyaltyIds,
        loading,
        error,
    };
};
