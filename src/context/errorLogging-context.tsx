import { createContext, useContext } from "react";

import { useMutation } from "@apollo/client";
import { LOG_SLACK_ERROR } from "../graphql/customMutations";
import { useRestaurant } from "./restaurant-context";

type ContextProps = {
    logError: (error: string, context: string) => void;
};

const ErrorLoggingContext = createContext<ContextProps>({
    logError: (error: string, context: string) => {},
});

const ErrorLoggingProvider = (props: { children: React.ReactNode }) => {
    const { restaurant } = useRestaurant();
    const [logSlackErrorMutation, { data, loading, error }] = useMutation(LOG_SLACK_ERROR, {
        update: (proxy, mutationResult) => {},
    });

    const logError = (error: string, context: string) => {
        return logSlackErrorMutation({
            variables: {
                message: JSON.stringify({
                    restaurantId: restaurant ? restaurant.id : "invalid",
                    restaurantName: restaurant ? restaurant.name : "invalid",
                    error: error,
                    context: context,
                }),
            },
        });
    };

    return (
        <ErrorLoggingContext.Provider
            value={{
                logError: logError,
            }}
            children={props.children}
        />
    );
};

const useErrorLogging = () => {
    const context = useContext(ErrorLoggingContext);
    if (context === undefined) {
        throw new Error(`useErrorLogging must be used within a ErrorLoggingProvider`);
    }
    return context;
};

export { ErrorLoggingProvider, useErrorLogging };
