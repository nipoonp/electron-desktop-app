import { useEffect, lazy, Suspense } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import { HashRouter } from "react-router-dom";
import Modal from "react-modal";
import { Auth, Logger } from "aws-amplify";
import { AlertProvider } from "../tabin/components/alert";
import { ToastContainer } from "../tabin/components/toast";
import { FullScreenSpinner } from "../tabin/components/fullScreenSpinner";
import { useAuth, AuthenticationStatus } from "../context/auth-context";
import { useUser } from "../context/user-context";
import { useRestaurant } from "../context/restaurant-context";
import { usePosUser } from "../context/pos-user-context";
import { IGET_RESTAURANT_REGISTER } from "../graphql/customQueries";
import { useRegister } from "../context/register-context";
import { ITab } from "../model/model";
import { FiDollarSign, FiLock, FiMenu, FiCheckSquare, FiUsers } from "react-icons/fi";
import { sendFailureNotification } from "../util/errorHandling";

import "react-toastify/dist/ReactToastify.min.css";
import { useElectron } from "../context/electron-context";
import { isThemePreviewMode } from "../util/util";

// Shared pages (identical for kiosk and POS registers)
const Login = lazy(() => import("./page/auth/login"));
const Logout = lazy(() => import("./page/auth/logout"));
const RestaurantList = lazy(() => import("./page/restaurantList"));
const RegisterList = lazy(() => import("./page/registerList"));
const Dashboard = lazy(() => import("./page/dashboard"));
const OrderType = lazy(() => import("./page/orderType"));
const ConfigureNewEftpos = lazy(() => import("./page/configureNewEftpos"));
const PaymentMethod = lazy(() => import("./page/paymentMethod"));
const NoMatch = lazy(() => import("./page/error/404"));
const Unauthorised = lazy(() => import("./page/error/unauthorised"));

// Kiosk ordering flow — only loaded (code + styles) when the register is a kiosk
const KioskBeginOrder = lazy(() => import("./kiosk/page/beginOrder"));
const KioskRestaurant = lazy(() => import("./kiosk/page/restaurant"));
const KioskCheckout = lazy(() => import("./kiosk/page/checkout"));
const KioskTableNumber = lazy(() => import("./kiosk/page/tableNumber"));
const KioskBuzzerNumber = lazy(() => import("./kiosk/page/buzzerNumber"));
const KioskCustomerInformation = lazy(() => import("./kiosk/page/customerInformation"));
const KioskLoyalty = lazy(() => import("./kiosk/page/loyalty"));

// POS ordering flow — only loaded (code + styles) when the register is a POS
const PosBeginOrder = lazy(() => import("./pos/page/beginOrder"));
const PosRestaurant = lazy(() => import("./pos/page/restaurant"));
const PosCheckout = lazy(() => import("./pos/page/checkout"));
const PosTableNumber = lazy(() => import("./pos/page/tableNumber"));
const PosBuzzerNumber = lazy(() => import("./pos/page/buzzerNumber"));
const PosCustomerInformation = lazy(() => import("./pos/page/customerInformation"));
const PosCustomerDisplay = lazy(() => import("./pos/page/customerDisplay"));
const PosUserList = lazy(() => import("./pos/page/posUserList"));
const Orders = lazy(() => import("./pos/page/orders"));
// Cash up is a dedicated POS page rather than a dashboard iframe screen.
const CashUp = lazy(() => import("./pos/page/cashManagement/cashUp"));

// reset scroll position on change of route
// https://stackoverflow.com/a/46868707/11460922

// history.listen((location, action) => {
//     window.scrollTo(0, 0);
// });

const logger = new Logger("Main");

Modal.setAppElement("#root");

// Auth routes
export const loginPath = "/login";
export const logoutPath = "/log_out";
export const customerDisplayPath = "/customer_display";
export const restaurantListPath = "/restaurant_list";
export const registerListPath = "/register_list";
export const ordersPath = "/orders";
export const posUserListPath = "/pos_user_list";
export const dashboardPath = "/dashboard";
export const configureNewEftposPath = "/configure_new_eftpos";
export const beginOrderPath = "/begin_order";
export const loyaltyPath = "/loyalty";
export const orderTypePath = "/order_type";
export const tableNumberPath = "/table_number";
export const buzzerNumberPath = "/buzzer_number";
export const customerInformationPath = "/customer_information";
export const paymentMethodPath = "/payment_method";
export const restaurantPath = "/restaurant";
export const checkoutPath = "/checkout";
export const cashUpPath = "/cash_up";
export const unauthorizedPath = "/unauthorized";

