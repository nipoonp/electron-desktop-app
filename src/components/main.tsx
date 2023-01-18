import { useEffect, lazy, Suspense } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import { HashRouter } from "react-router-dom";
import Modal from "react-modal";
import { Logger } from "aws-amplify";
import { AlertProvider } from "../tabin/components/alert";
import { ToastContainer } from "../tabin/components/toast";
import { FullScreenSpinner } from "../tabin/components/fullScreenSpinner";
import { useAuth, AuthenticationStatus } from "../context/auth-context";
import { useUser } from "../context/user-context";
import { useRestaurant } from "../context/restaurant-context";
import { IGET_RESTAURANT_REGISTER } from "../graphql/customQueries";
import { useRegister } from "../context/register-context";
import { ITab } from "../model/model";
import { FiDollarSign, FiLock, FiMenu } from "react-icons/fi";
import RequireCustomerInformation from "./page/customerInformation";

import "react-toastify/dist/ReactToastify.min.css";

const Login = lazy(() => import("./page/auth/login"));
const Logout = lazy(() => import("./page/auth/logout"));
const Restaurant = lazy(() => import("./page/restaurant"));
const RestaurantList = lazy(() => import("./page/restaurantList"));
const RegisterList = lazy(() => import("./page/registerList"));
const Dashboard = lazy(() => import("./page/dashboard"));
const BeginOrder = lazy(() => import("./page/beginOrder"));
const OrderType = lazy(() => import("./page/orderType"));
const ConfigureNewEftpos = lazy(() => import("./page/configureNewEftpos"));
const TableNumber = lazy(() => import("./page/tableNumber"));
const BuzzerNumber = lazy(() => import("./page/buzzerNumber"));
const PaymentMethod = lazy(() => import("./page/paymentMethod"));
const Checkout = lazy(() => import("./page/checkout"));
const NoMatch = lazy(() => import("./page/error/404"));
const Unauthorised = lazy(() => import("./page/error/unauthorised"));

let electron: any;
let ipcRenderer: any;
try {
    electron = window.require("electron");
    ipcRenderer = electron.ipcRenderer;
} catch (e) {}

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
export const restaurantListPath = "/restaurant_list";
export const registerListPath = "/register_list";
export const dashboardPath = "/dashboard";
export const configureNewEftposPath = "/configure_new_eftpos";
export const beginOrderPath = "/";
export const orderTypePath = "/order_type";
export const tableNumberPath = "/table_number";
export const buzzerNumberPath = "/buzzer_number";
export const customerInformationPath = "/customer_information";
export const paymentMethodPath = "/payment_method";
export const restaurantPath = "/restaurant";
export const checkoutPath = "/checkout";
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
    const { user } = useAuth();
    const { register } = useRegister();

    useEffect(() => {
        const e = user ? user.attributes.email : "invalid email";
        const r = register ? `${register.name} (${register.id})` : "invalid register";

        ipcRenderer &&
            ipcRenderer.send("SENTRY_CURRENT_USER", {
                email: e,
                register: r,
            });
    }, [user, register]);

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
        navigate(beginOrderPath);
    }, []);

    return (
        <>
            <Routes>
                <Route path={loginPath} element={<Login />} />
                <Route path={logoutPath} element={<Logout />} />
                <Route path={restaurantListPath} element={<PrivateRoute element={<RestaurantList />} />} />
                <Route path={registerListPath} element={<PrivateRoute element={<RegisterList />} />} />
                <Route path={dashboardPath} element={<RestaurantRegisterPrivateRoute element={<Dashboard />} />} />
                <Route path={configureNewEftposPath} element={<RestaurantRegisterPrivateRoute element={<ConfigureNewEftpos />} />} />
                <Route path={beginOrderPath} element={<RestaurantRegisterPrivateRoute element={<BeginOrder />} />} />
                <Route path={`${restaurantPath}/:restaurantId`} element={<RestaurantRegisterPrivateRoute element={<Restaurant />} />}>
                    <Route path=":selectedCategoryId" element={<RestaurantRegisterPrivateRoute element={<Restaurant />} />}>
                        <Route path=":selectedProductId" element={<RestaurantRegisterPrivateRoute element={<Restaurant />} />} />
                    </Route>
                </Route>
                <Route path={orderTypePath} element={<RestaurantRegisterPrivateRoute element={<OrderType />} />} />
                <Route path={tableNumberPath} element={<RestaurantRegisterPrivateRoute element={<TableNumber />} />} />
                <Route path={buzzerNumberPath} element={<RestaurantRegisterPrivateRoute element={<BuzzerNumber />} />} />
                <Route path={customerInformationPath} element={<RestaurantRegisterPrivateRoute element={<RequireCustomerInformation />} />} />
                <Route path={paymentMethodPath} element={<RestaurantRegisterPrivateRoute element={<PaymentMethod />} />} />
                <Route path={checkoutPath} element={<RestaurantRegisterPrivateRoute element={<Checkout />} />}>
                    <Route path=":autoClickCompleteOrderOnLoad" element={<RestaurantRegisterPrivateRoute element={<Checkout />} />}></Route>
                </Route>
                <Route path={unauthorizedPath} element={<Unauthorised />} />
                <Route path="*" element={<NoMatch />} />
            </Routes>
        </>
    );
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
    const { user, isLoading } = useUser();

    if (status !== AuthenticationStatus.SignedIn) return <Navigate to={loginPath} />; // Handle other authentication statuses
    if (isLoading) return <FullScreenSpinner show={true} text="Loading user..." />; // Assumed signed in from this point onwards
    if (!user) throw "Signed in but no user found in database";

    return element; // Route to original path
};

const RestaurantRegisterPrivateRoute = ({ element }) => {
    const { user } = useUser();
    const { restaurant, isLoading, isError } = useRestaurant();

    if (user && isLoading) return <FullScreenSpinner show={true} text="Loading restaurant..." />;
    if (isError) return <div>There was an error loading your restaurant.</div>;
    if (!restaurant) return <Navigate to={restaurantListPath} />;

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
