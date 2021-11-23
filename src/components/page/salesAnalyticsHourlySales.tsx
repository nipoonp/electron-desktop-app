import { getTwelveHourFormat, taxRate } from "../../model/util";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { convertCentsToDollars } from "../../util/util";
import { LineGraph } from "./salesAnalytics/salesAnalyticsGraphs";
import { Table } from "../../tabin/components/table";
import { useSalesAnalytics } from "../../context/salesAnalytics-context";
import { SalesAnalyticsWrapper } from "./salesAnalytics/salesAnalyticsWrapper";

import "./salesAnalytics.scss";

export const SalesAnalyticsHourlySales = () => {
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
            <SalesAnalyticsWrapper title="Sales By Hour" showBackButton={true}>
                {!startDate || !endDate ? (
                    <div className="text-center">Please select a start and end date.</div>
                ) : salesAnalytics && salesAnalytics.totalSoldItems > 0 ? (
                    <div className="sales-by">
                        <div className="mb-6" style={{ width: "100%", height: "300px" }}>
                            <LineGraph xAxis="hour" lines={["sales"]} graphData={salesAnalytics.hourByGraphData} fill={graphColor} />
                        </div>
                        <div className="sales-table-wrapper">
                            <Table>
                                <thead>
                                    <tr>
                                        <th className="text-left">Time</th>
                                        <th className="text-right">Orders</th>
                                        <th className="text-right">Tax</th>
                                        <th className="text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(salesAnalytics.hourlySales)
                                        .sort((a, b) => a[0].localeCompare(b[0]))
                                        .map(([hour, sale], index) => (
                                            <tr key={index}>
                                                <td className="sales-analytics-table-time-cell">{getTwelveHourFormat(Number(hour))}</td>
                                                <td className="text-right">{sale.totalQuantity}</td>
                                                <td className="text-right">{`$${convertCentsToDollars(sale.totalAmount * (taxRate / 100))}`}</td>
                                                <td className="text-right">{`$${convertCentsToDollars(sale.totalAmount)}`}</td>
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
