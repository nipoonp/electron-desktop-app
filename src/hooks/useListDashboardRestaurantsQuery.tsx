import { useQuery } from "react-apollo-hooks";
import {
  LIST_DASHBOARD_RESTAURANTS,
  ILIST_DASHBOARD_RESTAURANTS,
} from "../graphql/customQueries";
import { Logger } from "aws-amplify";

const logger = new Logger("useGetDashboardRestaurantListQuery");

export const useListDashboardRestaurantsQuery = () => {
  const { data: _data, error, loading } = useQuery(LIST_DASHBOARD_RESTAURANTS, {
    fetchPolicy: "network-only",
  });

  let data = null;
  if (!error && !loading) {
    data = (_data &&
      _data.listRestaurants &&
      _data.listRestaurants.items) as ILIST_DASHBOARD_RESTAURANTS[];
  }

  logger.debug("Data: ", _data);

  return {
    data,
    error,
    loading,
  };
};
