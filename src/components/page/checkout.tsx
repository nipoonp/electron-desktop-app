import React, { useState, useEffect, useRef } from "react";
import { Logger } from "aws-amplify";
import { useCart } from "../../context/cart-context";
import { useHistory } from "react-router-dom";
import { Space, Space2, Space3, Space4, Space1, Space6 } from "../../tabin/components/spaces";
import { Title3Font, NormalFont, Title2Font, BoldFont, Title1Font, Title4Font } from "../../tabin/components/fonts";
import { GrayColor, PrimaryColor } from "../../tabin/components/colors";
import { convertCentsToDollars } from "../../util/moneyConversion";
import { useMutation } from "react-apollo-hooks";
import { CREATE_ORDER } from "../../graphql/customMutations";
import { IGET_RESTAURANT_REGISTER_PRINTER, IGET_RESTAURANT_CATEGORY, IGET_RESTAURANT_PRODUCT } from "../../graphql/customQueries";
import { restaurantPath, beginOrderPath, tableNumberPath, orderTypePath } from "../main";
import { ShoppingBasketIcon } from "../../tabin/components/shoppingBasketIcon";
import { ProductModal } from "../modals/product";
import { ICartProduct, ISelectedProductModifiers, ICartModifierGroup, EOrderType } from "../../model/model";
import { Separator6 } from "../../tabin/components/separator";
import { useUser } from "../../context/user-context";
import { format } from "date-fns";
import { KioskPageWrapper } from "../../tabin/components/kioskPageWrapper";
import { useSmartpay, SmartpayTransactionOutcome } from "../../context/smartpay-context";
import { KioskModal } from "../../tabin/components/kioskModal";
import { KioskButton } from "../../tabin/components/kioskButton";
import { ItemAddedUpdatedModal } from "../modals/itemAddedUpdatedModal";
import { SizedBox } from "../../tabin/components/sizedBox";
import { KioskStepper } from "../../tabin/components/kioskStepper";
import { useVerifone, VerifoneTransactionOutcome } from "../../context/verifone-context";
import { useRegister } from "../../context/register-context";
import { useReceiptPrinter } from "../../context/receiptPrinter-context";
import { TextAreaV2 } from "../../tabin/components/textAreav2";
import { getPublicCloudFrontDomainName } from "../../private/aws-custom";
import { toast } from "../../tabin/components/toast";
import { toLocalISOString } from "../../util/dateTime";
import { useRestaurant } from "../../context/restaurant-context";

import "./checkout.scss";
import { KioskLink } from "../../tabin/components/kioskLink";

const logger = new Logger("checkout");

enum CheckoutTransactionOutcome {
    PayLater,
    Success,
    Delay,
    Fail,
}

