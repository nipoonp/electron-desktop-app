import { createContext, useLayoutEffect, useContext, useState, useEffect, useReducer } from "react";
import { useAsync } from "react-async";
import {
    confirmSignIn,
    confirmSignUp,
    fetchAuthSession,
    fetchUserAttributes,
    getCurrentUser,
    resendSignUpCode,
    resetPassword,
    signIn,
    signOut,
    signUp,
    updatePassword,
    updateUserAttributes,
} from "aws-amplify/auth";
import { ConsoleLogger, Hub } from "aws-amplify/utils";
import { ICognitoUser } from "../model/model";
import { loginPath } from "../components/main";

const logger = new ConsoleLogger("AuthContext");

// TYPES
export enum AuthenticationStatus {
    Loading,
    SignedIn,
    UnconfirmedSignIn,
    NewInformationRequired,
    NeedConfirmation,
    Unauthenticated,
}

// https://fettblog.eu/typescript-react/context/
// We define our type for the context properties right here
type ContextProps = {
    login: (email: string, password: string) => Promise<any>;
    logout: () => Promise<any>;
    register: (email: string, password: string, name: string, lastName: string) => Promise<any>;
    // For admin created accounts
    completeNewPassword: (password: string, firstName: string, lastName: string) => Promise<any>;
    confirmEmail: (email: string, confirmationCode: string) => Promise<any>;
    resendCode: (email: string) => Promise<any>;
    forgotPassword: (email: string) => Promise<any>;
    forgotPasswordSubmit: (email: string, password: string, verificationCode: string) => Promise<any>;
    updateUserAttributes: (userAttributes: object) => Promise<any>;
    changePassword: (oldPassword: string, newPassword: string) => Promise<any>;
    status: AuthenticationStatus;
    user?: ICognitoUser;
    email?: string;
    isAdmin: boolean;
};

// FACTORIES
const confirmEmailFactory = (email: string, password: string) => {
    return (email: string, confirmationCode: string) => {
        logger.info("Checking verification code...");
        return confirmSignUp({ username: email, confirmationCode }).then((data) => {
            login(email, password);
        });
    };
};

// METHODS
const login = (email: string, password: string) => {
    logger.info("Logging in...");

    return signIn({ username: email, password });
};

const logout = () => {
    logger.info("Logging out...");
    // window.analytics.reset();
    return signOut().then((data) => {
        // need to clear cognitoIdentityId in localstorage after signing out
        localStorage.clear();
    });
};

// Builds the user object the rest of the app reads (username, attributes and admin groups).
const getUser = async (): Promise<ICognitoUser | null> => {
    logger.info("GetUser");
    try {
        const { username } = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        const { tokens } = await fetchAuthSession();
        const groups = (tokens?.idToken?.payload["cognito:groups"] as string[] | undefined) || [];

        return { username, attributes: attributes as unknown as ICognitoUser["attributes"], groups };
    } catch (err) {
        logger.error("Error: ", err);
        return null;
    }
};

const resendCode = (email: string) => {
    logger.info("Resending code ...");
    return resendSignUpCode({ username: email }).catch((err) => logger.info("Error: ", err));
};

const checkIfUserIsAdmin = (data: ICognitoUser | null) => {
    return !!data?.groups?.includes("Admin");
};

// CONTEXT
const AuthContext = createContext<ContextProps>({
    login: login,
    logout: logout,
    register: (email: string, password: string, name: string, lastName: string) => {
        return new Promise(() => {
            console.log("");
        });
    },
    completeNewPassword: (password: string, firstName: string, lastName: string) => {
        return new Promise(() => {
            console.log("");
        });
    },
    confirmEmail: (email: string, confirmationCode: string) => {
        return new Promise(() => {
            console.log("");
        });
    },
    forgotPassword: (email: string) => {
        return new Promise(() => {
            console.log("");
        });
    },
    forgotPasswordSubmit: (email: string, password: string, verificationCode: string) => {
        return new Promise(() => {
            console.log("");
        });
    },
    updateUserAttributes: (userAttributes: object) => {
        return new Promise(() => {
            console.log("");
        });
    },
    changePassword: (oldPassword: string, newPassword: string) => {
        return new Promise(() => {
            console.log("");
        });
    },
    status: AuthenticationStatus.Unauthenticated,
    resendCode: resendCode,
    isAdmin: false,
});

