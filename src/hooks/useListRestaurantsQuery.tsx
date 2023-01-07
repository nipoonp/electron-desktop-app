import { useQuery } from "@apollo/client";
import { LIST_RESTAURANTS, ILIST_RESTAURANTS } from "../graphql/customQueries";
import { Logger } from "aws-amplify";

const logger = new Logger("useListRestaurantsQuery");

export const useListRestaurantsQuery = () => {
    const {
        data: _data,
        error,
        loading,
    } = useQuery(LIST_RESTAURANTS, {
        fetchPolicy: "network-only",
    });

    let data: ILIST_RESTAURANTS[] | null = null;
    if (!error && !loading) {
        data = (_data && _data.listRestaurants && _data.listRestaurants.items) as ILIST_RESTAURANTS[];
    }

    logger.debug("Data: ", _data);

    return {
        data,
        error,
        loading,
    };
};
