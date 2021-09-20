import { createContext, useContext } from "react";

import { useMutation } from "@apollo/client";
import { LOG_SLACK_ERROR } from "../graphql/customMutations";

type ContextProps = {
    logError: (message: string) => void;
};

const ErrorLoggingContext = createContext<ContextProps>({
    logError: (message: string) => {},
});

const ErrorLoggingProvider = (props: { children: React.ReactNode }) => {
    const [logSlackErrorMutation, { data, loading, error }] = useMutation(LOG_SLACK_ERROR, {
        update: (proxy, mutationResult) => {},
    });

    const logError = (message: string) => {
        return logSlackErrorMutation({
            variables: {
                message: message,
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