// Component
export const Checkout = () => {
    // context
    const history = useHistory();
    const { orderType, products, notes, setNotes, tableNumber, clearCart, total, updateItem, updateItemQuantity, deleteItem } = useCart();
    const { restaurant } = useRestaurant();
    const { printReceipt } = useReceiptPrinter();
    const { user } = useUser();
    const { createTransaction: smartpayCreateTransaction, pollForOutcome: smartpayPollForOutcome } = useSmartpay();
    const { createTransaction: verifoneCreateTransaction } = useVerifone();

    const createOrderMutation = useMutation(CREATE_ORDER, {
        update: (proxy, mutationResult) => {
            logger.debug("mutation result: ", mutationResult);
        },
    });

    // state
    const [productToEdit, setProductToEdit] = useState<{
        product: ICartProduct;
        displayOrder: number;
    } | null>(null);
    const [showEditProductModal, setShowEditProductModal] = useState(false);
    const [showItemUpdatedModal, setShowItemUpdatedModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentOutcome, setPaymentOutcome] = useState<CheckoutTransactionOutcome | null>(null);
    const [paymentOutcomeErrorMessage, setPaymentOutcomeErrorMessage] = useState<string | null>(null);
    const [paymentOutcomeDelayedOrderNumber, setPaymentOutcomeDelayedOrderNumber] = useState<string | null>(null);
    const [paymentOutcomeApprovedRedirectTimeLeft, setPaymentOutcomeApprovedRedirectTimeLeft] = useState(10);
    const [createOrderError, setCreateOrderError] = useState<string | null>(null);

    // const isUserFocusedOnEmailAddressInput = useRef(false);

    const { register } = useRegister();

    if (!register) {
        throw "Register is not valid";
    }

    useEffect(() => {
        if (showEditProductModal || showPaymentModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [showEditProductModal, showPaymentModal]);

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
    const onAddItem = () => {
        if (!restaurant) {
            throw "Cart restaurant is null!";
        }

        logger.debug("Routing to ", restaurantPath + "/" + restaurant.id);
        history.push(restaurantPath + "/" + restaurant.id);
    };

    const onUpdateTableNumber = () => {
        history.push(tableNumberPath);
    };

    const onUpdateOrderType = () => {
        history.push(orderTypePath);
    };

    const onCloseEditProductModal = () => {
        setProductToEdit(null);
        setShowEditProductModal(false);
    };

    const onCloseItemUpdatedModal = () => {
        setShowItemUpdatedModal(false);
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
    const createOrder = async (paid: boolean, orderNumber: string) => {
        if (!user) {
            throw "Invalid user";
        }

        if (!orderType) {
            throw "Invalid order type";
        }

        if (!restaurant) {
            throw "Invalid restaurant";
        }

        if (!products || products.length == 0) {
            throw "No products have been selected";
        }

        try {
            const variables = {
                status: "NEW",
                paid: paid,
                type: orderType,
                number: orderNumber,
                table: tableNumber,
                notes: notes,
                total: total,
                registerId: register.id,
                products: JSON.parse(JSON.stringify(products)) as ICartProduct[], // copy obj so we can mutate it later
                placedAt: toLocalISOString(new Date()),
                placedAtUtc: new Date().toISOString(),
                orderUserId: user.id,
                orderRestaurantId: restaurant.id,
            };

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
            throw e;
        }
    };

    const orderSummary = (
        <OrderSummary
            onAddItem={onAddItem}
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

    const printReceipts = (orderNumber: string, paid: boolean, eftposReceipt?: string) => {
        if (!products || products.length == 0) {
            return;
        }

        register.printers &&
            register.printers.items.forEach((printer) => {
                const productsToPrint = filterPrintProducts(products, printer);

                if (productsToPrint.length > 0) {
                    printReceipt({
                        printerAddress: printer.address,
                        kitchenPrinter: printer.kitchenPrinter,
                        eftposReceipt: eftposReceipt,
                        hideModifierGroupsForCustomer: true,
                        restaurant: {
                            name: restaurant.name,
                            address: `${restaurant.address.aptSuite || ""} ${restaurant.address.formattedAddress || ""}`,
                        },
                        notes: notes,
                        products: productsToPrint,
                        total: total,
                        paid: paid,
                        type: orderType || EOrderType.TAKEAWAY,
                        number: orderNumber,
                        table: tableNumber,
                    });
                }
            });
    };

    const onSubmitOrder = async (paid: boolean, eftposReceipt?: string) => {
        const orderNumber = getOrderNumber();
        setPaymentOutcomeDelayedOrderNumber(orderNumber);

        try {
            if (register.printers && register.printers.items.length > 0) {
                printReceipts(orderNumber, paid, eftposReceipt);
            }

            await createOrder(paid, orderNumber);
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
            let pollingUrl = await smartpayCreateTransaction(total, "Card.Purchase");

            let transactionOutcome: SmartpayTransactionOutcome = await smartpayPollForOutcome(pollingUrl, delayed);

            if (transactionOutcome == SmartpayTransactionOutcome.Accepted) {
                setPaymentOutcome(CheckoutTransactionOutcome.Success);

                try {
                    await onSubmitOrder(true);
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

    const doTransactionVerifone = async () => {
        try {
            const { transactionOutcome, eftposReceipt } = await verifoneCreateTransaction(
                total,
                register.eftposIpAddress,
                register.eftposPortNumber,
                restaurant.id
            );

            if (transactionOutcome == VerifoneTransactionOutcome.Approved) {
                setPaymentOutcome(CheckoutTransactionOutcome.Success);

                try {
                    await onSubmitOrder(true, eftposReceipt);
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

        restaurant!.categories.items.forEach((c) => {
            if (c.id == productToEdit.product.category.id) {
                category = c;
            }

            c.products.items.forEach((p) => {
                if (p.product.id == productToEdit.product.id) {
                    product = p.product;
                }
            });
        });

        if (!product || !category) {
            return <></>;
        }

        let orderedModifiers: ISelectedProductModifiers = {};

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
                restaurantIsAcceptingOrders={true}
                restaurantName={"doesn't matter if both restaurantOpen && restaurantIsAcceptingOrders are true"}
                editProduct={{
                    orderedModifiers: orderedModifiers,
                    quantity: productToEdit.product.quantity,
                    notes: productToEdit.product.notes,
                    productCartIndex: productToEdit.displayOrder,
                }}
            />
        );
    };

    const itemUpdatedModal = (
        <>
            {showItemUpdatedModal && <ItemAddedUpdatedModal isOpen={showItemUpdatedModal} onClose={onCloseItemUpdatedModal} isProductUpdate={true} />}
        </>
    );

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
            await onSubmitOrder(false);
        } catch (e) {
            setCreateOrderError(e);
        }
    };

    const retryButtons = () => (
        <>
            <div className="retry-buttons">
                <KioskButton className="mr-3" onClick={onConfirmTotalOrRetryTransaction}>
                    Retry
                </KioskButton>
                <KioskButton className="retry-cancel-button" onClick={onClosePaymentModal}>
                    Cancel
                </KioskButton>
            </div>
        </>
    );

    const awaitingCard = () => (
        <>
            <div className="h4 mb-6 awaiting-card-text">Swipe or insert your card on the terminal to complete your payment.</div>
            <img className="awaiting-card-image" src={`${getPublicCloudFrontDomainName()}/images/awaitingCard.gif`} />
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
                <KioskButton
                    onClick={() => {
                        toast.success("Receipt successfully sent to your email");
                    }}
                    style={{ padding: "12px 24px" }}
                >
                    <NormalFont>Send</NormalFont>
                </KioskButton>
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
            <div className="h1">{paymentOutcomeDelayedOrderNumber}</div>
            <div className="separator-6 mb-6"></div>
            {/* <Title3Font>Would you like to help save the planet? Get a e-receipt.</Title3Font>
            <Space4 />
            <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ flex: 1, paddingRight: "12px", width: "750px", height: "44px" }}>
                    <TextAreaV2 placeholder={"Email Address..."} onChange={onNotesChange} value={notes || ""} onFocus={onFocusEmailAddressInput} />
                </div>
                <KioskButton
                    onClick={() => {
                        toast.success("Receipt successfully sent to your email");
                    }}
                    style={{ padding: "12px 24px" }}
                >
                    <NormalFont>Send</NormalFont>
                </KioskButton>
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
            <KioskButton className="issue-fixed-button" onClick={onCancelOrder}>
                Issue Fixed? Restart
            </KioskButton>
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
            <KioskModal isOpen={showPaymentModal}>
                <div className="payment-modal">{getActivePaymentModalComponent()}</div>
            </KioskModal>
        </>
    );

    const modalsAndSpinners = (
        <>
            {/* <FullScreenSpinner show={loading} text={loadingMessage} /> */}
            {editProductModal()}
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
                <KioskButton
                    onClick={() => {
                        history.push(restaurantPath + "/" + restaurant!.id);
                    }}
                >
                    Back To Menu
                </KioskButton>
            </div>
        </>
    );

    const onOrderMore = () => {
        history.push(`/restaurant/${restaurant.id}`);
    };

    const title = (
        <div className="title mb-6">
            <img className="image mr-2" src={`${getPublicCloudFrontDomainName()}/images/shopping-bag-icon.jpg`} />
            <div className="h1">Your Order</div>
        </div>
    );

    const restaurantOrderType = (
        <div className="order-type mb-2">
            <div className="h3">Order Type: {orderType}</div>
            <KioskLink onClick={onUpdateOrderType}>Change</KioskLink>
        </div>
    );

    const restaurantTableNumber = (
        <div className="table-number">
            <div className="h3">Table Number: {tableNumber}</div>
            <KioskLink onClick={onUpdateTableNumber}>Change</KioskLink>
        </div>
    );

    const restaurantNotes = (
        <>
            <div className="h2 mb-3">Special instructions</div>
            <TextAreaV2 placeholder={"Leave a note for the restaurant"} value={notes} onChange={onNotesChange} />
        </>
    );

    const order = (
        <>
            <div className="mt-10"></div>
            {title}
            {restaurantOrderType}
            {tableNumber && <div className="mb-4">{restaurantTableNumber}</div>}
            <div className="separator-6"></div>
            {orderSummary}
            {restaurantNotes}
        </>
    );

    const checkoutFooter = (
        <div>
            <div className="h1 text-center mb-4">Total: ${convertCentsToDollars(total)}</div>
            <div>
                <div className="checkout-buttons-container">
                    <KioskButton onClick={onOrderMore} className="button large mr-3 order-more-button">
                        Order More
                    </KioskButton>
                    <KioskButton onClick={onClickOrderButton} className="button large complete-order-button">
                        Complete Order
                    </KioskButton>
                </div>
                {register.enablePayLater && (
                    <KioskLink className="pay-later-link mt-4" onClick={onClickPayLater}>
                        Pay at counter...
                    </KioskLink>
                )}
            </div>
            <Space4 />
            <KioskButton className="cancel-button" onClick={onCancelOrder}>
                Cancel Order
            </KioskButton>
        </div>
    );

    return (
        <>
            <KioskPageWrapper>
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
            </KioskPageWrapper>
        </>
    );
};

const OrderSummary = (props: {
    onAddItem: () => void;
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
        <KioskStepper
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
                    <KioskButton className="remove-button" onClick={() => props.onRemoveProduct(props.displayOrder)}>
                        Remove
                    </KioskButton>
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
            <KioskButton className="edit-button" onClick={() => props.onEditProduct()}>
                Edit
            </KioskButton>
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
                            <div className="text-bold mt-1" key={mg.id}>
                                {mg.name}
                            </div>
                            {mg.modifiers.map((m) => (
                                <div key={m.id}>{modifierString(m.preSelectedQuantity, m.quantity, m.name, m.price)}</div>
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
