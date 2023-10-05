import { createContext, useContext } from "react";

import { useMutation } from "@apollo/client";
import { CREATE_EFTPOS_TRANSACTION_LOG } from "../graphql/customMutations";
import { useRestaurant } from "./restaurant-context";
import { sendFailureNotification } from "../util/errorHandling";

export interface IAddEftposLog {
    eftposProvider: string;
    amount: number;
    type: string;
    payload: string;
    restaurantId: string;
    timestamp: string;
    expiry: number;
}

type ContextProps = {
    logError: (error: string, context: string) => Promise<void>;
    addEftposLog: (log: IAddEftposLog) => Promise<void>;
};

const ErrorLoggingContext = createContext<ContextProps>({
    logError: (error: string, context: string) => {
        return new Promise(() => {
            console.log("");
        });
    },
    addEftposLog: (log: IAddEftposLog) => {
        return new Promise(() => {
            console.log("");
        });
    },
});

const ErrorLoggingProvider = (props: { children: React.ReactNode }) => {
    const [createEftposTransactionLogMutation] = useMutation(CREATE_EFTPOS_TRANSACTION_LOG, {
        update: (proxy, mutationResult) => {},
    });

    const addEftposLog = async (log: IAddEftposLog) => {
        try {
            await createEftposTransactionLogMutation({
                variables: log,
            });
        } catch (e) {
            console.log("Error in creating eftpos transaction log", e);
        }
    };

    const logError = async (error: string, context: string) => {
        try {
            await sendFailureNotification(
                error,
                JSON.stringify({
                    restaurantId: localStorage.getItem("selectedRestaurantId") || "invalid",
                    context: context,
                })
            );
        } catch (e) {
            console.log("Error in send failure notification", e);
        }
    };

    return (
        <ErrorLoggingContext.Provider
            value={{
                logError: logError,
                addEftposLog: addEftposLog,
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
