import { useCallback, useEffect, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiRotateCw, FiX } from "react-icons/fi";
import { useNavigate } from "react-router";
import { ICartModifier, ICartModifierGroup, ICartProduct } from "../../model/model";
import { useCart } from "../../context/cart-context";
import { useReceiptPrinter } from "../../context/receiptPrinter-context";
import { useRegister } from "../../context/register-context";
import { useRestaurant } from "../../context/restaurant-context";
import { IGET_RESTAURANT_ORDER_FRAGMENT, IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT } from "../../graphql/customFragments";
import { IGET_RESTAURANT_REGISTER_PRINTER } from "../../graphql/customQueries";
import { ERegisterPrinterType, IOrderReceipt, IPrintSalesData } from "../../model/model";
import { toast } from "../../tabin/components/toast";
import {
    convertProductTypesForPrint,
    filterPrintProducts,
    isItemAvailable,
    isItemSoldOut,
    isModifierQuantityAvailable,
    isProductQuantityAvailable,
} from "../../util/util";
import { beginOrderPath, restaurantPath } from "../main";
import { SelectReceiptPrinterModal } from "../modals/selectReceiptPrinterModal";

import "./dashboard.scss";

export default () => {
    const { restaurant, menuCategories, menuProducts, menuModifierGroups, menuModifiers } = useRestaurant();
    const {
        clearCart,
        setParkedOrderId,
        setParkedOrderNumber,
        setOrderType,
        setTableNumber,
        setBuzzerNumber,
        setNotes,
        setProducts,
        cartProductQuantitiesById,
    } = useCart();
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
                    receiptFooterText: register.printers.items[0].receiptFooterText,
                    kitchenPrinter: register.printers.items[0].kitchenPrinter,
                    kitchenPrinterSmall: register.printers.items[0].kitchenPrinterSmall,
                    kitchenPrinterLarge: register.printers.items[0].kitchenPrinterLarge,
                    hidePreparationTime: register.printers.items[0].hidePreparationTime,
                    hideModifierGroupName: register.printers.items[0].hideModifierGroupName,
                    hideOrderType: register.availableOrderTypes.length === 0,
                    products: convertProductTypesForPrint(productsToPrint),
                    displayPaymentRequiredMessage: !order.paid,
                });
            } else {
                toast.error("No receipt printers configured");
            }
        }
    };

    const getParkedOrderProducts = (products: IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT[], invalidItemsFound: number) => {
        const newCartProducts: ICartProduct[] = [];

        products.forEach((product) => {
            const menuProduct = menuProducts[product.id];

            if (!menuProduct) {
                invalidItemsFound++;
                return;
            }

            const menuProductCategory = product.category ? menuCategories[product.category.id] : null;

            if (!menuProductCategory) {
                invalidItemsFound++;
                return;
            }

            const isProductSoldOut = isItemSoldOut(menuProduct.soldOut, menuProduct.soldOutDate);
            const isProductAvailable = isItemAvailable(menuProduct.availability);
            const isProductCategoryAvailable = isItemAvailable(menuProductCategory.availability);
            const isProductQtyAvailable = isProductQuantityAvailable(product, cartProductQuantitiesById);

            const isProductValid = !isProductSoldOut && isProductAvailable && isProductCategoryAvailable && isProductQtyAvailable;

            if (!isProductValid) {
                invalidItemsFound++;
                return;
            }

            const newCartProduct: ICartProduct = {
              id: product.id,
              name: product.name,
              kitchenName: product.kitchenName,
              price: product.price,
              totalPrice: product.totalPrice,
              discount: 0, //Set discount to total because we do not want to add any discount or promotions to parked orders
              availablePlatforms: product.availablePlatforms,
              isAgeRescricted: product.isAgeRescricted,
              image: product.image
                ? {
                    key: product.image.key,
                    bucket: product.image.bucket,
                    region: product.image.region,
                    identityPoolId: product.image.identityPoolId,
                  }
                : null, //To avoid __typename error
              quantity: product.quantity,
              notes: product.notes,
              category: product.category
                ? {
                    id: product.category.id,
                    name: product.category.name,
                    kitchenName: product.category.kitchenName,
                    image: product.category.image
                      ? {
                          key: product.category.image.key,
                          bucket: product.category.image.bucket,
                          region: product.category.image.region,
                          identityPoolId: product.category.image.identityPoolId,
                        }
                      : null, //To avoid __typename error
                  }
                : null,
              modifierGroups: [],
            };

            const newCartModifierGroups: ICartModifierGroup[] = [];

            product.modifierGroups &&
                product.modifierGroups.forEach((modifierGroup) => {
                    const menuModifierGroup = menuModifierGroups[modifierGroup.id];

                    if (!menuModifierGroup) {
                        invalidItemsFound++;
                        return;
                    }

                    const newCartModifierGroup: ICartModifierGroup = {
                        id: modifierGroup.id,
                        name: modifierGroup.name,
                        kitchenName: modifierGroup.kitchenName,
                        choiceDuplicate: modifierGroup.choiceDuplicate,
                        choiceMin: modifierGroup.choiceMin,
                        choiceMax: modifierGroup.choiceMax,
                        hideForCustomer: modifierGroup.hideForCustomer || false,
                        modifiers: [],
                    };

                    const newCartModifiers: ICartModifier[] = [];

                    modifierGroup.modifiers &&
                        modifierGroup.modifiers.forEach((modifier) => {
                            const menuModifier = menuModifiers[modifier.id];

                            if (!menuModifier) {
                                invalidItemsFound++;
                                return;
                            }

                            const isModifierSoldOut = isItemSoldOut(menuModifier.soldOut, menuModifier.soldOutDate);
                            const isModifierQtyAvailable = isModifierQuantityAvailable(product, cartProductQuantitiesById);

                            const isModifierValid = !isModifierSoldOut && isModifierQtyAvailable;

                            if (!isModifierValid) {
                                invalidItemsFound++;
                                return;
                            }

                            const processedProductModifiers = modifier.productModifiers
                                ? getParkedOrderProducts(modifier.productModifiers, invalidItemsFound)
                                : null;

                            if (processedProductModifiers && processedProductModifiers.invalidItemsFound) {
                                invalidItemsFound = invalidItemsFound + processedProductModifiers.invalidItemsFound;
                                return;
                            }

                            const newCartModifier: ICartModifier = {
                                id: modifier.id,
                                name: modifier.name,
                                kitchenName: modifier.kitchenName,
                                price: modifier.price,
                                preSelectedQuantity: modifier.preSelectedQuantity,
                                quantity: modifier.quantity,
                                productModifiers: processedProductModifiers ? processedProductModifiers.newCartProducts : null,
                                image: modifier.image
                                    ? {
                                          key: modifier.image.key,
                                          bucket: modifier.image.bucket,
                                          region: modifier.image.region,
                                          identityPoolId: modifier.image.identityPoolId,
                                      }
                                    : null, //To avoid __typename error
                            };

                            newCartModifiers.push(newCartModifier);
                        });

                    newCartModifierGroup.modifiers = newCartModifiers;
                    newCartModifierGroups.push(newCartModifierGroup);
                });

            newCartProduct.modifierGroups = newCartModifierGroups;
            newCartProducts.push(newCartProduct);
        });

        return { newCartProducts, invalidItemsFound };
    };

    const onOpenParkedOrder = (order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
        if (!restaurant) return;

        navigate(restaurantPath + "/" + restaurant.id);

        clearCart();

        setParkedOrderId(order.id);
        setParkedOrderNumber(order.number);
        setOrderType(order.type);
        if (order.table) setTableNumber(order.table);
        if (order.buzzer) setBuzzerNumber(order.buzzer);
        if (order.notes) setNotes(order.notes);

        const orderedProducts = getParkedOrderProducts(order.products, 0);

        setProducts(orderedProducts.newCartProducts);

        if (orderedProducts.invalidItemsFound > 0) toast.error("One or more items in this parked orders is invalid. Please recheck the order.");
    };

    const onMessage = async (event) => {
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
        } else if (data.action === "orderOpenParked") {
            try {
                onOpenParkedOrder(data.order);
            } catch (e) {
                console.error(e);
                toast.error("There was an error opening your parked order.");
            }
        }
    };

    useEffect(() => {
        window.addEventListener("message", onMessage, false);

        return () => window.removeEventListener("message", onMessage, false);
    }, []);

    if (!restaurant) return <>No Restaurant</>;
    if (!register) return <>No Register</>;

    const iFrameBaseUrl = "https://restaurants.tabin.co.nz";
    const defaultPath = `${iFrameBaseUrl}/${restaurant.id}/orders`;

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
            const productsToPrint = filterPrintProducts(receiptPrinterModalPrintReorderData.products, printer);

            await printReceipt({
                ...receiptPrinterModalPrintReorderData,
                printerType: printer.type,
                printerAddress: printer.address,
                customerPrinter: printer.customerPrinter,
                kitchenPrinter: printer.kitchenPrinter,
                kitchenPrinterSmall: printer.kitchenPrinterSmall,
                kitchenPrinterLarge: printer.kitchenPrinterLarge,
                hidePreparationTime: printer.hidePreparationTime,
                hideModifierGroupName: printer.hideModifierGroupName,
                hideOrderType: register.availableOrderTypes.length === 0,
                products: convertProductTypesForPrint(productsToPrint),
            });
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
        iframe.contentWindow.postMessage("goBack", iFrameBaseUrl);
    };

    const onIFrameForward = () => {
        const iframe = document.querySelector("iframe");

        //@ts-ignore
        iframe.contentWindow.postMessage("goForward", iFrameBaseUrl);
    };

    const onBackToSale = () => {
        navigate(beginOrderPath);
    };

    const onRefresh = () => {
        const iframe = document.querySelector("iframe");

        //@ts-ignore
        iframe.contentWindow.postMessage("refresh", iFrameBaseUrl);
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
