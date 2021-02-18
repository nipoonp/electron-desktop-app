import React, { useState, useEffect, useReducer } from "react";
import { useAsync } from "react-async";
import { Auth } from "aws-amplify";
import { Hub, Logger } from "aws-amplify";
import { HubCapsule } from "@aws-amplify/core/lib/Hub";
import { ICognitoUser } from "../model/model";
import {
  loginPath,
  signUpPath,
  signUpConfirmPath,
  forgotPasswordPath,
  forgotPasswordResetPath,
  newInformationRequiredPath,
  // verifyPhonePath,
  // verifyPhoneConfirmPath,
  // profilePath,
  // notifyPath,
  // betaInvitationPath,
  authRedirectPath,
} from "../components/main";

const logger = new Logger("AuthContext");

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
  register: (
    email: string,
    password: string,
    name: string,
    lastName: string
  ) => Promise<any>;
  // For admin created accounts
  completeNewPassword: (
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<any>;
  confirmEmail: (email: string, confirmationCode: string) => Promise<any>;
  resendCode: (email: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  forgotPasswordSubmit: (
    email: string,
    password: string,
    verificationCode: string
  ) => Promise<any>;
  updateUserAttributes: (userAttributes: object) => Promise<any>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<any>;
  status: AuthenticationStatus;
  user?: ICognitoUser;
  email?: string;
  isAdmin: boolean;
  setAuthRedirectPath: (currentPath: string) => void;
};

// FACTORIES
const confirmEmailFactory = (email: string, password: string) => {
  return (email: string, confirmationCode: string) => {
    logger.info("Checking verification code...");
    return Auth.confirmSignUp(email, confirmationCode).then((data) => {
      login(email, password);
    });
  };
};

// METHODS
const login = (email: string, password: string) => {
  logger.info("Logging in...");

  return Auth.signIn(email, password);
};

const logout = () => {
  logger.info("Logging out...");
  // window.analytics.reset();
  return Auth.signOut().then((data) => {
    // need to clear cognitoIdentityID in localstorage after signing out

    // Keep the local storage registerKey
    const registerKey = localStorage.getItem("registerKey");

    localStorage.clear();

    if (registerKey) {
      localStorage.setItem("registerKey", registerKey);
    }
  });
};

const getUser = async () => {
  logger.info("GetUser");
  return Auth.currentAuthenticatedUser({
    bypassCache: true, // Optional, By default is false. If set to true, this call will send a request to Cognito to get the latest user data
  }).catch((err) => logger.error("Error: ", err));
};

const resendCode = (email: string) => {
  logger.info("Resending code ...");
  return Auth.resendSignUp(email).catch((err) => logger.info("Error: ", err));
};

const checkIfUserIsAdmin = (data: any) => {
  let admin = false;

  data.signInUserSession.idToken &&
    data.signInUserSession.idToken.payload["cognito:groups"] &&
    data.signInUserSession.idToken.payload["cognito:groups"].map(
      (group: string) => {
        if (group === "Admin") {
          admin = true;
        }
      }
    );

  return admin;
};

// CONTEXT
const AuthContext = React.createContext<ContextProps>({
  login: login,
  logout: logout,
  register: (
    email: string,
    password: string,
    name: string,
    lastName: string
  ) => {
    return new Promise(() => {
      console.log("");
    });
  },
  completeNewPassword: (
    password: string,
    firstName: string,
    lastName: string
  ) => {
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
  forgotPasswordSubmit: (
    email: string,
    password: string,
    verificationCode: string
  ) => {
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
  setAuthRedirectPath: (currentPath: string) => {},
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
      user: ICognitoUser;
      email: string;
      password: string;
    }
  // | { type: "signIn_failure"; code: string }
  | { type: "unconfirmedForgotPassword"; email: string }
  | { type: "configured"; user: ICognitoUser };

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
        // user: user,
        status: AuthenticationStatus.SignedIn,
        // email: user.attributes.email,
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
        user: action.user,
        email: action.email,
        password: action.password,
        status: AuthenticationStatus.NewInformationRequired,
      };

    // case "signIn_failure":
    //   if (action.code == "UserNotConfirmedException") {
    //     return {
    //       ...state,
    //       status: AuthenticationStatus.NeedConfirmation
    //     };
    //   }
    // return { ...state };

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

  const listener = async (data: HubCapsule) => {
    // TODO remove listener, use the methods' Promise
    // i.e. then(dispatch(...)).catch(dispatch(...))
    // then in login component, don't have to get status before routing
    // because .then will be instant
    // unlike logging in, waiting for listener, then dispatch, then update state
    switch (data.payload.event) {
      case "signIn":
        logger.info("User signed in"); //[INFO] My-Logger - user signed in
        // need to get user to get the attributes
        // when signed in via google/ facebook, Hub's data does not contain user attributes
        let user = null;
        try {
          user = await getUser();
        } catch (e) {
          logger.error(e);
        }

        const isAdmin = checkIfUserIsAdmin(user);

        dispatch({ type: "signIn", user: user, isAdmin: isAdmin });
        break;
      case "signUp":
        logger.info("user signed up");
        dispatch({ type: "signUp", user: data.payload.data.user });
        break;
      case "signOut":
        logger.info("user signed out");
        dispatch({ type: "signOut" });
        break;
      case "signIn_failure":
        logger.info("user sign in failed");
        // // TODO: SET EMAIL HERE
        // if (data.payload.data.code === "UserNotConfirmedException") {
        //   logger.debug("Data: ", data);
        //   debugger;
        //   dispatch({
        //     type: "unconfirmedSignIn",
        //     email: data,
        //     password: data.payload
        //   });
        // }

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

  React.useLayoutEffect(() => {
    logger.info("useLayoutEffect, isSettled: ", isSettled);
    if (isSettled) {
      setFirstAttemptFinished(true);
      if (data && data.attributes && data.signInUserSession) {
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
    Hub.listen("auth", listener);
    return () => {
      Hub.remove("auth", listener);
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
          return Auth.signIn(email, password)
            .then((data) => {
              if (data.challengeName === "NEW_PASSWORD_REQUIRED") {
                dispatch({
                  user: data,
                  type: "newInformationRequired",
                  email: email,
                  password: password,
                });
              }
            })
            .catch((error) => {
              if (error.code === "UserNotConfirmedException") {
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
          return Auth.signUp({
            username: email,
            password,
            attributes: { name: name, family_name: lastName },
          }).then(() => {
            dispatch({
              type: "unconfirmedSignUp",
              email: email,
              password: password,
            });
          });
        },
        completeNewPassword: (
          password: string,
          firstName: string,
          lastName: string
        ) => {
          return Auth.completeNewPassword(state.user, password, {
            family_name: lastName,
            name: firstName,
          });
        },
        // MAKE SURE CONFIRM EMAIL IS ONLY USED AFTER REGISTER
        confirmEmail: confirmEmailFactory(state.email!, state.password!),
        forgotPassword: (email) => {
          return Auth.forgotPassword(email).then(() => {
            dispatch({
              type: "unconfirmedForgotPassword",
              email: email,
            });
          });
        },
        updateUserAttributes: (userAttributes: object) => {
          Auth.updateUserAttributes(state.user, userAttributes);
        },
        changePassword: (oldPassword: string, newPassword: string) => {
          return Auth.changePassword(state.user, oldPassword, newPassword);
        },
        resendCode: resendCode,
        email: state.email,
        user: state.user,
        status: state.status,
        isAdmin: state.isAdmin,
        setAuthRedirectPath: (currentPath: string) => {
          const authPathIgnoreList = [
            loginPath,
            signUpPath,
            signUpConfirmPath,
            forgotPasswordPath,
            forgotPasswordResetPath,
            newInformationRequiredPath,
            // verifyPhonePath,
            // verifyPhoneConfirmPath,
            // profilePath,
            // notifyPath,
            // betaInvitationPath,
            authRedirectPath,
            authRedirectPath + "/",
          ];

          const isIgnorePath = authPathIgnoreList.find(
            (path) => path === currentPath
          );

          // We do not want to redirect back to an auth path ie. redirect back to login page, doesn't make sense
          if (!isIgnorePath) {
            sessionStorage.setItem("authRedirectPath", currentPath);
          }
        },
      }}
      {...props}
    />
  );
}

function useAuth(): ContextProps {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error(`useAuth must be used within a AuthProvider`);
  }
  return context;
}

export { AuthProvider, useAuth };
