import { useMutation } from "@apollo/client";
import { DELETE_TABLE_PLAN } from "../graphql/customMutations";

type DeleteFloorPlanInput = {
    id: string;
};

export const useDeleteRestaurantFloorPlanMutation = () => {
    const [deleteFloorPlan, { loading, error, data }] = useMutation(DELETE_TABLE_PLAN);

    const deleteRestaurantFloorPlan = async (options: {
        variables: {
            input: DeleteFloorPlanInput;
        };
    }) => {
        return await deleteFloorPlan(options);
    };

    return {
        deleteRestaurantFloorPlan,
        loading,
        error,
        data,
    };
};
