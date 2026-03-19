import { useMutation } from "@apollo/client";
import { ISection, ITableNodesAttributes } from "../model/model";
import { CREATE_TABLE_PLAN, UPDATE_TABLE_PLAN } from "../graphql/customMutations";

type TablePlanMutationInput = {
    id?: string;
    restaurantId: string;
    nodes: ITableNodesAttributes[];
    sections: ISection[];
};

// Unified floor-plan save hook:
// updates when input.id exists, otherwise creates a new restaurant table plan.
export const useUpdateRestaurantFloorPlanMutation = () => {
    const [createFloorPlan] = useMutation(CREATE_TABLE_PLAN);
    const [updateFloorPlan] = useMutation(UPDATE_TABLE_PLAN);

    // Keeps callsites simple by hiding create-vs-update mutation branching.
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

    return { updateRestaurantFloorPlan };
};
