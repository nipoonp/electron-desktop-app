import axios from "axios";
import { format } from "date-fns";
import { useEffect, createContext, useContext } from "react";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../graphql/customFragments";
import { useGetRestaurantOnlineOrdersByBeginWithPlacedAtLazyQuery } from "../hooks/useGetRestaurantOnlineOrdersByBeginWithPlacedAtLazyQuery";
import { useGetRestaurantOrdersByBetweenPlacedAtLazyQuery } from "../hooks/useGetRestaurantOrdersByBetweenPlacedAtLazyQuery";
import { IPrintReceiptDataOutput, IOrderReceipt, IPrintSalesDataInput, IOrderLabel, IPrintReceiptDataInput } from "../model/model";
import { toast } from "../tabin/components/toast";
import { convertProductTypesForPrint, filterPrintProducts, toLocalISOString } from "../util/util";
import { useErrorLogging } from "./errorLogging-context";
import { useRegister } from "./register-context";
import { useRestaurant } from "./restaurant-context";
import { IEftposReceiptOutput } from "../../electron/model";
import { useElectron } from "./electron-context";

type ContextProps = {
    printReceipt: (payload: IOrderReceipt) => Promise<any>;
    printEftposReceipt: (eftposReceipt: IPrintReceiptDataInput) => Promise<any>;
    printLabel: (payload: IOrderLabel) => Promise<any>;
    printSalesData: (printSalesDataInput: IPrintSalesDataInput) => Promise<any>;
};

const ReceiptPrinterContext = createContext<ContextProps>({
    printReceipt: (payload: IOrderReceipt) => {
        return new Promise(() => {});
    },
    printEftposReceipt: (eftposReceipt: IPrintReceiptDataInput) => {
        return new Promise(() => {});
    },
    printLabel: (payload: IOrderLabel) => {
        return new Promise(() => {});
    },
    printSalesData: (printSalesDataInput: IPrintSalesDataInput) => {
        return new Promise(() => {});
    },
});

