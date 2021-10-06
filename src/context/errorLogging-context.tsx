import { createContext, useContext, useEffect, useRef, useState } from "react";

import { useMutation } from "@apollo/client";
import { CREATE_EFTPOS_TRANSACTION_LOG, LOG_SLACK_ERROR } from "../graphql/customMutations";
import { useRestaurant } from "./restaurant-context";

export interface IAddVerifoneLog {
    eftposProvider: string;
    amount: number;
    type: string;
    payload: string;
    restaurantId: string;
    timestamp: string;
    expiry: number;
}

type ContextProps = {
    logError: (error: string, context: string) => void;
    addVerifoneLog: (log: IAddVerifoneLog) => void;
};

const ErrorLoggingContext = createContext<ContextProps>({
    logError: (error: string, context: string) => {},
    addVerifoneLog: (log: IAddVerifoneLog) => {},
});

const ErrorLoggingProvider = (props: { children: React.ReactNode }) => {
    const { restaurant } = useRestaurant();
    const [logSlackErrorMutation, { data, loading, error }] = useMutation(LOG_SLACK_ERROR, {
        update: (proxy, mutationResult) => {},
    });

    const [createEftposTransactionLogMutation] = useMutation(CREATE_EFTPOS_TRANSACTION_LOG, {
        update: (proxy, mutationResult) => {},
    });

    let verifoneLogQueue: IAddVerifoneLog[] = [];
    // const verifoneLogQueue = useRef<IAddVerifoneLog[]>([]);

    useEffect(() => {
        const timerId = setInterval(async () => {
            const queue = [...verifoneLogQueue];
            verifoneLogQueue = [];

            try {
                for (var i = 0; i < queue.length; i++) {
                    const item = queue[i];

                    await createEftposTransactionLogMutation({
                        variables: item,
                    });
                }
            } catch (e) {
                console.log("Error in creating verifone transaction log", e);
            }
        }, 100);

        return () => {
            clearInterval(timerId);
        };
    }, []);

    const addVerifoneLog = (log: IAddVerifoneLog) => {
        verifoneLogQueue = [...verifoneLogQueue, log];
    };

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
                addVerifoneLog: addVerifoneLog,
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
