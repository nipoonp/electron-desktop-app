import "./salesReport.scss";

import { addDays, differenceInDays, format, subDays } from "date-fns";
import { useEffect, useState } from "react";

import { useRestaurant } from "../../context/restaurant-context";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../../graphql/customFragments";
import { EOrderStatus } from "../../graphql/customQueries";
import { useGetRestaurantOrdersByBetweenPlacedAt } from "../../hooks/useGetRestaurantOrdersByBetweenPlacedAt";
import { SalesReportScreen } from "../../model/model";
import { Card } from "../../tabin/components/card";
import { DateRangePicker } from "../../tabin/components/dateRangePicker";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { convertCentsToDollars } from "../../util/util";
import { SalesBy } from "./salesReport/SalesBy";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import { CachedImage } from "../../tabin/components/cachedImage";
import { Graph } from "./salesReport/Graph";

interface IBestHour {
    hour: string;
    saleAmount: number;
    saleQuantity: number;
}

interface ITopSoldItem {
    item: any;
    quantity: number;
    saleAmount: number;
    percentageOfSale: string;
}

interface ISalesSummary {
    daysDifference: number;
    dailySales;
    subTotalNew: number;
    totalNumberOfOrdersNew: number;
    subTotalCancelled: number;
    totalNumberOfOrdersCancelled: number;
    subTotalCompleted: number;
    totalNumberOfOrdersCompleted: number;
    hourlySales;
    bestHour: IBestHour;
    mostSoldCategories;
    mostSoldProducts;
    topSoldCategory: ITopSoldItem;
    topSoldProduct: ITopSoldItem;
    totalSoldItems: number;
}

