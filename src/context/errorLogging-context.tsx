import { createContext, useContext } from "react";

import { useMutation } from "react-apollo-hooks";
import { LOG_SLACK_ERROR } from "../graphql/customMutations";

type ContextProps = {
    logError: (message: string) => void;
};

const ErrorLoggingContext = createContext<ContextProps>({
    logError: (message: string) => {},
});

const ErrorLoggingProvider = (props: { children: React.ReactNode }) => {
    const logSlackError = useMutation(LOG_SLACK_ERROR, {
        update: (proxy, mutationResult) => {},
    });

    const logError = (message: string) => {
        return logSlackError({
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
