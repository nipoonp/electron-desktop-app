import { useEffect, createContext, useContext } from "react";
import { IGET_RESTAURANT_ORDER_FRAGMENT, IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT } from "../graphql/customFragments";
import { EOrderStatus } from "../graphql/customQueries";
import { useGetOnlineOrdersByRestaurantByStatusByPlacedAt } from "../hooks/useGetOnlineOrdersByRestaurantByStatusByPlacedAt";

import { ICartModifier, ICartModifierGroup, ICartProduct, IOrderReceipt } from "../model/model";
import { toast } from "../tabin/components/toast";
import { convertProductTypesForPrint, toLocalISOString } from "../util/util";
import { useErrorLogging } from "./errorLogging-context";
import { useRegister } from "./register-context";
import { useRestaurant } from "./restaurant-context";

let electron: any;
let ipcRenderer: any;
try {
    electron = window.require("electron");
    ipcRenderer = electron.ipcRenderer;
} catch (e) {}

type ContextProps = {
    printReceipt: (payload: IOrderReceipt) => void;
};

const ReceiptPrinterContext = createContext<ContextProps>({
    printReceipt: (payload: IOrderReceipt) => {},
});

const ReceiptPrinterProvider = (props: { children: React.ReactNode }) => {
    const { restaurant } = useRestaurant();
    const { register } = useRegister();
    const { logError } = useErrorLogging();

    const { refetch } = useGetOnlineOrdersByRestaurantByStatusByPlacedAt(true); //Skip the first iteration. Get new orders from refetch.

    useEffect(() => {
        if (!restaurant) return;
        if (!register) return;

        const timerId = setInterval(async () => {
            try {
                const res = await refetch({
                    orderRestaurantId: restaurant ? restaurant.id : "",
                    status: EOrderStatus.NEW,
                    startDateTime: "2021-09-22T12:35:40.839",
                    endDateTime: toLocalISOString(new Date()),
                });

                const orders: IGET_RESTAURANT_ORDER_FRAGMENT[] = res.data.getOrdersByRestaurantByStatusByPlacedAt.items;

                printNewOnlineOrderReceipts(orders);
            } catch (e) {
                await logError(
                    JSON.stringify({
                        restaurantId: restaurant.id,
                        restaurantName: restaurant.name,
                        error: "Error polling for new online orders",
                        context: { restaurant: restaurant, error: e },
                    })
                );
            }
        }, 60 * 1 * 1000);

        return () => clearInterval(timerId);
    }, [restaurant, register]);

    useEffect(() => {
        ipcRenderer &&
            ipcRenderer.on("RECEIPT_PRINTER_ERROR", (event: any, arg: { order: IOrderReceipt; error: any }) => {
                console.log("RECEIPT_PRINTER_ERROR:", arg);
                toast.error("Connection with Receipt Printer failed. Please make sure it is powered on and configured correctly.");

                processFailedPrint(arg);
            });
    }, []);

    const printReceipt = (order: IOrderReceipt) => {
        ipcRenderer && ipcRenderer.send("RECEIPT_PRINTER_DATA", order);
    };

    const processFailedPrint = (arg: { order: IOrderReceipt; error: any }) => {
        const currentFailedPrintQueue = sessionStorage.getItem("failedPrintQueue");

        const currentFailedPrintQueueOrders: { order: IOrderReceipt; error: any }[] = currentFailedPrintQueue
            ? JSON.parse(currentFailedPrintQueue)
            : [];

        const newFailedPrintQueueOrders = [...currentFailedPrintQueueOrders, arg];

        sessionStorage.setItem("printQueue", JSON.stringify(newFailedPrintQueueOrders));

        if (newFailedPrintQueueOrders.length > 0) {
            logError(
                JSON.stringify({
                    restaurantId: restaurant ? restaurant.id : "undefined",
                    restaurantName: restaurant ? restaurant.name : "undefined",
                    error: "Failed Receipt Printing",
                    context: { newFailedPrintQueueOrders: newFailedPrintQueueOrders },
                })
            );
        }
    };

    const printNewOnlineOrderReceipts = (orders: IGET_RESTAURANT_ORDER_FRAGMENT[]) => {
        if (!restaurant) return;
        // console.log("xxx...I AM HERE!", register);

        if (!register || register.printers.items.length == 0) return;
        if (!register.printOnlineOrderReceipts) return;

        register.printers.items.forEach((printer) => {
            if (!printer.kitchenPrinter) return;

            orders.forEach((order) => {
                printReceipt({
                    printerType: printer.type,
                    printerAddress: printer.address,
                    customerPrinter: printer.customerPrinter,
                    kitchenPrinter: printer.kitchenPrinter,
                    eftposReceipt: order.eftposReceipt || null,
                    hideModifierGroupsForCustomer: true,
                    restaurant: {
                        name: restaurant.name,
                        address: `${restaurant.address.aptSuite || ""} ${restaurant.address.formattedAddress || ""}`,
                        gstNumber: restaurant.gstNumber,
                    },
                    notes: order.notes,
                    products: convertProductTypesForPrint(order.products),
                    total: order.total,
                    discount: order.promotionId && order.discount ? order.discount : null,
                    subTotal: order.subTotal,
                    paid: order.paid,
                    type: order.type,
                    number: order.number,
                    table: order.table,
                });
            });
        });
    };

    return (
        <ReceiptPrinterContext.Provider
            value={{
                printReceipt: printReceipt,
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
