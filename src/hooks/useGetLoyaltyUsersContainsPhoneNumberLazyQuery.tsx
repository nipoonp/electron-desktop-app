import { GET_LOYALTY_USER_CONTAINS_PHONE_NUMBER, IGET_LOYALTY_USER_CONTAINS_PHONE_NUMBER_EMAIL } from "../graphql/customQueries";
import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";

export const useGetLoyaltyUsersContainsPhoneNumberLazyQuery = (rewardsIdentifier: string, loyaltyHistoryRestaurantId: string) => {
    const [data, setSavedData] = useState<IGET_LOYALTY_USER_CONTAINS_PHONE_NUMBER_EMAIL[] | null>(null);

    const [getLoyaltyUsersContainsPhoneNumberLazyQuery, { loading, error, data: _data }] = useLazyQuery(GET_LOYALTY_USER_CONTAINS_PHONE_NUMBER, {
        variables: {
            rewardsIdentifier: rewardsIdentifier,
            loyaltyHistoryRestaurantId: loyaltyHistoryRestaurantId,
        },
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        if (_data) {
            setSavedData(_data.listLoyaltyUser.items);
        }
    }, [_data]);

    return {
        getLoyaltyUsersContainsPhoneNumberLazyQuery,
        data,
        error,
        loading,
    };
};
