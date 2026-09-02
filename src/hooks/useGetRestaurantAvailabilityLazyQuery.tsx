import { useLazyQuery } from "@apollo/client";
import { GET_RESTAURANT_AVAILABILITY, IGET_RESTAURANT_AVAILABILITY } from "../graphql/customQueries";

export const useGetRestaurantAvailabilityLazyQuery = () => {
    const [getRestaurantDataAvailability, { loading, error, data }] = useLazyQuery<IGET_RESTAURANT_AVAILABILITY>(GET_RESTAURANT_AVAILABILITY, {
        fetchPolicy: "network-only",
    });

    return {
        getRestaurantDataAvailability,
        data: data?.getRestaurant ?? null,
        error,
        loading,
    };
};
