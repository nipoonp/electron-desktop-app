import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { convertCentsToDollars } from "../../util/util";
import { PieGraph } from "./salesAnalytics/salesAnalyticsGraphs";
import { Table } from "../../tabin/components/table";
import { useSalesAnalytics } from "../../context/salesAnalytics-context";
import { SalesAnalyticsWrapper } from "./salesAnalytics/salesAnalyticsWrapper";

import "./salesAnalytics.scss";
import { taxRate } from "../../model/util";
import { IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT } from "../../graphql/customFragments";
import { CachedImage } from "../../tabin/components/cachedImage";
import { getCloudFrontDomainName } from "../../private/aws-custom";

export const SalesAnalyticsTopProduct = () => {
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
            <SalesAnalyticsWrapper title="Sales By Product" showBackButton={true}>
                {!startDate || !endDate ? (
                    <div className="text-center">Please select a start and end date.</div>
                ) : salesAnalytics && salesAnalytics.totalSoldItems > 0 ? (
                    <div className="sales-by">
                        <div className="mb-6" style={{ width: "100%", height: "300px" }}>
                            <PieGraph data={salesAnalytics.productByGraphData} fill={graphColor} />
                        </div>
                        <div className="sales-table-wrapper">
                            <Table>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th className="text-left">Product</th>
                                        <th className="text-left">Category</th>
                                        <th className="text-right">Quantity</th>
                                        <th className="text-right">Net</th>
                                        <th className="text-right">Tax</th>
                                        <th className="text-right">Total</th>
                                        <th className="text-right">% Of Sale</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(salesAnalytics.mostSoldProducts)
                                        .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
                                        .map(([productId, product]) => {
                                            const pItem = product.item as IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT;

                                            return (
                                                <tr key={productId}>
                                                    <td className="sales-analytics-table-image-cell">
                                                        {pItem.image && (
                                                            <CachedImage
                                                                url={`${getCloudFrontDomainName()}/protected/${pItem.image.identityPoolId}/${
                                                                    pItem.image.key
                                                                }`}
                                                                className="sales-analytics-table-image"
                                                                alt="product-image"
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="text-left"> {product.item.name}</td>
                                                    <td className="text-left"> {pItem.category && pItem.category.name}</td>
                                                    <td className="text-right"> {product.totalQuantity}</td>
                                                    <td className="text-right">{`$${convertCentsToDollars(
                                                        (product.totalAmount * (100 - taxRate)) / 100
                                                    )}`}</td>
                                                    <td className="text-right">{`$${convertCentsToDollars(
                                                        product.totalAmount * (taxRate / 100)
                                                    )}`}</td>
                                                    <td className="text-right">{`$${convertCentsToDollars(product.totalAmount)}`}</td>
                                                    <td className="text-right">{`${(
                                                        (product.totalAmount * 100) /
                                                        (salesAnalytics.subTotalCompleted + salesAnalytics.subTotalNew)
                                                    ).toFixed(2)}%`}</td>
                                                </tr>
                                            );
                                        })}
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
