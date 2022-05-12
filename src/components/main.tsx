import { useEffect, lazy, Suspense } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import { HashRouter } from "react-router-dom";
import Modal from "react-modal";
import { Logger } from "aws-amplify";
import { createBrowserHistory } from "history";

import { AlertProvider } from "../tabin/components/alert";
import { ToastContainer } from "../tabin/components/toast";
import { FullScreenSpinner } from "../tabin/components/fullScreenSpinner";
import { useAuth, AuthenticationStatus } from "../context/auth-context";
import { useUser } from "../context/user-context";
import { useRestaurant } from "../context/restaurant-context";
import { IGET_RESTAURANT_REGISTER } from "../graphql/customQueries";

import "react-toastify/dist/ReactToastify.min.css";
import { useRegister } from "../context/register-context";

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
export const menuPath = "/menu";
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
    return <div>Hi</div>;
};
