import React, {  FunctionComponent } from "react";
import {
  Router,
  Route,
  Switch,
  Redirect,
  RouteComponentProps,
  RouteProps,
} from "react-router-dom";
import { Restaurant } from "./page/restaurant";
import { NoMatch } from "./page/error/404";
import Unauthorised from "./page/error/unauthorised";
import Modal from "react-modal";
import { Login } from "./page/auth/login";
import { Checkout } from "./page/checkout";
import { useAuth, AuthenticationStatus } from "../context/auth-context";

import "react-toastify/dist/ReactToastify.min.css";
import { Logger } from "aws-amplify";
import { useUser } from "../context/user-context";
import { ToastContainer } from "../tabin/components/toast";
import { RegisterList } from "./page/registerList";
import { createBrowserHistory } from "history";
import { useAuthRedirectURL } from "../hooks/useAuthRedirectURL";
import { FullScreenSpinner } from "../tabin/components/fullScreenSpinner";
import { BeginOrder } from "./page/beginOrder";
import { OrderType } from "./page/orderType";
import { ConfigureNewEftpos } from "./page/configureNewEftpos";
import { TableNumber } from "./page/tableNumber";
import { useRegister } from "../context/register-context";

// reset scroll position on change of route
// https://stackoverflow.com/a/46868707/11460922
export const history = createBrowserHistory();

history.listen((location, action) => {
  window.scrollTo(0, 0);
});

const logger = new Logger("Main");

Modal.setAppElement("#root");

// Auth routes
// If new auth path is added, add reference to it inside setAuthRedirectPath function in auth context
export const authRedirectPath = "/auth_redirect";
export const loginPath = "/login";
export const signUpPath = "/signup";
export const signUpConfirmPath = "/signup_confirm";
export const forgotPasswordPath = "/forgot_password";
export const forgotPasswordResetPath = "/forgot_password_reset";
export const newInformationRequiredPath = "/new_information_required";
export const landingPath = "/";
export const registerListPath = "/register_list";
export const configureNewEftposPath = "/configure_new_eftpos";
export const beginOrderPath = "/begin_order";
export const orderTypePath = "/order_type";
export const tableNumberPath = "/table_number";
export const restaurantPath = "/restaurant";
export const dashboardPath = "/dashboard";
export const checkoutPath = "/checkout";
export const createRestaurantPath = "/create_restaurant";
export const unauthorizedPath = "/unauthorized";

export default () => {
  return (
    <>
      <Router history={history}>
        <Routes />
      </Router>
      <ToastContainer />
    </>
  );
};

const Routes = () => {
  useAuthRedirectURL();

  return (
    <Switch>
      <Route exact path={loginPath} component={Login} />
      <PrivateRoute exact path={registerListPath} component={RegisterList} />
      <RegisterPrivateRoute
        exact
        path={configureNewEftposPath}
        component={ConfigureNewEftpos}
      />
      <RegisterPrivateRoute
        exact
        path={beginOrderPath}
        component={BeginOrder}
      />
      <RegisterPrivateRoute exact path={orderTypePath} component={OrderType} />
      <RegisterPrivateRoute
        exact
        path={tableNumberPath}
        component={TableNumber}
      />
      <RegisterPrivateRoute exact path={checkoutPath} component={Checkout} />
      <RegisterPrivateRoute
        exact
        path={`${restaurantPath}/:restaurantId`}
        component={(props: RouteComponentProps<any>) => (
          <Restaurant
            restaurantID={props.match.params.restaurantId}
            {...props}
          />
        )}
      />
      <Route exact path={unauthorizedPath} component={Unauthorised} />
      <Route component={NoMatch} />
    </Switch>
  );
};

export const AdminOnlyRoute: FunctionComponent<PrivateRouteProps> = ({
  component: Component,
  path: Path,
  ...rest
}) => {
  const { isAdmin, status } = useAuth();
  const { user, isLoading } = useUser();

  // Handle other authentication statuses
  if (status !== AuthenticationStatus.SignedIn) {
    return (
      <Route
        {...rest}
        render={(props) => (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: props.location },
            }}
          />
        )}
      />
    );
  }

  // Assumed signed in from this point onwards
  if (isLoading) {
    return <FullScreenSpinner show={true} text="Loading user" />;
  }

  // not authorized
  if (!isAdmin) {
    return (
      <Route
        {...rest}
        render={(props) => (
          <Redirect
            to={{
              pathname: unauthorizedPath,
              state: { from: props.location },
            }}
          />
        )}
      />
    );
  }

  // Route to original path
  return <Route {...rest} component={Component} />;
};

const PrivateRoute: FunctionComponent<PrivateRouteProps> = ({
  component: Component,
  ...rest
}) => {
  const { status } = useAuth();
  const { user, isLoading } = useUser();

  // Handle other authentication statuses
  if (status !== AuthenticationStatus.SignedIn) {
    return (
      <Route
        {...rest}
        render={(props) => (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: props.location },
            }}
          />
        )}
      />
    );
  }

  // Assumed signed in from this point onwards
  if (isLoading) {
    return <FullScreenSpinner show={true} text="Loading user" />;
  }

  if (!user) {
    throw "Signed in but no user found in database";
  }

  // Route to original path
  return <Route {...rest} component={Component} />;
};

interface PrivateRouteProps extends RouteProps {
  component:
    | React.ComponentType<RouteComponentProps<any>>
    | React.ComponentType<any>;
}

const RegisterPrivateRoute: FunctionComponent<PrivateRouteProps> = ({
  component: Component,
  ...rest
}) => {
  const { register } = useRegister();

  return register ? (
    <PrivateRoute {...rest} component={Component} />
  ) : (
    <Route
      {...rest}
      render={(props) => (
        <Redirect
          to={{
            pathname: registerListPath,
            state: { from: props.location },
          }}
        />
      )}
    />
  );
};