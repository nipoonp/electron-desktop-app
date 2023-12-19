import { useLazyQuery, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { IGET_FEEDBACK_BY_RESTAURANT } from "../graphql/customQueries";
import { GET_FEEDBACK_BY_RESTAURANT } from "../graphql/customMutations";

export const useListFeedbackLazyQuery = (feedbackRestaurantId: string) => {
    const [data, setSavedData] = useState<IGET_FEEDBACK_BY_RESTAURANT[] | null>(null);

    const {
        loading,
        error,
        data: _data,
    } = useQuery(GET_FEEDBACK_BY_RESTAURANT, {
        variables: {
            feedbackRestaurantId: feedbackRestaurantId,
        },
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        console.log("_data", _data);
        if (_data) {
            setSavedData(_data.getFeedbackByRestaurant.items);
        }
    }, [_data]);

    return {
        data,
        error,
        loading,
    };
};
