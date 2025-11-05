import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { GET_LOYALTY_HISTORY_BY_LOYALTY_ID, IGET_LOYALTY_HISTORY_BY_LOYALTY_ID } from "../graphql/customQueries";

export const useGetLoyaltyHistoryByLoyaltyIdLazyQuery = () => {
    const [loyaltyHistories, setLoyaltyHistories] = useState<IGET_LOYALTY_HISTORY_BY_LOYALTY_ID[]>([]);

    const [getLoyaltyHistoryByLoyaltyIdLazyQuery, { loading, error, data }] = useLazyQuery(GET_LOYALTY_HISTORY_BY_LOYALTY_ID, {
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        if (data?.getLoyalty?.loyaltyHistories?.items) {
            setLoyaltyHistories(
                (data.getLoyalty.loyaltyHistories.items as IGET_LOYALTY_HISTORY_BY_LOYALTY_ID[]).filter(
                    (history): history is IGET_LOYALTY_HISTORY_BY_LOYALTY_ID => Boolean(history)
                )
            );
        }
    }, [data]);

    return {
        getLoyaltyHistoryByLoyaltyIdLazyQuery,
        loyaltyHistories,
        loading,
        error,
        nextToken: data?.getLoyalty?.loyaltyHistories?.nextToken ?? null,
    };
};
