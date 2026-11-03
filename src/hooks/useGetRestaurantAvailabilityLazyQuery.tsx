import { useLazyQuery } from "@apollo/client/react";
import { GET_RESTAURANT_AVAILABILITY, IGET_RESTAURANT_AVAILABILITY } from "../graphql/customQueries";

export const useGetRestaurantAvailabilityLazyQuery = () => {
    const [getRestaurantDataAvailability, { loading, error, data }] = useLazyQuery(GET_RESTAURANT_AVAILABILITY, {
        fetchPolicy: "no-cache", //This is to stop the GetRestaurant API get double called. I think its somehting to do with useGetRestaurantQuery "cache-first" and "netowrk-first" fetchPolicy.
    });

    return {
        getRestaurantDataAvailability,
        data: data?.getRestaurant ?? null,
        error,
        loading,
    };
};
