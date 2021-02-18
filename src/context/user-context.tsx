import React, { useState, useEffect } from "react";
import gql from "graphql-tag";
import { Logger, Auth } from "aws-amplify";
import { useQuery, useMutation } from "react-apollo-hooks";
import {
  GET_USER,
  IGET_USER,
  // IGET_USER_ORDERS
} from "../graphql/customQueries";
// import { DELETE_CARD } from "../graphql/customMutations";
import { useGetUserQuery } from "../hooks/useGetUserQuery";
// import { useGetUserOrdersQuery } from "../hooks/useGetUserOrdersQuery";
import { ApolloError, ApolloQueryResult } from "apollo-client";
import { get } from "lodash";

const logger = new Logger("UserContext");

// Queries
const REGISTER_USER = gql`
  mutation RegisterUser(
    $id: ID!
    $email: String
    $firstName: String
    $lastName: String
    $identityPoolId: String
  ) {
    registerUser(
      input: {
        id: $id
        email: $email
        firstName: $firstName
        lastName: $lastName
        identityPoolId: $identityPoolId
      }
    ) {
      id
      firstName
      lastName
      email
    }
  }
`;

// const VERIFY_PHONE = gql`
//   mutation VerifyPhone($phoneNumber: String!) {
//     verifyPhone(input: { phoneNumber: $phoneNumber }) {
//       valid
//       status
//       to
//       channel
//     }
//   }
// `;

// const CONFIRM_PHONE = gql`
//   mutation ConfirmPhone($code: String!) {
//     confirmPhone(input: { code: $code }) {
//       valid
//       status
//       to
//       channel
//     }
//   }
// `;

const UPDATE_USER = gql`
  mutation UpdateUser($userID: ID!, $firstName: String, $lastName: String) {
    updateUser(
      input: { id: $userID, firstName: $firstName, lastName: $lastName }
    ) {
      id
      firstName
      lastName
    }
  }
`;

const UPDATE_USER_IDENTITY_POOL_ID = gql`
  mutation UpdateUser($id: ID!, $identityPoolId: String!) {
    updateUser(
      input: { id: $id, identityPoolId: $identityPoolId }
    ) {
      id
      firstName
      lastName
      identityPoolId
    }
  }
`;

// const TOP_UP_BALANCE = gql`
//   mutation TopUpBalance($id: ID!, $amount: Int!) {
//     topUpBalance(input: { id: $id, amount: $amount }) {
//       id
//       firstName
//       lastName
//       email
//       balance
//       useBalance
//       phoneNumber
//       phoneVerified
//     }
//   }
// `;

// const UPDATE_USE_BALANCE = gql`
//   mutation UpdateUseBalance($id: ID!, $useBalance: Boolean!) {
//     updateUseBalance(input: { id: $id, useBalance: $useBalance }) {
//       id
//       useBalance
//     }
//   }
// `;

// Context
type ContextProps = {
  user: IGET_USER | null;
  isLoading: boolean;
  error: boolean;
  userRefetch: () => Promise<IGET_USER | null>;
  // orders: IGET_USER_ORDERS | null;
  // ordersLoading: boolean;
  // ordersError?: ApolloError;
  // ordersFetchMore: (nextToken: string) => void;
  // ordersRefetch: (
  //   variables?:
  //     | {
  //         userID: string | null;
  //         sortDirection: "ASC" | "DESC";
  //         nextToken: string | null;
  //       }
  //     | undefined
  // ) => Promise<ApolloQueryResult<any>>;
  // verifyPhone: (phoneNumber: string) => Promise<any>;
  // confirmPhone: (code: string) => Promise<any>;
  // skipAddingPhone: boolean;
  // setSkipAddingPhone: () => void;
  updateUser: (
    firstName?: string | null,
    lastName?: string | null
  ) => Promise<any>;
  // updateUseBalance: (useBalance: boolean) => Promise<any>;
  // topUpBalance: (amount: number) => Promise<any>;
  // removeCard: () => Promise<any>;
};

const UserContext = React.createContext<ContextProps>({
  user: null,
  isLoading: true,
  error: false,
  userRefetch: () => {
    return new Promise(() => {
      console.log("");
    });
  },
  // orders: null,
  // ordersLoading: false,
  // ordersFetchMore: () => {},
  // ordersRefetch: () => {
  //   return new Promise(() => {
  //     console.log("");
  //   });
  // },
  // verifyPhone: (phoneNumber: string) => {
  //   return new Promise(() => {
  //     console.log("");
  //   });
  // },
  // confirmPhone: (code: string) => {
  //   return new Promise(() => {
  //     console.log("");
  //   });
  // },
  // skipAddingPhone: false,
  // setSkipAddingPhone: () => {},
  updateUser: (firstName?: string | null, lastName?: string | null) => {
    return new Promise(() => {
      console.log("");
    });
  },
  // updateUseBalance: (useBalance: boolean) => {
  //   return new Promise(() => {
  //     console.log("");
  //   });
  // },
  // topUpBalance: (amount: number) => {
  //   return new Promise(() => {
  //     console.log("");
  //   });
  // },
  // removeCard: () => {
  //   return new Promise(() => {
  //     console.log("");
  //   });
  // }
});

