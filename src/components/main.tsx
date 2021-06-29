import { FunctionComponent, useEffect } from "react";

import { Router, Route, Switch, Redirect, RouteComponentProps, RouteProps, useHistory } from "react-router-dom";
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
import { RestaurantList } from "./page/restaurantList";
import { RegisterList } from "./page/registerList";
import { createBrowserHistory } from "history";
import { FullScreenSpinner } from "../tabin/components/fullScreenSpinner";
import { BeginOrder } from "./page/beginOrder";
import { OrderType } from "./page/orderType";
import { ConfigureNewEftpos } from "./page/configureNewEftpos";
import { TableNumber } from "./page/tableNumber";
import { IGET_RESTAURANT_REGISTER } from "../graphql/customQueries";
import { useRestaurant } from "../context/restaurant-context";
import { Logout } from "./page/auth/logout";

let electron: any;
let ipcRenderer: any;
try {
    electron = window.require("electron");
    ipcRenderer = electron.ipcRenderer;
} catch (e) {}

// reset scroll position on change of route
// https://stackoverflow.com/a/46868707/11460922
export const history = createBrowserHistory();

history.listen((location, action) => {
    window.scrollTo(0, 0);
});

const logger = new Logger("Main");

Modal.setAppElement("#root");

// Auth routes
export const loginPath = "/login";
export const restaurantListPath = "/restaurant_list";
export const registerListPath = "/register_list";
export const configureNewEftposPath = "/configure_new_eftpos";
export const beginOrderPath = "/";
export const orderTypePath = "/order_type";
export const tableNumberPath = "/table_number";
export const restaurantPath = "/restaurant";
export const checkoutPath = "/checkout";
export const logoutPath = "/log_out";
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
    const history = useHistory();

    let timerId: NodeJS.Timeout;

    // This is for electron, as it doesn't start at '/' route for some reason.
    useEffect(() => {
        history.push(beginOrderPath);
    }, []);

    useEffect(() => {
        document.body.onmousedown = () => {
            timerId = setTimeout(() => {
                ipcRenderer && ipcRenderer.send("SHOW_CONTEXT_MENU");
            }, 2000);
        };

        document.body.onmouseup = () => {
            clearTimeout(timerId);
        };

        ipcRenderer &&
            ipcRenderer.on("CONTEXT_MENU_COMMAND", (e: any, command: any) => {
                switch (command) {
                    case "kioskMode":
                        history.push(beginOrderPath);
                        break;
                    case "configureEftposAndPrinters":
                        history.push(configureNewEftposPath);
                        break;
                    case "configureRestaurant":
                        history.push(restaurantListPath);
                        break;
                    case "configureRegister":
                        history.push(registerListPath);
                        break;
                    case "logout":
                        history.push(logoutPath);
                        break;
                    default:
                        break;
                }
            });
    }, []);

    return (
        <Switch>
            <Route exact path={loginPath} component={Login} />
            <Route exact path={logoutPath} component={Logout} />
            <PrivateRoute exact path={restaurantListPath} component={RestaurantList} />
            <PrivateRoute exact path={registerListPath} component={RegisterList} />
            <RestaurantRegisterPrivateRoute exact path={configureNewEftposPath} component={ConfigureNewEftpos} />
            <RestaurantRegisterPrivateRoute exact path={beginOrderPath} component={BeginOrder} />
            <RestaurantRegisterPrivateRoute exact path={orderTypePath} component={OrderType} />
            <RestaurantRegisterPrivateRoute exact path={tableNumberPath} component={TableNumber} />
            <RestaurantRegisterPrivateRoute exact path={checkoutPath} component={Checkout} />
            <RestaurantRegisterPrivateRoute
                exact
                path={`${restaurantPath}/:restaurantId/:selectedCategoryId?/:selectedProductId?`}
                component={(props: RouteComponentProps<any>) => {
                    return (
                        <Restaurant
                            restaurantId={props.match.params.restaurantId}
                            selectedCategoryId={props.match.params.selectedCategoryId}
                            selectedProductId={props.match.params.selectedProductId}
                            {...props}
                        />
                    );
                }}
            />
            <Route exact path={unauthorizedPath} component={Unauthorised} />
            <Route component={NoMatch} />
        </Switch>
    );
};

export const AdminOnlyRoute: FunctionComponent<PrivateRouteProps> = ({ component: Component, path: Path, ...rest }) => {
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

const PrivateRoute: FunctionComponent<PrivateRouteProps> = ({ component: Component, ...rest }) => {
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
        return <FullScreenSpinner show={true} text="Loading user..." />;
    }

    if (!user) {
        throw "Signed in but no user found in database";
    }

    // Route to original path
    return <Route {...rest} component={Component} />;
};

interface PrivateRouteProps extends RouteProps {
    component: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>;
}

const RestaurantRegisterPrivateRoute: FunctionComponent<PrivateRouteProps> = ({ component: Component, ...rest }) => {
    const { user } = useUser();
    const { restaurant, isLoading, isError } = useRestaurant();

    if (user && isLoading) {
        return <FullScreenSpinner show={true} text="Loading restaurant..." />;
    }

    if (isError) {
        return <div>There was an error loading your restaurant.</div>;
    }

    if (!restaurant) {
        return (
            <Route
                {...rest}
                render={(props) => (
                    <Redirect
                        to={{
                            pathname: restaurantListPath,
                            state: { from: props.location },
                        }}
                    />
                )}
            />
        );
    }

    //----------------------------------------------------------------------------
    //TODO: Fix this later, should be coming in from the kiosk
    const storedRegisterKey = localStorage.getItem("registerKey");

    let matchingRegister: IGET_RESTAURANT_REGISTER | null = null;

    restaurant &&
        restaurant.registers.items.forEach((r) => {
            if (storedRegisterKey == r.id) {
                matchingRegister = r;
            }
        });
    //----------------------------------------------------------------------------

    if (!matchingRegister) {
        return (
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
    }

    // Route to original path
    return <PrivateRoute {...rest} component={Component} />;
};
