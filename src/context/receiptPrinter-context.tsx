import axios from "axios";
import { format } from "date-fns";
import { useEffect, useRef, createContext, useContext } from "react";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../graphql/customFragments";
import { useGetRestaurantOnlineOrdersByBeginWithPlacedAtLazyQuery } from "../hooks/useGetRestaurantOnlineOrdersByBeginWithPlacedAtLazyQuery";
import {
    IPrintReceiptDataOutput,
    IOrderReceipt,
    EReceiptPrinterPrinterType,
    IPrintCashUpDataInput,
    IPrintSalesDataInput,
    IOrderLabel,
    IPrintReceiptDataInput,
    IPrintNoSaleReceiptDataInput,
} from "../model/model";
import { toast } from "../tabin/components/toast";
import {
    buildOrderReceipt,
    convertProductTypesForPrint,
    filterPrintProducts,
    toLocalISOString,
    getProductQuantities,
    mergeProductQuantities,
    getUnprintedKitchenProducts,
    getReceiptPrinter,
    isKitchenReceiptPrinter,
    printedQuantitiesListToMap,
    printedQuantitiesToList,
} from "../util/util";
import { useLazyQuery, useMutation } from "@apollo/client";
import { GET_ORDER, IGET_RESTAURANT_REGISTER_PRINTER } from "../graphql/customQueries";
import { UPDATE_ORDER_PRINTED_QUANTITIES } from "../graphql/customMutations";
import { useErrorLogging } from "./errorLogging-context";
import { useRegister } from "./register-context";
import { useRestaurant } from "./restaurant-context";
import { IEftposReceiptOutput } from "../../electron/model";
import { useElectron } from "./electron-context";

interface IKitchenPrintOptions {
    printers?: IGET_RESTAURANT_REGISTER_PRINTER[];
    receiptOverrides?: Partial<IOrderReceipt>;
    markUnroutedAsSent?: boolean;
    refreshOrder?: boolean;
}

interface IReceiptPrintResult extends IPrintReceiptDataOutput {
    queued?: boolean;
}

type ContextProps = {
    printOrderReceipt: (
        order: IGET_RESTAURANT_ORDER_FRAGMENT,
        printer: IGET_RESTAURANT_REGISTER_PRINTER,
        overrides?: Partial<IOrderReceipt>,
    ) => Promise<boolean>;
    printUnprintedKitchenItems: (order: IGET_RESTAURANT_ORDER_FRAGMENT, options?: IKitchenPrintOptions) => Promise<Record<string, number>>;
    printReceipt: (payload: IOrderReceipt) => Promise<IReceiptPrintResult>;
    printEftposReceipt: (eftposReceipt: IPrintReceiptDataInput) => Promise<any>;
    printLabel: (payload: IOrderLabel) => Promise<any>;
    printNoSaleReceipt: (noSaleReceipt: IPrintNoSaleReceiptDataInput) => Promise<any>;
    printSalesData: (printSalesDataInput: IPrintSalesDataInput) => Promise<any>;
    printCashUpData: (printCashUpDataInput: IPrintCashUpDataInput) => Promise<any>;
};

const ReceiptPrinterContext = createContext<ContextProps>({
    printOrderReceipt: () => {
        return new Promise(() => {});
    },
    printUnprintedKitchenItems: () => {
        return new Promise(() => {});
    },
    printReceipt: (payload: IOrderReceipt) => {
        return new Promise(() => {});
    },
    printEftposReceipt: (eftposReceipt: IPrintReceiptDataInput) => {
        return new Promise(() => {});
    },
    printLabel: (payload: IOrderLabel) => {
        return new Promise(() => {});
    },
    printNoSaleReceipt: (eftposReceipt: IPrintNoSaleReceiptDataInput) => {
        return new Promise(() => {});
    },
    printSalesData: (printSalesDataInput: IPrintSalesDataInput) => {
        return new Promise(() => {});
    },
    printCashUpData: (printCashUpDataInput: IPrintCashUpDataInput) => {
        return new Promise(() => {});
    },
});

