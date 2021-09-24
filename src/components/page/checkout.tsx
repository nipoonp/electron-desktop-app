import { useState, useEffect } from "react";

import { Logger } from "aws-amplify";
import { useCart } from "../../context/cart-context";
import { useHistory } from "react-router-dom";
import { convertCentsToDollars } from "../../util/util";
import { useMutation } from "@apollo/client";
import { CREATE_ORDER } from "../../graphql/customMutations";
import { IGET_RESTAURANT_REGISTER_PRINTER, IGET_RESTAURANT_CATEGORY, IGET_RESTAURANT_PRODUCT, EPromotionType } from "../../graphql/customQueries";
import { restaurantPath, beginOrderPath, tableNumberPath, orderTypePath } from "../main";
import { ShoppingBasketIcon } from "../../tabin/components/icons/shoppingBasketIcon";
import { ProductModal } from "../modals/product";
import {
    ICartProduct,
    IPreSelectedModifiers,
    ICartModifierGroup,
    EOrderType,
    IMatchingUpSellCrossSellProductItem,
    IMatchingUpSellCrossSellCategoryItem,
} from "../../model/model";
import { useUser } from "../../context/user-context";
import { format } from "date-fns";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { useSmartpay, SmartpayTransactionOutcome } from "../../context/smartpay-context";
import { Modal } from "../../tabin/components/modal";
import { Button } from "../../tabin/components/button";
import { ItemAddedUpdatedModal } from "../modals/itemAddedUpdatedModal";
import { Stepper } from "../../tabin/components/stepper";
import { useVerifone, VerifoneTransactionOutcome } from "../../context/verifone-context";
import { useRegister } from "../../context/register-context";
import { useReceiptPrinter } from "../../context/receiptPrinter-context";
import { getPublicCloudFrontDomainName } from "../../private/aws-custom";
import { toLocalISOString } from "../../util/util";
import { useRestaurant } from "../../context/restaurant-context";
import { UpSellProductModal } from "../modals/upSellProduct";
import { Link } from "../../tabin/components/link";
import { TextArea } from "../../tabin/components/textArea";

import "./checkout.scss";
import { useWindcave, WindcaveTransactionOutcome, WindcaveTransactionOutcomeResult } from "../../context/windcave-context";
import { CachedImage } from "../../tabin/components/cachedImage";
import { UpSellCategoryModal } from "../modals/upSellCategory";
import { useErrorLogging } from "../../context/errorLogging-context";
import { PromotionCodeModal } from "../modals/promotionCodeModal";

const logger = new Logger("checkout");

enum CheckoutTransactionOutcome {
    PayLater,
    CashPayment,
    Success,
    Delay,
    Fail,
}

