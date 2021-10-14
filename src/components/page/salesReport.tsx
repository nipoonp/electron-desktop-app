import "./salesReport.scss";

import { addDays, differenceInDays, format, subDays } from "date-fns";
import { useEffect, useState } from "react";

import { useRestaurant } from "../../context/restaurant-context";
import {
    IGET_RESTAURANT_ORDER_CATEGORY_FRAGMENT,
    IGET_RESTAURANT_ORDER_FRAGMENT,
    IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT,
} from "../../graphql/customFragments";
import { EOrderStatus } from "../../graphql/customQueries";
import { useGetRestaurantOrdersByBetweenPlacedAt } from "../../hooks/useGetRestaurantOrdersByBetweenPlacedAt";
import { SalesReportScreen } from "../../model/model";
import { taxRate } from "../../model/util";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import { CachedImage } from "../../tabin/components/cachedImage";
import { Card } from "../../tabin/components/card";
import { DateRangePicker } from "../../tabin/components/dateRangePicker";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { convertCentsToDollars, convertCentsToDollarsReturnFloat } from "../../util/util";
import { LineGraph, PieGraph } from "./salesReport/Graph";
import { Table } from "../../tabin/components/table";

interface ITopSoldItem {
    item: IGET_RESTAURANT_ORDER_CATEGORY_FRAGMENT | IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT | null;
    totalQuantity: number;
    totalAmount: number;
}

interface IDailySales {
    [date: string]: {
        totalAmount: number;
        net: number;
        tax: number;
        totalQuantity: number;
        orders: IGET_RESTAURANT_ORDER_FRAGMENT[];
    };
}

interface IBestHour {
    hour: string;
    totalAmount: number;
    totalQuantity: number;
}

interface IHourlySales {
    [hour: string]: {
        hour: string;
        totalAmount: number;
        totalQuantity: number;
        net: number;
        tax: number;
    };
}

interface IMostSoldItems {
    [id: string]: {
        item: IGET_RESTAURANT_ORDER_CATEGORY_FRAGMENT | IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT;
        totalQuantity: number;
        totalAmount: number;
    };
}

interface ISalesTableData {
    cols: string[];
    rows: any[];
}

interface ISalesSummary {
    daysDifference: number;
    dailySales: IDailySales;
    subTotalNew: number;
    totalNumberOfOrdersNew: number;
    subTotalCancelled: number;
    totalNumberOfOrdersCancelled: number;
    subTotalCompleted: number;
    totalNumberOfOrdersCompleted: number;
    hourlySales: IHourlySales;
    bestHour: IBestHour;
    mostSoldCategories: IMostSoldItems;
    mostSoldProducts: IMostSoldItems;
    topSoldCategory: ITopSoldItem;
    topSoldProduct: ITopSoldItem;
    totalSoldItems: number;
    dayByGraphData: { date: string; sales: number }[];
    hourByGraphData: { hour: string; sales: number }[];
    categoryByGraphData: { name: string; value: number }[];
    productByGraphData: { name: string; value: number }[];
    dayByTableData: ISalesTableData;
    hourByTableData: ISalesTableData;
    categoryByTableData: ISalesTableData;
    productByTableData: ISalesTableData;
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

        const dailySales: IDailySales = {};

        let subTotalNew: number = 0;
        let totalNumberOfOrdersNew: number = 0;

        let subTotalCancelled: number = 0;
        let totalNumberOfOrdersCancelled: number = 0;

        let subTotalCompleted: number = 0;
        let numberOfProductsSold: number = 0;
        let totalNumberOfOrdersCompleted: number = 0;

        let totalSoldItems: number = 0;

