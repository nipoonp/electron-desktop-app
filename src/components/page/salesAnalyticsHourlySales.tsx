import { FaArrowLeft } from "react-icons/fa";
import { getTwelveHourFormat } from "../../model/util";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { convertCentsToDollarsReturnFloat } from "../../util/util";
import { LineGraph } from "./salesAnalytics/Graph";
import { Table } from "../../tabin/components/table";
import { useSalesAnalytics } from "../../context/salesAnalytics-context";

import "./salesAnalytics.scss";
import { SalesAnalyticsWrapper } from "./salesAnalytics/salesAnalyticsWrapper";

export const SalesAnalyticsHourlySales = () => {
    const { salesAnalytics, error, loading } = useSalesAnalytics();

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
                <div className="reports">
                    <div className="sales-by p-3">
                        <div className="pb-3" style={{ width: "100%", height: "300px" }}>
                            <LineGraph xAxis="hour" lines={["sales"]} graphData={salesAnalytics?.hourByGraphData} fill={graphColor} />
                        </div>
                        <div className="sales-table-wrapper">
                            <Table>
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Orders</th>
                                        <th>Net</th>
                                        <th>Tax</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesAnalytics &&
                                        Object.entries(salesAnalytics.hourlySales)
                                            .sort((a, b) => a[0].localeCompare(b[0]))
                                            .map(([hour, sale], index) => (
                                                <tr key={index}>
                                                    <td> {getTwelveHourFormat(Number(hour))}</td>
                                                    <td> {sale.totalQuantity}</td>
                                                    <td> {`$${convertCentsToDollarsReturnFloat(sale.net)}`}</td>
                                                    <td> {`$${convertCentsToDollarsReturnFloat(sale.tax)}`}</td>
                                                    <td> {`$${convertCentsToDollarsReturnFloat(sale.totalAmount)}`}</td>
                                                </tr>
                                            ))}
                                    <tr>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </Table>
                        </div>
                    </div>
                </div>
            </SalesAnalyticsWrapper>
        </>
    );
};
