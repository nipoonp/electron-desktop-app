import React, { useEffect, useState } from "react";
import { isAfter, addHours } from "date-fns";

export const useGetRestaurantQueryFetchPolicy = () => {
    const [fetchPolicy, setFetchPolicy] = useState<"cache-first" | "cache-and-network" | "network-only" | "cache-only" | "no-cache" | "standby" | undefined>("cache-first");

    useEffect(() => {
        const apolloRestaurantQueryCacheTimestamp = sessionStorage.getItem("apolloRestaurantQueryCacheTimestamp");

        if (!apolloRestaurantQueryCacheTimestamp) {
            sessionStorage.setItem("apolloRestaurantQueryCacheTimestamp", new Date().toISOString());
            setFetchPolicy("network-only");
        } else {
            const cacheExpiry = addHours(new Date(apolloRestaurantQueryCacheTimestamp), 6);
            const fetchFromServer = isAfter(new Date(), cacheExpiry);


            if (fetchFromServer) {
                sessionStorage.setItem("apolloRestaurantQueryCacheTimestamp", new Date().toISOString());
                setFetchPolicy("network-only");
            } else {
                setFetchPolicy("cache-first");
            }
        }
    }, []);

    return fetchPolicy;
}