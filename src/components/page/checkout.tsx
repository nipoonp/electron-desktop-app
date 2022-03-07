import { useState, useEffect, useRef } from "react";
import { Logger } from "aws-amplify";
import { useCart } from "../../context/cart-context";
import { useNavigate } from "react-router-dom";
import { convertCentsToDollars, convertProductTypesForPrint, filterPrintProducts, getOrderNumber } from "../../util/util";
import { useMutation } from "@apollo/client";
import { CREATE_ORDER } from "../../graphql/customMutations";
import { IGET_RESTAURANT_CATEGORY, IGET_RESTAURANT_PRODUCT, EPromotionType, ERegisterType } from "../../graphql/customQueries";
import { restaurantPath, beginOrderPath, tableNumberPath, orderTypePath } from "../main";
import { ShoppingBasketIcon } from "../../tabin/components/icons/shoppingBasketIcon";
import { ProductModal } from "../modals/product";
import {
    ICartProduct,
    IPreSelectedModifiers,
    IMatchingUpSellCrossSellProductItem,
    IMatchingUpSellCrossSellCategoryItem,
    EEftposTransactionOutcome,
    IEftposTransactionOutcome,
    EPaymentModalState,
    EEftposProvider,
    ICartPaymentAmounts,
    ICartPayment,
} from "../../model/model";
import { useUser } from "../../context/user-context";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { useSmartpay } from "../../context/smartpay-context";
import { Button } from "../../tabin/components/button";
import { ItemAddedUpdatedModal } from "../modals/itemAddedUpdatedModal";
import { useVerifone } from "../../context/verifone-context";
import { useRegister } from "../../context/register-context";
import { useReceiptPrinter } from "../../context/receiptPrinter-context";
import { getPublicCloudFrontDomainName } from "../../private/aws-custom";
import { toLocalISOString } from "../../util/util";
import { useRestaurant } from "../../context/restaurant-context";
import { UpSellProductModal } from "../modals/upSellProduct";
import { Link } from "../../tabin/components/link";
import { TextArea } from "../../tabin/components/textArea";
import { useWindcave } from "../../context/windcave-context";
import { CachedImage } from "../../tabin/components/cachedImage";
import { UpSellCategoryModal } from "../modals/upSellCategory";
import { useErrorLogging } from "../../context/errorLogging-context";
import { PromotionCodeModal } from "../modals/promotionCodeModal";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../../graphql/customFragments";
import { OrderSummary } from "./checkout/orderSummary";
import { PaymentModal } from "../modals/paymentModal";
import { useAlert } from "../../tabin/components/alert";

import "./checkout.scss";

const logger = new Logger("checkout");

