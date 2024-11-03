import { GET_LOYALTY_USER_BY_PHONE_NUMBER, IGET_LOYALTY_USER_BY_PHONE_NUMBER_EMAIL } from "../graphql/customQueries";
import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";

export const useGetLoyaltyUsersByPhoneNumberLazyQuery = (rewardsIdentifier: string, loyaltyHistoryRestaurantId: string) => {
    const [data, setSavedData] = useState<IGET_LOYALTY_USER_BY_PHONE_NUMBER_EMAIL[] | null>(null);

    const [getLoyaltyUsersByPhoneNumberLazyQuery, { loading, error, data: _data }] = useLazyQuery(GET_LOYALTY_USER_BY_PHONE_NUMBER, {
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
        getLoyaltyUsersByPhoneNumberLazyQuery,
        data,
        error,
        loading,
    };
};
