import { useEffect, useRef, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_RESTAURANT } from "../graphql/customQueries";

import { Logger } from "aws-amplify";
import { IGET_RESTAURANT } from "../graphql/customQueries";
import { useGetRestaurantQueryFetchPolicy } from "./useGetRestaurantQueryFetchPolicy";

const logger = new Logger("useGetRestaurantQuery");

export const useGetRestaurantQuery = (restaurantId: string, skip?: boolean) => {
    // const fetchPolicy = useGetRestaurantQueryFetchPolicy();

    const cachedData = useRef<IGET_RESTAURANT | null>(null);

    // const { data: _data, error, loading, refetch, networkStatus } = useQuery(GET_RESTAURANT, {

    //The fetchPolicy "cache-and-network" did not work for some reason. So just are making the two calls separately. First get it from the cache, and then use the network to update the cache.
    const {
        data: _data,
        error,
        loading,
    } = useQuery<{ getRestaurant: IGET_RESTAURANT }>(GET_RESTAURANT, {
        variables: {
            restaurantId: restaurantId,
        },
        skip: skip,
        fetchPolicy: "cache-first",
        // notifyOnNetworkStatusChange: true,
    });

    const {
        data: _data1,
        error: error1,
        loading: loading1,
    } = useQuery<{ getRestaurant: IGET_RESTAURANT }>(GET_RESTAURANT, {
        variables: {
            restaurantId: restaurantId,
        },
        skip: skip,
        fetchPolicy: "network-only",
        // notifyOnNetworkStatusChange: true,
    });

    let data: IGET_RESTAURANT | null = null;
    if (!error && !loading && _data) {
        data = _data.getRestaurant;
        cachedData.current = data;
    }
    logger.debug("RestaurantId: ", restaurantId);

    // const refetching = networkStatus === 4;

    const dataReturn = cachedData.current;
    const loadingReturn = cachedData.current ? false : loading;

    return { data: dataReturn, error: error, loading: loadingReturn };
};
