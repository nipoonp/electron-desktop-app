import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { convertCentsToDollarsReturnFloat } from "../../util/util";
import { PieGraph } from "./salesAnalytics/Graph";
import { Table } from "../../tabin/components/table";
import { useSalesAnalytics } from "../../context/salesAnalytics-context";

import "./salesAnalytics.scss";
import { SalesAnalyticsWrapper } from "./salesAnalytics/salesAnalyticsWrapper";

export const SalesAnalyticsTopProduct = () => {
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
                            <PieGraph data={salesAnalytics?.productByGraphData} fill={graphColor} />
                        </div>
                        <div className="sales-table-wrapper">
                            <Table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                        <th>Sale Amount</th>
                                        <th>% Of Sale</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesAnalytics &&
                                        Object.entries(salesAnalytics.mostSoldProducts).map(([productId, product]) => (
                                            <tr key={productId}>
                                                <td> {product.item.name}</td>
                                                <td> {product.totalQuantity}</td>
                                                <td> {`$${convertCentsToDollarsReturnFloat(product.totalAmount)}`}</td>
                                                <td> {`${((product.totalAmount * 100) / salesAnalytics.subTotalCompleted).toFixed(2)} %`}</td>
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
