import { format } from "date-fns";
import { Card } from "../../tabin/components/card";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { convertCentsToDollars, convertCentsToDollarsReturnFloat } from "../../util/util";
import { LineGraph } from "./salesAnalytics/Graph";
import { Table } from "../../tabin/components/table";
import { useSalesAnalytics } from "../../context/salesAnalytics-context";
import { SalesAnalyticsWrapper } from "./salesAnalytics/salesAnalyticsWrapper";

import "./salesAnalytics.scss";

export const SalesAnalyticsDailySales = () => {
    const { startDate, endDate, salesAnalytics, error, loading } = useSalesAnalytics();

    const graphColor = getComputedStyle(document.documentElement).getPropertyValue("--primary-color");

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
                ) : salesAnalytics ? (
                    <div className="sales-by">
                        <div className="mb-6" style={{ width: "100%", height: "300px" }}>
                            <LineGraph xAxis="date" lines={["sales"]} graphData={salesAnalytics?.dayByGraphData} fill={graphColor} />
                        </div>
                        <div className="sales-reading-wrapper mb-6">
                            <Card className="text-center sales-reading">
                                <div className="h3 mb-1">{`$${convertCentsToDollars(salesAnalytics.subTotalCompleted)}`}</div>
                                <div className="text-uppercase">Total Sales</div>
                            </Card>
                            <Card className="text-center sales-reading">
                                <div className="h3 mb-1">{`$${convertCentsToDollars(
                                    isNaN(salesAnalytics.subTotalCompleted / salesAnalytics.totalNumberOfOrdersCompleted)
                                        ? 0
                                        : salesAnalytics.subTotalCompleted / salesAnalytics.totalNumberOfOrdersCompleted
                                )}`}</div>
                                <div className="text-uppercase">Average Sales</div>
                            </Card>
                            <Card className="text-center sales-reading">
                                <div className="h3 mb-1">{salesAnalytics.totalNumberOfOrdersCompleted}</div>
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
                                        <th>Date</th>
                                        <th>Orders</th>
                                        <th>Net</th>
                                        <th>Tax</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(salesAnalytics.dailySales).map(([date, sale], index) => (
                                        <tr key={index}>
                                            <td>{format(new Date(date), "E, dd MMM")}</td>
                                            <td>{sale.totalQuantity}</td>
                                            <td>{`$${convertCentsToDollarsReturnFloat(sale.net)}`}</td>
                                            <td>{`$${convertCentsToDollarsReturnFloat(sale.tax)}`}</td>
                                            <td>{`$${convertCentsToDollarsReturnFloat(sale.totalAmount)}`}</td>
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