// Component
export const Checkout = () => {
    // context
    const history = useHistory();
    const {
        orderType,
        products,
        notes,
        setNotes,
        tableNumber,
        clearCart,
        promotion,
        total,
        subTotal,
        updateItem,
        updateItemQuantity,
        deleteItem,
        addItem,
        userAppliedPromotionCode,
        removeUserAppliedPromotion,
    } = useCart();
    const { restaurant } = useRestaurant();
    const { printReceipt } = useReceiptPrinter();
    const { user } = useUser();
    const { logError } = useErrorLogging();

    const { createTransaction: smartpayCreateTransaction, pollForOutcome: smartpayPollForOutcome } = useSmartpay();
    const { createTransaction: verifoneCreateTransaction } = useVerifone();
    const { createTransaction: windcaveCreateTransaction, pollForOutcome: windcavePollForOutcome } = useWindcave();

    const [createOrderMutation, { data, loading, error }] = useMutation(CREATE_ORDER, {
        update: (proxy, mutationResult) => {
            logger.debug("mutation result: ", mutationResult);
        },
    });

    // state
    const [selectedCategoryForProductModal, setSelectedCategoryForProductModal] = useState<IGET_RESTAURANT_CATEGORY | null>(null);
    const [selectedProductForProductModal, setSelectedProductForProductModal] = useState<IGET_RESTAURANT_PRODUCT | null>(null);
    const [productToEdit, setProductToEdit] = useState<{
        product: ICartProduct;
        displayOrder: number;
    } | null>(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showEditProductModal, setShowEditProductModal] = useState(false);
    const [showItemUpdatedModal, setShowItemUpdatedModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentOutcome, setPaymentOutcome] = useState<CheckoutTransactionOutcome | null>(null);
    const [paymentOutcomeErrorMessage, setPaymentOutcomeErrorMessage] = useState<string | null>(null);
    const [paymentOutcomeDelayedOrderNumber, setPaymentOutcomeDelayedOrderNumber] = useState<string | null>(null);
    const [paymentOutcomeApprovedRedirectTimeLeft, setPaymentOutcomeApprovedRedirectTimeLeft] = useState(10);
    const [createOrderError, setCreateOrderError] = useState<string | null>(null);
    const [showPromotionCodeModal, setShowPromotionCodeModal] = useState(false);
    const [showUpSellCategoryModal, setShowUpSellCategoryModal] = useState(false);
    const [showUpSellProductModal, setShowUpSellProductModal] = useState(false);

    // const isUserFocusedOnEmailAddressInput = useRef(false);

    const { register } = useRegister();

    if (!register) {
        throw "Register is not valid";
    }

    useEffect(() => {
        if (
            showProductModal ||
            showEditProductModal ||
            showPaymentModal ||
            showPromotionCodeModal ||
            showUpSellCategoryModal ||
            showUpSellProductModal
        ) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [showProductModal, showEditProductModal, showPaymentModal, showPromotionCodeModal || showUpSellCategoryModal, showUpSellProductModal]);

    useEffect(() => {
        setTimeout(() => {
            setShowUpSellCategoryModal(true);
        }, 1000);
    }, []);

    if (!restaurant) {
        history.push(beginOrderPath);
    }

    if (!restaurant) {
        throw "Restaurant is invalid";
    }

    const onCancelOrder = () => {
        clearCart();
        history.push(beginOrderPath);
    };

    // callbacks
    const onUpdateTableNumber = () => {
        history.push(tableNumberPath);
    };

    const onUpdateOrderType = () => {
        history.push(orderTypePath);
    };

    const onCloseProductModal = () => {
        setShowProductModal(false);
    };

    const onClosePromotionCodeModal = () => {
        setShowPromotionCodeModal(false);
    };

    const onCloseEditProductModal = () => {
        setProductToEdit(null);
        setShowEditProductModal(false);
    };

    const onCloseUpSellCategoryModal = () => {
        setShowUpSellCategoryModal(false);
    };

    const onCloseUpSellProductModal = () => {
        setShowUpSellProductModal(false);
    };

    const onCloseItemUpdatedModal = () => {
        setShowItemUpdatedModal(false);
    };

    const onAddItem = (product: ICartProduct) => {
        addItem(product);
    };

    const onSelectUpSellCrossSellCategory = (category: IGET_RESTAURANT_CATEGORY) => {
        history.push(`${restaurantPath}/${restaurant.id}/${category.id}`);
    };

    const onSelectUpSellCrossSellProduct = (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => {
        if (product.modifierGroups && product.modifierGroups.items.length > 0) {
            setSelectedCategoryForProductModal(category);
            setSelectedProductForProductModal(product);

            setShowProductModal(true);
        } else {
            addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image
                    ? {
                          key: product.image.key,
                          region: product.image.region,
                          bucket: product.image.bucket,
                          identityPoolId: product.image.identityPoolId,
                      }
                    : null,
                quantity: 1,
                notes: null,
                category: {
                    id: category.id,
                    name: category.name,
                    image: category.image
                        ? {
                              key: category.image.key,
                              region: category.image.region,
                              bucket: category.image.bucket,
                              identityPoolId: category.image.identityPoolId,
                          }
                        : null,
                },
                modifierGroups: [],
            });
        }

        setShowUpSellProductModal(false);
    };

    const onEditProduct = (product: ICartProduct, displayOrder: number) => {
        setProductToEdit({ product, displayOrder });
        setShowEditProductModal(true);
    };

    const onUpdateProductQuantity = (displayOrder: number, productQuantity: number) => {
        updateItemQuantity(displayOrder, productQuantity);
    };

    const onRemoveProduct = (displayOrder: number) => {
        deleteItem(displayOrder);
    };

    const onClickOrderButton = async () => {
        setShowPaymentModal(true);

        await onConfirmTotalOrRetryTransaction();
    };

    const onClosePaymentModal = () => {
        setPaymentOutcome(null);
        setPaymentOutcomeErrorMessage(null);
        setPaymentOutcomeDelayedOrderNumber(null);
        setPaymentOutcomeApprovedRedirectTimeLeft(10);

        setShowPaymentModal(false);
    };

    const onNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
    };

    // submit callback
    const createOrder = async (orderNumber: string, paid: boolean, cashPayment: boolean, eftposReceipt: string | null) => {
        const now = new Date();

        if (!user) {
            await logError(
                JSON.stringify({
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                    context: { user: user },
                })
            );
            throw "Invalid user";
        }

        if (!orderType) {
            await logError(
                JSON.stringify({
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                    error: "Invalid order type",
                    context: { orderType: orderType },
                })
            );
            throw "Invalid order type";
        }

        if (!restaurant) {
            await logError(
                JSON.stringify({
                    error: "Invalid restaurant",
                    context: { restaurant: restaurant },
                })
            );
            throw "Invalid restaurant";
        }

        if (!products || products.length == 0) {
            await logError(
                JSON.stringify({
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                    error: "No products have been selected",
                    context: { products: products },
                })
            );
            throw "No products have been selected";
        }

        let variables;

        try {
            variables = {
                status: "NEW",
                paid: paid,
                cashPayment: cashPayment,
                type: orderType,
                number: orderNumber,
                table: tableNumber,
                notes: notes,
                eftposReceipt: eftposReceipt,
                total: total,
                discount: promotion ? promotion.discountedAmount : undefined,
                promotionId: promotion ? promotion.promotion.id : undefined,
                subTotal: subTotal,
                registerId: register.id,
                products: JSON.parse(JSON.stringify(products)) as ICartProduct[], // copy obj so we can mutate it later
                placedAt: toLocalISOString(now),
                placedAtUtc: now.toISOString(),
                orderUserId: user.id,
                orderRestaurantId: restaurant.id,
            };

            if (restaurant.autoCompleteOrders) {
                variables.status = "COMPLETED";
                variables.completedAt = toLocalISOString(now);
                variables.completedAtUtc = now.toISOString();
                variables.paid = true;
            }
        } catch (e) {
            await logError(
                JSON.stringify({
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                    error: "No products have been selected",
                    context: {
                        status: "NEW",
                        paid: paid,
                        cashPayment: cashPayment,
                        type: orderType,
                        number: orderNumber,
                        table: tableNumber,
                        notes: notes,
                        eftposReceipt: eftposReceipt,
                        total: total,
                        discount: promotion ? promotion.discountedAmount : undefined,
                        promotionId: promotion ? promotion.promotion.id : undefined,
                        subTotal: subTotal,
                        registerId: register.id,
                        products: JSON.stringify(products), // copy obj so we can mutate it later
                        placedAt: now,
                        placedAtUtc: now,
                        orderUserId: user.id,
                        orderRestaurantId: restaurant.id,
                    },
                })
            );
            throw "Error in createOrderMutation input";
        }

        try {
            if (tableNumber == null || tableNumber == "") {
                delete variables.table;
            }

            if (notes == null || notes == "") {
                delete variables.notes;
            }

            variables.products.forEach((product) => {
                if (product.modifierGroups.length == 0) {
                    delete product.modifierGroups;
                }

                if (product.image == null) {
                    delete product.image;
                }

                if (product.notes == null || product.notes == "") {
                    delete product.notes;
                }

                if (product.category.image == null) {
                    delete product.category.image;
                }
            });

            // process order
            const res = await createOrderMutation({
                variables: variables,
            });

            logger.debug("process order mutation result: ", res);
        } catch (e) {
            await logError(
                JSON.stringify({
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                    error: e,
                    context: variables,
                })
            );
            throw e;
        }
    };

    const orderSummary = (
        <OrderSummary
            onNotesChange={onNotesChange}
            onEditProduct={onEditProduct}
            onUpdateProductQuantity={onUpdateProductQuantity}
            onRemoveProduct={onRemoveProduct}
        />
    );

    const getOrderNumber = () => {
        let todayDate = format(new Date(), "dd/MM/yyyy");

        let orderNumberStored: string | null = localStorage.getItem("orderNumber");
        let orderNumberDateStored: string | null = localStorage.getItem("orderNumberDate");

        let orderNumber;

        if (todayDate == orderNumberDateStored) {
            orderNumber = String(Number(orderNumberStored) + 1);

            localStorage.setItem("orderNumber", orderNumber);
        } else {
            orderNumber = String(1);
            localStorage.setItem("orderNumber", orderNumber);
            localStorage.setItem("orderNumberDate", todayDate);
        }

        return orderNumber + (register.orderNumberSuffix || "");
    };

    const beginPaymentOutcomeApprovedTimeout = () => {
        (function myLoop(i) {
            setTimeout(() => {
                // if (isUserFocusedOnEmailAddressInput.current) {
                //     i = 30;
                //     isUserFocusedOnEmailAddressInput.current = false;
                // }
                i--;
                setPaymentOutcomeApprovedRedirectTimeLeft(i);

                if (i == 0) {
                    history.push(beginOrderPath);
                    clearCart();
                }

                if (i > 0) myLoop(i); //  decrement i and call myLoop again if i > 0
            }, 1000);
        })(10);
    };

    const filterPrintProducts = (products: ICartProduct[], printer: IGET_RESTAURANT_REGISTER_PRINTER) => {
        if (!printer.ignoreProducts || printer.ignoreProducts.items.length == 0) {
            return products;
        }

        printer.ignoreProducts.items.forEach((ignoreProduct) => {
            products.forEach((product) => {
                if (ignoreProduct.product.id == product.id) {
                    products = products.filter((p) => p.id != product.id);
                }
            });
        });

        return products;
    };

    const printReceipts = (orderNumber: string, paid: boolean, eftposReceipt: string | null) => {
        if (!products || products.length == 0) {
            return;
        }

        register.printers &&
            register.printers.items.forEach((printer) => {
                const productsToPrint = filterPrintProducts(products, printer);

                if (productsToPrint.length > 0) {
                    printReceipt({
                        printerType: printer.type,
                        printerAddress: printer.address,
                        customerPrinter: printer.customerPrinter,
                        kitchenPrinter: printer.kitchenPrinter,
                        hideModifierGroupsForCustomer: true,
                        restaurant: {
                            name: restaurant.name,
                            address: `${restaurant.address.aptSuite || ""} ${restaurant.address.formattedAddress || ""}`,
                            gstNumber: restaurant.gstNumber,
                        },
                        notes: notes,
                        products: productsToPrint,
                        eftposReceipt: eftposReceipt,
                        total: total,
                        discount: promotion ? promotion.discountedAmount : null,
                        subTotal: subTotal,
                        paid: paid,
                        type: orderType || EOrderType.TAKEAWAY,
                        number: orderNumber,
                        table: tableNumber,
                    });
                }
            });
    };

    const onSubmitOrder = async (paid: boolean, cashPayment: boolean, eftposReceipt: string | null) => {
        const orderNumber = getOrderNumber();
        setPaymentOutcomeDelayedOrderNumber(orderNumber);

        try {
            if (register.printers && register.printers.items.length > 0) {
                printReceipts(orderNumber, paid, eftposReceipt);
            }

            await createOrder(orderNumber, paid, cashPayment, eftposReceipt);
        } catch (e) {
            throw e.message;
        }

        beginPaymentOutcomeApprovedTimeout();
    };

    const doTransaction = async () => {
        if (register.eftposProvider == "SMARTPAY") {
            await doTransactionSmartpay();
        } else if (register.eftposProvider == "VERIFONE") {
            await doTransactionVerifone();
        } else if (register.eftposProvider == "WINDCAVE") {
            await doTransactionWindcave();
        }
    };

    const doTransactionSmartpay = async () => {
        let delayedShown = false;

        let delayed = () => {
            if (!delayedShown) {
                // Don't show it more than once per request...
                delayedShown = true;

                // Might want to let the user know to check if everything is ok with the device
                setPaymentOutcome(CheckoutTransactionOutcome.Delay);
            }
        };

        try {
            let pollingUrl = await smartpayCreateTransaction(subTotal, "Card.Purchase");

            let transactionOutcome: SmartpayTransactionOutcome = await smartpayPollForOutcome(pollingUrl, delayed);

            if (transactionOutcome == SmartpayTransactionOutcome.Accepted) {
                setPaymentOutcome(CheckoutTransactionOutcome.Success);

                try {
                    await onSubmitOrder(true, false, null);
                } catch (e) {
                    setCreateOrderError(e);
                }
            } else if (transactionOutcome == SmartpayTransactionOutcome.Declined) {
                setPaymentOutcome(CheckoutTransactionOutcome.Fail);
                setPaymentOutcomeErrorMessage("Transaction Declined! Please try again.");
            } else if (transactionOutcome == SmartpayTransactionOutcome.Cancelled) {
                setPaymentOutcome(CheckoutTransactionOutcome.Fail);
                setPaymentOutcomeErrorMessage("Transaction Cancelled!");
            } else if (transactionOutcome == SmartpayTransactionOutcome.DeviceOffline) {
                setPaymentOutcome(CheckoutTransactionOutcome.Fail);
                setPaymentOutcomeErrorMessage("Transaction Cancelled! Please check if the device is powered on and online.");
            } else {
                setPaymentOutcome(CheckoutTransactionOutcome.Fail);
            }
        } catch (errorMessage) {
            setPaymentOutcomeErrorMessage(errorMessage);
        }
    };

    const doTransactionWindcave = async () => {
        try {
            const txnRef = await windcaveCreateTransaction(register.windcaveStationId, subTotal, "Purchase");

            let transactionOutcome: WindcaveTransactionOutcomeResult = await windcavePollForOutcome(register.windcaveStationId, txnRef);

            if (transactionOutcome.transactionOutcome == WindcaveTransactionOutcome.Accepted) {
                setPaymentOutcome(CheckoutTransactionOutcome.Success);

                try {
                    await onSubmitOrder(true, false, transactionOutcome.eftposReceipt);
                } catch (e) {
                    setCreateOrderError(e);
                }
            } else if (transactionOutcome.transactionOutcome == WindcaveTransactionOutcome.Declined) {
                setPaymentOutcome(CheckoutTransactionOutcome.Fail);
                setPaymentOutcomeErrorMessage("Transaction Declined! Please try again.");
            } else if (transactionOutcome.transactionOutcome == WindcaveTransactionOutcome.Cancelled) {
                setPaymentOutcome(CheckoutTransactionOutcome.Fail);
                setPaymentOutcomeErrorMessage("Transaction Cancelled!");
            } else {
                setPaymentOutcome(CheckoutTransactionOutcome.Fail);
            }
        } catch (errorMessage) {
            setPaymentOutcomeErrorMessage(errorMessage);
        }
    };

    const doTransactionVerifone = async () => {
        try {
            const { transactionOutcome, eftposReceipt } = await verifoneCreateTransaction(
                subTotal,
                register.eftposIpAddress,
                register.eftposPortNumber,
                restaurant.id
            );

            if (transactionOutcome == VerifoneTransactionOutcome.Approved) {
                setPaymentOutcome(CheckoutTransactionOutcome.Success);

                try {
                    await onSubmitOrder(true, false, eftposReceipt);
                } catch (e) {
                    setCreateOrderError(e);
                }
            } else if (transactionOutcome == VerifoneTransactionOutcome.ApprovedWithSignature) {
                // We should not come in here if its on kiosk mode, unattended mode for Verifone
                setPaymentOutcome(CheckoutTransactionOutcome.Fail);
                setPaymentOutcomeErrorMessage("Transaction Approved With Signature Not Allowed In Kiosk Mode!");
                // setPaymentOutcome(CheckoutTransactionOutcome.Success);

                // try {
                //     await onSubmitOrder(true);
                // } catch (e) {
                //     setCreateOrderError(e);
                // }
            } else if (transactionOutcome == VerifoneTransactionOutcome.Cancelled) {
                setPaymentOutcome(CheckoutTransactionOutcome.Fail);
                setPaymentOutcomeErrorMessage("Transaction Cancelled!");
            } else if (transactionOutcome == VerifoneTransactionOutcome.Declined) {
                setPaymentOutcome(CheckoutTransactionOutcome.Fail);
                setPaymentOutcomeErrorMessage("Transaction Declined! Please try again.");
            } else if (transactionOutcome == VerifoneTransactionOutcome.SettledOk) {
                alert("Transaction Settled Ok!");
            } else if (transactionOutcome == VerifoneTransactionOutcome.HostUnavailable) {
                setPaymentOutcome(CheckoutTransactionOutcome.Fail);
                setPaymentOutcomeErrorMessage("Transaction Host Unavailable! Please check if the device is powered on and online.");
            } else if (transactionOutcome == VerifoneTransactionOutcome.SystemError) {
                setPaymentOutcome(CheckoutTransactionOutcome.Fail);
                setPaymentOutcomeErrorMessage("Transaction System Error! Please try again later.");
            } else if (transactionOutcome == VerifoneTransactionOutcome.TransactionInProgress) {
                // You should never come in this state
                // alert("Transaction In Progress!");
            } else if (transactionOutcome == VerifoneTransactionOutcome.TerminalBusy) {
                setPaymentOutcome(CheckoutTransactionOutcome.Fail);
                setPaymentOutcomeErrorMessage("Terminal Is Busy! Please cancel the previous transaction before proceeding.");
            } else {
                setPaymentOutcome(CheckoutTransactionOutcome.Fail);
                setPaymentOutcomeErrorMessage("Transaction Failed!");
            }
        } catch (errorMessage) {
            setPaymentOutcome(CheckoutTransactionOutcome.Fail);
            setPaymentOutcomeErrorMessage(errorMessage);
        }
    };

    const onUpdateItem = (index: number, product: ICartProduct) => {
        updateItem(index, product);
        setShowItemUpdatedModal(true);
    };

    const editProductModal = () => {
        let category: IGET_RESTAURANT_CATEGORY | null = null;
        let product: IGET_RESTAURANT_PRODUCT | null = null;

        if (!productToEdit) {
            return <></>;
        }

        restaurant.categories.items.forEach((c) => {
            if (c.id == productToEdit.product.category.id) {
                category = c;
            }

            c.products &&
                c.products.items.forEach((p) => {
                    if (p.product.id == productToEdit.product.id) {
                        product = p.product;
                    }
                });
        });

        if (!product || !category) {
            return <></>;
        }

        let orderedModifiers: IPreSelectedModifiers = {};

        productToEdit.product.modifierGroups.forEach((mg) => {
            orderedModifiers[mg.id] = mg.modifiers;
        });

        console.log("orderedModifiers", orderedModifiers);

        return (
            <ProductModal
                category={category}
                product={product}
                isOpen={showEditProductModal}
                onClose={onCloseEditProductModal}
                onUpdateItem={onUpdateItem}
                editProduct={{
                    orderedModifiers: orderedModifiers,
                    quantity: productToEdit.product.quantity,
                    notes: productToEdit.product.notes,
                    productCartIndex: productToEdit.displayOrder,
                }}
            />
        );
    };

    const productModal = () => {
        if (selectedCategoryForProductModal && selectedProductForProductModal && showProductModal) {
            return (
                <ProductModal
                    isOpen={showProductModal}
                    category={selectedCategoryForProductModal}
                    product={selectedProductForProductModal}
                    onAddItem={onAddItem}
                    onClose={onCloseProductModal}
                />
            );
        }
    };

    const promotionCodeModal = () => {
        return <>{showPromotionCodeModal && <PromotionCodeModal isOpen={showPromotionCodeModal} onClose={onClosePromotionCodeModal} />}</>;
    };

    const upSellCategoryModal = () => {
        if (
            restaurant &&
            restaurant.upSellCrossSell &&
            restaurant.upSellCrossSell.customCategories &&
            restaurant.upSellCrossSell.customCategories.items.length > 0
        ) {
            const upSellCrossSaleCategoryItems: IMatchingUpSellCrossSellCategoryItem[] = [];

            const menuCategories = restaurant.categories.items;
            const upSellCrossSellCategories = restaurant.upSellCrossSell.customCategories.items;

            menuCategories.forEach((category) => {
                upSellCrossSellCategories.forEach((upSellCategory) => {
                    if (category.id === upSellCategory.id) {
                        upSellCrossSaleCategoryItems.push({ category: category });
                    }
                });
            });

            return (
                <UpSellCategoryModal
                    isOpen={showUpSellCategoryModal}
                    onClose={onCloseUpSellCategoryModal}
                    upSellCrossSaleCategoryItems={upSellCrossSaleCategoryItems}
                    onSelectUpSellCrossSellCategory={onSelectUpSellCrossSellCategory}
                />
            );
        }
    };

    const upSellProductModal = () => {
        if (
            restaurant &&
            restaurant.upSellCrossSell &&
            restaurant.upSellCrossSell.customProducts &&
            restaurant.upSellCrossSell.customProducts.items.length > 0
        ) {
            const upSellCrossSaleProductItems: IMatchingUpSellCrossSellProductItem[] = [];

            const menuCategories = restaurant.categories.items;
            const upSellCrossSellProducts = restaurant.upSellCrossSell.customProducts.items;

            menuCategories.forEach((category) => {
                category.products &&
                    category.products.items.forEach((p) => {
                        upSellCrossSellProducts.forEach((upSellProduct) => {
                            if (p.product.id === upSellProduct.id) {
                                upSellCrossSaleProductItems.push({ category: category, product: p.product });
                            }
                        });
                    });
            });

            return (
                <UpSellProductModal
                    isOpen={showUpSellProductModal}
                    onClose={onCloseUpSellProductModal}
                    upSellCrossSaleProductItems={upSellCrossSaleProductItems}
                    onSelectUpSellCrossSellProduct={onSelectUpSellCrossSellProduct}
                />
            );
        }
    };

    const itemUpdatedModal = (
        <>
            {showItemUpdatedModal && <ItemAddedUpdatedModal isOpen={showItemUpdatedModal} onClose={onCloseItemUpdatedModal} isProductUpdate={true} />}
        </>
    );

    const onClickApplyPromotionCode = async () => {
        setShowPromotionCodeModal(true);
    };

    const onConfirmTotalOrRetryTransaction = async () => {
        setPaymentOutcome(null);
        setPaymentOutcomeErrorMessage(null);
        setPaymentOutcomeDelayedOrderNumber(null);
        setPaymentOutcomeApprovedRedirectTimeLeft(10);

        await doTransaction();
    };

    const onClickPayLater = async () => {
        setShowPaymentModal(true);

        setPaymentOutcome(CheckoutTransactionOutcome.PayLater);
        setPaymentOutcomeErrorMessage(null);
        setPaymentOutcomeDelayedOrderNumber(null);
        setPaymentOutcomeApprovedRedirectTimeLeft(10);

        try {
            await onSubmitOrder(false, false, null);
        } catch (e) {
            setCreateOrderError(e);
        }
    };

    const onClickCashPayment = async () => {
        setShowPaymentModal(true);

        setPaymentOutcome(CheckoutTransactionOutcome.CashPayment);
        setPaymentOutcomeErrorMessage(null);
        setPaymentOutcomeDelayedOrderNumber(null);
        setPaymentOutcomeApprovedRedirectTimeLeft(20);

        try {
            await onSubmitOrder(false, true, null);
        } catch (e) {
            setCreateOrderError(e);
        }
    };

    const retryButtons = () => (
        <>
            <div className="retry-buttons">
                <Button className="button large mr-3" onClick={onConfirmTotalOrRetryTransaction}>
                    Retry
                </Button>
                <Button className="button large retry-cancel-button" onClick={onClosePaymentModal}>
                    Cancel
                </Button>
            </div>
        </>
    );

    const awaitingCard = () => (
        <>
            <div className="h4 mb-6 awaiting-card-text">Swipe or insert your card on the terminal to complete your payment.</div>
            <CachedImage className="awaiting-card-image" url={`${getPublicCloudFrontDomainName()}/images/awaitingCard.gif`} alt="awaiting-card-gif" />
        </>
    );

    // const onFocusEmailAddressInput = () => {
    //     isUserFocusedOnEmailAddressInput.current = true;
    // };

    const paymentPayLater = () => (
        <>
            <div className="h4 mb-4">All Done!</div>
            <div className="h2 mb-6">Please pay later at the counter.</div>
            <div className="mb-1">Your order number is</div>
            <div className="order-number h1">{paymentOutcomeDelayedOrderNumber}</div>
            <div className="separator-6 mb-6"></div>
            {/* <Title3Font>Would you like to help save the planet? Get a e-receipt.</Title3Font>
            <Space4 />
            <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ flex: 1, paddingRight: "12px", width: "750px", height: "44px" }}>
                    <TextAreaV2 placeholder={"Email Address..."} onChange={onNotesChange} value={notes || ""} onFocus={onFocusEmailAddressInput} />
                </div>
                <Button
                    onClick={() => {
                        toast.success("Receipt successfully sent to your email");
                    }}
                    style={{ padding: "12px 24px" }}
                >
                    <NormalFont>Send</NormalFont>
                </Button>
            </div>
            <Space3 />
            <NormalFont>
                No, I prefer a physical copy.{" "}
                <Link>
                    <NormalFont>Click here to print</NormalFont>
                </Link>{" "}
            </NormalFont>
            <Space3 /> */}
            <div className="redirecting-in-text text-grey">
                Redirecting in {paymentOutcomeApprovedRedirectTimeLeft}
                {paymentOutcomeApprovedRedirectTimeLeft > 1 ? " seconds" : " second"}
                ...
            </div>
        </>
    );

    const paymentCashPayment = () => (
        <>
            <div className="h4 mb-4">All Done!</div>
            <div className="h2 mb-6">Please give correct change.</div>
            <div className="h1 mb-6">Total: ${convertCentsToDollars(subTotal)}</div>
            <div className="mb-1">Your order number is</div>
            <div className="order-number h1">{paymentOutcomeDelayedOrderNumber}</div>
            <div className="separator-6 mb-6"></div>
            {/* <Title3Font>Would you like to help save the planet? Get a e-receipt.</Title3Font>
            <Space4 />
            <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ flex: 1, paddingRight: "12px", width: "750px", height: "44px" }}>
                    <TextAreaV2 placeholder={"Email Address..."} onChange={onNotesChange} value={notes || ""} onFocus={onFocusEmailAddressInput} />
                </div>
                <Button
                    onClick={() => {
                        toast.success("Receipt successfully sent to your email");
                    }}
                    style={{ padding: "12px 24px" }}
                >
                    <NormalFont>Send</NormalFont>
                </Button>
            </div>
            <Space3 />
            <NormalFont>
                No, I prefer a physical copy.{" "}
                <Link>
                    <NormalFont>Click here to print</NormalFont>
                </Link>{" "}
            </NormalFont>
            <Space3 /> */}
            <div className="redirecting-in-text text-grey">
                Redirecting in {paymentOutcomeApprovedRedirectTimeLeft}
                {paymentOutcomeApprovedRedirectTimeLeft > 1 ? " seconds" : " second"}
                ...
            </div>
        </>
    );

    const paymentAccepted = () => (
        <>
            <div className="h4 mb-4">All Done!</div>
            <div className="h2 mb-6">Transaction Accepted!</div>
            <div className="mb-1">Your order number is</div>
            <div className="order-number h1">{paymentOutcomeDelayedOrderNumber}</div>
            <div className="separator-6 mb-6"></div>
            {/* <Title3Font>Would you like to help save the planet? Get a e-receipt.</Title3Font>
            <Space4 />
            <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ flex: 1, paddingRight: "12px", width: "750px", height: "44px" }}>
                    <TextAreaV2 placeholder={"Email Address..."} onChange={onNotesChange} value={notes || ""} onFocus={onFocusEmailAddressInput} />
                </div>
                <Button
                    onClick={() => {
                        toast.success("Receipt successfully sent to your email");
                    }}
                    style={{ padding: "12px 24px" }}
                >
                    <NormalFont>Send</NormalFont>
                </Button>
            </div>
            <Space3 />
            <NormalFont>
                No, I prefer a physical copy.{" "}
                <Link>
                    <NormalFont>Click here to print</NormalFont>
                </Link>
            </NormalFont>
            <Space3 /> */}
            <div className="redirecting-in-text text-grey">
                Redirecting in {paymentOutcomeApprovedRedirectTimeLeft}
                {paymentOutcomeApprovedRedirectTimeLeft > 1 ? " seconds" : " second"}
                ...
            </div>
        </>
    );

    const paymentDelayed = () => <div className="h4">Transaction delayed! Check if the device is powered on and online.</div>;

    const paymentFailed = (errorMessage?: string) => (
        <>
            <div className="h4">Oops! Something went wrong.</div>
            {errorMessage && <div className="h2 mt-4 mb-6">{errorMessage}</div>}
            {retryButtons()}
        </>
    );

    const createOrderFailed = () => (
        <>
            <div className="h4 mb-4">Oops! Something went wrong.</div>
            <div className="mb-2">Internal Server Error! Please contact a Tabin representative!</div>
            <div className="mb-2">{createOrderError}</div>
            <Button className="issue-fixed-button" onClick={onCancelOrder}>
                Issue Fixed? Restart
            </Button>
        </>
    );

    const getActivePaymentModalComponent = () => {
        if (paymentOutcomeErrorMessage) {
            return paymentFailed(paymentOutcomeErrorMessage);
        }

        if (createOrderError) {
            return createOrderFailed();
        }

        if (paymentOutcome == null) {
            return awaitingCard();
        }

        if (paymentOutcome == CheckoutTransactionOutcome.PayLater) {
            return paymentPayLater();
        } else if (paymentOutcome == CheckoutTransactionOutcome.CashPayment) {
            return paymentCashPayment();
        } else if (paymentOutcome == CheckoutTransactionOutcome.Success) {
            return paymentAccepted();
        } else if (paymentOutcome == CheckoutTransactionOutcome.Fail) {
            return paymentFailed();
        } else if (paymentOutcome == CheckoutTransactionOutcome.Delay) {
            return paymentDelayed();
        } else {
            return paymentFailed();
        }
    };

    const paymentModal = (
        <>
            <Modal isOpen={showPaymentModal}>
                <div className="payment-modal">{getActivePaymentModalComponent()}</div>
            </Modal>
        </>
    );

    const modalsAndSpinners = (
        <>
            {/* <FullScreenSpinner show={loading} text={loadingMessage} /> */}

            {upSellCategoryModal()}
            {upSellProductModal()}
            {productModal()}
            {editProductModal()}
            {promotionCodeModal()}
            {paymentModal}
            {itemUpdatedModal}
        </>
    );

    const cartEmptyDisplay = (
        <>
            <div className="cart-empty">
                <div className="icon mb-3">
                    <ShoppingBasketIcon height={"72px"}></ShoppingBasketIcon>
                </div>
                <div className="h1 center mb-3">Empty cart</div>
                <div className="h3 center mb-6">Show some love and start ordering!</div>
                <Button
                    onClick={() => {
                        history.push(restaurantPath + "/" + restaurant!.id);
                    }}
                >
                    Back To Menu
                </Button>
            </div>
        </>
    );

    const onOrderMore = () => {
        history.push(`/restaurant/${restaurant.id}`);
    };

    const title = (
        <div className="title mb-6">
            <CachedImage className="image mr-2" url={`${getPublicCloudFrontDomainName()}/images/shopping-bag-icon.png`} alt="shopping-bag-icon" />
            <div className="h1">Your Order</div>
        </div>
    );

    const restaurantOrderType = (
        <div className="checkout-order-type mb-2">
            <div className="h3">Order Type: {orderType}</div>
            <Link onClick={onUpdateOrderType}>Change</Link>
        </div>
    );

    const promotionInformation = (
        <>
            {promotion && (
                <div className="checkout-promotion-information mb-2 pt-3 pr-3 pb-4 pl-3">
                    <div>
                        <div className="checkout-promotion-information-heading h3 mb-1">
                            <div>Promotion Applied!</div>
                            <div>-${convertCentsToDollars(promotion.discountedAmount)}</div>
                        </div>
                        {promotion.promotion.type !== EPromotionType.ENTIREORDER ? (
                            <div>
                                {promotion.promotion.name}:{" "}
                                {Object.values(promotion.matchingProducts).map((p, index) => (
                                    <>
                                        {index !== 0 && ", "}
                                        {p.name}
                                    </>
                                ))}
                            </div>
                        ) : (
                            <div>Entire Order</div>
                        )}
                    </div>
                </div>
            )}
        </>
    );

    const restaurantTableNumber = (
        <div className="checkout-table-number">
            <div className="h3">Table Number: {tableNumber}</div>
            <Link onClick={onUpdateTableNumber}>Change</Link>
        </div>
    );

    const restaurantNotes = (
        <>
            <div className="h2 mb-3">Special Instructions</div>
            <TextArea placeholder={"Leave a note for the restaurant"} value={notes} onChange={onNotesChange} />
        </>
    );

    const order = (
        <>
            <div className="mt-10"></div>
            {title}
            {restaurantOrderType}
            {promotionInformation}
            {tableNumber && <div className="mb-4">{restaurantTableNumber}</div>}
            <div className="separator-6"></div>
            {orderSummary}
            {restaurantNotes}
        </>
    );

    const onRemoveUserAppliedPromotionCode = () => {
        removeUserAppliedPromotion();
    };

    const checkoutFooter = (
        <div>
            {promotion && (
                <div className="h3 text-center mb-2">
                    {`Discount${promotion.promotion.code ? ` (${promotion.promotion.code})` : ""}: -$${convertCentsToDollars(
                        promotion.discountedAmount
                    )}`}{" "}
                    {userAppliedPromotionCode && <Link onClick={onRemoveUserAppliedPromotionCode}>Remove</Link>}
                </div>
            )}
            <div className="h1 text-center mb-4">Total: ${convertCentsToDollars(subTotal)}</div>
            <div className="mb-4">
                <div className="checkout-buttons-container">
                    <Button onClick={onOrderMore} className="button large mr-3 order-more-button">
                        Order More
                    </Button>
                    <Button onClick={onClickOrderButton} className="button large complete-order-button">
                        Complete Order
                    </Button>
                    {register.enableCashPayments && (
                        <Button onClick={onClickCashPayment} className="button large ml-3 complete-order-button">
                            Cash Payment
                        </Button>
                    )}
                </div>
                {register.enablePayLater && (
                    <div className="pay-later-link mt-4">
                        <Link onClick={onClickPayLater}>Pay cash at counter...</Link>
                    </div>
                )}
                {/* <div className="pay-later-link mt-4">
                    <Link onClick={onClickApplyPromotionCode}>Apply promo code</Link>
                </div> */}
            </div>
            <Button className="cancel-button" onClick={onCancelOrder}>
                Cancel Order
            </Button>
        </div>
    );

    return (
        <>
            <PageWrapper>
                <div className="checkout">
                    <div className="order-wrapper">
                        <div className="order">
                            {(!products || products.length == 0) && cartEmptyDisplay}
                            {products && products.length > 0 && order}
                        </div>
                    </div>
                    {products && products.length > 0 && <div className="footer">{checkoutFooter}</div>}
                </div>
                {modalsAndSpinners}
            </PageWrapper>
        </>
    );
};