        const hourlySales: IHourlySales = {
            "00": { hour: "00", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "01": { hour: "01", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "02": { hour: "02", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "03": { hour: "03", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "04": { hour: "04", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "05": { hour: "05", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "06": { hour: "06", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "07": { hour: "07", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "08": { hour: "08", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "09": { hour: "09", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "10": { hour: "10", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "11": { hour: "11", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "12": { hour: "12", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "13": { hour: "13", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "14": { hour: "14", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "15": { hour: "15", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "16": { hour: "16", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "17": { hour: "17", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "18": { hour: "18", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "19": { hour: "19", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "20": { hour: "20", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "21": { hour: "21", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "22": { hour: "22", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
            "23": { hour: "23", totalAmount: 0, totalQuantity: 0, net: 0, tax: 0 },
        };

        let bestHour: IBestHour = { hour: "00", totalAmount: 0, totalQuantity: 0 };

        let topSoldCategory: ITopSoldItem = {
            item: null,
            totalQuantity: 0,
            totalAmount: 0,
        };
        let topSoldProduct: ITopSoldItem = {
            item: null,
            totalQuantity: 0,
            totalAmount: 0,
        };

        const mostSoldCategories: IMostSoldItems = {};
        const mostSoldProducts: IMostSoldItems = {};

        //First create an empty object with empty defined day sales
        for (var i = 0; i < daysDifference; i++) {
            const loopDateTime: Date = addDays(new Date(startDate), i);
            const formattedDateTime: string = format(new Date(loopDateTime), "yyyy-MM-dd");

            dailySales[formattedDateTime] = {
                totalAmount: 0,
                totalQuantity: 0,
                orders: [],
                net: 0,
                tax: 0,
            };
        }

        orders.forEach((order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
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
                const newSubTotal = dailySales[placedAt].totalAmount + order.subTotal;
                const newQuantitySold = dailySales[placedAt].totalQuantity + 1;
                const newOrders: IGET_RESTAURANT_ORDER_FRAGMENT[] = [...dailySales[placedAt].orders, order];

                subTotalCompleted += order.total;
                totalNumberOfOrdersCompleted++;

                dailySales[placedAt] = {
                    totalAmount: newSubTotal,
                    totalQuantity: newQuantitySold,
                    orders: [...newOrders],
                    net: (newSubTotal * (100 - taxRate)) / 100,
                    tax: newSubTotal * (taxRate / 100),
                };

                // HOURLY SALES //////////////////////////////////
                const newSaleQuantity = hourlySales[placedAtHour].totalQuantity + 1;
                const newSaleAmount = hourlySales[placedAtHour].totalAmount + order.total;

                hourlySales[placedAtHour] = {
                    hour: placedAtHour,
                    totalQuantity: newSaleQuantity,
                    totalAmount: newSaleAmount,
                    net: (newSaleAmount * (100 - taxRate)) / 100,
                    tax: newSaleAmount * (taxRate / 100),
                };

                if (newSaleAmount > bestHour.totalAmount) {
                    bestHour = {
                        hour: placedAtHour,
                        totalQuantity: newSaleQuantity,
                        totalAmount: newSaleAmount,
                    };
                }

                // MOST POPULAR CATEGORY //////////////////////////////////
                order.products &&
                    order.products.forEach((product) => {
                        if (!product.category) return;

                        if (mostSoldCategories[product.category.id]) {
                            const newTotalQuantity = mostSoldCategories[product.category.id].totalQuantity + product.quantity;
                            let newTotalAmount = mostSoldCategories[product.category.id].totalAmount + product.price * product.quantity;

                            product.modifierGroups &&
                                product.modifierGroups.forEach((modifierGroup) => {
                                    modifierGroup.modifiers.forEach((modifier) => {
                                        newTotalAmount += product.quantity * modifier.price * modifier.quantity;
                                    });
                                });

                            mostSoldCategories[product.category.id] = {
                                item: product.category,
                                totalQuantity: newTotalQuantity,
                                totalAmount: newTotalAmount,
                            };

                            if (newTotalAmount > topSoldCategory.totalAmount) {
                                topSoldCategory = {
                                    item: product.category,
                                    totalQuantity: newTotalQuantity,
                                    totalAmount: newTotalAmount,
                                };
                            }
                        } else {
                            const totalQuantity = product.quantity;
                            let totalAmount = product.price * product.quantity;

                            product.modifierGroups &&
                                product.modifierGroups.forEach((modifierGroup) => {
                                    modifierGroup.modifiers.forEach((modifier) => {
                                        totalAmount += product.quantity * modifier.price * modifier.quantity;
                                    });
                                });

                            mostSoldCategories[product.category.id] = {
                                item: product.category,
                                totalQuantity: totalQuantity,
                                totalAmount: totalAmount,
                            };

                            if (totalAmount > topSoldCategory.totalAmount) {
                                topSoldCategory = {
                                    item: product.category,
                                    totalQuantity: totalQuantity,
                                    totalAmount: totalAmount,
                                };
                            }
                        }

                        // Total sold items
                        totalSoldItems += product.quantity;
                    });

                //MOST POPULAR PRODUCT //////////////////////////////////
                order.products &&
                    order.products.forEach((product, index) => {
                        numberOfProductsSold = numberOfProductsSold + product.quantity;

                        if (mostSoldProducts[product.id]) {
                            const newTotalQuantity = mostSoldProducts[product.id].totalQuantity + product.quantity;
                            let newTotalAmount = mostSoldProducts[product.id].totalAmount + product.price * product.quantity;

                            product.modifierGroups &&
                                product.modifierGroups.forEach((modifierGroup) => {
                                    modifierGroup.modifiers.forEach((modifier) => {
                                        newTotalAmount += product.quantity * modifier.price * modifier.quantity;
                                    });
                                });

                            mostSoldProducts[product.id] = {
                                item: product,
                                totalQuantity: newTotalQuantity,
                                totalAmount: newTotalAmount,
                            };

                            if (newTotalAmount > topSoldProduct.totalAmount) {
                                topSoldProduct = {
                                    item: product,
                                    totalQuantity: newTotalQuantity,
                                    totalAmount: newTotalAmount,
                                };
                            }
                        } else {
                            const totalQuantity = product.quantity;
                            let totalAmount = product.price * product.quantity;

                            product.modifierGroups &&
                                product.modifierGroups.forEach((modifierGroup) => {
                                    modifierGroup.modifiers.forEach((modifier) => {
                                        totalAmount += product.quantity * modifier.price * modifier.quantity;
                                    });
                                });

                            mostSoldProducts[product.id] = {
                                item: product,
                                totalQuantity: totalQuantity,
                                totalAmount: totalAmount,
                            };

                            if (totalAmount > topSoldProduct.totalAmount) {
                                topSoldProduct = {
                                    item: product,
                                    totalQuantity: totalQuantity,
                                    totalAmount: totalAmount,
                                };
                            }
                        }
                    });
            }
        });

        // Table Data
        const dayByTableData = { cols: ["Date", "Orders", "Net", "Tax", "Total"], rows: [] as any };
        const hourByTableData = { cols: ["Time", "Orders", "Net", "Tax", "Total"], rows: [] as any };
        const categoryByTableData = { cols: ["Category", "Quantity", "Sale Amount", "% Of Sale"], rows: [] as any };
        const productByTableData = { cols: ["Product", "Quantity", "Sale Amount", "% Of Sale"], rows: [] as any };

        // Graph Data

        const dayByGraphData: { date: string; sales: number }[] = [];
        const hourByGraphData: { hour: string; sales: number }[] = [];
        const categoryByGraphData: { name: string; value: number }[] = [];
        const productByGraphData: { name: string; value: number }[] = [];

        Object.entries(dailySales).forEach(([date, sale]) => {
            dayByGraphData.push({
                date: format(new Date(date), "dd MMM"),
                sales: convertCentsToDollarsReturnFloat(sale.totalAmount),
            });

            const row = [
                format(new Date(date), "E dd MMM"),
                sale.totalQuantity,
                `$${convertCentsToDollarsReturnFloat(sale.net)}`,
                `$${convertCentsToDollarsReturnFloat(sale.tax)}`,
                `$${convertCentsToDollarsReturnFloat(sale.totalAmount)}`,
            ];

            dayByTableData.rows.push(row);
        });

        Object.entries(hourlySales)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .forEach(([hour, sale]) => {
                hourByGraphData.push({
                    hour: hour,
                    sales: convertCentsToDollarsReturnFloat(sale.totalAmount),
                });
                const row = [
                    `${Number(hour) > 12 ? `${Number(hour) - 12} PM` : hour === "12" ? `${hour} PM` : `${hour} AM`}`,
                    sale.totalQuantity,
                    `$${convertCentsToDollarsReturnFloat(sale.net)}`,
                    `$${convertCentsToDollarsReturnFloat(sale.tax)}`,
                    `$${convertCentsToDollarsReturnFloat(sale.totalAmount)}`,
                ];
                hourByTableData.rows.push(row);
            });

        Object.entries(mostSoldCategories).forEach(([categoryId, category]) => {
            categoryByGraphData.push({
                name: category.item.name,
                value: category.totalQuantity,
            });
            const row = [
                category.item.name,
                category.totalQuantity,
                `$${convertCentsToDollarsReturnFloat(category.totalAmount)}`,
                `${((category.totalAmount * 100) / subTotalCompleted).toFixed(2)} %`,
            ];
            categoryByTableData.rows.push(row);
        });

        Object.entries(mostSoldProducts).forEach(([productId, product]) => {
            productByGraphData.push({
                name: product.item.name,
                value: product.totalQuantity,
            });
            const row = [
                product.item.name,
                product.totalQuantity,
                `$${convertCentsToDollarsReturnFloat(product.totalAmount)}`,
                `${((product.totalAmount * 100) / subTotalCompleted).toFixed(2)} %`,
            ];
            productByTableData.rows.push(row);
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
            dayByGraphData,
            hourByGraphData,
            categoryByGraphData,
            productByGraphData,
            dayByTableData,
            hourByTableData,
            categoryByTableData,
            productByTableData,
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
                    <span className="h4">{`$${convertCentsToDollars(bestHour.totalAmount)}`}</span> total sales
                </div>
                <div>
                    <span className="h4">{bestHour.totalQuantity}</span> order(s)
                </div>
            </div>
        );
    };

    const MainReportBody = (props: { salesSummaryData: ISalesSummary }) => {
        const { salesSummaryData } = props;
        const {
            subTotalCompleted,
            totalNumberOfOrdersCompleted,
            bestHour,
            topSoldCategory,
            topSoldProduct,
            totalSoldItems,
            dayByGraphData,
            hourByGraphData,
        } = salesSummaryData;

        return (
            <div>
                <div className="grid">
                    <div className="item item1">
                        <Card title="Sales By Day" onOpen={() => changeScreen(SalesReportScreen.DAY)}>
                            <div style={{ width: "100%", height: "300px" }}>
                                <LineGraph xAxis="date" lines={["sales"]} graphData={dayByGraphData} />
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
                                <LineGraph xAxis="hour" lines={["sales"]} graphData={hourByGraphData} />
                            </div>
                        </Card>
                    </div>
                    {salesSummaryData && bestHour && (
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
            <div className="h3 pb-2">Sales By {currentScreen}</div>
            <div className="h5 pb-2">
                <span className="c-pointer" onClick={(e) => changeScreen(SalesReportScreen.DASHBOARD)}>
                    back
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
                            <LineGraph xAxis="date" lines={["sales"]} graphData={salesSummaryData?.dayByGraphData} />
                        </div>
                        {salesSummaryData && (
                            <div className="sales-reading-wrapper">
                                <Card className="text-center sales-reading">
                                    <div className="h3 mb-1">{`$${convertCentsToDollars(salesSummaryData.subTotalCompleted)}`}</div>
                                    <div className="text-uppercase">Total Sales</div>
                                </Card>
                                <Card className="text-center sales-reading">
                                    <div className="h3 mb-1">{`$${convertCentsToDollars(
                                        isNaN(salesSummaryData.subTotalCompleted / salesSummaryData.totalNumberOfOrdersCompleted)
                                            ? 0
                                            : salesSummaryData.subTotalCompleted / salesSummaryData.totalNumberOfOrdersCompleted
                                    )}`}</div>
                                    <div className="text-uppercase">Average Sales</div>
                                </Card>
                                <Card className="text-center sales-reading">
                                    <div className="h3 mt-1">{salesSummaryData.totalNumberOfOrdersCompleted}</div>
                                    <div className="text-uppercase">Sales Count</div>
                                </Card>
                                <Card className="text-center sales-reading">
                                    <div className="h3 mb-1">{salesSummaryData.totalSoldItems}</div>
                                    <div className="text-uppercase">Items Sold</div>
                                </Card>
                            </div>
                        )}
                        <div className="sales-table-wrapper">
                            {/* <Table cols={salesSummaryData?.dayByTableData.cols} rows={salesSummaryData?.dayByTableData.rows} /> */}
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
                                    {salesSummaryData &&
                                        Object.entries(salesSummaryData.dailySales).map(([date, sale]) => (
                                            <tr>
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
                            <LineGraph xAxis="hour" lines={["sales"]} graphData={salesSummaryData?.hourByGraphData} />
                        </div>
                        <div className="sales-table-wrapper">
                            {/* <Table cols={salesSummaryData?.hourByTableData.cols} rows={salesSummaryData?.hourByTableData.rows} /> */}
                        </div>
                    </div>
                );
            case "category":
                return (
                    <div className="sales-by p-3">
                        {salesByScreenHeader}
                        <div className="pb-3" style={{ width: "100%", height: "300px" }}>
                            <PieGraph data={salesSummaryData?.categoryByGraphData} />
                        </div>
                        <div className="sales-table-wrapper">
                            {/* <Table cols={salesSummaryData?.categoryByTableData.cols} rows={salesSummaryData?.categoryByTableData.rows} /> */}
                        </div>
                    </div>
                );
            case "product":
                return (
                    <div className="sales-by p-3">
                        {salesByScreenHeader}
                        <div className="pb-3" style={{ width: "100%", height: "300px" }}>
                            <PieGraph data={salesSummaryData?.productByGraphData} />
                        </div>
                        <div className="sales-table-wrapper">
                            {/* <Table cols={salesSummaryData?.productByTableData.cols} rows={salesSummaryData?.productByTableData.rows} /> */}
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
