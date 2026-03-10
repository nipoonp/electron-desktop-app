import { useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { IGET_FEEDBACK_BY_RESTAURANT } from "../graphql/customQueries";
import { GET_FEEDBACK_BY_RESTAURANT } from "../graphql/customMutations";

export const useGetFeedbackByRestaurant = (feedbackRestaurantId: string, enabled: boolean) => {
    const [data, setSavedData] = useState<IGET_FEEDBACK_BY_RESTAURANT[] | null>(null);

    const {
        loading,
        error,
        data: _data,
    } = useQuery(GET_FEEDBACK_BY_RESTAURANT, {
        variables: {
            feedbackRestaurantId,
        },
        fetchPolicy: "network-only",
        skip: !enabled || !feedbackRestaurantId,
    });

    useEffect(() => {
        if (_data) {
            setSavedData(_data.getFeedbackByRestaurant.items);
            return;
        }
        setSavedData(null);
    }, [_data]);

    return {
        data,
        error,
        loading,
    };
};
