import { addDays, differenceInDays, format, subDays } from "date-fns";
import { useEffect, useState } from "react";
import { useRestaurant } from "../../context/restaurant-context";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../../graphql/customFragments";
import { EOrderStatus } from "../../graphql/customQueries";
import { useGetRestaurantOrdersByBetweenPlacedAt } from "../../hooks/useGetRestaurantOrdersByBetweenPlacedAt";
import { DateRangePicker } from "../../tabin/components/dateRangePicker";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import SalesBy from "./salesReport/SalesBy";

import "./salesReport.scss";
import { SalesReportScreen } from "../../model/model";
import { Card } from "../../tabin/components/card";
import { Graph } from "./salesReport/Graph";
import { CachedImage } from "../../tabin/components/cachedImage";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import { convertCentsToDollars } from "../../util/util";

export const SalesReport = () => {
    const { restaurant } = useRestaurant();
    const [focusedInput, setFocusedInput] = useState<"startDate" | "endDate" | null>(null);

    const [startDate, setStartDate] = useState<string | null>(format(subDays(new Date(), 7), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState<string | null>(format(addDays(new Date(), 1), "yyyy-MM-dd")); //Adding extra day because GraphQL query is not inclusive of endDate

    const [salesSummaryData, setSalesSummaryData] = useState<any | null>(null);

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

        orders.forEach((order) => {
            const placedAt: string = format(new Date(order.placedAt), "yyyy-MM-dd");
            const placedAtHour: string = format(new Date(order.placedAt), "HH");

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
                    orders: newOrders,
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
                });

            //MOST POPULAR PRODUCT //////////////////////////////////
            order.products &&
                order.products.forEach((product) => {
                    numberOfProductsSold = numberOfProductsSold + product.quantity;

                    if (mostSoldProducts[product.id]) {
                        const prevQuantity = mostSoldProducts[product.id].quantity;

                        mostSoldProducts[product.id] = {
                            product: product,
                            quantity: prevQuantity + product.quantity,
                        };
                    } else {
                        mostSoldProducts[product.id] = {
                            product: product,
                            quantity: product.quantity,
                        };
                    }
                });
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

    const BestHourCard = (props: { bestHour: any }) => {
        const { bestHour } = props;

        return (
            <div className="card" style={{ textAlign: "center" }}>
                <div>Best Hour</div>
                <img src="https://i.dlpng.com/static/png/6835756_preview.png" alt="clock" height="50px" width="50px" />
                <div>{bestHour.hour}</div>
                <div>${bestHour.saleAmount} total sales</div>
                <div>{bestHour.saleQuantity} order(s)</div>
            </div>
        );
    };

    const renderCurrentScreen = () => {
        switch (currentScreen.toLocaleLowerCase()) {
            case "day":
            case "hour":
            case "category":
            case "product":
                return (
                    <>
                        <SalesBy screenName={currentScreen} changeScreen={changeScreen} />
                    </>
                );
            case "":
            default:
                return (
                    <div className="sales-report-wrapper">
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

                            <div>
                                <div className="grid">
                                    <div className="item item1">
                                        <Card title="Sales By Day" onOpen={() => changeScreen(SalesReportScreen.DAY)}>
                                            {/* <Graph /> */}
                                        </Card>
                                    </div>
                                    <div className="item item2 report-sales-value-wrapper">
                                        <Card className="text-center">
                                            <div className="h3 mb-1">$24.50</div>
                                            <div>Sales</div>
                                        </Card>
                                        <Card className="text-center">
                                            <div>primaryText</div>
                                            <div className="h3 mt-1">secondaryText</div>
                                        </Card>
                                        <Card className="text-center">
                                            <div>primaryText</div>
                                            <div className="h3 mt-1">secondaryText</div>
                                        </Card>
                                        <Card className="text-center">
                                            <div>primaryText</div>
                                            <div className="h3 mt-1">secondaryText</div>
                                        </Card>
                                    </div>
                                    <div className="item item3">
                                        <Card title="Sales By Hour" onOpen={() => changeScreen(SalesReportScreen.HOUR)}>
                                            {/* <Graph /> */}
                                        </Card>
                                    </div>
                                    {salesSummaryData && salesSummaryData.bestHour && (
                                        <div className="item item4">
                                            <BestHourCard bestHour={salesSummaryData.bestHour} />
                                        </div>
                                    )}
                                    <div className="item item5">
                                        <Card title="Top Category" onOpen={() => changeScreen(SalesReportScreen.CATEGORY)}>
                                            <div className="top-item-container" style={{ alignItems: "center" }}>
                                                <div className="top-item-image text-center">
                                                    {/* {getImage()} */}
                                                    <div>topProductName</div>
                                                    {/* <CachedImage
                                                    url={`${getCloudFrontDomainName()}/protected/${product.image.identityPoolId}/${product.image.key}`}
                                                    className="image mb-2"
                                                    alt="product-image"
                                                /> */}
                                                </div>
                                                <div className="top-item-details text-center">
                                                    <div>Quantity</div>
                                                    <div>quantity</div>
                                                    <div>Sale Amount</div>
                                                    <div>details.saleAmount</div>
                                                    {/* <div>{convertCentsToDollars(details.saleAmount)}</div> */}
                                                    <div>% of Sales</div>
                                                    <div>details.perSales</div>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                    <div className="item item6">
                                        <Card title="Top Product" onOpen={() => changeScreen(SalesReportScreen.PRODUCT)}>
                                            <div className="top-item-container" style={{ alignItems: "center" }}>
                                                <div className="top-item-image text-center">
                                                    {/* {getImage()} */}
                                                    <div>topProductName</div>
                                                </div>
                                                <div className="top-item-details text-center">
                                                    <div>Quantity</div>
                                                    <div>quantity</div>
                                                    <div>Sale Amount</div>
                                                    <div>details.saleAmount</div>
                                                    <div>% of Sales</div>
                                                    <div>details.perSales</div>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </div>
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
            <div className="reports">{renderCurrentScreen()}</div>
        </>
    );
};