export const tabs: ITab[] = [
    {
        id: "saleMode",
        name: "Sale Mode",
        icon: <FiDollarSign height="20px" />,
        route: beginOrderPath,
        showOnMobile: true,
    },
    {
        id: "dashboard",
        name: "Dashboard",
        icon: <FiMenu height="20px" />,
        route: dashboardPath,
        showOnMobile: true,
    },
    {
        id: "cashup",
        name: "Cash Up",
        icon: <FiCheckSquare height="20px" />,
        route: cashUpPath,
        showOnMobile: true,
    },
    {
        id: "selectPosUser",
        name: "Select POS User",
        icon: <FiUsers height="20px" />,
        route: posUserListPath,
        showOnMobile: true,
    },
    {
        id: "admin",
        name: "Admin",
        icon: <FiLock height="20px" />,
        showOnMobile: true,
        subTabs: [
            {
                id: "configureEftposAndPrinters",
                name: "Configure New Eftpos and Printers",
                route: configureNewEftposPath,
            },
            {
                id: "configureRestaurant",
                name: "Configure Restaurant",
                route: restaurantListPath,
            },
            {
                id: "configureRegister",
                name: "Configure Register",
                route: registerListPath,
            },
            {
                id: "logout",
                name: "Log Out",
                route: logoutPath,
            },
        ],
    },
];

export default () => {
    const { user, login } = useAuth();
    const { restaurant } = useRestaurant();
    const { register } = useRegister();
    const { sendParent } = useElectron();

    useEffect(() => {
        const e = user ? user.attributes.email : "invalid email";
        const r = register ? `${register.name} (${register.id})` : "invalid register";

        sendParent("SENTRY_CURRENT_USER", {
            email: e,
            register: r,
        });
    }, [user, register]);

    useEffect(() => {
        if (!restaurant) return;
        if (!register) return;
        if (isThemePreviewMode()) return; //No cognito session to refresh in theme preview mode.

        const timerId = setInterval(
            async () => {
                try {
                    //We are having an issue where we get "NotAuthorizedException: Refresh Token has expired".
                    //To avoid the refresh_token from expiring, we will force it to refresh every 10 minutes.
                    //I can see the access_token and id_token get refreshed. But not sure about the refresh_token.
                    //https://github.com/aws-amplify/amplify-js/issues/2560
                    //Also in AWS Dashboard under Cognito User Pools > App Integration > We set the 'Refresh token expiration' to 365 days.
                    //So monitor the next few weeks howmany of those errors we get rearing "NotAuthorizedException: Refresh Token has expired" issue.
                    //If we don't get such errors then we can try remove this code below.
                    const cognitoUser = await Auth.currentAuthenticatedUser();
                    const currentSession = await Auth.currentSession();

                    cognitoUser.refreshSession(currentSession.getRefreshToken(), (err, session) => {
                        console.log("New session", err, session);
                        // const { idToken, refreshToken, accessToken } = session;
                    });

                    //If the above code doesn't refresh the refresh_token then uncomment the below lines and get the user to relog in again.
                    // const email = localStorage.getItem("current_e");
                    // const password = localStorage.getItem("current_p");

                    // if (email && password) login(email, password);
                } catch (error) {
                    console.error("Error", error);
                    await sendFailureNotification(error, JSON.stringify({ restaurant: restaurant?.id, register: register?.id }));
                }
            },
            10 * 60 * 1000,
        ); // 10 minutes

        return () => clearInterval(timerId);
    }, [restaurant, register]);

    return (
        <>
            <AlertProvider>
                {/* Cannot use BrowserRouter in electron. Should use HashRouter: https://github.com/remix-run/react-router/issues/6726 */}
                <HashRouter>
                    <Suspense fallback={<FullScreenSpinner show={true} text="Loading page..." />}>
                        <AppRoutes />
                    </Suspense>
                </HashRouter>
            </AlertProvider>
            <ToastContainer />
        </>
    );
};

