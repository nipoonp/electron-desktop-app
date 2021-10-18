import "./salesReport.scss";
import "react-clock/dist/Clock.css";

import { format, add } from "date-fns";
import { useState } from "react";
import Clock from "react-clock";
import { FaArrowLeft } from "react-icons/fa";

import { SalesReportScreen } from "../../model/model";
import { getTwelveHourFormat } from "../../model/util";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import { CachedImage } from "../../tabin/components/cachedImage";
import { Card } from "../../tabin/components/card";
import { DateRangePicker } from "../../tabin/components/dateRangePicker";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { convertCentsToDollars, convertCentsToDollarsReturnFloat } from "../../util/util";
import { LineGraph, PieGraph } from "./salesReport/Graph";
import { Table } from "../../tabin/components/table";
import { IBestHour, ISalesAnalytics, useSalesAnalytics } from "../../context/salesAnalytics-context";

export const SalesReport = () => {
    const { startDate, endDate, salesAnalytics, error, loading, onDatesChange } = useSalesAnalytics();

    const [focusedInput, setFocusedInput] = useState<"startDate" | "endDate" | null>(null);
    const [currentScreen, setCurrentScreen] = useState(SalesReportScreen.DASHBOARD);

    const graphColor = getComputedStyle(document.documentElement).getPropertyValue("--primary-color");

    const onFocusChange = (focusedInput: "startDate" | "endDate" | null) => {
        setFocusedInput(focusedInput);
    };

    const changeScreen = (screenName: SalesReportScreen) => {
        setCurrentScreen(screenName);
    };

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

    const MainReportBody = (props: { salesAnalytics: ISalesAnalytics }) => {
        const { salesAnalytics } = props;
        const {
            subTotalCompleted,
            totalNumberOfOrdersCompleted,
            bestHour,
            topSoldCategory,
            topSoldProduct,
            totalSoldItems,
            dayByGraphData,
            hourByGraphData,
        } = salesAnalytics;

        return (
            <div>
                <div className="grid">
                    <div className="item item1">
                        <Card title="Sales By Day" onOpen={() => changeScreen(SalesReportScreen.DAY)}>
                            <div style={{ width: "100%", height: "300px" }}>
                                <LineGraph xAxis="date" lines={["sales"]} graphData={dayByGraphData} fill={graphColor} />
                            </div>
                        </Card>
                    </div>
                    <div className="item item2 report-sales-value-wrapper">
                        <Card className="text-center">
                            <div className="h3 mb-1">{`$${convertCentsToDollars(subTotalCompleted)}`}</div>
                            <div className="text-uppercase">Total Sales</div>
                        </Card>
                        <Card className="text-center">
                            <div className="h3 mb-1">{`$${convertCentsToDollars(
                                isNaN(subTotalCompleted / totalNumberOfOrdersCompleted) ? 0 : subTotalCompleted / totalNumberOfOrdersCompleted
                            )}`}</div>
                            <div className="text-uppercase">Average Sales</div>
                        </Card>
                        <Card className="text-center">
                            <div className="h3 mb-1">{totalNumberOfOrdersCompleted}</div>
                            <div className="text-uppercase">Sales Count</div>
                        </Card>
                        <Card className="text-center">
                            <div className="h3 mb-1">{totalSoldItems}</div>
                            <div className="text-uppercase">Items Sold</div>
                        </Card>
                    </div>
                    <div className="item item3">
                        <Card title="Sales By Hour" onOpen={() => changeScreen(SalesReportScreen.HOUR)}>
                            <div style={{ width: "100%", height: "250px" }}>
                                <LineGraph xAxis="hour" lines={["sales"]} graphData={hourByGraphData} fill={graphColor} />
                            </div>
                        </Card>
                    </div>
                    {salesAnalytics && bestHour && (
                        <div className="item item4">
                            <BestHourCard bestHour={bestHour} />
                        </div>
                    )}
                    {topSoldCategory && (
                        <div className="item item5">
                            <Card title="Top Category" onOpen={() => changeScreen(SalesReportScreen.CATEGORY)}>
                                <div className="top-item-container" style={{ alignItems: "center" }}>
                                    <div className="top-item-image text-center">
                                        {topSoldCategory?.item?.image && (
                                            <CachedImage
                                                url={`${getCloudFrontDomainName()}/protected/${topSoldCategory.item.image.identityPoolId}/${
                                                    topSoldCategory.item.image.key
                                                }`}
                                                className="image mb-2"
                                                alt={topSoldCategory.item.name}
                                            />
                                        )}
                                        <div>{topSoldCategory?.item?.name}</div>
                                    </div>
                                    <div className="top-item-details text-center">
                                        <div className="text-uppercase">Quantity</div>
                                        <div className="h4 mb-2">{topSoldCategory.totalQuantity}</div>
                                        <div className="text-uppercase">Sale Amount</div>
                                        <div className="h4 mb-2">${convertCentsToDollars(topSoldCategory.totalAmount ?? 0)}</div>
                                        <div className="text-uppercase">% of Sales</div>
                                        <div className="h4">{((topSoldCategory.totalAmount / subTotalCompleted) * 100).toFixed(2)}%</div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                    {topSoldProduct && (
                        <div className="item item6">
                            <Card title="Top Product" onOpen={() => changeScreen(SalesReportScreen.PRODUCT)}>
                                <div className="top-item-container" style={{ alignItems: "center" }}>
                                    <div className="top-item-image text-center">
                                        {topSoldProduct?.item?.image && (
                                            <CachedImage
                                                url={`${getCloudFrontDomainName()}/protected/${topSoldProduct.item.image.identityPoolId}/${
                                                    topSoldProduct.item.image.key
                                                }`}
                                                className="image mb-2"
                                                alt={topSoldProduct.item.name}
                                            />
                                        )}
                                        <div>{topSoldProduct?.item?.name}</div>
                                    </div>
                                    <div className="top-item-details text-center">
                                        <div className="text-uppercase">Quantity</div>
                                        <div className="h4 mb-2">{topSoldProduct.totalQuantity}</div>
                                        <div className="text-uppercase">Sale Amount</div>
                                        <div className="h4 mb-2">${convertCentsToDollars(topSoldProduct.totalAmount ?? 0)}</div>
                                        <div className="text-uppercase">% of Sales</div>
                                        <div className="h4">{((topSoldProduct.totalAmount / subTotalCompleted) * 100).toFixed(2)}%</div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const salesByScreenHeader = (
        <>
            <div className="h3 pb-2">{currentScreen ? `Sales by ${currentScreen}` : "Reports"}</div>
            <div className="h5 pb-2">
                <span className="cursor-pointer" onClick={(e) => changeScreen(SalesReportScreen.DASHBOARD)}>
                    <FaArrowLeft />
                </span>
            </div>
        </>
    );

    const renderCurrentScreen = () => {
        switch (currentScreen.toLocaleLowerCase()) {
            case "day":
                return (
                    <div className="sales-by p-3">
                        {salesByScreenHeader}
                        <div className="pb-3" style={{ width: "100%", height: "300px" }}>
                            <LineGraph xAxis="date" lines={["sales"]} graphData={salesAnalytics?.dayByGraphData} fill={graphColor} />
                        </div>
                        {salesAnalytics && (
                            <div className="sales-reading-wrapper">
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
                                    <div className="h3 mt-1">{salesAnalytics.totalNumberOfOrdersCompleted}</div>
                                    <div className="text-uppercase">Sales Count</div>
                                </Card>
                                <Card className="text-center sales-reading">
                                    <div className="h3 mb-1">{salesAnalytics.totalSoldItems}</div>
                                    <div className="text-uppercase">Items Sold</div>
                                </Card>
                            </div>
                        )}
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
                                    {salesAnalytics &&
                                        Object.entries(salesAnalytics.dailySales).map(([date, sale], index) => (
                                            <tr key={index}>
                                                <td> {format(new Date(date), "E dd MMM")}</td>
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
                );
            case "hour":
                return (
                    <div className="sales-by p-3">
                        {salesByScreenHeader}
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
                );
            case "category":
                return (
                    <div className="sales-by p-3">
                        {salesByScreenHeader}
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
                );
            case "product":
                return (
                    <div className="sales-by p-3">
                        {salesByScreenHeader}
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
                );
            case "":
            default:
                return (
                    <div className="sales-report p-3">
                        <div className="report-header mb-3">
                            <div className="h2">Reports</div>
                            <DateRangePicker
                                startDate={startDate}
                                endDate={endDate}
                                onDatesChange={onDatesChange}
                                focusedInput={focusedInput}
                                onFocusChange={onFocusChange}
                            />
                        </div>
                        {salesAnalytics && <MainReportBody salesAnalytics={salesAnalytics} />}
                    </div>
                );
        }
    };

    if (error) {
        return <h1>Couldn't fetch orders. Try Refreshing</h1>;
    }

    if (loading) {
        return <FullScreenSpinner show={loading} text={"Loading report details..."} />;
    }

    return (
        <>
            <div className="reports">
                {startDate && endDate ? (
                    <div className="sales-report-wrapper">{renderCurrentScreen()}</div>
                ) : (
                    <div>Please select both start and end dates.</div>
                )}
            </div>
        </>
    );
};
