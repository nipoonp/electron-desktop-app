import { useQuery } from "react-apollo-hooks";
import { GET_RESTAURANT } from "../graphql/customQueries";

import { Logger } from "aws-amplify";
import { IGET_RESTAURANT } from "../graphql/customQueries";
import { useEffect, useState } from "react";

const logger = new Logger("useGetRestaurantQuery");

export const useGetRestaurantQuery = (restaurantID: string, skip?: boolean) => {
  const { data: _data, error, loading, refetch, networkStatus } = useQuery(
    GET_RESTAURANT,
    {
      variables: {
        restaurantID: restaurantID,
      },
      skip: skip,
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    }
  );

  let data = null;
  if (!error && !loading) {
    data = _data.getRestaurant as IGET_RESTAURANT;
  }
  logger.debug("RestaurantID: ", restaurantID);

  const refetching = networkStatus === 4;

  return {
    data,
    error,
    loading,
    refetch,
    refetching,
  };
};