const AppRoutes = () => {
    const navigate = useNavigate();

    // This is for electron, as it doesn't start at '/' route for some reason.
    useEffect(() => {
        if (window.location.hash === "#/customer_display") return;
        //In theme preview mode keep the route the dashboard requested (e.g. the restaurant menu page).
        if (isThemePreviewMode() && window.location.hash && window.location.hash !== "#/") return;

        navigate(beginOrderPath);
    }, []);

    return (
        <>
            <Routes>
                <Route path={loginPath} element={<Login />} />
                <Route path={logoutPath} element={<Logout />} />
                <Route path={customerDisplayPath} element={<PosCustomerDisplay />} />
                <Route path={restaurantListPath} element={<PrivateRoute element={<RestaurantList />} />} />
                <Route path={registerListPath} element={<PrivateRoute element={<RegisterList />} />} />
                <Route path={posUserListPath} element={<RestaurantRegisterPosSetupPrivateRoute element={<PosUserList />} />} />
                <Route path={ordersPath} element={<RestaurantRegisterPosPrivateRoute element={<Orders />} />}>
                    <Route path=":date" element={<RestaurantRegisterPosPrivateRoute element={<Orders />} />} />
                </Route>
                <Route path={dashboardPath} element={<RestaurantRegisterSalePrivateRoute element={<Dashboard />} />} />
                <Route path={configureNewEftposPath} element={<RestaurantRegisterSalePrivateRoute element={<ConfigureNewEftpos />} />} />
                <Route
                    path={beginOrderPath}
                    element={
                        <RestaurantRegisterSalePrivateRoute element={<RegisterTypeSwitch kiosk={<KioskBeginOrder />} pos={<PosBeginOrder />} />} />
                    }
                />
                <Route path={loyaltyPath} element={<RestaurantRegisterKioskPrivateRoute element={<KioskLoyalty />} />} />
                <Route
                    path={`${restaurantPath}/:restaurantId`}
                    element={
                        <RestaurantRegisterSalePrivateRoute element={<RegisterTypeSwitch kiosk={<KioskRestaurant />} pos={<PosRestaurant />} />} />
                    }
                >
                    <Route
                        path=":selectedCategoryId"
                        element={
                            <RestaurantRegisterSalePrivateRoute element={<RegisterTypeSwitch kiosk={<KioskRestaurant />} pos={<PosRestaurant />} />} />
                        }
                    >
                        <Route
                            path=":selectedProductId"
                            element={
                                <RestaurantRegisterSalePrivateRoute
                                    element={<RegisterTypeSwitch kiosk={<KioskRestaurant />} pos={<PosRestaurant />} />}
                                />
                            }
                        />
                    </Route>
                </Route>
                <Route path={orderTypePath} element={<RestaurantRegisterSalePrivateRoute element={<OrderType />} />} />
                <Route
                    path={tableNumberPath}
                    element={
                        <RestaurantRegisterSalePrivateRoute element={<RegisterTypeSwitch kiosk={<KioskTableNumber />} pos={<PosTableNumber />} />} />
                    }
                />
                <Route
                    path={buzzerNumberPath}
                    element={
                        <RestaurantRegisterSalePrivateRoute element={<RegisterTypeSwitch kiosk={<KioskBuzzerNumber />} pos={<PosBuzzerNumber />} />} />
                    }
                />
                <Route
                    path={customerInformationPath}
                    element={
                        <RestaurantRegisterSalePrivateRoute
                            element={<RegisterTypeSwitch kiosk={<KioskCustomerInformation />} pos={<PosCustomerInformation />} />}
                        />
                    }
                />
                <Route path={paymentMethodPath} element={<RestaurantRegisterSalePrivateRoute element={<PaymentMethod />} />} />
                <Route
                    path={checkoutPath}
                    element={<RestaurantRegisterSalePrivateRoute element={<RegisterTypeSwitch kiosk={<KioskCheckout />} pos={<PosCheckout />} />} />}
                >
                    <Route
                        path=":autoClickCompleteOrderOnLoad"
                        element={<RestaurantRegisterSalePrivateRoute element={<RegisterTypeSwitch kiosk={<KioskCheckout />} pos={<PosCheckout />} />} />}
                    ></Route>
                </Route>
                <Route path={cashUpPath} element={<RestaurantRegisterPosPrivateRoute element={<CashUp />} />} />
                <Route path={unauthorizedPath} element={<Unauthorised />} />
                <Route path="*" element={<NoMatch />} />
            </Routes>
        </>
    );
};

// Renders the kiosk or POS variant of an ordering-flow page based on the connected register's type.
const RegisterTypeSwitch = ({ kiosk, pos }: { kiosk: JSX.Element; pos: JSX.Element }) => {
    const { isPOS } = useRegister();

    return isPOS ? pos : kiosk;
};