export const SalesReport = () => {
    const { restaurant } = useRestaurant();
    const [focusedInput, setFocusedInput] = useState<"startDate" | "endDate" | null>(null);

    const [startDate, setStartDate] = useState<string | null>(format(subDays(new Date(), 7), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState<string | null>(format(addDays(new Date(), 1), "yyyy-MM-dd")); //Adding extra day because GraphQL query is not inclusive of endDate

    const [salesSummaryData, setSalesSummaryData] = useState<ISalesSummary | null>(null);

    const [currentScreen, setCurrentScreen] = useState(SalesReportScreen.DASHBOARD);

    const { data: orders, error, loading, refetch } = useGetRestaurantOrdersByBetweenPlacedAt(
        restaurant ? restaurant.id : "",
        startDate || "",
        endDate || ""
    );

    useEffect(() => {
        processSalesData(orders);
    }, [orders]);

    const processSalesData = (orders: IGET_RESTAURANT_ORDER_FRAGMENT[] | null) => {
        if (!startDate || !endDate) return;
        if (!orders) return;

        const daysDifference: number = differenceInDays(new Date(endDate), new Date(startDate));

        const dailySales = {};

        let subTotalNew = 0;
        let totalNumberOfOrdersNew = 0;

        let subTotalCancelled = 0;
        let totalNumberOfOrdersCancelled = 0;

        let subTotalCompleted = 0;
        let numberOfProductsSold = 0;
        let totalNumberOfOrdersCompleted = 0;

        let totalSoldItems = 0;

        const hourlySales = {
            "00": { hour: "00", saleAmount: 0, saleQuantity: 0 },
            "01": { hour: "01", saleAmount: 0, saleQuantity: 0 },
            "02": { hour: "02", saleAmount: 0, saleQuantity: 0 },
            "03": { hour: "03", saleAmount: 0, saleQuantity: 0 },
            "04": { hour: "04", saleAmount: 0, saleQuantity: 0 },
            "05": { hour: "05", saleAmount: 0, saleQuantity: 0 },
            "06": { hour: "06", saleAmount: 0, saleQuantity: 0 },
            "07": { hour: "07", saleAmount: 0, saleQuantity: 0 },
            "08": { hour: "08", saleAmount: 0, saleQuantity: 0 },
            "09": { hour: "09", saleAmount: 0, saleQuantity: 0 },
            "10": { hour: "10", saleAmount: 0, saleQuantity: 0 },
            "11": { hour: "11", saleAmount: 0, saleQuantity: 0 },
            "12": { hour: "12", saleAmount: 0, saleQuantity: 0 },
            "13": { hour: "13", saleAmount: 0, saleQuantity: 0 },
            "14": { hour: "14", saleAmount: 0, saleQuantity: 0 },
            "15": { hour: "15", saleAmount: 0, saleQuantity: 0 },
            "16": { hour: "16", saleAmount: 0, saleQuantity: 0 },
            "17": { hour: "17", saleAmount: 0, saleQuantity: 0 },
            "18": { hour: "18", saleAmount: 0, saleQuantity: 0 },
            "19": { hour: "19", saleAmount: 0, saleQuantity: 0 },
            "20": { hour: "20", saleAmount: 0, saleQuantity: 0 },
            "21": { hour: "21", saleAmount: 0, saleQuantity: 0 },
            "22": { hour: "22", saleAmount: 0, saleQuantity: 0 },
            "23": { hour: "23", saleAmount: 0, saleQuantity: 0 },
        };

        let bestHour = { hour: "00", saleAmount: 0, saleQuantity: 0 };

        const mostSoldCategories = {};
        const mostSoldProducts = {};

        let topSoldCategory = {} as ITopSoldItem;
        let topSoldProduct = {} as ITopSoldItem;

        //First create an empty object with empty defined day sales
        for (var i = 0; i < daysDifference; i++) {
            const loopDateTime: Date = addDays(new Date(startDate), i);
            const formattedDateTime: string = format(new Date(loopDateTime), "yyyy-MM-dd");

            dailySales[formattedDateTime] = {
                subTotal: 0,
                quantitySold: 0,
                orders: [],
            };
        }

        orders.forEach((order) => {
            const placedAt: string = format(new Date(order.placedAt), "yyyy-MM-dd");
            const placedAtHour: string = format(new Date(order.placedAt), "HH");

            // NEW ORDERS //////////////////////////////////
            if (order.status === EOrderStatus.NEW) {
                subTotalNew += order.total;
                totalNumberOfOrdersNew++;
            }

            // CANCELLED ORDERS //////////////////////////////////
            if (order.status === EOrderStatus.CANCELLED) {
                subTotalCancelled += order.total;
                totalNumberOfOrdersCancelled++;
            }

            if (order.status === EOrderStatus.COMPLETED) {
                const newSubTotal = dailySales[placedAt].subTotal + order.subTotal;
                const newQuantitySold = dailySales[placedAt].quantitySold + 1;
                const newOrders: IGET_RESTAURANT_ORDER_FRAGMENT[] = [...dailySales[placedAt].orders, order];

                subTotalCompleted += order.total;
                totalNumberOfOrdersCompleted++;

                dailySales[placedAt] = {
                    subTotal: newSubTotal,
                    quantitySold: newQuantitySold,
                    orders: [...newOrders],
                };
            }

            // HOURLY SALES //////////////////////////////////
            const newSaleQuantity = hourlySales[placedAtHour].saleQuantity + 1;
            const newSaleAmount = hourlySales[placedAtHour].saleAmount + order.total;

            hourlySales[placedAtHour] = {
                hour: placedAtHour,
                saleQuantity: newSaleQuantity,
                saleAmount: newSaleAmount,
            };

            if (newSaleAmount > bestHour.saleAmount) {
                bestHour = {
                    hour: placedAtHour,
                    saleQuantity: newSaleQuantity,
                    saleAmount: newSaleAmount,
                };
            }

            // MOST POPULAR CATEGORY //////////////////////////////////
            order.products &&
                order.products.forEach((product) => {
                    if (!product.category) return;

                    if (mostSoldCategories[product.category.id]) {
                        const prevQuantity = mostSoldCategories[product.category.id].quantity;
                        const prevSales = mostSoldCategories[product.category.id].sales;

                        mostSoldCategories[product.category.id] = {
                            category: product.category,
                            quantity: prevQuantity + product.quantity,
                            sales: prevSales + product.price * product.quantity,
                        };
                    } else {
                        mostSoldCategories[product.category.id] = {
                            category: product.category,
                            quantity: product.quantity,
                            sales: product.price * product.quantity,
                        };
                    }

                    // Total sold items
                    totalSoldItems += product.quantity;
                });

            // Top Category
            let maxCategory = 0;
            let topSoldCategoryId = "";
            for (const key in mostSoldCategories) {
                if (mostSoldCategories[key].sales > maxCategory) {
                    maxCategory = mostSoldCategories[key].sales;
                    topSoldCategoryId = key;
                }
            }

            topSoldCategory = {
                item: mostSoldCategories[topSoldCategoryId].category,
                quantity: mostSoldCategories[topSoldCategoryId].quantity,
                saleAmount: mostSoldCategories[topSoldCategoryId].sales,
                percentageOfSale: ((mostSoldCategories[topSoldCategoryId].sales * 100) / subTotalCompleted).toFixed(2),
            };

            //MOST POPULAR PRODUCT //////////////////////////////////
            order.products &&
                order.products.forEach((product) => {
                    numberOfProductsSold = numberOfProductsSold + product.quantity;

                    if (mostSoldProducts[product.id]) {
                        const prevQuantity = mostSoldProducts[product.id].quantity;
                        const prevSales = mostSoldProducts[product.id].sales;

                        mostSoldProducts[product.id] = {
                            product: product,
                            quantity: prevQuantity + product.quantity,
                            sales: prevSales + product.price * product.quantity,
                        };
                    } else {
                        mostSoldProducts[product.id] = {
                            product: product,
                            quantity: product.quantity,
                            sales: product.price * product.quantity,
                        };
                    }
                });

            // Top Product
            let maxProduct = 0;
            let topSoldProductId = "";
            for (const key in mostSoldProducts) {
                if (mostSoldProducts[key].sales > maxProduct) {
                    maxProduct = mostSoldProducts[key].sales;
                    topSoldProductId = key;
                }
            }

            topSoldProduct = {
                item: mostSoldProducts[topSoldProductId].product,
                quantity: mostSoldProducts[topSoldProductId].quantity,
                saleAmount: mostSoldProducts[topSoldProductId].sales,
                percentageOfSale: ((mostSoldProducts[topSoldProductId].sales * 100) / subTotalCompleted).toFixed(2),
            };
        });

        console.log("xxx...", {
            daysDifference,
            dailySales,
            subTotalNew,
            totalNumberOfOrdersNew,
            subTotalCancelled,
            totalNumberOfOrdersCancelled,
            subTotalCompleted,
            totalNumberOfOrdersCompleted,
            hourlySales,
            bestHour,
            mostSoldCategories,
            mostSoldProducts,
            totalSoldItems,
        });

        setSalesSummaryData({
            daysDifference,
            dailySales,
            subTotalNew,
            totalNumberOfOrdersNew,
            subTotalCancelled,
            totalNumberOfOrdersCancelled,
            subTotalCompleted,
            totalNumberOfOrdersCompleted,
            hourlySales,
            bestHour,
            mostSoldCategories,
            mostSoldProducts,
            topSoldCategory,
            topSoldProduct,
            totalSoldItems,
        });
    };

    console.log("s:", salesSummaryData);

    const onDatesChange = async (startD: string | null, endD: string | null) => {
        setStartDate(startD);
        setEndDate(endD);

        if (!startDate || !endDate) return;

        //Adding extra day because GraphQL query is not inclusive of endDate
        const endDateWithExtraDay = format(addDays(new Date(endDate), 1), "yyyy-MM-dd");

        await refetch({
            orderRestaurantId: restaurant ? restaurant.id : "",
            placedAtStartDate: startDate,
            placedAtEndDate: endDateWithExtraDay,
        });
    };

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
                {/* <Clock/> */}
                <div className="h4">{bestHour.hour}</div>
                <div>
                    <span className="h4">{`$${convertCentsToDollars(bestHour.saleAmount)}`}</span> total sales
                </div>
                <div>
                    <span className="h4">{bestHour.saleQuantity}</span> order(s)
                </div>
            </div>
        );
    };

    const MainReportBody = (props: { salesSummaryData: ISalesSummary }) => {
        const { salesSummaryData } = props;
        const dayByGraphData: { date: string; sales: number }[] = [];
        const hourByGraphData: { hour: string; quantity: number }[] = [];
        for (const [key, value] of Object.entries<any>(salesSummaryData.dailySales)) {
            dayByGraphData.push({
                date: format(new Date(key), "dd MMM"),
                sales: value.orders.length,
            });
        }

        for (const [key, value] of Object.entries<any>(salesSummaryData.hourlySales).sort((a, b) => a[0].localeCompare(b[0]))) {
            hourByGraphData.push({
                hour: key,
                quantity: value.saleQuantity,
            });
        }

        return (
            <div>
                <div className="grid">
                    <div className="item item1">
                        <Card title="Sales By Day" onOpen={() => changeScreen(SalesReportScreen.DAY)}>
                            <div style={{ width: "100%", height: "300px" }}>
                                <Graph xAxis="date" lines={["sales"]} graphData={dayByGraphData} />
                            </div>
                        </Card>
                    </div>
                    <div className="item item2 report-sales-value-wrapper">
                        <Card className="text-center">
                            <div className="h3 mb-1">{`$${convertCentsToDollars(salesSummaryData.subTotalCompleted)}`}</div>
                            <div className="text-uppercase">Total Sales</div>
                        </Card>
                        <Card className="text-center">
                            <div className="h3 mb-1">{`$${convertCentsToDollars(
                                isNaN(salesSummaryData.subTotalCompleted / salesSummaryData.totalNumberOfOrdersCompleted)
                                    ? 0
                                    : salesSummaryData.subTotalCompleted / salesSummaryData.totalNumberOfOrdersCompleted
                            )}`}</div>
                            <div className="text-uppercase">Average Sales</div>
                        </Card>
                        <Card className="text-center">
                            <div className="h3 mt-1">{salesSummaryData.totalNumberOfOrdersCompleted}</div>
                            <div className="text-uppercase">Sales Count</div>
                        </Card>
                        <Card className="text-center">
                            <div className="h3 mb-1">{salesSummaryData.totalSoldItems}</div>
                            <div className="text-uppercase">Items Sold</div>
                        </Card>
                    </div>
                    <div className="item item3">
                        <Card title="Sales By Hour" onOpen={() => changeScreen(SalesReportScreen.HOUR)}>
                            <div style={{ width: "100%", height: "250px" }}>
                                <Graph xAxis="hour" lines={["quantity"]} graphData={hourByGraphData} />
                            </div>
                        </Card>
                    </div>
                    {salesSummaryData && salesSummaryData.bestHour && (
                        <div className="item item4">
                            <BestHourCard bestHour={salesSummaryData.bestHour} />
                        </div>
                    )}
                    {salesSummaryData.topSoldCategory && (
                        <div className="item item5">
                            <Card title="Top Category" onOpen={() => changeScreen(SalesReportScreen.CATEGORY)}>
                                <div className="top-item-container" style={{ alignItems: "center" }}>
                                    <div className="top-item-image text-center">
                                        {salesSummaryData.topSoldCategory?.item?.image && (
                                            <CachedImage
                                                url={`${getCloudFrontDomainName()}/protected/${
                                                    salesSummaryData.topSoldCategory.item.image.identityPoolId
                                                }/${salesSummaryData.topSoldCategory.item.image.key}`}
                                                className="image mb-2"
                                                alt={salesSummaryData.topSoldCategory.item.name}
                                            />
                                        )}
                                        <div>{salesSummaryData.topSoldCategory?.item?.name}</div>
                                    </div>
                                    <div className="top-item-details text-center">
                                        <div className="text-uppercase">Quantity</div>
                                        <div className="h4">{salesSummaryData.topSoldCategory.quantity}</div>
                                        <div className="text-uppercase">Sale Amount</div>
                                        <div className="h4">${convertCentsToDollars(salesSummaryData.topSoldCategory.saleAmount ?? 0)}</div>
                                        <div className="text-uppercase">% of Sales</div>
                                        <div className="h4">{salesSummaryData.topSoldCategory.percentageOfSale}</div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                    {salesSummaryData.topSoldProduct && (
                        <div className="item item6">
                            <Card title="Top Product" onOpen={() => changeScreen(SalesReportScreen.PRODUCT)}>
                                <div className="top-item-container" style={{ alignItems: "center" }}>
                                    <div className="top-item-image text-center">
                                        {salesSummaryData.topSoldProduct?.item?.image && (
                                            <CachedImage
                                                url={`${getCloudFrontDomainName()}/protected/${
                                                    salesSummaryData.topSoldProduct.item.image.identityPoolId
                                                }/${salesSummaryData.topSoldProduct.item.image.key}`}
                                                className="image mb-2"
                                                alt={salesSummaryData.topSoldProduct.item.name}
                                            />
                                        )}
                                        <div>{salesSummaryData.topSoldProduct?.item?.name}</div>
                                    </div>
                                    <div className="top-item-details text-center">
                                        <div className="text-uppercase">Quantity</div>
                                        <div className="h4">{salesSummaryData.topSoldProduct.quantity}</div>
                                        <div className="text-uppercase">Sale Amount</div>
                                        <div className="h4">${convertCentsToDollars(salesSummaryData.topSoldProduct.saleAmount ?? 0)}</div>
                                        <div className="text-uppercase">% of Sales</div>
                                        <div className="h4">{salesSummaryData.topSoldProduct.percentageOfSale}</div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderCurrentScreen = () => {
        const graphDetails = {
            graphData: [],
            xAxis: "date",
            lines: ["sales"],
        };
        switch (currentScreen.toLocaleLowerCase()) {
            case "day":
            case "hour":
            case "category":
            case "product":
                return (
                    <>
                        <div className="sales-by p-3">
                            <SalesBy screenName={currentScreen} changeScreen={changeScreen} graphDetails={graphDetails} salesSummaryData={salesSummaryData} />
                        </div>
                    </>
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
                        {salesSummaryData && <MainReportBody salesSummaryData={salesSummaryData} />}
                    </div>
                );
        }
    };

    if (error) {
        return <h1>Couldn't fetch orders. Try Refreshing</h1>;
    }

    if (!orders) {
        return <>Couldn't fetch orders.</>;
    }

    if (loading) {
        return <FullScreenSpinner show={loading} text={"Loading report details..."} />;
    }

    return (
        <>
            <div className="reports">
                <div className="sales-report-wrapper">{renderCurrentScreen()}</div>
            </div>
        </>
    );
};