// REDUCER
interface IState {
    user: ICognitoUser | null;
    status: AuthenticationStatus;
    email: string | null;
    password: string | null;
    isAdmin: boolean;
}
const initialState: IState = {
    user: null,
    status: AuthenticationStatus.Loading,
    email: null,
    password: null,
    isAdmin: false,
};

type Action =
    | { type: "loaded" }
    | { type: "signIn"; user: ICognitoUser; isAdmin: boolean }
    | { type: "unconfirmedSignUp"; password: string; email: string }
    | { type: "signUp"; user: ICognitoUser }
    | { type: "signOut" }
    | { type: "unconfirmedSignIn"; email: string; password: string }
    | {
          type: "newInformationRequired";
          email: string;
          password: string;
      }
    | { type: "unconfirmedForgotPassword"; email: string }
    | { type: "configured"; user: ICognitoUser | null };

const reducer = (state: IState, action: Action) => {
    logger.info("Dispatching ", action.type);
    switch (action.type) {
        case "loaded":
            return {
                ...state,
                status: AuthenticationStatus.Unauthenticated,
            };
        case "signIn":
            return {
                ...state,
                user: action.user,
                status: AuthenticationStatus.SignedIn,
                email: action.user.attributes.email,
                password: null,
                isAdmin: action.isAdmin,
            };
        case "unconfirmedSignUp":
            return {
                ...state,
                email: action.email,
                password: action.password,
            };
        case "signUp":
            return {
                ...state,
                user: action.user,
                status: AuthenticationStatus.NeedConfirmation,
                email: action.user.username,
                password: null,
            };
        case "signOut":
            return {
                ...state,
                user: null,
                status: AuthenticationStatus.Unauthenticated,
                email: null,
                password: null,
            };
        case "unconfirmedSignIn":
            return {
                ...state,
                email: action.email,
                password: action.password,
                status: AuthenticationStatus.UnconfirmedSignIn,
            };
        case "newInformationRequired":
            return {
                ...state,
                email: action.email,
                password: action.password,
                status: AuthenticationStatus.NewInformationRequired,
            };
        case "unconfirmedForgotPassword":
            return {
                ...state,
                email: action.email,
            };
        case "configured":
            return {
                ...state,
                user: action.user,
            };
        default:
            throw new Error("Unexpected action");
    }
};

