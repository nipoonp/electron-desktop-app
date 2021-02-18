import { useQuery } from "react-apollo-hooks";
import {
  GET_DASHBOARD_RESTAURANT,
  IGET_DASHBOARD_RESTAURANT,
} from "../graphql/customQueries";
import { Logger } from "aws-amplify";

const logger = new Logger("useGetDashboardRestaurantQuery");

export const useGetDashboardRestaurantQuery = (restaurantID: string) => {
  const { data: _data, error, loading } = useQuery(GET_DASHBOARD_RESTAURANT, {
    variables: {
      restaurantID: restaurantID,
    },
    fetchPolicy: "network-only",
  });

  let data = null;
  if (!error && !loading) {
    data = _data.getRestaurant as IGET_DASHBOARD_RESTAURANT;
  }

  logger.debug("Data: ", _data);
  logger.debug("RestaurantID: ", restaurantID);

  return {
    data,
    error,
    loading,
  };
};
