import { format } from "date-fns";
import { Card } from "../../tabin/components/card";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { convertCentsToDollars } from "../../util/util";
import { LineGraph } from "./salesAnalytics/salesAnalyticsGraphs";
import { Table } from "../../tabin/components/table";
import { useSalesAnalytics } from "../../context/salesAnalytics-context";
import { SalesAnalyticsWrapper } from "./salesAnalytics/salesAnalyticsWrapper";

import "./salesAnalytics.scss";
import { taxRate } from "../../model/util";
import { Button } from "../../tabin/components/button";
import { useHistory } from "react-router-dom";
import { ordersPath } from "../main";
import { Link } from "../../tabin/components/link";

export const SalesAnalyticsDailySales = () => {
    const history = useHistory();
    const { startDate, endDate, salesAnalytics, error, loading } = useSalesAnalytics();

    const graphColor = getComputedStyle(document.documentElement).getPropertyValue("--primary-color");

    const onShowOrder = (date: string) => {
        history.push(`${ordersPath}/${date}`);
    };

    if (error) {
        return <h1>Couldn't fetch orders. Try Refreshing</h1>;
    }

    if (loading) {
        return <FullScreenSpinner show={loading} text={"Loading report details..."} />;
    }

    return (
        <>
            <SalesAnalyticsWrapper title="Sales By Day" showBackButton={true}>
                {!startDate || !endDate ? (
                    <div className="text-center">Please select a start and end date.</div>
                ) : salesAnalytics && salesAnalytics.totalSoldItems > 0 ? (
                    <div className="sales-by">
                        <div className="mb-6" style={{ width: "100%", height: "300px" }}>
                            <LineGraph xAxis="date" lines={["sales"]} graphData={salesAnalytics?.dayByGraphData} fill={graphColor} />
                        </div>
                        <div className="sales-reading-wrapper mb-6">
                            <Card className="text-center sales-reading">
                                <div className="h3 mb-1">{`$${convertCentsToDollars(salesAnalytics.totalSubTotal)}`}</div>
                                <div className="text-uppercase">Total Sales</div>
                            </Card>
                            <Card className="text-center sales-reading">
                                <div className="h3 mb-1">{`$${convertCentsToDollars(
                                    isNaN(salesAnalytics.totalSubTotal / salesAnalytics.orders.length)
                                        ? 0
                                        : salesAnalytics.totalSubTotal / salesAnalytics.orders.length
                                )}`}</div>
                                <div className="text-uppercase">Average Sales</div>
                            </Card>
                            <Card className="text-center sales-reading">
                                <div className="h3 mb-1">{salesAnalytics.orders.length}</div>
                                <div className="text-uppercase">Sales Count</div>
                            </Card>
                            <Card className="text-center sales-reading">
                                <div className="h3 mb-1">{salesAnalytics.totalSoldItems}</div>
                                <div className="text-uppercase">Items Sold</div>
                            </Card>
                        </div>
                        <div className="sales-table-wrapper">
                            <Table>
                                <thead>
                                    <tr>
                                        <th className="text-left">Date</th>
                                        <th className="text-right">Orders</th>
                                        <th className="text-right">Cash</th>
                                        <th className="text-right">Eftpos</th>
                                        <th className="text-right">Online</th>
                                        <th className="text-right">Tax</th>
                                        <th className="text-right">Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(salesAnalytics.dailySales).map(([date, sale], index) => (
                                        <tr key={index}>
                                            <td className="sales-analytics-table-date-cell">{format(new Date(date), "E, dd MMM")}</td>
                                            <td className="text-right">{sale.totalQuantity}</td>
                                            <td className="text-right">{`$${convertCentsToDollars(sale.totalPaymentAmounts.cash)}`}</td>
                                            <td className="text-right">{`$${convertCentsToDollars(sale.totalPaymentAmounts.eftpos)}`}</td>
                                            <td className="text-right">{`$${convertCentsToDollars(sale.totalPaymentAmounts.online)}`}</td>
                                            <td className="text-right">{`$${convertCentsToDollars(sale.totalAmount * (taxRate / 100))}`}</td>
                                            <td className="text-right">{`$${convertCentsToDollars(sale.totalAmount)}`}</td>
                                            <td className="text-right">
                                                <Link
                                                    className="sales-analytics-table-show-orders-link"
                                                    onClick={() => {
                                                        onShowOrder(date);
                                                    }}
                                                >
                                                    Show Orders
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">No orders were placed during this period. Please select another date range.</div>
                )}
            </SalesAnalyticsWrapper>
        </>
    );
};
