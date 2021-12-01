import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import { BrowserRouter } from "react-router-dom";
import { Restaurant } from "./page/restaurant";
import { NoMatch } from "./page/error/404";
import Unauthorised from "./page/error/unauthorised";
import Modal from "react-modal";
import { Login } from "./page/auth/login";
import { Checkout } from "./page/checkout";
import { useAuth, AuthenticationStatus } from "../context/auth-context";
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
import { Stock } from "./page/stock";
import { Reports } from "./page/reports";
import { Orders } from "./page/orders";
import { AlertProvider } from "../tabin/components/alert";
import { SalesAnalytics } from "./page/salesAnalytics";
import { SalesAnalyticsDailySales } from "./page/salesAnalyticsDailySales";
import { SalesAnalyticsHourlySales } from "./page/salesAnalyticsHourlySales";
import { SalesAnalyticsTopCategory } from "./page/salesAnalyticsTopCategory";
import { SalesAnalyticsTopProduct } from "./page/salesAnalyticsTopProduct";

import "react-toastify/dist/ReactToastify.min.css";

let electron: any;
let ipcRenderer: any;
try {
    electron = window.require("electron");
    ipcRenderer = electron.ipcRenderer;
} catch (e) {}

// reset scroll position on change of route
// https://stackoverflow.com/a/46868707/11460922
export const navigate = createBrowserHistory();

// history.listen((location, action) => {
//     window.scrollTo(0, 0);
// });

const logger = new Logger("Main");

Modal.setAppElement("#root");

// Auth routes
export const loginPath = "/login";
export const stockPath = "/stock";
export const ordersPath = "/orders";
export const reportsPath = "/reports";
export const restaurantListPath = "/restaurant_list";
export const registerListPath = "/register_list";
export const configureNewEftposPath = "/configure_new_eftpos";
export const beginOrderPath = "/";
export const orderTypePath = "/order_type";
export const tableNumberPath = "/table_number";
export const restaurantPath = "/restaurant";
export const checkoutPath = "/checkout";
export const logoutPath = "/log_out";
export const salesAnalyticsPath = "/sales_analytics";
export const salesAnalyticsDailySalesPath = "/sales_analytics/daily_sales";
export const salesAnalyticsHourlySalesPath = "/sales_analytics/hourly_sales";
export const salesAnalyticsTopCategoryPath = "/sales_analytics/top_category";
export const salesAnalyticsTopProductPath = "/sales_analytics/top_product";
export const unauthorizedPath = "/unauthorized";

export default () => {
    return (
        <>
            <AlertProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </AlertProvider>
            <ToastContainer />
        </>
    );
};

const AppRoutes = () => {
    const navigate = useNavigate();
    let timerId: NodeJS.Timeout;

    // This is for electron, as it doesn't start at '/' route for some reason.
    useEffect(() => {
        navigate(beginOrderPath);
    }, []);

    useEffect(() => {
        document.body.onmousedown = () => {
            timerId = setTimeout(() => {
                ipcRenderer && ipcRenderer.send("SHOW_CONTEXT_MENU");
            }, 1000);
        };

        document.body.onmouseup = () => {
            clearTimeout(timerId);
        };

        ipcRenderer &&
            ipcRenderer.on("CONTEXT_MENU_COMMAND", (e: any, command: any) => {
                switch (command) {
                    case "kioskMode":
                        navigate(beginOrderPath);
                        break;
                    case "stock":
                        navigate(stockPath);
                        break;
                    case "orders":
                        navigate(ordersPath);
                        break;
                    case "reports":
                        navigate(reportsPath);
                        break;
                    case "salesAnalytics":
                        navigate(salesAnalyticsPath);
                        break;
                    case "configureEftposAndPrinters":
                        navigate(configureNewEftposPath);
                        break;
                    case "configureRestaurant":
                        navigate(restaurantListPath);
                        break;
                    case "configureRegister":
                        navigate(registerListPath);
                        break;
                    case "logout":
                        navigate(logoutPath);
                        break;
                    default:
                        break;
                }
            });
    }, []);

    return (
        <Routes>
            <Route path={loginPath} element={<Login />} />
            <Route path={logoutPath} element={<Logout />} />
            <Route path={restaurantListPath} element={<PrivateRoute element={<RestaurantList />} />} />
            <Route path={registerListPath} element={<PrivateRoute element={<RegisterList />} />} />
            <Route path={stockPath} element={<PrivateRoute element={<Stock />} />} />
            <Route path={`${ordersPath}`} element={<PrivateRoute element={<Orders />} />}>
                <Route path=":date" element={<PrivateRoute element={<Orders />} />} />
            </Route>
            <Route path={reportsPath} element={<PrivateRoute element={<Reports />} />} />
            <Route path={salesAnalyticsPath} element={<PrivateRoute element={<SalesAnalytics />} />} />
            <Route path={salesAnalyticsDailySalesPath} element={<PrivateRoute element={<SalesAnalyticsDailySales />} />} />
            <Route path={salesAnalyticsHourlySalesPath} element={<PrivateRoute element={<SalesAnalyticsHourlySales />} />} />
            <Route path={salesAnalyticsTopCategoryPath} element={<PrivateRoute element={<SalesAnalyticsTopCategory />} />} />
            <Route path={salesAnalyticsTopProductPath} element={<PrivateRoute element={<SalesAnalyticsTopProduct />} />} />
            <Route path={configureNewEftposPath} element={<RestaurantRegisterPrivateRoute element={<ConfigureNewEftpos />} />} />
            <Route path={beginOrderPath} element={<RestaurantRegisterPrivateRoute element={<BeginOrder />} />} />
            <Route path={`${restaurantPath}/:restaurantId`} element={<RestaurantRegisterPrivateRoute element={<Restaurant />} />}>
                <Route path=":selectedCategoryId" element={<PrivateRoute element={<Orders />} />}>
                    <Route path=":selectedProductId" element={<PrivateRoute element={<Orders />} />} />
                </Route>
            </Route>
            <Route path={orderTypePath} element={<RestaurantRegisterPrivateRoute element={<OrderType />} />} />
            <Route path={tableNumberPath} element={<RestaurantRegisterPrivateRoute element={<TableNumber />} />} />
            <Route path={checkoutPath} element={<RestaurantRegisterPrivateRoute element={<Checkout />} />} />
            <Route path={unauthorizedPath} element={<Unauthorised />} />
            <Route path="*" element={<NoMatch />} />
        </Routes>
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