// EXPORTS
function AuthProvider(props: any) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const listener = async (data: { payload: { event: string } }) => {
        // TODO remove listener, use the methods' Promise
        // i.e. then(dispatch(...)).catch(dispatch(...))
        // then in login component, don't have to get status before routing
        // because .then will be instant
        // unlike logging in, waiting for listener, then dispatch, then update state
        switch (data.payload.event) {
            case "signedIn":
                logger.info("User signed in"); //[INFO] My-Logger - user signed in
                // need to get user to get the attributes
                // when signed in via google/ facebook, Hub's data does not contain user attributes
                let user: ICognitoUser | null = null;
                try {
                    user = await getUser();
                } catch (e) {
                    logger.error(e);
                }

                if (!user) {
                    dispatch({ type: "loaded" });
                    break;
                }

                const isAdmin = checkIfUserIsAdmin(user);

                dispatch({ type: "signIn", user: user, isAdmin: isAdmin });
                break;
            case "signedOut":
                logger.info("user signed out");
                dispatch({ type: "signOut" });
                break;
            case "configured":
                logger.info("the Auth module is configured");
                getUser().then((user) => dispatch({ type: "configured", user: user }));
        }
    };

    logger.info("In provider...");
    const { data, error, isRejected, isPending, isSettled } = useAsync({
        promiseFn: getUser,
    });
    const [firstAttemptFinished, setFirstAttemptFinished] = useState(false);

    useLayoutEffect(() => {
        logger.info("useLayoutEffect, isSettled: ", isSettled);
        if (isSettled) {
            setFirstAttemptFinished(true);
            if (data && data.attributes && data.groups) {
                logger.info("User signed in");

                const isAdmin = checkIfUserIsAdmin(data);

                dispatch({ type: "signIn", user: data, isAdmin: isAdmin });
            } else {
                logger.info("No user");
                dispatch({ type: "loaded" });
            }
        }
    }, [isSettled]);

    useEffect(() => {
        // Hub.listen returns the unsubscribe function in Amplify v6
        const unsubscribe = Hub.listen("auth", listener);
        return () => {
            unsubscribe();
        };
    }, []);

    if (!firstAttemptFinished) {
        if (isPending) {
            logger.debug("isPending");
            // return <Spin />;
            return <></>;
        }
        if (isRejected) {
            logger.debug("isRejected");
            return (
                <div style={{ color: "red" }}>
                    <p>Uh oh... There's a problem. Try refreshing the app.</p>
                    {!!error && <pre>{error.message}</pre>}
                </div>
            );
        }
    }

    return (
        <AuthContext.Provider
            value={{
                login: (email: string, password: string) => {
                    return signIn({ username: email, password })
                        .then((result) => {
                            if (result.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
                                dispatch({
                                    type: "newInformationRequired",
                                    email: email,
                                    password: password,
                                });
                            } else if (result.nextStep.signInStep === "CONFIRM_SIGN_UP") {
                                resendCode(email);
                                dispatch({
                                    type: "unconfirmedSignIn",
                                    email: email,
                                    password: password,
                                });
                            }
                        })
                        .catch((error) => {
                            if (error.name === "UserNotConfirmedException") {
                                resendCode(email);
                                dispatch({
                                    type: "unconfirmedSignIn",
                                    email: email,
                                    password: password,
                                });
                            } else {
                                logger.error("Error: ", error);
                                throw error;
                            }
                        });
                },
                logout: logout,
                register: (email, password, name: string, lastName: string) => {
                    logger.info("Registering...");
                    return signUp({
                        username: email,
                        password,
                        options: { userAttributes: { name: name, family_name: lastName } },
                    }).then(() => {
                        dispatch({
                            type: "unconfirmedSignUp",
                            email: email,
                            password: password,
                        });
                    });
                },
                completeNewPassword: (password: string, firstName: string, lastName: string) => {
                    return confirmSignIn({
                        challengeResponse: password,
                        options: {
                            userAttributes: {
                                family_name: lastName,
                                name: firstName,
                            },
                        },
                    });
                },
                // MAKE SURE CONFIRM EMAIL IS ONLY USED AFTER REGISTER
                confirmEmail: confirmEmailFactory(state.email!, state.password!),
                forgotPassword: (email) => {
                    return resetPassword({ username: email }).then(() => {
                        dispatch({
                            type: "unconfirmedForgotPassword",
                            email: email,
                        });
                    });
                },
                updateUserAttributes: (userAttributes: object) => {
                    return updateUserAttributes({ userAttributes: userAttributes as Record<string, string> });
                },
                changePassword: (oldPassword: string, newPassword: string) => {
                    return updatePassword({ oldPassword, newPassword });
                },
                resendCode: resendCode,
                email: state.email,
                user: state.user,
                status: state.status,
                isAdmin: state.isAdmin,
            }}
            {...props}
        />
    );
}

function useAuth(): ContextProps {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error(`useAuth must be used within a AuthProvider`);
    }
    return context;
}

export { AuthProvider, useAuth };
