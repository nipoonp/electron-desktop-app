import { useMutation } from "@apollo/client";
import { ISection, ITableNodesAttributes } from "../model/model";
import { CREATE_TABLE_PLAN, UPDATE_TABLE_PLAN } from "../graphql/customMutations";

type TablePlanMutationInput = {
    id?: string;
    restaurantId: string;
    nodes: ITableNodesAttributes[];
    sections: ISection[];
};

export const useUpdateRestaurantFloorPlanMutation = () => {
    const [createFloorPlan, createResult] = useMutation(CREATE_TABLE_PLAN);
    const [updateFloorPlan, updateResult] = useMutation(UPDATE_TABLE_PLAN);

    const updateRestaurantFloorPlan = async (options: {
        variables: {
            input: TablePlanMutationInput;
        };
    }) => {
        const input = options.variables.input;

        if (input.id) {
            return await updateFloorPlan(options);
        }

        return await createFloorPlan({ variables: { input } });
    };

    return {
        updateRestaurantFloorPlan,
        loading: createResult.loading || updateResult.loading,
        error: createResult.error || updateResult.error,
        data: updateResult.data || createResult.data,
    };
};
