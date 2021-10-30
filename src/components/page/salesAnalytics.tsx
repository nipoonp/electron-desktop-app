import './salesAnalytics.scss';
import 'react-clock/dist/Clock.css';

import { add, addDays, format } from 'date-fns';
import Papa, { UnparseObject } from 'papaparse';
import Clock from 'react-clock';
import { useHistory } from 'react-router';

import { IBestHour, IDayComaparisonExport, useSalesAnalytics } from '../../context/salesAnalytics-context';
import { getTwelveHourFormat } from '../../model/util';
import { getCloudFrontDomainName } from '../../private/aws-custom';
import { CachedImage } from '../../tabin/components/cachedImage';
import { Card } from '../../tabin/components/card';
import { FullScreenSpinner } from '../../tabin/components/fullScreenSpinner';
import { convertCentsToDollars, downloadFile, getDollarString } from '../../util/util';
import {
    salesAnalyticsDailySalesPath,
    salesAnalyticsHourlySalesPath,
    salesAnalyticsTopCategoryPath,
    salesAnalyticsTopProductPath,
} from '../main';
import { LineGraph } from './salesAnalytics/salesAnalyticsGraphs';
import { SalesAnalyticsWrapper } from './salesAnalytics/salesAnalyticsWrapper';
import moment from 'moment';
import { useRestaurant } from '../../context/restaurant-context';
import { EOrderStatus } from '../../graphql/customQueries';
import { IGET_RESTAURANT_ORDER_FRAGMENT } from '../../graphql/customFragments';

