import { useState, useEffect, createContext, useContext } from "react";

import { ApolloError } from "@apollo/client";
import { useRestaurant } from "./restaurant-context";
import { addDays, differenceInDays, format, subDays } from "date-fns";
import { useGetRestaurantOrdersByBetweenPlacedAt } from "../hooks/useGetRestaurantOrdersByBetweenPlacedAt";
import {
    IGET_RESTAURANT_ORDER_CATEGORY_FRAGMENT,
    IGET_RESTAURANT_ORDER_FRAGMENT,
    IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT,
} from "../graphql/customFragments";
import { EOrderStatus } from "../graphql/customQueries";
import { getTwelveHourFormat, taxRate } from "../model/util";
import { convertCentsToDollarsReturnFloat } from "../util/util";

export interface ITopSoldItem {
    item: IGET_RESTAURANT_ORDER_CATEGORY_FRAGMENT | IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT | null;
    totalQuantity: number;
    totalAmount: number;
}

export interface IDailySales {
    [date: string]: {
        totalAmount: number;
        net: number;
        tax: number;
        totalQuantity: number;
        orders: IGET_RESTAURANT_ORDER_FRAGMENT[];
    };
}

export interface IBestHour {
    hour: string;
    totalAmount: number;
    totalQuantity: number;
}

export interface IHourlySales {
    [hour: string]: {
        hour: string;
        totalAmount: number;
        totalQuantity: number;
        net: number;
        tax: number;
    };
}

export interface IMostSoldItems {
    [id: string]: {
        item: IGET_RESTAURANT_ORDER_CATEGORY_FRAGMENT | IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT;
        totalQuantity: number;
        totalAmount: number;
    };
}
export interface ISalesAnalytics {
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
}

type ContextProps = {
    startDate: string | null;
    endDate: string | null;
    salesAnalytics: ISalesAnalytics | null;
    error: ApolloError | undefined;
    loading: boolean;
    onDatesChange: (startD: string | null, endD: string | null) => Promise<any>;
};

const SalesAnalyticsContext = createContext<ContextProps>({
    startDate: null,
    endDate: null,
    salesAnalytics: null,
    error: undefined,
    loading: false,
    onDatesChange: (startD: string | null, endD: string | null) => {
        return new Promise(() => {});
    },
});

const SalesAnalyticsProvider = (props: { children: React.ReactNode }) => {
    const { restaurant } = useRestaurant();

    const [salesAnalytics, setSalesAnalytics] = useState<ISalesAnalytics | null>(null);
    const [startDate, setStartDate] = useState<string | null>(format(subDays(new Date(), 7), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState<string | null>(format(addDays(new Date(), 1), "yyyy-MM-dd")); //Adding extra day because GraphQL query is not inclusive of endDate

    const { data: orders, error, loading, refetch } = useGetRestaurantOrdersByBetweenPlacedAt(
        restaurant ? restaurant.id : "",
        startDate || "",
        endDate || ""
    );

    useEffect(() => {
        processSalesData(orders);
    }, [orders, startDate, endDate]);

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
        });

        Object.entries(hourlySales)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .forEach(([hour, sale]) => {
                hourByGraphData.push({
                    hour: getTwelveHourFormat(Number(hour)),
                    sales: convertCentsToDollarsReturnFloat(sale.totalAmount),
                });
            });

        Object.entries(mostSoldCategories).forEach(([categoryId, category]) => {
            categoryByGraphData.push({
                name: category.item.name,
                value: category.totalQuantity,
            });
        });

        Object.entries(mostSoldProducts).forEach(([productId, product]) => {
            productByGraphData.push({
                name: product.item.name,
                value: product.totalQuantity,
            });
        });

        setSalesAnalytics({
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
        });
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

    return (
        <SalesAnalyticsContext.Provider
            value={{
                startDate: startDate,
                endDate: endDate,
                salesAnalytics: salesAnalytics,
                error: error,
                loading: loading,
                onDatesChange: onDatesChange,
            }}
            children={props.children}
        />
    );
};

const useSalesAnalytics = () => {
    const context = useContext(SalesAnalyticsContext);
    if (context === undefined) {
        throw new Error(`useSalesAnalytics must be used within a SalesAnalyticsProvider`);
    }
    return context;
};

export { SalesAnalyticsProvider, useSalesAnalytics };