// Component
export const Checkout = () => {
    // context
    const navigate = useNavigate();
    const { showAlert } = useAlert();
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
        transactionEftposReceipts,
        setTransactionEftposReceipts,
        paymentAmounts,
        setPaymentAmounts,
        payments,
        setPayments,
        updateProduct,
        updateProductQuantity,
        applyProductDiscount,
        deleteProduct,
        addProduct,
        userAppliedPromotionCode,
        removeUserAppliedPromotion,
    } = useCart();
    const { restaurant } = useRestaurant();
    const { register, isPOS } = useRegister();
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

    const [paymentModalState, setPaymentModalState] = useState<EPaymentModalState>(EPaymentModalState.None);

    const [eftposTransactionOutcome, setEftposTransactionOutcome] = useState<IEftposTransactionOutcome | null>(null);
    const [cashTransactionChangeAmount, setCashTransactionChangeAmount] = useState<number | null>(null);

    const [createOrderError, setCreateOrderError] = useState<string | null>(null);
    const [paymentOutcomeOrderNumber, setPaymentOutcomeOrderNumber] = useState<string | null>(null);
    const [paymentOutcomeApprovedRedirectTimeLeft, setPaymentOutcomeApprovedRedirectTimeLeft] = useState(10);

    const [showPromotionCodeModal, setShowPromotionCodeModal] = useState(false);
    const [showUpSellCategoryModal, setShowUpSellCategoryModal] = useState(false);
    const [showUpSellProductModal, setShowUpSellProductModal] = useState(false);

    const transactionCompleteTimeoutIntervalId = useRef<NodeJS.Timer | undefined>();

    const paidSoFar = paymentAmounts.cash + paymentAmounts.eftpos;

    // const isUserFocusedOnEmailAddressInput = useRef(false);

    useEffect(() => {
        setTimeout(() => {
            setShowUpSellCategoryModal(true);
        }, 1000);
    }, []);

    if (!register) throw "Register is not valid";
    if (!restaurant) navigate(beginOrderPath);
    if (!restaurant) throw "Restaurant is invalid";

    const onCancelOrder = () => {
        const cancelOrder = () => {
            clearCart();
            navigate(beginOrderPath);
        };

        if (payments.length > 0) {
            showAlert(
                "Incomplete Payments",
                "There have been partial payments made on this order. Are you sure you would like to cancel this order?",
                () => {},
                () => {
                    cancelOrder();
                }
            );
        } else {
            cancelOrder();
        }
    };

    // Modal callbacks
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

    // Callbacks
    const onUpdateTableNumber = () => {
        navigate(tableNumberPath);
    };

    const onUpdateOrderType = () => {
        navigate(orderTypePath);
    };

    const onNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
    };

    const onAddProduct = (product: ICartProduct) => {
        addProduct(product);
    };

    const onSelectUpSellCrossSellCategory = (category: IGET_RESTAURANT_CATEGORY) => {
        navigate(`${restaurantPath}/${restaurant.id}/${category.id}`);
    };

    const onSelectUpSellCrossSellProduct = (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => {
        if (product.modifierGroups && product.modifierGroups.items.length > 0) {
            setSelectedCategoryForProductModal(category);
            setSelectedProductForProductModal(product);

            setShowProductModal(true);
        } else {
            addProduct({
                id: product.id,
                name: product.name,
                price: product.price,
                totalPrice: product.price,
                discount: 0,
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
        updateProductQuantity(displayOrder, productQuantity);
    };

    const onApplyProductDiscount = (displayOrder: number, discount: number) => {
        applyProductDiscount(displayOrder, discount);
    };

    const onRemoveProduct = (displayOrder: number) => {
        deleteProduct(displayOrder);
    };

    const onClickOrderButton = async () => {
        setShowPaymentModal(true);

        if (isPOS) {
            setPaymentModalState(EPaymentModalState.POSScreen);
        } else {
            await onConfirmTotalOrRetryEftposTransaction(subTotal);
        }
    };

    const onClosePaymentModal = () => {
        setShowPaymentModal(false);
    };

    const onCancelPayment = () => {
        if (isPOS) {
            setPaymentModalState(EPaymentModalState.POSScreen);
        } else {
            onClosePaymentModal();
        }
    };

    const beginTransactionCompleteTimeout = () => {
        let timeLeft = 10;

        transactionCompleteTimeoutIntervalId.current = setInterval(() => {
            setPaymentOutcomeApprovedRedirectTimeLeft((prevPaymentOutcomeApprovedRedirectTimeLeft) => prevPaymentOutcomeApprovedRedirectTimeLeft - 1);
            timeLeft = timeLeft - 1;

            if (timeLeft == 0) {
                transactionCompleteTimeoutIntervalId.current && clearInterval(transactionCompleteTimeoutIntervalId.current);

                navigate(beginOrderPath);
                //     if (isPOS) {
                //     navigate(restaurantPath + "/" + restaurant.id);
                // } else {
                //     navigate(beginOrderPath);
                // }
                clearCart();
            }
        }, 1000);
    };

    const clearTransactionCompleteTimeout = () => {
        transactionCompleteTimeoutIntervalId.current && clearInterval(transactionCompleteTimeoutIntervalId.current);
        navigate(beginOrderPath);
        //     if (isPOS) {
        //     navigate(restaurantPath + "/" + restaurant.id);
        // } else {
        //     navigate(beginOrderPath);
        // }
        clearCart();
    };

    const printReceipts = (order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
        register.printers &&
            register.printers.items.forEach(async (printer) => {
                const productsToPrint = filterPrintProducts(order.products, printer);

                if (productsToPrint.length > 0) {
                    await printReceipt({
                        orderId: order.id,
                        printerType: printer.type,
                        printerAddress: printer.address,
                        customerPrinter: printer.customerPrinter,
                        kitchenPrinter: printer.kitchenPrinter,
                        hideModifierGroupsForCustomer: false,
                        restaurant: {
                            name: restaurant.name,
                            address: `${restaurant.address.aptSuite || ""} ${restaurant.address.formattedAddress || ""}`,
                            gstNumber: restaurant.gstNumber,
                        },
                        customerInformation: null,
                        notes: order.notes,
                        products: convertProductTypesForPrint(productsToPrint),
                        eftposReceipt: order.eftposReceipt,
                        paymentAmounts: order.paymentAmounts,
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
            });
    };

    const onSubmitOrder = async (paid: boolean, newPaymentAmounts: ICartPaymentAmounts, newPayments: ICartPayment[]) => {
        const orderNumber = getOrderNumber(register.orderNumberSuffix);

        setPaymentOutcomeOrderNumber(orderNumber);

        try {
            const newOrder: IGET_RESTAURANT_ORDER_FRAGMENT = await createOrder(orderNumber, paid, newPaymentAmounts, newPayments);

            if (register.printers && register.printers.items.length > 0) {
                await printReceipts(newOrder);
            }
        } catch (e) {
            throw e.message;
        }
    };

    // Submit callback
    const createOrder = async (
        orderNumber: string,
        paid: boolean,
        newPaymentAmounts: ICartPaymentAmounts,
        newPayments: ICartPayment[]
    ): Promise<IGET_RESTAURANT_ORDER_FRAGMENT> => {
        const now = new Date();

        if (!user) {
            await logError("Invalid user", JSON.stringify({ user: user }));
            throw "Invalid user";
        }

        if (register.availableOrderTypes.length === 0) {
            await logError("Invalid available order types", JSON.stringify({ register: register }));
            throw "Invalid available order types";
        }

        if (!restaurant) {
            await logError("Invalid restaurant", JSON.stringify({ restaurant: restaurant }));
            throw "Invalid restaurant";
        }

        if (!products || products.length == 0) {
            await logError("No products have been selected", JSON.stringify({ products: products }));
            throw "No products have been selected";
        }

        let variables;

        try {
            variables = {
                status: "NEW",
                paid: paid,
                type: orderType ? orderType : register.availableOrderTypes[0],
                number: orderNumber,
                table: tableNumber,
                notes: notes,
                eftposReceipt: transactionEftposReceipts,
                paymentAmounts: newPaymentAmounts,
                payments: newPayments,
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
                // variables.paid = true; //Comment out because if you set paid = true then "Payment Required" does not come up on the receipt.
            }
        } catch (e) {
            await logError(
                "Error in createOrderMutation input",
                JSON.stringify({
                    status: "NEW",
                    paid: paid,
                    type: orderType,
                    number: orderNumber,
                    table: tableNumber,
                    notes: notes,
                    eftposReceipt: transactionEftposReceipts,
                    payments: payments,
                    paymentAmounts: paymentAmounts,
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
            const res: any = await createOrderMutation({
                variables: variables,
            });

            console.log("process order mutation result: ", res);

            return res.data.createOrder;
        } catch (e) {
            console.log("process order mutation error: ", e);

            await logError(e, JSON.stringify({ error: e, variables: variables }));
            throw e;
        }
    };

    const performEftposTransaction = async (amount: number): Promise<IEftposTransactionOutcome> => {
        try {
            let outcome: IEftposTransactionOutcome | null = null;

            if (register.eftposProvider == EEftposProvider.SMARTPAY) {
                let delayedShown = false;

                const delayed = (outcome: IEftposTransactionOutcome) => {
                    // if (!delayedShown) {
                    //     delayedShown = true;
                    //     // Might want to let the user know to check if everything is ok with the device
                    //     setEftposTransactionOutcome(outcome);
                    // }
                };

                const pollingUrl = await smartpayCreateTransaction(amount, "Card.Purchase");
                outcome = await smartpayPollForOutcome(pollingUrl, delayed);
            } else if (register.eftposProvider == EEftposProvider.WINDCAVE) {
                const txnRef = await windcaveCreateTransaction(
                    register.windcaveStationId,
                    register.windcaveStationUser,
                    register.windcaveStationKey,
                    amount,
                    "Purchase"
                );
                outcome = await windcavePollForOutcome(register.windcaveStationId, register.windcaveStationUser, register.windcaveStationKey, txnRef);
            } else if (register.eftposProvider == EEftposProvider.VERIFONE) {
                outcome = await verifoneCreateTransaction(amount, register.eftposIpAddress, register.eftposPortNumber, restaurant.id);
            }

            if (!outcome) throw "Invalid Eftpos Transaction outcome.";

            return outcome;
        } catch (errorMessage) {
            return {
                platformTransactionOutcome: null,
                transactionOutcome: EEftposTransactionOutcome.Fail,
                message: errorMessage,
                eftposReceipt: null,
            };
        }
    };

    const onUpdateProduct = (index: number, product: ICartProduct) => {
        updateProduct(index, product);
        setShowItemUpdatedModal(true);
    };

    const onClickApplyPromotionCode = async () => {
        setShowPromotionCodeModal(true);
    };

    const onConfirmTotalOrRetryEftposTransaction = async (amount: number) => {
        setPaymentModalState(EPaymentModalState.AwaitingCard);

        const outcome = await performEftposTransaction(amount);

        setEftposTransactionOutcome(outcome);
        setPaymentModalState(EPaymentModalState.EftposResult);

        if (outcome.eftposReceipt) setTransactionEftposReceipts(transactionEftposReceipts + "\n" + outcome.eftposReceipt);

        //If paid for everything
        if (outcome.transactionOutcome == EEftposTransactionOutcome.Success) {
            try {
                const newEftposPaymentAmounts = paymentAmounts.eftpos + amount;
                const newTotalPaymentAmounts = newEftposPaymentAmounts + paymentAmounts.cash;

                const newPaymentAmounts: ICartPaymentAmounts = { ...paymentAmounts, eftpos: newEftposPaymentAmounts };
                const newPayments: ICartPayment[] = [...payments, { type: register.eftposProvider, amount: amount }];

                setPaymentAmounts(newPaymentAmounts);
                setPayments(newPayments);

                if (newTotalPaymentAmounts >= subTotal) {
                    beginTransactionCompleteTimeout();

                    //Passing paymentAmounts, payments via params so we send the most updated values
                    await onSubmitOrder(true, newPaymentAmounts, newPayments);
                }
            } catch (e) {
                setCreateOrderError(e);
            }
        }
    };

    const calculateCashChangeAmount = (totalCashAmount: number, subTotal: number): number => {
        const netAmount = totalCashAmount - subTotal;
        const floorToNearestTen = Math.floor(netAmount / 10) * 10; //Floor to nearest 10.

        return floorToNearestTen;
    };

    const onConfirmCashTransaction = async (amount: number) => {
        try {
            const newCashPaymentAmounts = paymentAmounts.cash + amount;
            const newTotalPaymentAmounts = newCashPaymentAmounts + paymentAmounts.eftpos;

            const newPaymentAmounts: ICartPaymentAmounts = {
                ...paymentAmounts,
                cash: newTotalPaymentAmounts >= subTotal ? subTotal : newCashPaymentAmounts, //Cannot pay more than subTotal amount
            };
            const newPayments: ICartPayment[] = [...payments, { type: "CASH", amount: amount }];

            setPaymentAmounts(newPaymentAmounts);
            setPayments(newPayments);

            //If paid for everything
            if (newTotalPaymentAmounts >= subTotal) {
                const changeAmount = calculateCashChangeAmount(newTotalPaymentAmounts, subTotal);

                setPaymentModalState(EPaymentModalState.CashResult);
                setCashTransactionChangeAmount(changeAmount);

                beginTransactionCompleteTimeout();

                //Passing paymentAmounts, payments via params so we send the most updated values
                await onSubmitOrder(true, newPaymentAmounts, newPayments);
            }
        } catch (e) {
            setCreateOrderError(e);
        }
    };

    const onContinueToNextOrder = () => {
        clearTransactionCompleteTimeout();
    };

    const onContinueToNextPayment = () => {
        setPaymentModalState(EPaymentModalState.POSScreen);
    };

    const onClickPayLater = async () => {
        setShowPaymentModal(true);

        const newPaymentAmounts: ICartPaymentAmounts = { cash: 0, eftpos: 0, online: 0 };
        const newPayments: ICartPayment[] = [];

        setPaymentModalState(EPaymentModalState.PayLater);

        beginTransactionCompleteTimeout();

        try {
            await onSubmitOrder(false, newPaymentAmounts, newPayments);
        } catch (e) {
            setCreateOrderError(e);
        }
    };

    // Modals
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
                if (!category.availablePlatforms.includes(register.type)) return;

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
                if (!category.availablePlatforms.includes(register.type)) return;

                category.products &&
                    category.products.items.forEach((p) => {
                        if (!p.product.availablePlatforms.includes(register.type)) return;

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

    const editProductModal = () => {
        let category: IGET_RESTAURANT_CATEGORY | null = null;
        let product: IGET_RESTAURANT_PRODUCT | null = null;

        if (!productToEdit) {
            return <></>;
        }

        restaurant.categories.items.forEach((c) => {
            if (productToEdit.product.category && productToEdit.product.category.id === c.id) {
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
                isOpen={showEditProductModal}
                onClose={onCloseEditProductModal}
                category={category}
                product={product}
                onUpdateProduct={onUpdateProduct}
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
                    onClose={onCloseProductModal}
                    category={selectedCategoryForProductModal}
                    product={selectedProductForProductModal}
                    onAddProduct={onAddProduct}
                />
            );
        }
    };

    const itemUpdatedModal = () => {
        return (
            <>
                {showItemUpdatedModal && (
                    <ItemAddedUpdatedModal isOpen={showItemUpdatedModal} onClose={onCloseItemUpdatedModal} isProductUpdate={true} />
                )}
            </>
        );
    };

    const promotionCodeModal = () => {
        return <>{showPromotionCodeModal && <PromotionCodeModal isOpen={showPromotionCodeModal} onClose={onClosePromotionCodeModal} />}</>;
    };

    const paymentModal = () => {
        return (
            <>
                {showPaymentModal && (
                    <PaymentModal
                        isOpen={showPaymentModal}
                        onClose={onClosePaymentModal}
                        paymentModalState={paymentModalState}
                        eftposTransactionOutcome={eftposTransactionOutcome}
                        cashTransactionChangeAmount={cashTransactionChangeAmount}
                        paymentOutcomeOrderNumber={paymentOutcomeOrderNumber}
                        paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                        onContinueToNextOrder={onContinueToNextOrder}
                        createOrderError={createOrderError}
                        onConfirmTotalOrRetryEftposTransaction={onConfirmTotalOrRetryEftposTransaction}
                        onConfirmCashTransaction={onConfirmCashTransaction}
                        onContinueToNextPayment={onContinueToNextPayment}
                        onCancelPayment={onCancelPayment}
                        onCancelOrder={onCancelOrder}
                    />
                )}
            </>
        );
    };

    const modalsAndSpinners = (
        <>
            {/* <FullScreenSpinner show={loading} text={loadingMessage} /> */}

            {upSellCategoryModal()}
            {upSellProductModal()}
            {productModal()}
            {editProductModal()}
            {itemUpdatedModal()}
            {promotionCodeModal()}
            {paymentModal()}
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
                        navigate(restaurantPath + "/" + restaurant!.id);
                    }}
                >
                    Back To Menu
                </Button>
            </div>
        </>
    );

    const onOrderMore = () => {
        navigate(`/restaurant/${restaurant.id}`);
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

    const orderSummary = (
        <OrderSummary
            products={products || []}
            onEditProduct={onEditProduct}
            onUpdateProductQuantity={onUpdateProductQuantity}
            onApplyProductDiscount={onApplyProductDiscount}
            onRemoveProduct={onRemoveProduct}
        />
    );

    const restaurantNotes = (
        <>
            <div className="h2 mb-3">Special Instructions</div>
            <TextArea placeholder={"Leave a note for the restaurant"} value={notes} onChange={onNotesChange} />
        </>
    );

    const order = (
        <>
            <div className={isPOS ? "mt-4" : "mt-10"}></div>
            {title}
            {register && register.availableOrderTypes.length > 1 && restaurantOrderType}
            {promotionInformation}
            {tableNumber && <div className="mb-4">{restaurantTableNumber}</div>}
            <div className="separator-6"></div>
            {orderSummary}
            {restaurantNotes}
            <div className={isPOS ? "mb-4" : "mb-10"}></div>
        </>
    );

    const checkoutFooter = (
        <div>
            {promotion && (
                <div className="h3 text-center mb-2">
                    {`Discount${promotion.promotion.code ? ` (${promotion.promotion.code})` : ""}: -$${convertCentsToDollars(
                        promotion.discountedAmount
                    )}`}{" "}
                    {userAppliedPromotionCode && <Link onClick={removeUserAppliedPromotion}>Remove</Link>}
                </div>
            )}
            {paidSoFar > 0 && <div className="h3 text-center mb-2">Paid So Far: ${convertCentsToDollars(paidSoFar)}</div>}
            <div className={`h1 text-center ${isPOS ? "mb-2" : "mb-4"}`}>Total: ${convertCentsToDollars(subTotal)}</div>
            <div className={`${isPOS ? "mb-0" : "mb-4"}`}>
                <div className="checkout-buttons-container">
                    {!isPOS && (
                        <Button onClick={onOrderMore} className="button large mr-3 order-more-button">
                            Order More
                        </Button>
                    )}
                    <Button onClick={onClickOrderButton} className="button large complete-order-button">
                        Complete Order
                    </Button>
                </div>
                {payments.length == 0 && register.enablePayLater && (
                    <div className={`pay-later-link ${isPOS ? "mt-3" : "mt-4"}`}>
                        <Link onClick={onClickPayLater}>Pay cash at counter...</Link>
                    </div>
                )}
                <div className={`apply-promo-code-link ${isPOS ? "mt-3" : "mt-4"}`}>
                    <Link onClick={onClickApplyPromotionCode}>Apply promo code</Link>
                </div>
            </div>
            {!isPOS && (
                <Button className="cancel-button" onClick={onCancelOrder}>
                    Cancel Order
                </Button>
            )}
        </div>
    );

    return (
        <>
            <PageWrapper>
                <div className="checkout">
                    <div className="order-wrapper">
                        <div className={`order ${isPOS ? "mr-4 ml-4" : "mr-10 ml-10"}`}>
                            {(!products || products.length == 0) && cartEmptyDisplay}
                            {products && products.length > 0 && order}
                        </div>
                    </div>
                    {products && products.length > 0 && <div className="footer p-4">{checkoutFooter}</div>}
                </div>
                {modalsAndSpinners}
            </PageWrapper>
        </>
    );
};