export const SalesAnalytics = () => {
    const history = useHistory();
    const { restaurant } = useRestaurant();
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
            // const csv = Papa.unparse(salesAnalytics.dailySalesExport);
            const csv = Papa.unparse(calculateDailySalesExport());
            var csvData = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            downloadFile(csvData, `${moment(startDate).format("DD-MM")}_${moment(endDate).format("DD-MM")}_Sales_By_Day`, ".csv");
        }
    };

    const onExportHourlySales = () => {
        if (salesAnalytics) {
            // const csv = Papa.unparse(salesAnalytics.hourlySalesExport);
            const csv = Papa.unparse(calculateHourlySalesExport());
            var csvData = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            downloadFile(csvData, `${moment(startDate).format("DD-MM")}_${moment(endDate).format("DD-MM")}_Sales_By_Hour`, ".csv");
        }
    };

    const onExportMostSoldCategory = () => {
        if (salesAnalytics) {
            // const csv = Papa.unparse(salesAnalytics.mostSoldCategoriesExport);
            const csv = Papa.unparse(calculateCategorySalesExport());
            var csvData = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            downloadFile(csvData, `${moment(startDate).format("DD-MM")}_${moment(endDate).format("DD-MM")}_Sales_By_Category`, ".csv");
        }
    };

    const onExportMostSoldProduct = () => {
        if (salesAnalytics) {
            // const csv = Papa.unparse(salesAnalytics.mostSoldProductsExport);
            const csv = Papa.unparse(calculateProductSalesExport());
            var csvData = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            downloadFile(csvData, `${moment(startDate).format("DD-MM")}_${moment(endDate).format("DD-MM")}_Sales_By_Product`, ".csv");
        }
    };

    const calculateDailySalesExport = () => {
        // CSV Date Comparison Export
        const dailySalesExport = {} as UnparseObject<Array<string | number>>;
        if (salesAnalytics) {
            dailySalesExport.fields = ["Date", ...salesAnalytics.exportSalesDates];
            dailySalesExport.data = [];
            dailySalesExport.data.push(["Orders"]);
            dailySalesExport.data.push(["Net"]);
            dailySalesExport.data.push(["Tax"]);
            dailySalesExport.data.push(["Total"]);

            salesAnalytics.dailySalesExport.data.forEach((d) => {
                dailySalesExport.data[0] = [...dailySalesExport.data[0], d[1]];
                dailySalesExport.data[1] = [...dailySalesExport.data[1], d[2]];
                dailySalesExport.data[2] = [...dailySalesExport.data[2], d[3]];
                dailySalesExport.data[3] = [...dailySalesExport.data[3], d[4]];
            });
        }

        return dailySalesExport;
    };

    const calculateHourlySalesExport = () => {
        const hourlySalesExport = {} as UnparseObject<Array<string | number>>;
        if (salesAnalytics && startDate) {
            hourlySalesExport.fields = ["Time", ...salesAnalytics.exportSalesDates];
            hourlySalesExport.data = [];
            const hourlySales: IDayComaparisonExport = {};
            for (let i = 0; i < salesAnalytics.daysDifference; i++) {
                const loopDateTime: Date = addDays(new Date(startDate), i);

                hourlySales[format(new Date(loopDateTime), "yyyy-MM-dd")] = {
                    "00": { name: "00", total: 0 },
                    "01": { name: "01", total: 0 },
                    "02": { name: "02", total: 0 },
                    "03": { name: "03", total: 0 },
                    "04": { name: "04", total: 0 },
                    "05": { name: "05", total: 0 },
                    "06": { name: "06", total: 0 },
                    "07": { name: "07", total: 0 },
                    "08": { name: "08", total: 0 },
                    "09": { name: "09", total: 0 },
                    "10": { name: "10", total: 0 },
                    "11": { name: "11", total: 0 },
                    "12": { name: "12", total: 0 },
                    "13": { name: "13", total: 0 },
                    "14": { name: "14", total: 0 },
                    "15": { name: "15", total: 0 },
                    "16": { name: "16", total: 0 },
                    "17": { name: "17", total: 0 },
                    "18": { name: "18", total: 0 },
                    "19": { name: "19", total: 0 },
                    "20": { name: "20", total: 0 },
                    "21": { name: "21", total: 0 },
                    "22": { name: "22", total: 0 },
                    "23": { name: "23", total: 0 },
                };
            }

            salesAnalytics.orders.forEach((order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
                const placedAt: string = format(new Date(order.placedAt), "yyyy-MM-dd");
                const placedAtHour: string = format(new Date(order.placedAt), "HH");
                if (order.status === EOrderStatus.NEW || order.status === EOrderStatus.COMPLETED) {
                    hourlySales[placedAt][placedAtHour] = {
                        name: placedAtHour,
                        total: hourlySales[placedAt][placedAtHour].total + order.total,
                    };
                }
            });

            Object.entries(hourlySales).forEach(([date, obj]) => {
                const hourKeys = Object.keys(obj).sort((a, b) => a[0].localeCompare(b[0]));

                hourKeys.forEach((hour, index) => {
                    if (!hourlySalesExport.data[index] || hourlySalesExport.data[index].length === 0) {
                        hourlySalesExport.data.push([getTwelveHourFormat(Number(hour))]);
                    }
                    hourlySalesExport.data[index] = [...hourlySalesExport.data[index], getDollarString(obj[hour].total)];
                });
            });
        }
        return hourlySalesExport;
    };

    const calculateCategorySalesExport = () => {
        const categorySalesExport = {} as UnparseObject<Array<string | number>>;
        if (salesAnalytics && startDate && restaurant) {
            categorySalesExport.fields = ["Category", ...salesAnalytics.exportSalesDates];
            categorySalesExport.data = [];
            const categorySales: IDayComaparisonExport = {};
            const categories = [...restaurant.categories.items].sort((a, b) => (a.name > b.name && 1) || -1);
            for (let i = 0; i < salesAnalytics.daysDifference; i++) {
                const loopDateTime: Date = addDays(new Date(startDate), i);
                const defaultCategorySale = {};
                categories.forEach((c) => (defaultCategorySale[c.id] = { name: c.name, total: 0 }));
                categorySales[format(new Date(loopDateTime), "yyyy-MM-dd")] = defaultCategorySale;
            }

            salesAnalytics.orders.forEach((order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
                const placedAt: string = format(new Date(order.placedAt), "yyyy-MM-dd");
                order.products &&
                    order.products.forEach((product) => {
                        if (!product.category) return;
                        let newTotalAmount = categorySales[placedAt][product.category.id].total + product.price * product.quantity;

                        product.modifierGroups &&
                            product.modifierGroups.forEach((modifierGroup) => {
                                modifierGroup.modifiers.forEach((modifier) => {
                                    newTotalAmount += product.quantity * modifier.price * modifier.quantity;
                                });
                            });

                        categorySales[placedAt][product.category.id] = {
                            name: categorySales[placedAt][product.category.id].name,
                            total: newTotalAmount,
                        };
                    });
            });

            Object.entries(categorySales).forEach(([date, obj]) => {
                Object.entries(obj).forEach(([id, category], index) => {
                    if (!categorySalesExport.data[index] || categorySalesExport.data[index].length === 0) {
                        categorySalesExport.data.push([category.name]);
                    }
                    categorySalesExport.data[index] = [...categorySalesExport.data[index], getDollarString(category.total)];
                });
            });
        }
        return categorySalesExport;
    };

    const calculateProductSalesExport = () => {
        const productSalesExport = {} as UnparseObject<Array<string | number>>;
        if (salesAnalytics && startDate && restaurant) {
            productSalesExport.fields = ["Product", ...salesAnalytics.exportSalesDates];
            productSalesExport.data = [];
            const productSales: IDayComaparisonExport = {};
            const products = [...restaurant.products.items].sort((a, b) => (a.name > b.name && 1) || -1);
            for (let i = 0; i < salesAnalytics.daysDifference; i++) {
                const loopDateTime: Date = addDays(new Date(startDate), i);
                const defaultProductSale = {};
                products.forEach((p) => (defaultProductSale[p.id] = { name: p.name, total: 0 }));
                productSales[format(new Date(loopDateTime), "yyyy-MM-dd")] = defaultProductSale;
            }

            salesAnalytics.orders.forEach((order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
                const placedAt: string = format(new Date(order.placedAt), "yyyy-MM-dd");
                order.products &&
                    order.products.forEach((product) => {
                        let newTotalAmount = productSales[placedAt][product.id].total + product.price * product.quantity;

                        product.modifierGroups &&
                            product.modifierGroups.forEach((modifierGroup) => {
                                modifierGroup.modifiers.forEach((modifier) => {
                                    newTotalAmount += product.quantity * modifier.price * modifier.quantity;
                                });
                            });

                            productSales[placedAt][product.id] = {
                            name: productSales[placedAt][product.id].name,
                            total: newTotalAmount,
                        };
                    });
            });

            Object.entries(productSales).forEach(([date, obj]) => {
                Object.entries(obj).forEach(([id, product], index) => {
                    if (!productSalesExport.data[index] || productSalesExport.data[index].length === 0) {
                        productSalesExport.data.push([product.name]);
                    }
                    productSalesExport.data[index] = [...productSalesExport.data[index], getDollarString(product.total)];
                });
            });
        }
        return productSalesExport;
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