export const AdminOnlyRoute = ({ element }) => {
    const { isAdmin, status } = useAuth();
    const { isLoading } = useUser();

    if (status !== AuthenticationStatus.SignedIn) return <Navigate to={loginPath} />; // Handle other authentication statuses
    if (isLoading) return <FullScreenSpinner show={true} text="Loading user" />; // Assumed signed in from this point onwards
    if (!isAdmin) return <Navigate to={unauthorizedPath} replace />; // not authorized

    return element; // Route to original path
};

const PrivateRoute = ({ element }) => {
    const { status } = useAuth();
    const { user, isLoading, error } = useUser();

    if (status !== AuthenticationStatus.SignedIn) return <Navigate to={loginPath} />; // Handle other authentication statuses
    if (error) return <div>There was an error loading the user. Please try restart the application.</div>;
    if (isLoading) return <FullScreenSpinner show={true} text="Loading user..." />; // Assumed signed in from this point onwards
    if (!user) throw "Signed in but no user found in database";

    return element; // Route to original path
};

const RestaurantRegisterPrivateRoute = ({ element }) => {
    const { user } = useUser();
    const { restaurant, isLoading, isError } = useRestaurant();
    const { register } = useRegister();

    const themePreview = isThemePreviewMode();

    if ((user || themePreview) && isLoading) return <FullScreenSpinner show={true} text="Loading restaurant..." />;
    if (isError) return <div>There was an error loading your restaurant.</div>;

    //In theme preview mode there is no login or connected register, the restaurant/register come from the url.
    if (themePreview) {
        if (!restaurant || !register) return <FullScreenSpinner show={true} text="Loading preview..." />;
        return element;
    }

    if (!restaurant) return <Navigate to={restaurantListPath} />;
    if (restaurant?.isAcceptingOrders === false)
        return (
            <div className="unavailable-center">
                <p>This KIOSK is Unavailable</p>
            </div>
        );
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

    if (!matchingRegister) return <Navigate to={registerListPath} />;

    // Route to original path
    return element;
};

const PosUserPrivateRoute = ({ element }) => {
    const { selectedPosUser, isUnlocked, availableUsers, isPosPinFeatureEnabled, hasSkippedPosUserSelection } = usePosUser();

    if (!isPosPinFeatureEnabled) return element;

    if (availableUsers.length === 0) {
        if (hasSkippedPosUserSelection) return element;
        return <Navigate to={posUserListPath} />;
    }

    if (!selectedPosUser) return <Navigate to={posUserListPath} />;
    if (!isUnlocked) return <Navigate to={posUserListPath} />;

    return element;
};

const RestaurantRegisterPosPrivateRoute = ({ element }) => {
    const { isPOS, isPosPinFeatureEnabled } = useRegister();

    // POS-only pages should never appear for kiosk registers.
    if (isPOS === false) return <Navigate to={beginOrderPath} replace />;

    if (!isPosPinFeatureEnabled) return <RestaurantRegisterPrivateRoute element={element} />;

    return <RestaurantRegisterPrivateRoute element={<PosUserPrivateRoute element={element} />} />;
};

// Kiosk-only pages (e.g. loyalty) should never appear for POS registers.
const RestaurantRegisterKioskPrivateRoute = ({ element }) => {
    const { isPOS } = useRegister();

    if (isPOS === true) return <Navigate to={beginOrderPath} replace />;

    return <RestaurantRegisterPrivateRoute element={element} />;
};

const RestaurantRegisterSalePrivateRoute = ({ element }) => {
    const { isPOS, isPosPinFeatureEnabled } = useRegister();

    // Shared sales pages work for every register. Only POS registers require the staff selection gate.
    if (isPOS === false || !isPosPinFeatureEnabled) return <RestaurantRegisterPrivateRoute element={element} />;

    return <RestaurantRegisterPrivateRoute element={<PosUserPrivateRoute element={element} />} />;
};

const RestaurantRegisterPosSetupPrivateRoute = ({ element }) => {
    const { isPOS, isPosPinFeatureEnabled } = useRegister();

    // Non-POS registers should skip the POS user selection flow completely.
    if (isPOS === false) return <Navigate to={beginOrderPath} replace />;
    if (!isPosPinFeatureEnabled) return <Navigate to={beginOrderPath} replace />;

    return <RestaurantRegisterPrivateRoute element={element} />;
};
