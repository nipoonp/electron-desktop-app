import { GET_LOYALTY_USER_CONTAINS_FIRST_NAME, IGET_LOYALTY_USER_CONTAINS_PHONE_NUMBER_EMAIL } from "../graphql/customQueries";
import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";

export const useGetLoyaltyUsersContainsFirstNameLazyQuery = (rewardsIdentifier: string, loyaltyHistoryRestaurantId: string) => {
    const [data, setSavedData] = useState<IGET_LOYALTY_USER_CONTAINS_PHONE_NUMBER_EMAIL[] | null>(null);

    // Do not bind variables here; pass them when executing to avoid refetch on each keystroke
    const [getLoyaltyUsersContainsFirstNameLazyQuery, { loading, error, data: _data }] = useLazyQuery(
        GET_LOYALTY_USER_CONTAINS_FIRST_NAME,
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
        getLoyaltyUsersContainsFirstNameLazyQuery,
        data,
        error,
        loading,
    };
};
