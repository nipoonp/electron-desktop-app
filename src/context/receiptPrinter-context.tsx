import { useEffect, createContext, useContext } from "react";
import { IGET_RESTAURANT_ORDER_FRAGMENT, IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT } from "../graphql/customFragments";
import { EOrderStatus } from "../graphql/customQueries";
import { useGetOnlineOrdersByRestaurantByStatusByPlacedAt } from "../hooks/useGetOnlineOrdersByRestaurantByStatusByPlacedAt";

import { ICartModifier, ICartModifierGroup, ICartProduct, IPrintReceiptDataOutput, IOrderReceipt, IPrintSalesByDayDataInput } from "../model/model";
import { toast } from "../tabin/components/toast";
import { convertProductTypesForPrint, toLocalISOString } from "../util/util";
import { useErrorLogging } from "./errorLogging-context";
import { useRegister } from "./register-context";
import { useRestaurant } from "./restaurant-context";
import { IDailySales } from "./salesAnalytics-context";

let electron: any;
let ipcRenderer: any;
try {
    electron = window.require("electron");
    ipcRenderer = electron.ipcRenderer;
} catch (e) {}

type ContextProps = {
    printReceipt: (payload: IOrderReceipt) => Promise<any>;
    printSalesByDay: (printSalesByDayDataInput: IPrintSalesByDayDataInput) => Promise<any>;
};

const ReceiptPrinterContext = createContext<ContextProps>({
    printReceipt: (payload: IOrderReceipt) => {
        return new Promise(() => {});
    },
    printSalesByDay: (printSalesByDayDataInput: IPrintSalesByDayDataInput) => {
        return new Promise(() => {});
    },
});

const ReceiptPrinterProvider = (props: { children: React.ReactNode }) => {
    const { restaurant } = useRestaurant();
    const { register } = useRegister();
    const { logError } = useErrorLogging();

    const { refetch } = useGetOnlineOrdersByRestaurantByStatusByPlacedAt(true); //Skip the first iteration. Get new orders from refetch.

    useEffect(() => {
        if (!restaurant) return;
        if (!register) return;
        if (!register.printOnlineOrderReceipts) return;

        const onlineOrdersFetchTimer = setInterval(async () => {
            try {
                const onlineOrdersLastFetched = localStorage.getItem("onlineOrdersLastFetched");

                if (!onlineOrdersLastFetched) {
                    localStorage.setItem("onlineOrdersLastFetched", toLocalISOString(new Date()));
                    return;
                }

                const res = await refetch({
                    orderRestaurantId: restaurant ? restaurant.id : "",
                    status: EOrderStatus.NEW,
                    startDateTime: onlineOrdersLastFetched,
                    endDateTime: toLocalISOString(new Date()),
                });

                const orders: IGET_RESTAURANT_ORDER_FRAGMENT[] = res.data.getOrdersByRestaurantByStatusByPlacedAt.items;

                await printNewOnlineOrderReceipts(orders);

                localStorage.setItem("onlineOrdersLastFetched", toLocalISOString(new Date()));
            } catch (e) {
                await logError("Error polling for new online orders", JSON.stringify({ error: e, restaurant: restaurant }));
            }
        }, 60 * 1 * 1000);

        return () => clearInterval(onlineOrdersFetchTimer);
    }, [restaurant, register]);

    useEffect(() => {
        if (!restaurant) return;
        if (!register) return;

        const retryFailedPrintQueueTimer = setInterval(async () => {
            try {
                const storedFiledPrintQueue = localStorage.getItem("failedPrintQueue");

                if (!storedFiledPrintQueue) return;

                const failedPrintQueue = JSON.parse(storedFiledPrintQueue) as IPrintReceiptDataOutput[];

                if (failedPrintQueue.length > 3) {
                    //Send notification for monitoring if it passes threshold
                    await logError("Failed receipt prints passed threshold", JSON.stringify({ failedPrintQueue: failedPrintQueue }));
                }

                for (var i = 0; i < failedPrintQueue.length; i++) {
                    const failedPrint = failedPrintQueue[i];

                    await printReceipt(failedPrint.order, true);
                }
            } catch (e) {
                await logError(
                    "Error reprinting failed orders",
                    JSON.stringify({ error: e, failedPrintQueue: localStorage.getItem("failedPrintQueue") })
                );
            }
        }, 20 * 1 * 1000);

        return () => clearInterval(retryFailedPrintQueueTimer);
    }, [restaurant, register]);

    const printReceipt = async (order: IOrderReceipt, isRetry?: boolean) => {
        if (ipcRenderer) {
            try {
                const result: IPrintReceiptDataOutput = await ipcRenderer.invoke("RECEIPT_PRINTER_DATA", order);

                console.log("result", result);

                if (result.error && isRetry) {
                    //If retry dont readd same order into failedPrintQueue
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
                await logError("There was an error printing your order", JSON.stringify({ error: e, order: order }));
            }
        }
    };

    const printSalesByDay = async (printSalesByDayDataInput: IPrintSalesByDayDataInput) => {
        if (ipcRenderer) {
            try {
                const result: IPrintReceiptDataOutput = await ipcRenderer.invoke("RECEIPT_SALES_BY_DAY_PRINTER_DATA", printSalesByDayDataInput);

                console.log("result", result);
            } catch (e) {
                console.error(e);
                toast.error("There was an error printing sales by day");
                await logError(
                    "There was an error printing sales by day",
                    JSON.stringify({ error: e, printSalesByDayDataInput: printSalesByDayDataInput })
                );
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

    const printNewOnlineOrderReceipts = async (orders: IGET_RESTAURANT_ORDER_FRAGMENT[]) => {
        if (!restaurant) return;
        if (!register || register.printers.items.length == 0) return;
        if (!register.printOnlineOrderReceipts) return;

        for (var i = 0; i < register.printers.items.length; i++) {
            const printer = register.printers.items[i];

            if (!printer.kitchenPrinter) return;

            for (var j = 0; j < orders.length; j++) {
                const order = orders[j];

                await printReceipt({
                    orderId: order.id,
                    printerType: printer.type,
                    printerAddress: printer.address,
                    customerPrinter: printer.customerPrinter,
                    kitchenPrinter: printer.kitchenPrinter,
                    eftposReceipt: order.eftposReceipt || null,
                    hideModifierGroupsForCustomer: false,
                    restaurant: {
                        name: restaurant.name,
                        address: `${restaurant.address.aptSuite || ""} ${restaurant.address.formattedAddress || ""}`,
                        gstNumber: restaurant.gstNumber,
                    },
                    customerInformation: order.customerInformation
                        ? {
                              firstName: order.customerInformation.firstName,
                              email: order.customerInformation.email,
                              phoneNumber: order.customerInformation.phoneNumber,
                          }
                        : null,
                    notes: order.notes,
                    products: convertProductTypesForPrint(order.products),
                    total: order.total,
                    discount: order.promotionId && order.discount ? order.discount : null,
                    subTotal: order.subTotal,
                    paid: order.paid,
                    type: order.type,
                    number: order.number,
                    table: order.table,
                    placedAt: order.placedAt,
                    orderScheduledAt: order.orderScheduledAt,
                });
            }
        }
    };

    return (
        <ReceiptPrinterContext.Provider
            value={{
                printReceipt: printReceipt,
                printSalesByDay: printSalesByDay,
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
