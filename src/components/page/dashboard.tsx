import { useEffect, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiRotateCw, FiX } from "react-icons/fi";
import { useNavigate } from "react-router";
import { useReceiptPrinter } from "../../context/receiptPrinter-context";
import { useRegister } from "../../context/register-context";
import { useRestaurant } from "../../context/restaurant-context";
import { IGET_RESTAURANT_REGISTER_PRINTER } from "../../graphql/customQueries";
import { ERegisterPrinterType, IOrderReceipt, IPrintSalesData } from "../../model/model";
import { toast } from "../../tabin/components/toast";
import { convertProductTypesForPrint, filterPrintProducts } from "../../util/util";
import { beginOrderPath } from "../main";
import { SelectReceiptPrinterModal } from "../modals/selectReceiptPrinterModal";

import "./dashboard.scss";

export default () => {
    const { restaurant } = useRestaurant();
    const { register } = useRegister();
    const { printSalesData } = useReceiptPrinter();
    const { printReceipt } = useReceiptPrinter();
    const navigate = useNavigate();

    const [showSelectReceiptPrinterModal, setShowSelectReceiptPrinterModal] = useState(false);
    const [receiptPrinterModalPrintSalesData, setReceiptPrinterModalPrintSalesData] = useState<IPrintSalesData | null>(null);
    const [receiptPrinterModalPrintReorderData, setReceiptPrinterModalPrintReorderData] = useState<IOrderReceipt | null>(null);

    const onPrintData = async (printData: IPrintSalesData) => {
        if (register) {
            if (register.printers.items.length > 1) {
                setReceiptPrinterModalPrintSalesData(printData);
                setShowSelectReceiptPrinterModal(true);
            } else if (register.printers.items.length === 1) {
                await printSales({ printerType: register.printers.items[0].type, printerAddress: register.printers.items[0].address }, printData);
            } else {
                toast.error("No receipt printers configured");
            }
        }
    };

    const onReprintReceipt = async (order: IOrderReceipt) => {
        if (register) {
            if (register.printers.items.length > 1) {
                setReceiptPrinterModalPrintReorderData(order);
                setShowSelectReceiptPrinterModal(true);
            } else if (register.printers.items.length === 1) {
                const productsToPrint = filterPrintProducts(order.products, register.printers.items[0]);

                await printReceipt({
                    ...order,
                    printerType: register.printers.items[0].type,
                    printerAddress: register.printers.items[0].address,
                    customerPrinter: register.printers.items[0].customerPrinter,
                    kitchenPrinter: register.printers.items[0].kitchenPrinter,
                    products: convertProductTypesForPrint(productsToPrint),
                });
            } else {
                toast.error("No receipt printers configured");
            }
        }
    };

    useEffect(() => {
        window.addEventListener("message", async (event) => {
            console.log("Got message from child", event);

            const data = event.data;

            if (data.action === "printSalesData") {
                try {
                    await onPrintData(data.printData);
                } catch (e) {
                    console.error(e);
                    toast.error("There was an error printing your sales data.");
                }
            } else if (data.action === "orderReprint") {
                try {
                    await onReprintReceipt(data.order);
                } catch (e) {
                    console.error(e);
                    toast.error("There was an error reprinting your order.");
                }
            }
        });

        return () => window.removeEventListener("message", () => {});
    }, []);

    if (!restaurant) return <>No Restaurant</>;
    if (!register) return <>No Register</>;

    const defaultPath = `http://localhost:3000/${restaurant.id}/sales_analytics`;

    const printSales = async (
        printer: {
            printerType: ERegisterPrinterType;
            printerAddress: string;
        },
        printData: IPrintSalesData
    ) => {
        await printSalesData({
            type: printData.type,
            printer: printer,
            startDate: printData.startDate,
            endDate: printData.endDate,
            dailySales: printData.dailySales,
            mostSoldCategories: printData.mostSoldCategories,
            mostSoldProducts: printData.mostSoldProducts,
        });
    };

    const onSelectPrinter = async (printer: IGET_RESTAURANT_REGISTER_PRINTER) => {
        if (receiptPrinterModalPrintSalesData) {
            await printSales({ printerType: printer.type, printerAddress: printer.address }, receiptPrinterModalPrintSalesData);

            setReceiptPrinterModalPrintSalesData(null);
        } else if (receiptPrinterModalPrintReorderData) {
            const productsToPrint = filterPrintProducts(receiptPrinterModalPrintReorderData.products, register.printers.items[0]);

            await printReceipt({
                ...receiptPrinterModalPrintReorderData,
                printerType: register.printers.items[0].type,
                printerAddress: register.printers.items[0].address,
                customerPrinter: register.printers.items[0].customerPrinter,
                kitchenPrinter: register.printers.items[0].kitchenPrinter,
                products: convertProductTypesForPrint(productsToPrint),
            });

            setReceiptPrinterModalPrintReorderData(null);
        }
    };

    const selectReceiptPrinterModal = () => {
        return (
            <>
                {showSelectReceiptPrinterModal && (
                    <SelectReceiptPrinterModal
                        isOpen={showSelectReceiptPrinterModal}
                        onClose={onCloseSelectReceiptPrinterModal}
                        onSelectPrinter={onSelectPrinter}
                    />
                )}
            </>
        );
    };

    const onIFrameBack = () => {
        const iframe = document.querySelector("iframe");

        //@ts-ignore
        iframe.contentWindow.postMessage("goBack", "http://localhost:3000/");
    };

    const onIFrameForward = () => {
        const iframe = document.querySelector("iframe");

        //@ts-ignore
        iframe.contentWindow.postMessage("goForward", "http://localhost:3000/");
    };

    const onBackToSale = () => {
        navigate(beginOrderPath);
    };

    const onRefresh = () => {
        const iframe = document.querySelector("iframe");

        //@ts-ignore
        iframe.contentWindow.postMessage("refresh", "http://localhost:3000/");
    };

    const onCloseSelectReceiptPrinterModal = () => {
        setShowSelectReceiptPrinterModal(false);
        setReceiptPrinterModalPrintSalesData(null);
        setReceiptPrinterModalPrintReorderData(null);
    };

    const modalsAndSpinners = <>{selectReceiptPrinterModal()}</>;

    return (
        <>
            {modalsAndSpinners}
            <div className="iframe-container">
                <div className="dashboard-header">
                    <div className="dashboard-header-nav-item-wrapper">
                        <div className="dashboard-header-nav-item" onClick={onIFrameBack}>
                            <FiArrowLeft size="20px" />
                        </div>
                        <div className="dashboard-header-nav-item" onClick={onIFrameForward}>
                            <FiArrowRight size="20px" />
                        </div>
                        <div className="dashboard-header-nav-item" onClick={onRefresh}>
                            <FiRotateCw size="20px" />
                        </div>
                    </div>
                    <div className="dashboard-header-nav-item-wrapper">
                        <div className="dashboard-header-nav-item" onClick={onBackToSale}>
                            <div className="mr-1">Back To Sale</div>
                            <FiX size="20px" />
                        </div>
                    </div>
                </div>
                <iframe key={restaurant.id} src={defaultPath} className="dashboard-iframe" />
            </div>
        </>
    );
};
