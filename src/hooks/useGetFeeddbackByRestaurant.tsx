import { useLazyQuery, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { ILIST_FEEDBACK } from "../graphql/customQueries";
import { GET_FEEDBACK_BY_RESTAURANT } from "../graphql/customMutations";

export const useListFeedbackLazyQuery = (feedbackRestaurantId: string) => {
    const [data, setSavedData] = useState<ILIST_FEEDBACK[] | null>(null);

    const { loading, error, data: _data } = useQuery(GET_FEEDBACK_BY_RESTAURANT, {
        variables: {
            feedbackRestaurantId: feedbackRestaurantId
        },
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        console.log('_data',_data)
        if (_data) {
            setSavedData(_data.listFeedbackByRestaurant.items);
        }
    }, [_data]);

    return {
        data,
        error,
        loading,
    };
};

