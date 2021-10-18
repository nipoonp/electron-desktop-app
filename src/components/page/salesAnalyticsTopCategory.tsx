import { FaArrowLeft } from "react-icons/fa";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { convertCentsToDollarsReturnFloat } from "../../util/util";
import { PieGraph } from "./salesAnalytics/Graph";
import { Table } from "../../tabin/components/table";
import { useSalesAnalytics } from "../../context/salesAnalytics-context";

import "./salesAnalytics.scss";
import { SalesAnalyticsWrapper } from "./salesAnalytics/salesAnalyticsWrapper";

export const SalesAnalyticsTopCategory = () => {
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
            <SalesAnalyticsWrapper title="Sales By Category" showBackButton={true}>
                <div className="reports">
                    <div className="sales-by p-3">
                        <div className="pb-3" style={{ width: "100%", height: "300px" }}>
                            <PieGraph data={salesAnalytics?.categoryByGraphData} fill={graphColor} />
                        </div>
                        <div className="sales-table-wrapper">
                            <Table>
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Quantity</th>
                                        <th>Sale Amount</th>
                                        <th>% Of Sale</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesAnalytics &&
                                        Object.entries(salesAnalytics.mostSoldCategories).map(([categoryId, category]) => (
                                            <tr key={categoryId}>
                                                <td> {category.item.name}</td>
                                                <td> {category.totalQuantity}</td>
                                                <td> {`$${convertCentsToDollarsReturnFloat(category.totalAmount)}`}</td>
                                                <td> {`${((category.totalAmount * 100) / salesAnalytics.subTotalCompleted).toFixed(2)} %`}</td>
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
