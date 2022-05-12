import { useNavigate } from "react-router";
import { Button } from "../../tabin/components/button";
import { ordersPath, salesAnalyticsPath, stockPath } from "../main";

import "./menu.scss";

export default () => {
    const navigate = useNavigate();

    const onStock = () => {
        navigate(stockPath);
    };

    const onOrders = () => {
        navigate(ordersPath);
    };

    const onSalesAnalysis = () => {
        navigate(salesAnalyticsPath);
    };

    return (
        <>
            <div className="menu-item-wrapper">
                <div className="h3 mb-3">Select a page you would like to access</div>
                <Button className="mb-3" onClick={onStock}>
                    Stock
                </Button>
                <Button className="mb-3" onClick={onOrders}>
                    Orders
                </Button>
                <Button className="mb-3" onClick={onSalesAnalysis}>
                    Sales Analytics
                </Button>
            </div>
        </>
    );
};