// Exports
const C = (props: { userID: string | null; children: React.ReactNode }) => {
  // queries
  const {
    user: getUserData,
    error: getUserError,
    loading: getUserLoading,
    refetch: getUserRefetch,
  } = useGetUserQuery(props.userID);
  // const {
  //   orders: getUserOrdersData,
  //   error: getUserOrdersError,
  //   loading: getUserOrdersLoading,
  //   fetchMore: getUserOrdersFetchMore,
  //   refetch: getUserOrdersRefetch
  // } = useGetUserOrdersQuery(props.userID, "DESC");
  const registerUser = useMutation(REGISTER_USER);
  const updateUserIdentityPoolId = useMutation(UPDATE_USER_IDENTITY_POOL_ID, {
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
  // const verifyPhoneMutation = useMutation(VERIFY_PHONE, {
  //   refetchQueries: [{ query: GET_USER, variables: { userID: props.userID } }],
  //   awaitRefetchQueries: true,
  //   update: (_, result) => {
  //     logger.debug("Mutation result: ", result);
  //   }
  // });
  // const confirmPhoneMutation = useMutation(CONFIRM_PHONE, {
  //   refetchQueries: [{ query: GET_USER, variables: { userID: props.userID } }],
  //   awaitRefetchQueries: true,
  //   update: (_, result) => {
  //     logger.debug("Mutation result: ", result);
  //   }
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
  // const updateUseBalanceMutation = useMutation(UPDATE_USE_BALANCE, {
  //   refetchQueries: [
  //     {
  //       query: GET_USER,
  //       variables: {
  //         userID: props.userID
  //       }
  //     }
  //   ],
  //   awaitRefetchQueries: true,
  //   update: (_, result) => {
  //     logger.debug("Mutation result: ", result);
  //   }
  // });
  // const topUpBalanceMutation = useMutation(TOP_UP_BALANCE, {
  //   update: (_, result) => {
  //     logger.debug("Mutation result: ", result);
  //   }
  // });
  // const removeCardMutation = useMutation(DELETE_CARD, {
  //   update: (_, result) => {
  //     logger.debug("Mutation result: ", result);
  //   }
  // });

  // states
  // const [skipAddingPhone, setSkipAddingPhone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<IGET_USER | null>(null);
  const [contextError, setContextError] = useState(false);

  // Track user signed in
  // useEffect(() => {
  //   if (user) {
  //     window.analytics.identify(user.id, {
  //       name: user.firstName + " " + user.lastName,
  //       email: user.email,
  //       // phone: user.phoneNumber,
  //     });
  //   }
  // }, [user]);

  // Fetch/create user from/in DB
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
       Auth.currentUserCredentials()
       .then(currentUser => {
       console.log("currentUser: " , currentUser.identityId);
       console.log("getUserData: " , getUserData!.identityPoolId);

       if(getUserData!.identityPoolId !== currentUser.identityId){
        updateUserIdentityPoolId({
          variables: {
            id: getUserData!.id,
            identityPoolId: currentUser.identityId
          }
        })
        .then(data => console.log("Updated user identityPoolId"))
        .catch((e) => {console.log("there was an error getting currentAuthenticatedUser", e)});
       }
      })
      .catch((e) => {console.log("there was an error getting currentAuthenticatedUser", e)});
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    } else if (!getUserLoading) {
      // registering user
      // logger.debug("xxx...Registering user");
      // logger.debug("xxx...getUserData", getUserData);
      // Auth.currentUserInfo().then((currentUser) => {
      //   logger.debug("xxx...", currentUser);
      //   registerUser({
      //     variables: {
      //       id: currentUser.username,
      //       email: currentUser.attributes.email,
      //       firstName: currentUser.attributes.name,
      //       lastName: currentUser.attributes.family_name,
      //       identityPoolId: currentUser.id,
      //     },
      //   })
      //     .then((d) => {
      //       logger.debug("Registered user: ", d);
      //       setUser(d.data.registerUser);
      //       setIsLoading(false);
      //     })
      //     .catch((e) => {
      //       // Error: GraphQL error: The conditional request failed(Service: AmazonDynamoDBv2; Status Code: 400; Error Code: ConditionalCheckFailedException; Request ID: HBQILJ7FGF630RGA1BSU0B1G63VV4KQNSO5AEMVJF66Q9ASUAAJG)
      //       logger.error("Failed to register user: ", e);
      //       setContextError(true);
      //       setIsLoading(false);
      //     });
      // });
    }
  }, [getUserError, getUserLoading, getUserData]);

  // Get "skipAddingPhone" from local storage
  // useEffect(() => {
  //   // TODO: user based
  //   // different users on a device will have only have one skipAddingPhone
  //   const s = localStorage.getItem("skipAddingPhone");
  //   logger.debug("Local storage's skipAddingPhone: ", s);
  //   if (s !== null) {
  //     const b = JSON.parse(s);
  //     if (typeof b === "boolean") {
  //       setSkipAddingPhone(b);
  //     }
  //   }
  // }, []);

  // functions
  // const verifyPhone = (phone: string) => {
  //   return verifyPhoneMutation({ variables: { phoneNumber: phone } }).then(
  //     d => {
  //       logger.debug("Phone verified: ", d);
  //     }
  //   );
  // };
  // const confirmPhone = (code: string) => {
  //   return confirmPhoneMutation({ variables: { code: code } }).then(d => {
  //     logger.debug("Phone confirmed: ", d);
  //   });
  // };
  const updateUser = (firstName?: string | null, lastName?: string | null) => {
    let variables = {
      userID: props.userID,
      firstName: firstName,
      lastName: lastName,
    };

    if (firstName === null || firstName === undefined) {
      delete variables.firstName;
    }

    if (lastName === null || lastName === undefined) {
      delete variables.lastName;
    }

    return updateUserMutation({
      variables: variables,
    }).then((d) => {
      logger.debug("User updated: ", d);
    });
  };
  // const updateUseBalance = (useBalance: boolean) => {
  //   return updateUseBalanceMutation({
  //     variables: {
  //       id: props.userID,
  //       useBalance: useBalance
  //     }
  //   }).then(d => {
  //     logger.debug("Use balance up: ", d);
  //   });
  // };
  // const topUpBalance = (amount: number) => {
  //   return topUpBalanceMutation({
  //     variables: {
  //       id: props.userID,
  //       amount: amount
  //     }
  //   }).then(d => {
  //     logger.debug("Balance topped up: ", d);
  //   });
  // };
  // const removeCard = () => {
  //   return removeCardMutation({
  //     variables: {
  //       id: props.userID
  //     }
  //   }).then(d => {
  //     logger.debug("Card removed: ", d);
  //   });
  // };

  const userRefetch = (): Promise<IGET_USER | null> => {
    return getUserRefetch().then((d) => {
      return get(d, "data.getUser", null);
    });
  };

  return (
    <UserContext.Provider
      value={{
        isLoading,
        user,
        error: contextError,
        userRefetch,
        // orders: getUserOrdersData,
        // ordersLoading: getUserOrdersLoading,
        // ordersError: getUserOrdersError,
        // ordersFetchMore: getUserOrdersFetchMore,
        // ordersRefetch: getUserOrdersRefetch,
        // verifyPhone,
        // confirmPhone,
        // skipAddingPhone,
        // setSkipAddingPhone: () => {
        //   localStorage.setItem("skipAddingPhone", "true");
        //   setSkipAddingPhone(true);
        // },
        updateUser,
        // updateUseBalance,
        // topUpBalance,
        // removeCard
      }}
      children={props.children}
    />
  );
};

const UserProvider = (props: {
  userID: string | null;
  children: React.ReactNode;
}) => {
  if (props.userID) {
    return <C {...props} />;
  } else {
    return (
      <UserContext.Provider
        value={{
          isLoading: false,
          user: null,
          error: false,
          userRefetch: () => {
            return new Promise(() => {});
          },
          // orders: null,
          // ordersLoading: false,
          // ordersFetchMore: () => {},
          // ordersRefetch: () => {
          //   return new Promise(() => {});
          // },
          // verifyPhone: () => {
          //   return new Promise(() => {});
          // },
          // confirmPhone: () => {
          //   return new Promise(() => {});
          // },
          // skipAddingPhone: false,
          // setSkipAddingPhone: () => {},
          updateUser: () => {
            return new Promise(() => {});
          },
          // updateUseBalance: () => {
          //   return new Promise(() => {});
          // },
          // topUpBalance: () => {
          //   return new Promise(() => {});
          // },
          // removeCard: () => {
          //   return new Promise(() => {});
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
