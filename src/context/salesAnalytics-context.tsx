import { useState, useEffect, createContext, useContext } from "react";

import { ApolloError } from "@apollo/client";
import { useRestaurant } from "./restaurant-context";
import { addDays, differenceInDays, format, subDays } from "date-fns";
import { useGetRestaurantOrdersByBetweenPlacedAt } from "../hooks/useGetRestaurantOrdersByBetweenPlacedAt";
import {
    IGET_RESTAURANT_ORDER_CATEGORY_FRAGMENT,
    IGET_RESTAURANT_ORDER_FRAGMENT,
    IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT,
    IOrderPaymentAmounts,
} from "../graphql/customFragments";
import { EOrderStatus, EOrderType, IGET_RESTAURANT_REGISTER } from "../graphql/customQueries";
import { getTwelveHourFormat, taxRate } from "../model/util";
import { convertCentsToDollars, convertCentsToDollarsReturnFloat } from "../util/util";
import { toast } from "../tabin/components/toast";
import { UnparseObject } from "papaparse";

export interface ITopSoldItem {
    item: IGET_RESTAURANT_ORDER_CATEGORY_FRAGMENT | IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT | null;
    totalQuantity: number;
    totalAmount: number;
}

export interface IDayComparisonExport {
    [date: string]: {
        [key: string]: {
            name: string;
            total: number;
        };
    };
}

