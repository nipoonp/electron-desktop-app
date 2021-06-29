import { useEffect, useRef, useState } from "react";
import { useQuery } from "react-apollo-hooks";
import { GET_RESTAURANT } from "../graphql/customQueries";

import { Logger } from "aws-amplify";
import { IGET_RESTAURANT } from "../graphql/customQueries";
import { useGetRestaurantQueryFetchPolicy } from "./useGetRestaurantQueryFetchPolicy";

const logger = new Logger("useGetRestaurantQuery");

export const useGetRestaurantQuery = (restaurantId: string, skip?: boolean) => {
    // const fetchPolicy = useGetRestaurantQueryFetchPolicy();

    const cachedData = useRef<IGET_RESTAURANT | null>(null);

    // const { data: _data, error, loading, refetch, networkStatus } = useQuery(GET_RESTAURANT, {
    const { data: _data, error, loading } = useQuery(GET_RESTAURANT, {
        variables: {
            restaurantId: restaurantId,
        },
        skip: skip,
        fetchPolicy: "cache-and-network",
        notifyOnNetworkStatusChange: true,
    });

    let data: IGET_RESTAURANT | null = null;
    if (!error && !loading) {
        data = _data.getRestaurant as IGET_RESTAURANT;
        cachedData.current = data;
    }
    logger.debug("RestaurantID: ", restaurantId);

    // const refetching = networkStatus === 4;

    const dataReturn = cachedData.current;
    const loadingReturn = cachedData.current ? false : loading;

    return { data: dataReturn, error: error, loading: loadingReturn };
};
