import { useEffect, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiRotateCw, FiX } from "react-icons/fi";
import { useNavigate } from "react-router";
import { useReceiptPrinter } from "../../context/receiptPrinter-context";
import { useRegister } from "../../context/register-context";
import { useRestaurant } from "../../context/restaurant-context";
import { IGET_RESTAURANT_REGISTER_PRINTER } from "../../graphql/customQueries";
import { ERegisterPrinterType, IPrintSalesData } from "../../model/model";
import { toast } from "../../tabin/components/toast";
import { beginOrderPath } from "../main";
import { SelectReceiptPrinterModal } from "../modals/selectReceiptPrinterModal";

import "./dashboard.scss";

export default () => {
    const { restaurant } = useRestaurant();
    const { register } = useRegister();
    const { printSalesData } = useReceiptPrinter();
    const navigate = useNavigate();

    const [showSelectReceiptPrinterModal, setShowSelectReceiptPrinterModal] = useState(false);
    const [receiptPrinterModalPrintData, setReceiptPrinterModalPrintData] = useState<IPrintSalesData | null>(null);

    const onPrintData = async (type: "DAY" | "CATEGORY" | "PRODUCT", printData: IPrintSalesData) => {
        setReceiptPrinterModalPrintData(printData);

        if (register) {
            if (register.printers.items.length > 1) {
                setShowSelectReceiptPrinterModal(true);
            } else if (register.printers.items.length === 1) {
                await printSales({ printerType: register.printers.items[0].type, printerAddress: register.printers.items[0].address }, printData);
            } else {
                toast.error("No receipt printers configured");
            }
        }
    };

    useEffect(() => {
        window.addEventListener("message", (event) => {
            console.log("Got message from child", event);

            const data = event.data;

            if (data.action === "printSalesData") {
                try {
                    onPrintData(data.type, data.printData);
                } catch (err) {
                    console.error(err);
                    toast.error("There was an error printing your sales data.");
                }
            }
        });

        // return () => window.removeEventListener("message", () => {});
    }, []);

    if (!restaurant) return <>No Restaurant</>;
    if (!register) return <>No Register</>;

    const defaultPath = `https://restaurants.tabin.co.nz/${restaurant.id}/sales_analytics`;

    console.log(window.location.href);
    console.log(window.location.origin);

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
        if (!receiptPrinterModalPrintData) return;

        await printSales({ printerType: printer.type, printerAddress: printer.address }, receiptPrinterModalPrintData);
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
        iframe.contentWindow.postMessage("goBack", "https://restaurants.tabin.co.nz/");
    };

    const onIFrameForward = () => {
        const iframe = document.querySelector("iframe");

        //@ts-ignore
        iframe.contentWindow.postMessage("goForward", "https://restaurants.tabin.co.nz/");
    };

    const onBackToSale = () => {
        navigate(beginOrderPath);
    };

    const onRefresh = () => {
        const iframe = document.querySelector("iframe");

        //@ts-ignore
        iframe.contentWindow.postMessage("refresh", "https://restaurants.tabin.co.nz/");
    };

    const onCloseSelectReceiptPrinterModal = () => {
        setShowSelectReceiptPrinterModal(false);
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
