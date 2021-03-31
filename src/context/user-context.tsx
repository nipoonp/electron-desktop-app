import { useState, useEffect } from "react";
import * as React from "react";
import gql from "graphql-tag";
import { Logger, Auth } from "aws-amplify";
import { useMutation } from "react-apollo-hooks";
import { GET_USER, IGET_USER } from "../graphql/customQueries";
import { useGetUserQuery } from "../hooks/useGetUserQuery";
import { get } from "lodash";
import { Spinner } from "../tabin/components/spinner";
import { FullScreenSpinner } from "../tabin/components/fullScreenSpinner";

const logger = new Logger("UserContext");

// Queries
const REGISTER_USER = gql`
    mutation RegisterUser($id: ID!, $email: String, $firstName: String, $lastName: String, $identityPoolId: String) {
        registerUser(input: { id: $id, email: $email, firstName: $firstName, lastName: $lastName, identityPoolId: $identityPoolId }) {
            id
            firstName
            lastName
            email
        }
    }
`;

const UPDATE_USER = gql`
    mutation UpdateUser($userID: ID!, $firstName: String, $lastName: String) {
        updateUser(input: { id: $userID, firstName: $firstName, lastName: $lastName }) {
            id
            firstName
            lastName
        }
    }
`;

const UPDATE_USER_IDENTITY_POOL_ID = gql`
    mutation UpdateUser($id: ID!, $identityPoolId: String!) {
        updateUser(input: { id: $id, identityPoolId: $identityPoolId }) {
            id
            firstName
            lastName
            identityPoolId
        }
    }
`;

// Context
type ContextProps = {
    user: IGET_USER | null;
    isLoading: boolean;
    error: boolean;
    // userRefetch: () => Promise<IGET_USER | null>;
    // updateUser: (
    //   firstName?: string | null,
    //   lastName?: string | null
    // ) => Promise<any>;
};

const UserContext = React.createContext<ContextProps>({
    user: null,
    isLoading: true,
    error: false,
    // userRefetch: () => {
    //   return new Promise(() => {
    //     console.log("");
    //   });
    // },
    // updateUser: (firstName?: string | null, lastName?: string | null) => {
    //   return new Promise(() => {
    //     console.log("");
    //   });
    // },
});

// Exports
const C = (props: { userID: string | null; children: React.ReactNode }) => {
    // queries
    const { user: getUserData, error: getUserError, loading: getUserLoading, refetch: getUserRefetch } = useGetUserQuery(props.userID);
    // const registerUser = useMutation(REGISTER_USER);
    // const updateUserIdentityPoolId = useMutation(UPDATE_USER_IDENTITY_POOL_ID, {
    //   refetchQueries: [
    //     {
    //       query: GET_USER,
    //       variables: {
    //         userID: props.userID,
    //       },
    //     },
    //   ],
    //   awaitRefetchQueries: true,
    //   update: (_, result) => {
    //     logger.debug("Mutation result: ", result);
    //   },
    // });
    const updateUserMutation = useMutation(UPDATE_USER, {
        refetchQueries: [
            {
                query: GET_USER,
                variables: {
                    userID: props.userID,
                },
            },
        ],
        awaitRefetchQueries: true,
        update: (_, result) => {
            logger.debug("Mutation result: ", result);
        },
    });

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

            //TODO: UPDATE THIS
            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // Auth.currentUserCredentials()
            //   .then(currentUser => {
            //     console.log("currentUser: ", currentUser.identityId);
            //     console.log("getUserData: ", getUserData!.identityPoolId);

            //     if (getUserData!.identityPoolId !== currentUser.identityId) {
            //       updateUserIdentityPoolId({
            //         variables: {
            //           id: getUserData!.id,
            //           identityPoolId: currentUser.identityId
            //         }
            //       })
            //         .then(data => console.log("Updated user identityPoolId"))
            //         .catch((e) => { console.log("there was an error getting currentAuthenticatedUser", e) });
            //     }
            //   })
            //   .catch((e) => { console.log("there was an error getting currentAuthenticatedUser", e) });
            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        } else if (!getUserLoading) {
        }
    }, [getUserError, getUserLoading, getUserData]);

    // const updateUser = (firstName?: string | null, lastName?: string | null) => {
    //   let variables = {
    //     userID: props.userID,
    //     firstName: firstName,
    //     lastName: lastName,
    //   };

    //   if (firstName === null || firstName === undefined) {
    //     delete variables.firstName;
    //   }

    //   if (lastName === null || lastName === undefined) {
    //     delete variables.lastName;
    //   }

    //   return updateUserMutation({
    //     variables: variables,
    //   }).then((d) => {
    //     logger.debug("User updated: ", d);
    //   });
    // };

    // const userRefetch = (): Promise<IGET_USER | null> => {
    //   return getUserRefetch().then((d) => {
    //     return get(d, "data.getUser", null);
    //   });
    // };

    return (
        <UserContext.Provider
            value={{
                isLoading,
                user,
                error: contextError,
                // userRefetch,
                // updateUser,
            }}
            children={props.children}
        />
    );
};

const UserProvider = (props: { userID: string | null; children: React.ReactNode }) => {
    if (props.userID) {
        return <C {...props} />;
    } else {
        return (
            <UserContext.Provider
                value={{
                    isLoading: false,
                    user: null,
                    error: false,
                    // userRefetch: () => {
                    //   return new Promise(() => { });
                    // },
                    // updateUser: () => {
                    //   return new Promise(() => { });
                    // },
                }}
                children={props.children}
            />
        );
    }
};

const useUser = () => {
    const context = React.useContext(UserContext);
    if (context === undefined) {
        throw new Error(`useUser must be used within a UserProvider`);
    }
    return context;
};

export { UserProvider, useUser };
