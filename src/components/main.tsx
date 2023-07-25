import { useEffect, lazy, Suspense } from "react";
import { Navigate, useRoutes, BrowserRouter as HashRouter, useNavigate } from "react-router-dom";
import Modal from "react-modal";
import { Logger } from "aws-amplify";
import { AlertProvider } from "../tabin/components/alert";
import { ToastContainer } from "../tabin/components/toast";
import { FullScreenSpinner } from "../tabin/components/fullScreenSpinner";
import { useAuth, AuthenticationStatus } from "../context/auth-context";
import { useUser } from "../context/user-context";
import { useRestaurant } from "../context/restaurant-context";
import { useRegister } from "../context/register-context";
import { ITab } from "../model/model";
import { FiDollarSign, FiLock, FiMenu } from "react-icons/fi";
import RequireCustomerInformation from "./page/customerInformation";

import "react-toastify/dist/ReactToastify.min.css";
import { IGET_RESTAURANT_REGISTER } from "../graphql/customQueries";

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

    useEffect(() => {
        navigate(beginOrderPath);
    }, []);

    const routes = useRoutes([
        { path: loginPath, element: <Login /> },
        { path: logoutPath, element: <Logout /> },
        { path: restaurantListPath, element: <PrivateRoute element={<RestaurantList />} /> },
        { path: registerListPath, element: <PrivateRoute element={<RegisterList />} /> },
        { path: dashboardPath, element: <RestaurantRegisterPrivateRoute element={<Dashboard />} /> },
        { path: configureNewEftposPath, element: <RestaurantRegisterPrivateRoute element={<ConfigureNewEftpos />} /> },
        { path: beginOrderPath, element: <RestaurantRegisterPrivateRoute element={<BeginOrder />} /> },
        {
            path: `${restaurantPath}/:restaurantId`,
            element: <RestaurantRegisterPrivateRoute element={<Restaurant />} />,
            children: [
                {
                    path: ":selectedCategoryId",
                    element: <RestaurantRegisterPrivateRoute element={<Restaurant />} />,
                    children: [{ path: ":selectedProductId", element: <RestaurantRegisterPrivateRoute element={<Restaurant />} /> }],
                },
            ],
        },
        { path: orderTypePath, element: <RestaurantRegisterPrivateRoute element={<OrderType />} /> },
        { path: tableNumberPath, element: <RestaurantRegisterPrivateRoute element={<TableNumber />} /> },
        { path: buzzerNumberPath, element: <RestaurantRegisterPrivateRoute element={<BuzzerNumber />} /> },
        { path: customerInformationPath, element: <RestaurantRegisterPrivateRoute element={<RequireCustomerInformation />} /> },
        { path: paymentMethodPath, element: <RestaurantRegisterPrivateRoute element={<PaymentMethod />} /> },
        { path: checkoutPath, element: <RestaurantRegisterPrivateRoute element={<Checkout />} /> },
        { path: "*", element: <NoMatch /> },
        { path: unauthorizedPath, element: <Unauthorised /> },
    ]);

    return routes;
};

const AdminOnlyRoute = ({ element }) => {
    const { isAdmin, status } = useAuth();
    const { isLoading } = useUser();

    if (status !== AuthenticationStatus.SignedIn) return <Navigate to={loginPath} />; // Handle other authentication statuses
    if (!isAdmin) return <Navigate to={unauthorizedPath} replace />; // not authorized

    if (isLoading) return <FullScreenSpinner show={true} text="Loading user" />; // Assumed signed in from this point onwards

    return element; // Route to original path
};

const PrivateRoute = ({ element }) => {
    const { status } = useAuth();
    const { user, isLoading, error } = useUser();

    if (status !== AuthenticationStatus.SignedIn) return <Navigate to={loginPath} />;

    if (error) return <div>There was an error loading the user. Please try restart the application.</div>;
    if (isLoading) return <FullScreenSpinner show={true} text="Loading user..." />;
    if (!user) throw "Signed in but no user found in database";

    return element; // Route to original path
};

const RestaurantRegisterPrivateRoute = ({ element }) => {
    const { user } = useUser();
    const { restaurant, isLoading, isError } = useRestaurant();

    const storedRegisterKey = localStorage.getItem("registerKey");
    const matchingRegister = restaurant?.registers.items.find((r) => storedRegisterKey === r.id);

    if (user && isLoading) return <FullScreenSpinner show={true} text="Loading restaurant..." />;
    if (isError) return <div>There was an error loading your restaurant.</div>;
    if (!restaurant) return <Navigate to={restaurantListPath} />;
    if (!matchingRegister) return <Navigate to={registerListPath} />;

    return element;
};