const OrderSummary = (props: {
    onEditProduct: (product: ICartProduct, displayOrder: number) => void;
    onRemoveProduct: (displayOrder: number) => void;
    onUpdateProductQuantity: (displayOrder: number, productQuantity: number) => void;
    onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) => {
    // context
    const { products } = useCart();

    // displays
    if (!products || products == []) {
        return (
            <>
                <h1>No items in cart!</h1>
            </>
        );
    }

    const orderItems = (
        <>
            {products &&
                products.map((product, index) => {
                    // using index as key because products can be duplicated
                    if (product) {
                        return (
                            <div key={index}>
                                <OrderItem
                                    product={product}
                                    displayOrder={index}
                                    onEditProduct={props.onEditProduct}
                                    onUpdateProductQuantity={props.onUpdateProductQuantity}
                                    onRemoveProduct={props.onRemoveProduct}
                                />
                                <div className="separator-6"></div>
                            </div>
                        );
                    }
                })}
        </>
    );

    return <>{orderItems}</>;
};

const OrderItem = (props: {
    product: ICartProduct;
    displayOrder: number;
    onEditProduct: (product: ICartProduct, displayOrder: number) => void;
    onUpdateProductQuantity: (displayOrder: number, productQuantity: number) => void;
    onRemoveProduct: (displayOrder: number) => void;
}) => {
    // constants
    let itemPrice = props.product.price * props.product.quantity;

    props.product.modifierGroups.forEach((mg) => {
        mg.modifiers.forEach((m) => {
            const changedQuantity = m.quantity - m.preSelectedQuantity;

            if (changedQuantity > 0) {
                itemPrice += m.price * changedQuantity * props.product.quantity;
            }
        });
    });

    // displays
    const quantity = (
        <Stepper
            count={props.product.quantity}
            min={1}
            onUpdate={(count: number) => props.onUpdateProductQuantity(props.displayOrder, count)}
            size={32}
        />
    );

    return (
        <>
            <div className="order-item">
                {quantity}
                <OrderItemDetails
                    name={props.product.name}
                    notes={props.product.notes}
                    modifierGroups={props.product.modifierGroups}
                    onEditProduct={() => props.onEditProduct(props.product, props.displayOrder)}
                />
                <div className="text-center">
                    <div className="h2 text-primary mb-2">${convertCentsToDollars(itemPrice)}</div>
                    <Button className="remove-button" onClick={() => props.onRemoveProduct(props.displayOrder)}>
                        Remove
                    </Button>
                </div>
            </div>
        </>
    );
};

const OrderItemDetails = (props: { name: string; notes: string | null; modifierGroups: ICartModifierGroup[]; onEditProduct: () => void }) => {
    // functions
    const modifierString = (preSelectedQuantity: number, quantity: number, name: string, price: number) => {
        const changedQuantity = quantity - preSelectedQuantity;
        let mStr = "";

        if (changedQuantity < 0 && Math.abs(changedQuantity) == preSelectedQuantity) {
            mStr = `(REMOVE) ${changedQuantity > 1 ? `${Math.abs(changedQuantity)} x ` : ""}${name}`;
        } else {
            mStr = `${quantity > 1 ? `${Math.abs(quantity)} x ` : ""}${name}`;
        }

        if (price > 0 && changedQuantity > 0) {
            mStr += ` ($${convertCentsToDollars(price)})`;
        }

        return mStr;
    };

    const editButton = (
        <>
            <Button className="edit-button" onClick={() => props.onEditProduct()}>
                Edit
            </Button>
        </>
    );

    const nameDisplay = (
        <div className="name-edit-button">
            <div className="h2 mr-2">{props.name}</div> {editButton}
        </div>
    );

    const modifiersDisplay = (
        <>
            {props.modifierGroups.map((mg, index) => (
                <>
                    {!mg.hideForCustomer && (
                        <>
                            <div className="text-bold mt-3" key={mg.id}>
                                {mg.name}
                            </div>
                            {mg.modifiers.map((m) => (
                                <div key={m.id} className="mt-1">
                                    {modifierString(m.preSelectedQuantity, m.quantity, m.name, m.price)}
                                </div>
                            ))}
                        </>
                    )}
                </>
            ))}
        </>
    );

    const notesDisplay = <>{props.notes && <div className="text-grey">Notes: {props.notes}</div>}</>;

    return (
        <div className="detail">
            {nameDisplay}
            {modifiersDisplay}
            {notesDisplay}
        </div>
    );
};