const ReceiptPrinterProvider = (props: { children: React.ReactNode }) => {
    const { restaurant, restaurantBase64Logo } = useRestaurant();
    const { register } = useRegister();
    const { logError } = useErrorLogging();
    const { checkElectron, sendAsync } = useElectron();

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
            try {
                const storedPrintedOnlineOrders = localStorage.getItem("printedOnlineOrders");
                const printedOnlineOrders: {
                    [orderId: string]: boolean;
                } = storedPrintedOnlineOrders ? JSON.parse(storedPrintedOnlineOrders) : {};

                const res = await getRestaurantOnlineOrdersByBeginWithPlacedAt({
                    variables: {
                        orderRestaurantId: restaurant.id,
                        placedAt: format(new Date(), "yyyy-MM-dd"),
                    },
                });

                const newOrders: IGET_RESTAURANT_ORDER_FRAGMENT[] = res.data.getOrdersByRestaurantByPlacedAt.items;

                for (var i = 0; i < newOrders.length; i++) {
                    const order = newOrders[i];

                    if (printedOnlineOrders[order.id] !== undefined) continue;

                    for (var j = 0; j < register.printers.items.length; j++) {
                        const printer = register.printers.items[j];

                        if (!printer.printOnlineOrderReceipts) continue;

                        const productsToPrint = filterPrintProducts(order.products, printer);

                        await printReceipt({
                            orderId: order.id,
                            country: order.country,
                            status: order.status,
                            printerType: printer.type,
                            printerAddress: printer.address,
                            receiptFooterText: printer.receiptFooterText,
                            customerPrinter: printer.customerPrinter,
                            kitchenPrinter: printer.kitchenPrinter,
                            kitchenPrinterSmall: printer.kitchenPrinterSmall,
                            kitchenPrinterLarge: printer.kitchenPrinterLarge,
                            hidePreparationTime: printer.hidePreparationTime,
                            hideModifierGroupName: printer.hideModifierGroupName,
                            skipReceiptCutCommand: printer.skipReceiptCutCommand,
                            printReceiptForEachProduct: printer.printReceiptForEachProduct,
                            hideOrderType: register.availableOrderTypes.length === 0,
                            eftposReceipt: order.eftposReceipt || null,
                            hideModifierGroupsForCustomer: false,
                            restaurant: {
                                name: restaurant.name,
                                address: restaurant.address.formattedAddress,
                                gstNumber: restaurant.gstNumber,
                            },
                            restaurantLogoBase64: restaurantBase64Logo,
                            customerInformation: order.customerInformation
                                ? {
                                      firstName: order.customerInformation.firstName,
                                      email: order.customerInformation.email,
                                      phoneNumber: order.customerInformation.phoneNumber,
                                      signatureBase64: null,
                                      customFields: order.customerInformation.customFields,
                                  }
                                : null,
                            notes: order.notes,
                            products: convertProductTypesForPrint(productsToPrint),
                            paymentAmounts: order.paymentAmounts,
                            total: order.total,
                            surcharge: order.surcharge,
                            orderTypeSurcharge: order.orderTypeSurcharge,
                            eftposSurcharge: order.eftposSurcharge,
                            eftposTip: order.eftposTip,
                            discount: order.promotionId && order.discount ? order.discount : null,
                            tax: order.tax,
                            subTotal: order.subTotal,
                            paid: order.paid,
                            displayPaymentRequiredMessage: !order.paid,
                            type: order.type,
                            number: order.number,
                            table: order.table,
                            buzzer: order.buzzer,
                            placedAt: order.placedAt,
                            orderScheduledAt: order.orderScheduledAt,
                            preparationTimeInMinutes: restaurant.preparationTimeInMinutes,
                            enableLoyalty: restaurant.enableLoyalty,
                        });
                    }

                    printedOnlineOrders[order.id] = true;
                }

                localStorage.setItem("printedOnlineOrders", JSON.stringify(printedOnlineOrders));
            } catch (e) {
                console.error("Error", e);
                await toast.error("Error polling for new online orders");
            }
        }, fetchOrdersLoopTime);

        return () => clearInterval(ordersFetchTimer);
    }, [restaurant, register]);

    useEffect(() => {
        if (!restaurant) return;
        if (!register) return;

        const retryFailedPrintQueueTimer = setInterval(async () => {
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
            }
        }, retryPrintLoopTime);

        return () => clearInterval(retryFailedPrintQueueTimer);
    }, [restaurant, register]);

    const printReceipt = async (order: IOrderReceipt, isRetry?: boolean) => {
        if (checkElectron()) {
            try {
                const result: IPrintReceiptDataOutput = await sendAsync("RECEIPT_PRINTER_DATA", order);

                console.log("result", result);

                if (result.error && isRetry) {
                    //If retry don't readd same order into failedPrintQueue
                    return;
                } else if (result.error) {
                    toast.error("There was an error printing your order");
                    storeFailedPrint(result);
                } else if (isRetry) {
                    //We are retrying and the retry was successful, remove order from failedPrintQueue
                    removeSuccessPrintFromFailedPrintQueue(result);
                }
            } catch (e) {
                console.error(e);
                toast.error("There was an error printing your order");
                // await logError("There was an error printing your order", JSON.stringify({ error: e, order: order }));
            }
        }
    };

    const printEftposReceipt = async (eftposReceipt: IPrintReceiptDataInput) => {
        if (checkElectron()) {
            try {
                const result: IEftposReceiptOutput = await sendAsync("RECEIPT_PRINTER_EFTPOS_DATA", eftposReceipt);

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
        } catch (e) {
            console.error(e);
            toast.error("There was an error printing your order");
            // await logError("There was an error printing your order", JSON.stringify({ error: e, order: order }));
        }
    };

    const printSalesData = async (printSalesDataInput: IPrintSalesDataInput) => {
        if (checkElectron()) {
            try {
                const result: IPrintReceiptDataOutput = await sendAsync("RECEIPT_SALES_DATA", printSalesDataInput);

                console.log("result", result);

                if (result.error) toast.error("There was an error printing your report");
            } catch (e) {
                console.error(e);
                toast.error("There was an error printing your report");
                // await logError("There was an error printing your report", JSON.stringify({ error: e, printSalesDataInput: printSalesDataInput }));
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

        const updatedFailedPrintQueue = failedPrintQueue.filter((o) => o.order.orderId != successPrintOrder.order.orderId);

        localStorage.setItem("failedPrintQueue", JSON.stringify(updatedFailedPrintQueue));
    };

    return (
        <ReceiptPrinterContext.Provider
            value={{
                printReceipt: printReceipt,
                printEftposReceipt: printEftposReceipt,
                printLabel: printLabel,
                printSalesData: printSalesData,
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