const ReceiptPrinterProvider = (props: { children: React.ReactNode }) => {
    const { restaurant, restaurantBase64Logo } = useRestaurant();
    const { register, setIsShownNewOnlineOrderReceivedModal, setNewOnlineOrderInfo } = useRegister();
    const { logError } = useErrorLogging();
    const { checkParentView, sendParentAsync } = useElectron();

    const [getOrder] = useLazyQuery(GET_ORDER, { fetchPolicy: "network-only" });
    const [updateOrderPrintedQuantitiesMutation] = useMutation(UPDATE_ORDER_PRINTED_QUANTITIES);

    const kitchenPrintTasks = useRef<Record<string, Promise<Record<string, number>>>>({});
    // Retain accepted counts if a backend write fails; the next call retries persistence without printing again.
    const pendingPrintedQuantities = useRef<Record<string, Record<string, number>>>({});
    const isPollingOnlineOrders = useRef(false);
    const isRetryingReceipts = useRef(false);

    const { getRestaurantOnlineOrdersByBeginWithPlacedAt } = useGetRestaurantOnlineOrdersByBeginWithPlacedAtLazyQuery(); //Skip the first iteration. Get new orders from refetch.
    // const { getRestaurantOrdersByBetweenPlacedAt } = useGetRestaurantOrdersByBetweenPlacedAtLazyQuery(); //Skip the first iteration. Get new orders from refetch.

    const fetchOrdersLoopTime = 30 * 1000; //30 seconds
    const retryPrintLoopTime = 20 * 1000; //20 seconds

    useEffect(() => {
        if (!restaurant) return;
        if (!register) return;

        let enableOnlineOrderPrinting = false;

        register.printers.items.forEach((printer) => {
            if (printer.printOnlineOrderReceipts) enableOnlineOrderPrinting = true;
        });

        if (!enableOnlineOrderPrinting) return;

        const ordersFetchTimer = setInterval(async () => {
            if (isPollingOnlineOrders.current) return;
            isPollingOnlineOrders.current = true;
            try {
                let showOnlineOrderPromot = false;
                const newOrderInfoList: {
                    number: string;
                    total: number;
                    customerFirstName: string | null;
                    customerPhoneNumber: string | null;
                    type: string;
                    placedAt: string;
                    orderScheduledAt: string | null;
                }[] = [];
                const storedPrintedOrders = localStorage.getItem("printedOnlineOrders");
                const printedOrders: {
                    [orderId: string]: boolean | "quantity-tracked";
                } = storedPrintedOrders ? JSON.parse(storedPrintedOrders) : {};

                const res = await getRestaurantOnlineOrdersByBeginWithPlacedAt({
                    variables: {
                        orderRestaurantId: restaurant.id,
                        placedAt: format(new Date(), "yyyy-MM-dd"),
                    },
                });

                const newOrders: IGET_RESTAURANT_ORDER_FRAGMENT[] = res.data.getOrdersByRestaurantByPlacedAt.items;

                const mergedOrderIds = new Set(newOrders.map((order) => order.orderMergeId).filter(Boolean));

                const ordersToPrint = newOrders.filter(
                    (order) =>
                        !mergedOrderIds.has(order.id) && (order.onlineOrder || order.thirdPartyIntegrationResult?.platform === "DELIVERECTPOS"),
                );

                for (var i = 0; i < ordersToPrint.length; i++) {
                    const order = ordersToPrint[i];

                    const alreadyNotified = printedOrders[order.id] !== undefined;
                    // Older versions saved no item snapshot. Preserve their one-time behaviour rather than
                    // guessing which current items were printed before this version was installed.
                    if (alreadyNotified && printedOrders[order.id] !== "quantity-tracked" && !order.printedQuantities?.length) continue;

                    if (order.status === "CANCELLED" || order.status === "REFUNDED") continue;

                    if (order.cancellationReason?.includes("ONLINE_PAYMENT_FAILED")) continue;

                    const printers = register.printers.items.filter((printer) => printer.printOnlineOrderReceipts);
                    const unprintedProducts = getUnprintedKitchenProducts(order, printedQuantitiesListToMap(order.printedQuantities));
                    const hasUnprintedKitchenItems = printers.some(
                        (printer) => isKitchenReceiptPrinter(printer) && filterPrintProducts(unprintedProducts, printer).length > 0,
                    );
                    if (pendingPrintedQuantities.current[order.id] || hasUnprintedKitchenItems) {
                        await printUnprintedKitchenItems(order, { printers, refreshOrder: true });
                    }

                    if (!alreadyNotified) {
                        for (const printer of printers) {
                            if (printer.customerPrinter) {
                                await printOrderReceipt(order, getReceiptPrinter(printer, "customer"));
                            }
                        }

                        if (printers.some((printer) => filterPrintProducts(order.products, printer).length > 0)) {
                            showOnlineOrderPromot = true;
                            newOrderInfoList.push({
                                number: order.number,
                                total: order.total,
                                customerFirstName: order.customerInformation?.firstName || null,
                                customerPhoneNumber: order.customerInformation?.phoneNumber || null,
                                type: order.type,
                                placedAt: order.placedAt,
                                orderScheduledAt: order.orderScheduledAt,
                            });
                        }
                    }

                    printedOrders[order.id] = "quantity-tracked";
                    localStorage.setItem("printedOnlineOrders", JSON.stringify(printedOrders));
                }

                if (showOnlineOrderPromot) {
                    setNewOnlineOrderInfo(newOrderInfoList);
                    setIsShownNewOnlineOrderReceivedModal(true);
                }
            } catch (e) {
                console.error("Error", e);
                await toast.error("Error polling for new online orders");
            } finally {
                isPollingOnlineOrders.current = false;
            }
        }, fetchOrdersLoopTime);

        return () => clearInterval(ordersFetchTimer);
    }, [restaurant, register]);

    useEffect(() => {
        if (!restaurant) return;
        if (!register) return;

        const retryFailedPrintQueueTimer = setInterval(async () => {
            if (isRetryingReceipts.current) return;
            isRetryingReceipts.current = true;
            try {
                const storedFiledPrintQueue = localStorage.getItem("failedPrintQueue");

                if (!storedFiledPrintQueue) return;

                const failedPrintQueue = JSON.parse(storedFiledPrintQueue) as IPrintReceiptDataOutput[];

                // if (failedPrintQueue.length > 3) {
                //     //Send notification for monitoring if it passes threshold
                //     await logError("Failed receipt prints passed threshold", JSON.stringify({ failedPrintQueue: failedPrintQueue }));
                // }

                for (var i = 0; i < failedPrintQueue.length; i++) {
                    const failedPrint = failedPrintQueue[i];

                    await printReceipt(failedPrint.order, true);
                }
            } catch (e) {
                // await logError(
                //     "Error reprinting failed orders",
                //     JSON.stringify({ error: e, failedPrintQueue: localStorage.getItem("failedPrintQueue") })
                // );
            } finally {
                isRetryingReceipts.current = false;
            }
        }, retryPrintLoopTime);

        return () => clearInterval(retryFailedPrintQueueTimer);
    }, [restaurant, register]);

    const printReceipt = async (order: IOrderReceipt, isRetry = false): Promise<IReceiptPrintResult> => {
        if (!checkParentView()) return { error: "Printer connection unavailable", order };

        let result: IPrintReceiptDataOutput;
        try {
            result = await sendParentAsync("RECEIPT_PRINTER_DATA", order);
        } catch (e) {
            result = { error: e, order: order };
        }

        if (result.error) {
            if (isRetry) return result;
            toast.error("There was an error printing your order");
            // A durably queued job owns this quantity until retry succeeds. Polling must not send it again.
            try {
                storeFailedPrint(result);
                return { ...result, queued: true };
            } catch (e) {
                console.error("Unable to queue failed receipt", e);
                return result;
            }
        }
        if (isRetry) removeSuccessPrintFromFailedPrintQueue(result);
        return result;
    };

    const printOrderReceipt = async (
        order: IGET_RESTAURANT_ORDER_FRAGMENT,
        printer: IGET_RESTAURANT_REGISTER_PRINTER,
        overrides: Partial<IOrderReceipt> = {},
    ): Promise<boolean> => {
        if (!restaurant) return false;
        if (!register) return false;

        const products = filterPrintProducts(order.products, printer);
        if (products.length === 0) return false;

        if (printer.printerType === EReceiptPrinterPrinterType.LABEL) {
            return printLabel({
                orderId: order.id,
                printerName: printer.name,
                printerType: printer.type,
                printerAddress: printer.address,
                products: convertProductTypesForPrint(products),
                number: order.number,
                placedAt: format(new Date(order.placedAt), "dd/MM HH:mm"),
            });
        }

        const result = await printReceipt(
            buildOrderReceipt(
                { ...order, products },
                printer,
                {
                    restaurant: {
                        name: restaurant.name,
                        address: restaurant.address.receiptAddress || restaurant.address.formattedAddress,
                        gstNumber: restaurant.gstNumber,
                    },
                    restaurantLogoBase64: restaurantBase64Logo,
                    hideOrderType: register.availableOrderTypes.length === 1,
                    preparationTimeInMinutes: restaurant.preparationTimeInMinutes,
                    enableLoyalty: restaurant.enableLoyalty,
                },
                overrides,
            ),
        );
        return !result.error || result.queued === true;
    };

    const printUnprintedKitchenItems = (
        order: IGET_RESTAURANT_ORDER_FRAGMENT,
        options: IKitchenPrintOptions = {},
    ): Promise<Record<string, number>> => {
        // Serialize checkout and polling for this order on this terminal, including after a failed call.
        const previous = kitchenPrintTasks.current[order.id] || Promise.resolve({});
        const task = previous.catch(() => ({})).then(async () => {
            const latestOrderResult = await getOrder({ variables: { id: order.id } });
            const latestOrder: IGET_RESTAURANT_ORDER_FRAGMENT | undefined = latestOrderResult.data?.getOrder;
            if (!latestOrder) throw new Error("Unable to load kitchen print tracking");
            const printedProductQuantities = printedQuantitiesListToMap(latestOrder.printedQuantities);
            mergeProductQuantities(printedProductQuantities, pendingPrintedQuantities.current[order.id] || {}, "max");
            const orderToPrint = options.refreshOrder ? latestOrder : order;
            if (
                options.refreshOrder &&
                (latestOrder.status === "CANCELLED" ||
                    latestOrder.status === "REFUNDED" ||
                    latestOrder.paymentInProgress ||
                    latestOrder.cancellationReason?.includes("ONLINE_PAYMENT_FAILED"))
            ) {
                return printedProductQuantities;
            }

            const unprintedProducts = getUnprintedKitchenProducts(orderToPrint, printedProductQuantities);
            const printedProductQuantitiesThisRun: Record<string, number> = {};
            const printers = (options.printers || register?.printers?.items || []).filter(isKitchenReceiptPrinter);
            let hasApplicableKitchenPrinter = false;

            for (const printer of printers) {
                const products = filterPrintProducts(unprintedProducts, printer);
                if (products.length === 0) continue;
                hasApplicableKitchenPrinter = true;

                try {
                    const accepted = await printOrderReceipt(
                        { ...orderToPrint, products },
                        getReceiptPrinter(printer, "kitchen"),
                        options.receiptOverrides,
                    );
                    if (accepted) mergeProductQuantities(printedProductQuantitiesThisRun, getProductQuantities(products), "max");
                } catch (e) {
                    console.error("Unable to send kitchen receipt", e);
                }
            }

            // Preserve the existing parked-order behaviour for items with no kitchen destination.
            if (!hasApplicableKitchenPrinter && options.markUnroutedAsSent) {
                mergeProductQuantities(printedProductQuantitiesThisRun, getProductQuantities(unprintedProducts), "max");
            }
            mergeProductQuantities(printedProductQuantities, printedProductQuantitiesThisRun, "add");
            if (Object.keys(printedProductQuantitiesThisRun).length || pendingPrintedQuantities.current[order.id]) {
                pendingPrintedQuantities.current[order.id] = printedProductQuantities;
                try {
                    const latestResult = await getOrder({ variables: { id: order.id } });
                    mergeProductQuantities(printedProductQuantities, printedQuantitiesListToMap(latestResult.data.getOrder.printedQuantities), "max");
                    await updateOrderPrintedQuantitiesMutation({
                        variables: { orderId: order.id, printedQuantities: printedQuantitiesToList(printedProductQuantities) },
                    });
                    delete pendingPrintedQuantities.current[order.id];
                } catch (e) {
                    console.error("Unable to save kitchen print tracking", e);
                    toast.error("Kitchen items were sent, but their print tracking could not be saved.");
                }
            }
            return printedProductQuantities;
        });
        kitchenPrintTasks.current[order.id] = task;
        const release = () => {
            if (kitchenPrintTasks.current[order.id] === task) delete kitchenPrintTasks.current[order.id];
        };
        void task.then(release, release);
        return task;
    };

    const printEftposReceipt = async (eftposReceipt: IPrintReceiptDataInput) => {
        if (checkParentView()) {
            try {
                const result: IEftposReceiptOutput = await sendParentAsync("RECEIPT_PRINTER_EFTPOS_DATA", eftposReceipt);

                console.log("result", result);
            } catch (e) {
                console.error(e);
                toast.error("There was an error printing your order");
                // await logError("There was an error printing your order", JSON.stringify({ error: e, order: order }));
            }
        }
    };

    const printNoSaleReceipt = async (noSaleReceipt: IPrintNoSaleReceiptDataInput) => {
        if (checkParentView()) {
            try {
                const result: IEftposReceiptOutput = await sendParentAsync("RECEIPT_NO_SALE_DATA", noSaleReceipt);

                console.log("result", result);
            } catch (e) {
                console.error(e);
                toast.error("There was an error printing your order");
                // await logError("There was an error printing your order", JSON.stringify({ error: e, order: order }));
            }
        }
    };

    const makeResultInquiryData = (requestId, responseId, timeout) => {
        return '{"RequestID":' + requestId + ',"ResponseID":"' + responseId + '","Timeout":' + timeout + "}";
    };

    const checkResult = async (serverURL, requestId, responseId) => {
        const requestURL = serverURL + "/checkStatus";
        const inquiryData = makeResultInquiryData(requestId, responseId, 30);

        try {
            const response = await axios.post(requestURL, inquiryData);

            if (response.request.readyState === 4 && response.status === 200) {
                const res = response.data;

                if (res.Result === "ready" || res.Result === "progress") {
                    await checkResult(serverURL, res.RequestID, res.ResponseID);
                } else if (res.Result === "error") {
                    throw "Error";
                } else {
                    //Label has completed printing
                    console.log(res.ResponseID + ":" + res.Result);
                }
            } else if (response.request.readyState === 4 && response.status === 404) {
                throw "No printers";
            } else if (response.request.readyState === 4) {
                throw "Cannot connect to server";
            }
        } catch (e) {
            throw e;
        }
    };

    const requestPrint = async (serverAddress, printerName, payload) => {
        const serverURL = `http://${serverAddress}:18080/WebPrintSDK/${printerName}`;

        try {
            const response = await axios.post(serverURL, payload);

            if (response.request.readyState === 4 && response.status === 200) {
                const res = response.data;

                if (res.Result === "ready" || res.Result === "progress") {
                    await checkResult(serverURL, res.RequestID, res.ResponseID);
                } else if (res.Result === "error") {
                    throw "Error";
                } else if (res.Result === "duplicated") {
                    throw "Duplicated receipt";
                } else {
                    throw "Undefined error";
                }
            } else if (response.request.readyState === 4 && response.status === 404) {
                throw "No printers";
            } else if (response.request.readyState === 4) {
                throw "Cannot connect to server";
            }
        } catch (e) {
            throw e;
        }
    };

    const printLabel = async (order: IOrderLabel) => {
        try {
            let productCounter = 0;
            let totalProductCount = 0;

            order.products.forEach((product) => {
                totalProductCount += product.quantity;
            });

            for (var i = 0; i < order.products.length; i++) {
                const product = order.products[i];

                for (var qty = 0; qty < product.quantity; qty++) {
                    let funcCounter = 0;
                    productCounter++;

                    const emptyClearBuffer = `"func${funcCounter}":{"clearBuffer":[]}`;
                    funcCounter++;
                    const setPaperWidth = `"func${funcCounter}":{"setWidth":[300]}`;
                    funcCounter++;

                    const orderNumberString = `"func${funcCounter}":{"drawTrueTypeFont":["#${order.number} (${productCounter}/${totalProductCount}) - ${order.placedAt}",0,0,"Arial",20,0,false,false,false,true]}`;
                    funcCounter++;
                    const productString = `"func${funcCounter}":{"drawTrueTypeFont":["${product.kitchenName || product.name}",0,${
                        (funcCounter - 2) * 30 + 5
                    },"Arial",18,0,false,true,false,false]}`;
                    funcCounter++;

                    let modifierGroupString = "";
                    let mgString = "";

                    product.modifierGroups.forEach((modifierGroup, index) => {
                        mgString = `${modifierGroup.kitchenName || modifierGroup.name}: `;

                        //Show only first 2 on first line
                        modifierGroup.modifiers.slice(0, 1).forEach((modifier, index2) => {
                            if (index2 !== 0) mgString += `, `;

                            mgString += modifier.kitchenName || modifier.name;
                        });

                        if (index !== 0) modifierGroupString += `,`;
                        modifierGroupString += `"func${funcCounter}":{"drawTrueTypeFont":["${mgString}",0,${
                            (funcCounter - 2) * 30 + 10
                        },"Arial",16,0,false,false,false,true]}`;
                        funcCounter++;

                        if (modifierGroup.modifiers.length > 1) {
                            mgString = ""; //Reset
                            //Show only first 2 on first line
                            modifierGroup.modifiers.slice(1).forEach((modifier, index2) => {
                                if (index2 !== 0) mgString += `, `;

                                mgString += `${modifier.quantity > 1 ? modifier.quantity + "x " : ""}${modifier.kitchenName || modifier.name}`;
                            });

                            if (index !== 0) modifierGroupString += `,`;
                            modifierGroupString += `"func${funcCounter}":{"drawTrueTypeFont":["${mgString}",0,${
                                (funcCounter - 2) * 30 + 10
                            },"Arial",16,0,false,false,false,true]}`;
                            funcCounter++;
                        }
                    });

                    const emptyPrintBuffer = `"func${funcCounter}":{"printBuffer":[]}`;
                    funcCounter++;

                    let payload = "";
                    if (modifierGroupString) {
                        payload = `{"id":1,"functions":{${emptyClearBuffer},${setPaperWidth},${orderNumberString},${productString},${modifierGroupString},${emptyPrintBuffer}}}`;
                    } else {
                        payload = `{"id":1,"functions":{${emptyClearBuffer},${setPaperWidth},${orderNumberString},${productString},${emptyPrintBuffer}}}`;
                    }
                    await requestPrint(order.printerAddress, order.printerName, payload);
                }
            }
            return true;
        } catch (e) {
            console.error(e);
            toast.error("There was an error printing your order");
            return false;
        }
    };

    const printSalesData = async (printSalesDataInput: IPrintSalesDataInput) => {
        if (checkParentView()) {
            try {
                const result: IPrintReceiptDataOutput = await sendParentAsync("RECEIPT_SALES_DATA", printSalesDataInput);

                console.log("result", result);

                if (result.error) toast.error("There was an error printing your report");
            } catch (e) {
                console.error(e);
                toast.error("There was an error printing your report");
                // await logError("There was an error printing your report", JSON.stringify({ error: e, printSalesDataInput: printSalesDataInput }));
            }
        }
    };

    const printCashUpData = async (printCashUpDataInput: IPrintCashUpDataInput) => {
        if (checkParentView()) {
            try {
                const result: IPrintReceiptDataOutput = await sendParentAsync("RECEIPT_CASH_UP_DATA", printCashUpDataInput);

                if (result.error) toast.error("There was an error printing your report");
            } catch (e) {
                console.error(e);
                toast.error("There was an error printing your report");
            }
        }
    };

    const storeFailedPrint = (failedPrintOrder: IPrintReceiptDataOutput) => {
        const currentFailedPrintQueue = localStorage.getItem("failedPrintQueue");
        const currentFailedPrintQueueOrders: IPrintReceiptDataOutput[] = currentFailedPrintQueue ? JSON.parse(currentFailedPrintQueue) : [];
        const newFailedPrintQueueOrders: IPrintReceiptDataOutput[] = [
            ...currentFailedPrintQueueOrders,
            {
                error: failedPrintOrder.error && failedPrintOrder.error.message ? failedPrintOrder.error.message : "",
                order: failedPrintOrder.order,
            },
        ];

        localStorage.setItem("failedPrintQueue", JSON.stringify(newFailedPrintQueueOrders));
    };

    const removeSuccessPrintFromFailedPrintQueue = (successPrintOrder: IPrintReceiptDataOutput) => {
        const storedFiledPrintQueue = localStorage.getItem("failedPrintQueue");

        if (!storedFiledPrintQueue) return;

        const failedPrintQueue = JSON.parse(storedFiledPrintQueue) as IPrintReceiptDataOutput[];

        const successfulIndex = failedPrintQueue.findIndex((entry) => JSON.stringify(entry.order) === JSON.stringify(successPrintOrder.order));
        if (successfulIndex === -1) return;
        // Identical payloads can represent separate additions of the same item. Remove only the job just retried.
        failedPrintQueue.splice(successfulIndex, 1);

        localStorage.setItem("failedPrintQueue", JSON.stringify(failedPrintQueue));
    };

    return (
        <ReceiptPrinterContext.Provider
            value={{
                printOrderReceipt: printOrderReceipt,
                printUnprintedKitchenItems: printUnprintedKitchenItems,
                printReceipt: printReceipt,
                printEftposReceipt: printEftposReceipt,
                printLabel: printLabel,
                printNoSaleReceipt: printNoSaleReceipt,
                printSalesData: printSalesData,
                printCashUpData: printCashUpData,
            }}
            children={props.children}
        />
    );
};

const useReceiptPrinter = () => {
    const context = useContext(ReceiptPrinterContext);
    if (context === undefined) {
        throw new Error(`useReceiptPrinter must be used within a ReceiptPrinterProvider`);
    }
    return context;
};

export { ReceiptPrinterProvider, useReceiptPrinter };
