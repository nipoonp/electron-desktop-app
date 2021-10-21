import './salesAnalytics.scss';
import 'react-clock/dist/Clock.css';

import { add } from 'date-fns';
import Papa from 'papaparse';
import Clock from 'react-clock';
import { useHistory } from 'react-router';

import { IBestHour, useSalesAnalytics } from '../../context/salesAnalytics-context';
import { getTwelveHourFormat } from '../../model/util';
import { getCloudFrontDomainName } from '../../private/aws-custom';
import { CachedImage } from '../../tabin/components/cachedImage';
import { Card } from '../../tabin/components/card';
import { FullScreenSpinner } from '../../tabin/components/fullScreenSpinner';
import { convertCentsToDollars, downloadFile } from '../../util/util';
import {
    salesAnalyticsDailySalesPath,
    salesAnalyticsHourlySalesPath,
    salesAnalyticsTopCategoryPath,
    salesAnalyticsTopProductPath,
} from '../main';
import { LineGraph } from './salesAnalytics/salesAnalyticsGraphs';
import { SalesAnalyticsWrapper } from './salesAnalytics/salesAnalyticsWrapper';
import moment from 'moment';

export const SalesAnalytics = () => {
    const history = useHistory();
    const { startDate, endDate, salesAnalytics, error, loading } = useSalesAnalytics();

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

    const onExportDailySales = () => {
        if (salesAnalytics) {
            const csv = Papa.unparse(salesAnalytics.dailySalesExport);
            var csvData = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            downloadFile(csvData, `${moment(startDate).format("DD-MM")}_${moment(endDate).format("DD-MM")}_Sales_By_Day`, ".csv");
        }
    };

    const onExportHourlySales = () => {
        if (salesAnalytics) {
            const csv = Papa.unparse(salesAnalytics.hourlySalesExport);
            var csvData = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            downloadFile(csvData, `${moment(startDate).format("DD-MM")}_${moment(endDate).format("DD-MM")}_Sales_By_Hour`, ".csv");
        }
    };

    const onExportMostSoldCategory = () => {
        if (salesAnalytics) {
            const csv = Papa.unparse(salesAnalytics.mostSoldCategoriesExport);
            var csvData = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            downloadFile(csvData, `${moment(startDate).format("DD-MM")}_${moment(endDate).format("DD-MM")}_Sales_By_Category`, ".csv");
        }
    };

    const onExportMostSoldProduct = () => {
        if (salesAnalytics) {
            const csv = Papa.unparse(salesAnalytics.mostSoldProductsExport);
            var csvData = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            downloadFile(csvData, `${moment(startDate).format("DD-MM")}_${moment(endDate).format("DD-MM")}_Sales_By_Product`, ".csv");
        }
    };

    if (error) {
        return <h1>Couldn't fetch orders. Try Refreshing</h1>;
    }

    if (loading) {
        return <FullScreenSpinner show={loading} text={"Loading sales analytics..."} />;
    }

    return (
        <>
            <SalesAnalyticsWrapper title="Sales Analytics">
                {!startDate || !endDate ? (
                    <div className="text-center">Please select a start and end date.</div>
                ) : salesAnalytics && salesAnalytics.totalSoldItems > 0 ? (
                    <div className="sales-analytics-grid">
                        <div className="sales-analytics-grid-item1">
                            <Card title="Sales By Day" onOpen={onClickDailySales} onExport={onExportDailySales}>
                                <div style={{ width: "100%", height: "300px" }}>
                                    <LineGraph xAxis="date" lines={["sales"]} graphData={salesAnalytics.dayByGraphData} fill={graphColor} />
                                </div>
                            </Card>
                        </div>
                        <div className="sales-analytics-grid-item2 analytics-value-wrapper">
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
                        <div className="sales-analytics-grid-item3">
                            <Card title="Sales By Hour" onOpen={onClickHourlySales} onExport={onExportHourlySales}>
                                <div style={{ width: "100%", height: "250px" }}>
                                    <LineGraph xAxis="hour" lines={["sales"]} graphData={salesAnalytics.hourByGraphData} fill={graphColor} />
                                </div>
                            </Card>
                        </div>
                        {salesAnalytics.bestHour && (
                            <div className="sales-analytics-grid-item4">
                                <BestHourCard bestHour={salesAnalytics.bestHour} />
                            </div>
                        )}
                        {salesAnalytics.topSoldCategory && (
                            <div className="sales-analytics-grid-item5">
                                <Card title="Top Category" onOpen={onClickTopCategory} onExport={onExportMostSoldCategory}>
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
                            <div className="sales-analytics-grid-item6">
                                <Card title="Top Product" onOpen={onClickTopProduct} onExport={onExportMostSoldProduct}>
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
                ) : (
                    <div className="text-center">No orders were placed during this period. Please select another date range.</div>
                )}
            </SalesAnalyticsWrapper>
        </>
    );
};
