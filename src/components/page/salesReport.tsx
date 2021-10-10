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
import ExpandableCard from "./salesReport/ExpandableCard";
import TopCard from "./salesReport/TopCard";
import Graph from "./salesReport/Graph";
import InformativeCard from "./salesReport/InformativeCard";
import { SalesReportScreen } from "../../model/model";

export const SalesReport = () => {
    const { restaurant } = useRestaurant();
    const [focusedInput, setFocusedInput] = useState<"startDate" | "endDate" | null>(null);

    const [startDate, setStartDate] = useState<string | null>(format(subDays(new Date(), 7), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState<string | null>(format(addDays(new Date(), 1), "yyyy-MM-dd")); //Adding extra day because GraphQL query is not inclusive of endDate

    const [salesSummaryData, setSalesSummaryData] = useState({} as any);

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
        console.log("s:", salesSummaryData);
    };

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

    const getBestHourCard = () => {
        if (salesSummaryData?.bestHour) {
            <div className="card" style={{ textAlign: "center" }}>
                <p>Best Hour</p>
                <img src="https://i.dlpng.com/static/png/6835756_preview.png" alt="clock" height="50px" width="50px" />
                <p>{salesSummaryData.bestHour.hour}</p>
                <p>${salesSummaryData.bestHour.saleAmount} total sales</p>
                <p>{salesSummaryData.bestHour.saleQuantity} order(s)</p>
            </div>;
        }

        return <></>;
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
                    <div className="App">
                        <div className="report-header">
                            <p className="header-title">Reports</p>
                            <div>
                                <div style={{ display: "flex", justifyContent: "center" }}>
                                    <DateRangePicker
                                        startDate={startDate}
                                        endDate={endDate}
                                        onDatesChange={onDatesChange}
                                        focusedInput={focusedInput}
                                        onFocusChange={onFocusChange}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="report-body">
                            <div className="flex-responsive">
                                <ExpandableCard title="Sales By Day" screenName={SalesReportScreen.DAY} changeScreen={changeScreen}>
                                    <Graph />
                                </ExpandableCard>
                                <div className="flex-responsive" style={{ flexWrap: "wrap" }}>
                                    <InformativeCard primaryText="$68.30" secondaryText="Total Sales" />
                                    <InformativeCard primaryText="$22.30" secondaryText="Average Sales" />
                                    <InformativeCard primaryText="3" secondaryText="Sales Count" />
                                    <InformativeCard primaryText="7" secondaryText="Items Sold" />
                                </div>
                            </div>
                            <div className="flex-responsive">
                                <ExpandableCard title="Sales By Hour" screenName={SalesReportScreen.HOUR} changeScreen={changeScreen}>
                                    <Graph />
                                </ExpandableCard>
                                {getBestHourCard()}
                            </div>
                            <div className="flex-responsive">
                                <ExpandableCard title="Top Category" screenName={SalesReportScreen.CATEGORY} changeScreen={changeScreen}>
                                    <TopCard
                                        details={{
                                            topProductName: "Aloo Tikki Burger",
                                            image: "",
                                            quantity: 5,
                                            saleAmount: "$35.78",
                                            perSales: "64.96%",
                                        }}
                                    />
                                </ExpandableCard>
                                <ExpandableCard title="Top Product" screenName={SalesReportScreen.PRODUCT} changeScreen={changeScreen}>
                                    <TopCard
                                        details={{
                                            topProductName: "Aloo Tikki Burger",
                                            image: "",
                                            quantity: 5,
                                            saleAmount: "$35.78",
                                            perSales: "64.96%",
                                        }}
                                    />
                                </ExpandableCard>
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

    return (
        <>
            <FullScreenSpinner show={loading} text={"Loading report details..."} />

            <div className="reports">{renderCurrentScreen()}</div>
        </>
    );
};
