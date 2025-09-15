import { GET_LOYALTY_USER_CONTAINS_EMAIL, IGET_LOYALTY_USER_CONTAINS_PHONE_NUMBER_EMAIL } from "../graphql/customQueries";
import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";

export const useGetLoyaltyUsersContainsEmailLazyQuery = (rewardsIdentifier: string, loyaltyHistoryRestaurantId: string) => {
    const [data, setSavedData] = useState<IGET_LOYALTY_USER_CONTAINS_PHONE_NUMBER_EMAIL[] | null>(null);

    // Do not bind variables here; pass them when executing to avoid refetch on each keystroke
    const [getLoyaltyUsersContainsEmailLazyQuery, { loading, error, data: _data }] = useLazyQuery(
        GET_LOYALTY_USER_CONTAINS_EMAIL,
        {
            fetchPolicy: "network-only",
        }
    );

    useEffect(() => {
        if (_data) {
            setSavedData(_data.listLoyaltyUser.items);
        }
    }, [_data]);

    return {
        getLoyaltyUsersContainsEmailLazyQuery,
        data,
        error,
        loading,
    };
};