export interface IDailySales {
    [date: string]: {
        totalAmount: number;
        totalQuantity: number;
        orders: IGET_RESTAURANT_ORDER_FRAGMENT[];
        totalPaymentAmounts: IOrderPaymentAmounts;
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
    orders: IGET_RESTAURANT_ORDER_FRAGMENT[];
    daysDifference: number;
    dailySales: IDailySales;
    totalPaymentAmounts: IOrderPaymentAmounts;
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
    totalSubTotal: number;
    totalSoldItems: number;
    dayByGraphData: { date: string; sales: number }[];
    hourByGraphData: { hour: string; sales: number }[];
    categoryByGraphData: { name: string; value: number }[];
    productByGraphData: { name: string; value: number }[];
    dailySalesExport: UnparseObject<Array<string | number>>;
    hourlySalesExport: UnparseObject<Array<string | number>>;
    mostSoldCategoriesExport: UnparseObject<Array<string | number>>;
    mostSoldProductsExport: UnparseObject<Array<string | number>>;
    exportSalesDates: string[];
}

type ContextProps = {
    refetchRestaurantOrdersByBetweenPlacedAt: () => void;
    startDate: string | null;
    endDate: string | null;
    registerFilters: IGET_RESTAURANT_REGISTER[];
    orderFilters: EOrderType[];
    salesAnalytics: ISalesAnalytics | null;
    error: ApolloError | undefined;
    loading: boolean;
    onDatesChange: (startD: string | null, endD: string | null) => Promise<any>;
    onRegisterFilterChange: (value?: IGET_RESTAURANT_REGISTER) => void;
    onOrderFilterChange: (value?: EOrderType) => void;
};

const SalesAnalyticsContext = createContext<ContextProps>({
    refetchRestaurantOrdersByBetweenPlacedAt: () => {},
    startDate: null,
    endDate: null,
    registerFilters: [],
    orderFilters: [],
    salesAnalytics: null,
    error: undefined,
    loading: false,
    onDatesChange: (startD: string | null, endD: string | null) => {
        return new Promise(() => {});
    },
    onRegisterFilterChange: (value?: IGET_RESTAURANT_REGISTER) => {},
    onOrderFilterChange: (value?: EOrderType) => {},
});

const SalesAnalyticsProvider = (props: { children: React.ReactNode }) => {
    const { restaurant } = useRestaurant();

    const [salesAnalytics, setSalesAnalytics] = useState<ISalesAnalytics | null>(null);
    const [startDate, setStartDate] = useState<string | null>(format(subDays(new Date(), 7), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState<string | null>(format(new Date(), "yyyy-MM-dd")); //Adding extra day because GraphQL query is not inclusive of endDate

    // Filters
    const [registerFilters, setRegisterFilter] = useState<IGET_RESTAURANT_REGISTER[]>([]);
    const [orderFilters, setOrderFilter] = useState(Object.values(EOrderType));

    const { data: orders, error, loading, refetch } = useGetRestaurantOrdersByBetweenPlacedAt(
        restaurant ? restaurant.id : "",
        startDate,
        endDate ? format(addDays(new Date(endDate), 1), "yyyy-MM-dd") : null //Adding extra day because GraphQL query is not inclusive of endDate
    );

    useEffect(() => {
        const registers = restaurant && restaurant.registers.items ? restaurant.registers.items : [];
        setRegisterFilter(registers);
    }, [restaurant]);

    useEffect(() => {
        processSalesData(getFilteredOrders(orders));
    }, [orders, orderFilters, registerFilters]);

    const refetchRestaurantOrdersByBetweenPlacedAt = () => {
        refetch({
            orderRestaurantId: restaurant ? restaurant.id : "",
            placedAtStartDate: startDate,
            placedAtEndDate: endDate ? format(addDays(new Date(endDate), 1), "yyyy-MM-dd") : null, //Adding extra day because GraphQL query is not inclusive of endDate
        });
    };

    const getFilteredOrders = (orders: IGET_RESTAURANT_ORDER_FRAGMENT[] | null): IGET_RESTAURANT_ORDER_FRAGMENT[] => {
        if (!orders) return [];
        let filteredOrders: IGET_RESTAURANT_ORDER_FRAGMENT[] = [];

        // Filter by order type and register type
        filteredOrders = orders.filter((o) => orderFilters.includes(o.type) && registerFilters.map((r) => r.id).includes(o.registerId));

        return filteredOrders;
    };

    const processSalesData = (orders: IGET_RESTAURANT_ORDER_FRAGMENT[] | null) => {
        try {
            if (!startDate || !endDate) return;
            if (!orders) return;

            const daysDifference: number = differenceInDays(new Date(endDate), new Date(startDate)) + 1; //We want the start and end dates to be inclusive.

            const dailySales: IDailySales = {};

            let totalPaymentAmounts: IOrderPaymentAmounts = {
                cash: 0,
                eftpos: 0,
                online: 0,
            };

            let subTotalNew: number = 0;
            let totalNumberOfOrdersNew: number = 0;

            let subTotalCancelled: number = 0;
            let totalNumberOfOrdersCancelled: number = 0;

            let subTotalCompleted: number = 0;
            let numberOfProductsSold: number = 0;
            let totalNumberOfOrdersCompleted: number = 0;

            let totalSoldItems: number = 0;
            let totalSubTotal: number = 0;

            const hourlySales: IHourlySales = {
                "00": { hour: "00", totalAmount: 0, totalQuantity: 0 },
                "01": { hour: "01", totalAmount: 0, totalQuantity: 0 },
                "02": { hour: "02", totalAmount: 0, totalQuantity: 0 },
                "03": { hour: "03", totalAmount: 0, totalQuantity: 0 },
                "04": { hour: "04", totalAmount: 0, totalQuantity: 0 },
                "05": { hour: "05", totalAmount: 0, totalQuantity: 0 },
                "06": { hour: "06", totalAmount: 0, totalQuantity: 0 },
                "07": { hour: "07", totalAmount: 0, totalQuantity: 0 },
                "08": { hour: "08", totalAmount: 0, totalQuantity: 0 },
                "09": { hour: "09", totalAmount: 0, totalQuantity: 0 },
                "10": { hour: "10", totalAmount: 0, totalQuantity: 0 },
                "11": { hour: "11", totalAmount: 0, totalQuantity: 0 },
                "12": { hour: "12", totalAmount: 0, totalQuantity: 0 },
                "13": { hour: "13", totalAmount: 0, totalQuantity: 0 },
                "14": { hour: "14", totalAmount: 0, totalQuantity: 0 },
                "15": { hour: "15", totalAmount: 0, totalQuantity: 0 },
                "16": { hour: "16", totalAmount: 0, totalQuantity: 0 },
                "17": { hour: "17", totalAmount: 0, totalQuantity: 0 },
                "18": { hour: "18", totalAmount: 0, totalQuantity: 0 },
                "19": { hour: "19", totalAmount: 0, totalQuantity: 0 },
                "20": { hour: "20", totalAmount: 0, totalQuantity: 0 },
                "21": { hour: "21", totalAmount: 0, totalQuantity: 0 },
                "22": { hour: "22", totalAmount: 0, totalQuantity: 0 },
                "23": { hour: "23", totalAmount: 0, totalQuantity: 0 },
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

            const exportSalesDates: string[] = [];

            //First create an empty object with empty defined day sales
            for (var i = 0; i < daysDifference; i++) {
                const loopDateTime: Date = addDays(new Date(startDate), i);
                const formattedDateTime: string = format(new Date(loopDateTime), "yyyy-MM-dd");

                dailySales[formattedDateTime] = {
                    totalAmount: 0,
                    totalQuantity: 0,
                    orders: [],
                    totalPaymentAmounts: {
                        cash: 0,
                        eftpos: 0,
                        online: 0,
                    },
                };

                exportSalesDates.push(format(new Date(loopDateTime), "E, dd MMM"));
            }

            orders.forEach((order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
                const placedAt: string = format(new Date(order.placedAt), "yyyy-MM-dd");
                const placedAtHour: string = format(new Date(order.placedAt), "HH");

                if (order.paymentAmounts) {
                    totalPaymentAmounts.cash += order.paymentAmounts.cash;
                    totalPaymentAmounts.eftpos += order.paymentAmounts.eftpos;
                    totalPaymentAmounts.online += order.paymentAmounts.online;
                }

                // NEW ORDERS //////////////////////////////////
                if (order.status === EOrderStatus.NEW) {
                    subTotalNew += order.subTotal;
                    totalNumberOfOrdersNew++;
                }

                // CANCELLED ORDERS //////////////////////////////////
                if (order.status === EOrderStatus.CANCELLED) {
                    subTotalCancelled += order.subTotal;
                    totalNumberOfOrdersCancelled++;
                }

                if (order.status === EOrderStatus.COMPLETED) {
                    subTotalCompleted += order.subTotal;
                    totalNumberOfOrdersCompleted++;
                }

                //Not including refunded orders because we expect restaurants to refund an order before its been made.
                if (order.status === EOrderStatus.NEW || order.status === EOrderStatus.COMPLETED || order.status === EOrderStatus.CANCELLED) {
                    totalSubTotal += order.subTotal;
                    const newSubTotal = dailySales[placedAt].totalAmount + order.subTotal;
                    const newQuantitySold = dailySales[placedAt].totalQuantity + 1;
                    const newOrders: IGET_RESTAURANT_ORDER_FRAGMENT[] = [...dailySales[placedAt].orders, order];

                    dailySales[placedAt] = {
                        totalAmount: newSubTotal,
                        totalQuantity: newQuantitySold,
                        orders: [...newOrders],
                        totalPaymentAmounts: {
                            cash: dailySales[placedAt].totalPaymentAmounts.cash + (order.paymentAmounts ? order.paymentAmounts.cash : 0),
                            eftpos: dailySales[placedAt].totalPaymentAmounts.eftpos + (order.paymentAmounts ? order.paymentAmounts.eftpos : 0),
                            online: dailySales[placedAt].totalPaymentAmounts.online + (order.paymentAmounts ? order.paymentAmounts.online : 0),
                        },
                    };

                    // HOURLY SALES //////////////////////////////////
                    const newSaleQuantity = hourlySales[placedAtHour].totalQuantity + 1;
                    const newSaleAmount = hourlySales[placedAtHour].totalAmount + order.subTotal;

                    hourlySales[placedAtHour] = {
                        hour: placedAtHour,
                        totalQuantity: newSaleQuantity,
                        totalAmount: newSaleAmount,
                    };

                    // Best Hour
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

            // CSV Export Data
            const dailySalesExport = {} as UnparseObject<Array<string | number>>;
            dailySalesExport.fields = ["Date", "Orders", "Net", "Tax", "Total"];
            dailySalesExport.data = [];

            Object.entries(dailySales).forEach(([date, sale]) => {
                dayByGraphData.push({
                    date: format(new Date(date), "dd MMM"),
                    sales: convertCentsToDollarsReturnFloat(sale.totalAmount),
                });

                const row = [
                    format(new Date(date), "E, dd MMM"),
                    sale.totalQuantity,
                    `$${convertCentsToDollars((sale.totalAmount * (100 - taxRate)) / 100)}`,
                    `$${convertCentsToDollars(sale.totalAmount * (taxRate / 100))}`,
                    `$${convertCentsToDollars(sale.totalAmount)}`,
                ];
                dailySalesExport.data.push(row);
            });

            // CSV Export Data
            const hourlySalesExport = {} as UnparseObject<Array<string | number>>;
            hourlySalesExport.fields = ["Time", "Orders", "Net", "Tax", "Total"];
            hourlySalesExport.data = [];

            Object.entries(hourlySales)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .forEach(([hour, sale]) => {
                    hourByGraphData.push({
                        hour: getTwelveHourFormat(Number(hour)),
                        sales: convertCentsToDollarsReturnFloat(sale.totalAmount),
                    });

                    const row = [
                        getTwelveHourFormat(Number(hour)),
                        sale.totalQuantity,
                        `$${convertCentsToDollars((sale.totalAmount * (100 - taxRate)) / 100)}`,
                        `$${convertCentsToDollars(sale.totalAmount * (taxRate / 100))}`,
                        `$${convertCentsToDollars(sale.totalAmount)}`,
                    ];
                    hourlySalesExport.data.push(row);
                });

            // CSV Export Data
            const mostSoldCategoriesExport = {} as UnparseObject<Array<string | number>>;
            mostSoldCategoriesExport.fields = ["Category", "Quantity", "Net", "Tax", "Total", "% Of Sale"];
            mostSoldCategoriesExport.data = [];

            Object.entries(mostSoldCategories).forEach(([categoryId, category]) => {
                categoryByGraphData.push({
                    name: category.item.name,
                    value: category.totalQuantity,
                });

                const row = [
                    category.item.name,
                    category.totalQuantity,
                    `$${convertCentsToDollars((category.totalAmount * (100 - taxRate)) / 100)}`,
                    `$${convertCentsToDollars(category.totalAmount * (taxRate / 100))}`,
                    `$${convertCentsToDollars(category.totalAmount)}`,
                    `${((category.totalAmount * 100) / totalSubTotal).toFixed(2)}%`,
                ];
                mostSoldCategoriesExport.data.push(row);
            });

            // Sort Category graph data by it's value
            categoryByGraphData.sort((a, b) => a.value - b.value);
            mostSoldCategoriesExport.data.sort((a, b) => (a[0] > b[0] && 1) || -1);

            // CSV Export Data
            const mostSoldProductsExport = {} as UnparseObject<Array<string | number>>;
            mostSoldProductsExport.fields = ["Product", "Quantity", "Net", "Tax", "Total", "% Of Sale"];
            mostSoldProductsExport.data = [];

            Object.entries(mostSoldProducts).forEach(([productId, product]) => {
                productByGraphData.push({
                    name: product.item.name,
                    value: product.totalQuantity,
                });

                const row = [
                    product.item.name,
                    product.totalQuantity,
                    `$${convertCentsToDollars((product.totalAmount * (100 - taxRate)) / 100)}`,
                    `$${convertCentsToDollars(product.totalAmount * (taxRate / 100))}`,
                    `$${convertCentsToDollars(product.totalAmount)}`,
                    `${((product.totalAmount * 100) / totalSubTotal).toFixed(2)}%`,
                ];
                mostSoldProductsExport.data.push(row);
            });

            // Sort Product graph data by
            productByGraphData.sort((a, b) => a.value - b.value);
            mostSoldProductsExport.data.sort((a, b) => (a[0] > b[0] && 1) || -1);

            setSalesAnalytics({
                orders,
                daysDifference,
                dailySales,
                totalPaymentAmounts,
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
                totalSubTotal,
                totalSoldItems,
                dayByGraphData,
                hourByGraphData,
                categoryByGraphData,
                productByGraphData,
                dailySalesExport,
                hourlySalesExport,
                mostSoldCategoriesExport,
                mostSoldProductsExport,
                exportSalesDates,
            });
        } catch (e) {
            toast.error("There was an error processing sales analytics data. Please try again later.");
        }
    };

    const onDatesChange = async (startD: string | null, endD: string | null) => {
        setStartDate(startD);
        setEndDate(endD);
    };

    const onRegisterFilterChange = (value?: IGET_RESTAURANT_REGISTER) => {
        value ? setRegisterFilter([...registerFilters, value]) : setRegisterFilter([...registerFilters]);
    };

    const onOrderFilterChange = (value?: EOrderType) => {
        value ? setOrderFilter([...orderFilters, value]) : setOrderFilter([...orderFilters]);
    };

    return (
        <SalesAnalyticsContext.Provider
            value={{
                refetchRestaurantOrdersByBetweenPlacedAt: refetchRestaurantOrdersByBetweenPlacedAt,
                startDate: startDate,
                endDate: endDate,
                registerFilters,
                orderFilters,
                salesAnalytics: salesAnalytics,
                error: error,
                loading: loading,
                onDatesChange: onDatesChange,
                onRegisterFilterChange,
                onOrderFilterChange,
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
