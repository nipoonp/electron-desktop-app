import { useState, useEffect, createContext, useContext } from "react";

import { Logger } from "aws-amplify";
import { IGET_USER } from "../graphql/customQueries";
import { useGetUserQuery } from "../hooks/useGetUserQuery";

const logger = new Logger("UserContext");

// Context
type ContextProps = {
    user: IGET_USER | null;
    isLoading: boolean;
    error: boolean;
};

const UserContext = createContext<ContextProps>({
    user: null,
    isLoading: true,
    error: false,
});

// Exports
const C = (props: { userId: string | null; children: React.ReactNode }) => {
    // queries
    const { user: getUserData, error: getUserError, loading: getUserLoading } = useGetUserQuery(props.userId);

    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<IGET_USER | null>(null);
    const [contextError, setContextError] = useState(false);

    useEffect(() => {
        if (getUserError) {
            logger.error("Failed to get user: ", getUserError);
            setContextError(true);
        } else if (!getUserLoading && getUserData!) {
            // user is registered
            logger.debug("Found user in database: ", getUserData);
            setIsLoading(false);
            setUser(getUserData!);
        } else if (!getUserLoading) {
        }
    }, [getUserError, getUserLoading, getUserData]);

    return (
        <UserContext.Provider
            value={{
                isLoading,
                user,
                error: contextError,
            }}
            children={props.children}
        />
    );
};

const UserProvider = (props: { userId: string | null; children: React.ReactNode }) => {
    if (props.userId) {
        return <C {...props} />;
    } else {
        return (
            <UserContext.Provider
                value={{
                    isLoading: false,
                    user: null,
                    error: false,
                }}
                children={props.children}
            />
        );
    }
};

const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error(`useUser must be used within a UserProvider`);
    }
    return context;
};

export { UserProvider, useUser };
