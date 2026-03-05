import { useLazyQuery } from "@apollo/client";
import { GET_FLOOR_PLAN, IGET_FLOOR_PLAN } from "../graphql/customQueries";

type GetFloorPlanResponse = {
    listTablePlansByRestaurantId?: {
        items?: (IGET_FLOOR_PLAN | null)[] | null;
    } | null;
};

export const useGetRestaurantFloorPlanLazyQuery = () => {
    const [getRestaurantFloorPlan, { loading, error, data }] = useLazyQuery<GetFloorPlanResponse>(GET_FLOOR_PLAN, {
        fetchPolicy: "network-only",
    });

    const items =
        data?.listTablePlansByRestaurantId?.items
            ?.filter((item): item is IGET_FLOOR_PLAN => !!item)
            .sort((a, b) => {
                const aUpdated = new Date(a.updatedAt || a.createdAt || 0).getTime();
                const bUpdated = new Date(b.updatedAt || b.createdAt || 0).getTime();
                return bUpdated - aUpdated;
            }) || [];

    return {
        getRestaurantFloorPlan,
        data: items[0] || null,
        error,
        loading,
    };
};
