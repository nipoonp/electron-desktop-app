import { add } from "date-fns";
import Clock from "react-clock";
import { getTwelveHourFormat } from "../../model/util";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import { CachedImage } from "../../tabin/components/cachedImage";
import { Card } from "../../tabin/components/card";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { convertCentsToDollars } from "../../util/util";
import { LineGraph } from "./salesAnalytics/Graph";
import { IBestHour, useSalesAnalytics } from "../../context/salesAnalytics-context";
import { SalesAnalyticsWrapper } from "./salesAnalytics/salesAnalyticsWrapper";
import { useHistory } from "react-router";
import { salesAnalyticsDailySalesPath, salesAnalyticsHourlySalesPath, salesAnalyticsTopCategoryPath, salesAnalyticsTopProductPath } from "../main";

import "./salesAnalytics.scss";
import "react-clock/dist/Clock.css";

export const SalesAnalytics = () => {
    const history = useHistory();
    const { salesAnalytics, error, loading } = useSalesAnalytics();

    const graphColor = getComputedStyle(document.documentElement).getPropertyValue("--primary-color");

    const BestHourCard = (props: { bestHour: IBestHour }) => {
        const { bestHour } = props;

        return (
            <div className="card" style={{ textAlign: "center" }}>
                <div className="text-uppercase">Best Hour</div>
                <div className="besthour-clock-wrapper m-2">
                    <Clock
                        className="besthour-clock"
                        value={add(new Date().setHours(0, 0, 0, 0), { hours: Number(bestHour.hour) })}
                        renderSecondHand={false}
                        renderMinuteMarks={false}
                    />
                </div>
                <div className="h4">{getTwelveHourFormat(Number(bestHour.hour))}</div>
                <div>
                    <span className="h4">{`$${convertCentsToDollars(bestHour.totalAmount)}`}</span> total sales
                </div>
                <div>
                    <span className="h4">{bestHour.totalQuantity}</span> order(s)
                </div>
            </div>
        );
    };

    const onClickDailySales = () => {
        history.push(salesAnalyticsDailySalesPath);
    };

    const onClickHourlySales = () => {
        history.push(salesAnalyticsHourlySalesPath);
    };

    const onClickTopCategory = () => {
        history.push(salesAnalyticsTopCategoryPath);
    };

    const onClickTopProduct = () => {
        history.push(salesAnalyticsTopProductPath);
    };

    if (error) {
        return <h1>Couldn't fetch orders. Try Refreshing</h1>;
    }

    if (loading) {
        return <FullScreenSpinner show={loading} text={"Loading sales analytics..."} />;
    }

    return (
        <>
            {salesAnalytics && (
                <SalesAnalyticsWrapper title="Sales Analytics">
                    <div className="grid">
                        <div className="item item1">
                            <Card title="Sales By Day" onOpen={onClickDailySales}>
                                <div style={{ width: "100%", height: "300px" }}>
                                    <LineGraph xAxis="date" lines={["sales"]} graphData={salesAnalytics.dayByGraphData} fill={graphColor} />
                                </div>
                            </Card>
                        </div>
                        <div className="item item2 report-sales-value-wrapper">
                            <Card className="text-center">
                                <div className="h3 mb-1">{`$${convertCentsToDollars(salesAnalytics.subTotalCompleted)}`}</div>
                                <div className="text-uppercase">Total Sales</div>
                            </Card>
                            <Card className="text-center">
                                <div className="h3 mb-1">{`$${convertCentsToDollars(
                                    isNaN(salesAnalytics.subTotalCompleted / salesAnalytics.totalNumberOfOrdersCompleted)
                                        ? 0
                                        : salesAnalytics.subTotalCompleted / salesAnalytics.totalNumberOfOrdersCompleted
                                )}`}</div>
                                <div className="text-uppercase">Average Sales</div>
                            </Card>
                            <Card className="text-center">
                                <div className="h3 mb-1">{salesAnalytics.totalNumberOfOrdersCompleted}</div>
                                <div className="text-uppercase">Sales Count</div>
                            </Card>
                            <Card className="text-center">
                                <div className="h3 mb-1">{salesAnalytics.totalSoldItems}</div>
                                <div className="text-uppercase">Items Sold</div>
                            </Card>
                        </div>
                        <div className="item item3">
                            <Card title="Sales By Hour" onOpen={onClickHourlySales}>
                                <div style={{ width: "100%", height: "250px" }}>
                                    <LineGraph xAxis="hour" lines={["sales"]} graphData={salesAnalytics.hourByGraphData} fill={graphColor} />
                                </div>
                            </Card>
                        </div>
                        {salesAnalytics.bestHour && (
                            <div className="item item4">
                                <BestHourCard bestHour={salesAnalytics.bestHour} />
                            </div>
                        )}
                        {salesAnalytics.topSoldCategory && (
                            <div className="item item5">
                                <Card title="Top Category" onOpen={onClickTopCategory}>
                                    <div className="top-item-container" style={{ alignItems: "center" }}>
                                        <div className="top-item-image text-center">
                                            {salesAnalytics.topSoldCategory.item?.image && (
                                                <CachedImage
                                                    url={`${getCloudFrontDomainName()}/protected/${
                                                        salesAnalytics.topSoldCategory.item.image.identityPoolId
                                                    }/${salesAnalytics.topSoldCategory.item.image.key}`}
                                                    className="image mb-2"
                                                    alt={salesAnalytics.topSoldCategory.item.name}
                                                />
                                            )}
                                            <div>{salesAnalytics.topSoldCategory?.item?.name}</div>
                                        </div>
                                        <div className="top-item-details text-center">
                                            <div className="text-uppercase">Quantity</div>
                                            <div className="h4 mb-2">{salesAnalytics.topSoldCategory.totalQuantity}</div>
                                            <div className="text-uppercase">Sale Amount</div>
                                            <div className="h4 mb-2">${convertCentsToDollars(salesAnalytics.topSoldCategory.totalAmount ?? 0)}</div>
                                            <div className="text-uppercase">% of Sales</div>
                                            <div className="h4">
                                                {((salesAnalytics.topSoldCategory.totalAmount / salesAnalytics.subTotalCompleted) * 100).toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                        {salesAnalytics.topSoldProduct && (
                            <div className="item item6">
                                <Card title="Top Product" onOpen={onClickTopProduct}>
                                    <div className="top-item-container" style={{ alignItems: "center" }}>
                                        <div className="top-item-image text-center">
                                            {salesAnalytics.topSoldProduct.item?.image && (
                                                <CachedImage
                                                    url={`${getCloudFrontDomainName()}/protected/${
                                                        salesAnalytics.topSoldProduct.item.image.identityPoolId
                                                    }/${salesAnalytics.topSoldProduct.item.image.key}`}
                                                    className="image mb-2"
                                                    alt={salesAnalytics.topSoldProduct.item.name}
                                                />
                                            )}
                                            <div>{salesAnalytics.topSoldProduct?.item?.name}</div>
                                        </div>
                                        <div className="top-item-details text-center">
                                            <div className="text-uppercase">Quantity</div>
                                            <div className="h4 mb-2">{salesAnalytics.topSoldProduct.totalQuantity}</div>
                                            <div className="text-uppercase">Sale Amount</div>
                                            <div className="h4 mb-2">${convertCentsToDollars(salesAnalytics.topSoldProduct.totalAmount ?? 0)}</div>
                                            <div className="text-uppercase">% of Sales</div>
                                            <div className="h4">
                                                {((salesAnalytics.topSoldProduct.totalAmount / salesAnalytics.subTotalCompleted) * 100).toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                </SalesAnalyticsWrapper>
            )}
        </>
    );
};
