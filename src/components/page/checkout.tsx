import { useState, useEffect, useRef } from "react";
import { Logger } from "aws-amplify";
import { useCart } from "../../context/cart-context";
import { useNavigate } from "react-router-dom";
import { convertBase64ToFile, convertCentsToDollars, convertProductTypesForPrint, filterPrintProducts, getOrderNumber } from "../../util/util";
import { useMutation } from "@apollo/client";
import { CREATE_ORDER, UPDATE_ORDER } from "../../graphql/customMutations";
import { FiArrowDownCircle } from "react-icons/fi";
import {
    IGET_RESTAURANT_CATEGORY,
    IGET_RESTAURANT_PRODUCT,
    EPromotionType,
    IS3Object,
    IGET_THIRD_PARTY_ORDER_RESPONSE,
    IGET_RESTAURANT_REGISTER_PRINTER,
} from "../../graphql/customQueries";
import {
    restaurantPath,
    beginOrderPath,
    tableNumberPath,
    orderTypePath,
    buzzerNumberPath,
    paymentMethodPath,
    customerInformationPath,
} from "../main";
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
    EReceiptPrinterPrinterType,
    EPaymentMethod,
    EVerifoneTransactionOutcome,
    ERegisterType,
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
import { OrderThresholdMessageModal } from "../modals/orderThresholdMessageModal";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../../graphql/customFragments";
import { OrderSummary } from "./checkout/orderSummary";
import { PaymentModal } from "../modals/paymentModal";
import { useAlert } from "../../tabin/components/alert";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { simpleDateTimeFormatUTC } from "../../util/dateFormat";
import { Storage } from "aws-amplify";
import awsconfig from "../../aws-exports";
import { OrderScheduleDateTime } from "../../tabin/components/orderScheduleDateTime";
import { useGetThirdPartyOrderResponseLazyQuery } from "../../hooks/useGetThirdPartyOrderResponseLazyQuery";

import "./checkout.scss";
import axios from "axios";
import { R18MessageModal } from "../modals/r18MessageModal";
import { useTyro } from "../../context/tyro-context";

const logger = new Logger("checkout");

// Component
export const Checkout = () => {
    // context
    const navigate = useNavigate();
    const { autoClickCompleteOrderOnLoad } = useParams();
    const { showAlert } = useAlert();
    const {
        parkedOrderId,
        parkedOrderNumber,
        orderType,
        products,
        notes,
        buzzerNumber,
        customerInformation,
        paymentMethod,
        setPaymentMethod,
        setNotes,
        tableNumber,
        clearCart,
        promotion,
        total,
        surcharge,
        subTotal,
        paidSoFar,
        orderTypeSurcharge,
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
        isShownUpSellCrossSellModal,
        setIsShownUpSellCrossSellModal,
        isShownOrderThresholdMessageModal,
        setIsShownOrderThresholdMessageModal,
        orderScheduledAt,
        updateOrderScheduledAt,
        orderDetail,
        updateOrderDetail,
    } = useCart();
    const { restaurant, restaurantBase64Logo } = useRestaurant();
    const { register, isPOS } = useRegister();
    const { printReceipt, printLabel } = useReceiptPrinter();
    const { user } = useUser();
    const { logError } = useErrorLogging();

    const { createTransaction: smartpayCreateTransaction, pollForOutcome: smartpayPollForOutcome } = useSmartpay();
    const { createTransaction: verifoneCreateTransaction } = useVerifone();
    const { createTransaction: windcaveCreateTransaction } = useWindcave();
    const { createTransaction: tyroCreateTransaction } = useTyro();
    const [isScrollable, setIsScrollable] = useState(false);
    const [createOrderMutation] = useMutation(CREATE_ORDER, {
        update: (proxy, mutationResult) => {
            logger.debug("create order mutation result: ", mutationResult);
        },
    });

    const [updateOrderMutation] = useMutation(UPDATE_ORDER, {
        update: (proxy, mutationResult) => {
            logger.debug("update order mutation result: ", mutationResult);
        },
    });

    const { getThirdPartyOrderResponse } = useGetThirdPartyOrderResponseLazyQuery();

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

    const [eftposTransactionProcessMessage, setEftposTransactionProcessMessage] = useState<string | null>(null);
    const [eftposTransactionOutcome, setEftposTransactionOutcome] = useState<IEftposTransactionOutcome | null>(null);
    const [cashTransactionChangeAmount, setCashTransactionChangeAmount] = useState<number | null>(null);

    const createdOrder = useRef<IGET_RESTAURANT_ORDER_FRAGMENT | undefined>();

    const [createOrderError, setCreateOrderError] = useState<string | null>(null);
    const [paymentOutcomeOrderNumber, setPaymentOutcomeOrderNumber] = useState<string | null>(null);
    const [paymentOutcomeApprovedRedirectTimeLeft, setPaymentOutcomeApprovedRedirectTimeLeft] = useState(
        restaurant?.delayBetweenOrdersInSeconds || 10
    );
    let transactionCompleteRedirectTime = restaurant?.delayBetweenOrdersInSeconds || 10;

    const [showPromotionCodeModal, setShowPromotionCodeModal] = useState(false);
    const [showUpSellCategoryModal, setShowUpSellCategoryModal] = useState(false);
    const [showUpSellProductModal, setShowUpSellProductModal] = useState(false);
    const [showOrderThresholdMessageModal, setShowOrderThresholdMessageModal] = useState(false);

    const transactionCompleteTimeoutIntervalId = useRef<NodeJS.Timer | undefined>();
    const [showModal, setShowModal] = useState<string>("");

    useEffect(() => {
        const checkDivScrollable = () => {
            const scrollableDiv = document.getElementById("productsWrapperScroll");
            const arrowContainer = document.querySelector(".arrow-container");
            const footer = document.getElementById("footer");
            if (scrollableDiv) {
                const isDivScrollable = scrollableDiv.scrollHeight + (footer?.scrollHeight || 0) > scrollableDiv.clientHeight;
                setIsScrollable(isDivScrollable);
                if (isDivScrollable) {
                    arrowContainer?.classList.remove("fade-out");
                    arrowContainer?.classList.add("fade-in");
                } else {
                    arrowContainer?.classList.remove("fade-in");
                    arrowContainer?.classList.add("fade-out");
                }
            }
        };

        window.addEventListener("resize", checkDivScrollable);

        checkDivScrollable();

        return () => {
            window.removeEventListener("resize", checkDivScrollable);
        };
    }, []);

    const [productsWrapperElement, setProductsWrapperElement] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            const scrollableDiv = document.getElementById("productsWrapperScroll");
            const arrowContainer = document.querySelector(".arrow-container");

            if (scrollableDiv) {
                const isAtBottom = scrollableDiv.scrollTop + scrollableDiv.clientHeight === scrollableDiv.scrollHeight;
                if (!isAtBottom) {
                    arrowContainer?.classList.remove("fade-out");
                    arrowContainer?.classList.add("fade-in");
                } else {
                    arrowContainer?.classList.remove("fade-in");
                    arrowContainer?.classList.add("fade-out");
                }
            }
        };

        const productsWrapperScroll = document.getElementById("productsWrapperScroll");
        if (productsWrapperScroll) {
            productsWrapperScroll.addEventListener("scroll", handleScroll);
            return () => {
                productsWrapperScroll.removeEventListener("scroll", handleScroll);
            };
        }
    }, [productsWrapperElement]);

    useEffect(() => {
        if (autoClickCompleteOrderOnLoad) onClickOrderButton();
        const ageRestrictedProducts = products && products.filter((product) => product.isAgeRescricted).map((product) => product.name);
        if (ageRestrictedProducts && ageRestrictedProducts.length > 0) {
            setShowModal(ageRestrictedProducts.toString());
        } else {
            setShowModal("");
        }
    }, []);

    useEffect(() => {
        if (isShownUpSellCrossSellModal) return;

        setTimeout(() => {
            setShowUpSellProductModal(true);
            setIsShownUpSellCrossSellModal(true);
        }, 1000);
    }, []);

    if (!register) throw "Register is not valid";
    if (!restaurant) navigate(beginOrderPath);
    if (!restaurant) throw "Restaurant is invalid";
    const incrementRedirectTimer = (time: number) => {
        setPaymentOutcomeApprovedRedirectTimeLeft(time);
        transactionCompleteRedirectTime = time;
        beginTransactionCompleteTimeout();
    };

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

    const onCloseOrderThresholdMessageModal = () => {
        setShowOrderThresholdMessageModal(false);
    };
    const onCloseR18MessageModal = () => {
        setShowModal("");
        navigate(beginOrderPath);
        clearCart();
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

    const onUpdateBuzzerNumber = () => {
        navigate(buzzerNumberPath);
    };

    const onUpdateCustomerInformation = () => {
        navigate(customerInformationPath);
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
                kitchenName: product.kitchenName,
                price: product.price,
                totalPrice: product.price,
                discount: 0,
                isAgeRescricted: product.isAgeRescricted,
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
                    kitchenName: category.kitchenName,
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
        if (restaurant.orderThresholds?.enable && restaurant.orderThresholdMessage && !isShownOrderThresholdMessageModal) {
            setShowOrderThresholdMessageModal(true);
            return;
        }

        if (register && register.enableBuzzerNumbers && buzzerNumber === null) {
            navigate(buzzerNumberPath);
            return;
        }

        if (register && register.requestCustomerInformation) {
            let invalid = false;

            if (register.requestCustomerInformation.firstName && (!customerInformation || !customerInformation.firstName)) invalid = true;
            if (register.requestCustomerInformation.email && (!customerInformation || !customerInformation.email)) invalid = true;
            if (register.requestCustomerInformation.phoneNumber && (!customerInformation || !customerInformation.phoneNumber)) invalid = true;
            if (register.requestCustomerInformation.signature && (!customerInformation || !customerInformation.signatureBase64)) invalid = true;
            //    if(register.) orderScheduledAt

            if (invalid) {
                navigate(customerInformationPath);
                return;
            }
        }

        if (!isPOS && register.enableEftposPayments && register.enableCashPayments && paymentMethod === null) {
            navigate(paymentMethodPath);
            return;
        }

        setShowPaymentModal(true);

        if (isPOS) {
            setPaymentModalState(EPaymentModalState.POSScreen);
        } else {
            if ((paymentMethod === null && register.enableEftposPayments) || paymentMethod === EPaymentMethod.EFTPOS) {
                await onConfirmTotalOrRetryEftposTransaction(subTotal);
            } else if ((paymentMethod === null && register.enableCashPayments) || paymentMethod === EPaymentMethod.CASH) {
                await onConfirmCashTransaction(subTotal);
            } else if ((paymentMethod === null && register.enablePayLater) || paymentMethod === EPaymentMethod.LATER) {
                await onClickPayLater();
            }
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
            setPaymentMethod(null);
        }
    };

    const beginTransactionCompleteTimeout = () => {
        clearInterval(transactionCompleteTimeoutIntervalId.current);
        let timeLeft = transactionCompleteRedirectTime;

        transactionCompleteTimeoutIntervalId.current = setInterval(() => {
            setPaymentOutcomeApprovedRedirectTimeLeft((prevPaymentOutcomeApprovedRedirectTimeLeft) => prevPaymentOutcomeApprovedRedirectTimeLeft - 1);
            timeLeft = timeLeft - 1;

            if (timeLeft == 0) {
                //@ts-ignore
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
        //@ts-ignore
        transactionCompleteTimeoutIntervalId.current && clearInterval(transactionCompleteTimeoutIntervalId.current);
        navigate(beginOrderPath);
        //     if (isPOS) {
        //     navigate(restaurantPath + "/" + restaurant.id);
        // } else {
        //     navigate(beginOrderPath);
        // }
        clearCart();
    };

    const sendReceiptPrint = async (order: IGET_RESTAURANT_ORDER_FRAGMENT, printer: IGET_RESTAURANT_REGISTER_PRINTER) => {
        const productsToPrint = filterPrintProducts(order.products, printer);

        if (productsToPrint.length === 0) return;

        if (printer.printerType === EReceiptPrinterPrinterType.LABEL) {
            await printLabel({
                orderId: order.id,
                printerName: printer.name, //For label printer name is important
                printerType: printer.type,
                printerAddress: printer.address,
                products: convertProductTypesForPrint(productsToPrint),
                number: order.number,
                placedAt: format(new Date(order.placedAt), "dd/MM HH:mm"),
            });
        } else {
            //Not checking if its printerType receipt
            await printReceipt({
                orderId: order.id,
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
                printReceiptForEachProduct: printer.printReceiptForEachProduct,
                hideOrderType: register.availableOrderTypes.length === 1, //Don't show order type if only 1 is available
                hideModifierGroupsForCustomer: false,
                restaurant: {
                    name: restaurant.name,
                    address: `${restaurant.address.aptSuite || ""} ${restaurant.address.formattedAddress || ""}`,
                    gstNumber: restaurant.gstNumber,
                },
                restaurantLogoBase64: restaurantBase64Logo,
                customerInformation: customerInformation
                    ? {
                          firstName: customerInformation.firstName,
                          email: customerInformation.email,
                          phoneNumber: customerInformation.phoneNumber,
                          signatureBase64: customerInformation.signatureBase64,
                      }
                    : null,
                notes: order.notes,
                products: convertProductTypesForPrint(productsToPrint),
                eftposReceipt: order.eftposReceipt,
                paymentAmounts: order.paymentAmounts,
                total: order.total,
                discount: order.promotionId && order.discount ? order.discount : null,
                subTotal: order.subTotal,
                paid: order.paid,
                //display payment required message if kiosk and paid cash
                displayPaymentRequiredMessage:
                    !order.paid || (!isPOS && order.paid && order.paymentAmounts && order.paymentAmounts.cash === order.subTotal) ? true : false,
                type: order.type,
                number: order.number,
                table: order.table,
                buzzer: order.buzzer,
                placedAt: order.placedAt,
                orderScheduledAt: order.orderScheduledAt,
                preparationTimeInMinutes: restaurant.preparationTimeInMinutes,
            });
        }
    };

    const printReceipts = (order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
        register.printers &&
            register.printers.items.forEach((printer) => {
                if (printer.customerPrinter === true && register.askToPrintCustomerReceipt === true) return;

                sendReceiptPrint(order, printer);
            });
    };

    const onPrintCustomerReceipt = (order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
        register.printers &&
            register.printers.items.forEach((printer) => {
                if (printer.customerPrinter !== true || register.askToPrintCustomerReceipt !== true) return;

                sendReceiptPrint(order, printer);
            });
    };

    const onPrintParkedOrderReceipts = (order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
        register.printers &&
            register.printers.items.forEach((printer) => {
                sendReceiptPrint(order, printer);
            });
    };

    const onSubmitOrder = async (paid: boolean, parkOrder: boolean, newPaymentAmounts: ICartPaymentAmounts, newPayments: ICartPayment[]) => {
        //If parked order do not generate order number
        let orderNumber =
            parkedOrderId && parkedOrderNumber ? parkedOrderNumber : getOrderNumber(register.orderNumberSuffix, register.orderNumberStart);

        setPaymentOutcomeOrderNumber(orderNumber);

        try {
            let signatureS3Object: IS3Object | null = null;

            if (customerInformation && customerInformation.signatureBase64) {
                const date = simpleDateTimeFormatUTC(new Date());
                const filename = `${date}-signature`;
                const fileExtension = "png";

                const signatureFile = await convertBase64ToFile(
                    customerInformation.signatureBase64,
                    `${filename}.${fileExtension}`,
                    `image/${fileExtension}`
                );

                const uploadedObject: any = await Storage.put(`${filename}.${fileExtension}`, signatureFile, {
                    contentType: `image/${fileExtension}`, //signature image png, png required to print to receipt printer
                });

                signatureS3Object = {
                    key: uploadedObject.key,
                    bucket: awsconfig.aws_user_files_s3_bucket,
                    region: awsconfig.aws_project_region,
                    identityPoolId: user ? user.identityPoolId : "",
                };
            }

            const newOrder: IGET_RESTAURANT_ORDER_FRAGMENT = await createOrder(
                orderNumber,
                paid,
                parkOrder,
                newPaymentAmounts,
                newPayments,
                signatureS3Object
            );

            createdOrder.current = newOrder;
            updateOrderDetail(newOrder);
            if (register.printers && register.printers.items.length > 0 && !parkedOrderId) {
                await printReceipts(newOrder);
            }

            // If using third party integration. Poll for resposne
            if (
                restaurant.thirdPartyIntegrations &&
                restaurant.thirdPartyIntegrations.enable &&
                restaurant.thirdPartyIntegrations.awaitThirdPartyResponse
            ) {
                setPaymentModalState(EPaymentModalState.ThirdPartyIntegrationAwaitingResponse);

                await pollForThirdPartyResponse(newOrder.id);
            }

            beginTransactionCompleteTimeout();
        } catch (e) {
            throw e;
        }
    };

    const pollForThirdPartyResponse = (orderId) => {
        const interval = 2 * 1000; // 2 seconds
        const timeout = 30 * 1000; // 20 seconds

        const endTime = Number(new Date()) + timeout;

        var checkCondition = async (resolve: any, reject: any) => {
            try {
                const thirdPartyOrderResponseRes = await getThirdPartyOrderResponse({
                    variables: {
                        id: orderId,
                    },
                });

                const thirdPartyOrderResponse: IGET_THIRD_PARTY_ORDER_RESPONSE = thirdPartyOrderResponseRes.data.getOrder;

                if (thirdPartyOrderResponse.thirdPartyIntegrationResult) {
                    if (thirdPartyOrderResponse.thirdPartyIntegrationResult.isSuccess === true) {
                        resolve();
                    } else {
                        reject(thirdPartyOrderResponse.thirdPartyIntegrationResult.errorMessage);
                    }
                } else if (Number(new Date()) < endTime) {
                    setTimeout(checkCondition, interval, resolve, reject);
                    return;
                } else {
                    // Didn't match and too much time, reject!
                    reject("Third Party Result Polling timed out. Please contact support staff.");
                    return;
                }
            } catch (error) {
                reject(error);
            }
        };

        return new Promise(checkCondition);
    };

    const createOrder = async (
        orderNumber: string,
        paid: boolean,
        parkOrder: boolean,
        newPaymentAmounts: ICartPaymentAmounts,
        newPayments: ICartPayment[],
        signatureS3Object: IS3Object | null
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
                buzzer: buzzerNumber,
                orderScheduledAt: orderScheduledAt,
                customerInformation: customerInformation
                    ? {
                          firstName: customerInformation.firstName,
                          email: customerInformation.email,
                          phoneNumber: customerInformation.phoneNumber,
                          signature: signatureS3Object,
                      }
                    : null,
                notes: notes,
                eftposReceipt: transactionEftposReceipts,
                paymentAmounts: newPaymentAmounts,
                payments: newPayments,
                total: total,
                surcharge: surcharge || undefined,
                orderTypeSurcharge: orderTypeSurcharge || undefined,
                discount: promotion ? promotion.discountedAmount : undefined,
                promotionId: promotion ? promotion.promotion.id : undefined,
                promotionType: promotion ? promotion.promotion.type : undefined,
                subTotal: subTotal,
                preparationTimeInMinutes: restaurant.preparationTimeInMinutes,
                registerId: register.id,
                products: JSON.parse(JSON.stringify(products)) as ICartProduct[], // copy obj so we can mutate it later
                placedAt: toLocalISOString(now),
                placedAtUtc: now.toISOString(),
                orderUserId: user.id,
                orderRestaurantId: restaurant.id,
            };

            if (parkOrder) {
                variables.status = "PARKED";
                variables.parkedAt = toLocalISOString(now);
                variables.parkedAtUtc = now.toISOString();
                variables.discount = undefined;
                variables.promotionId = undefined;
                variables.subTotal = total; //Set subTotal to total because we do not want to add any discount or promotions. Also product.discount is set to 0 in dashboard.tsx
            } else if (restaurant.autoCompleteOrders) {
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
                    buzzer: buzzerNumber,
                    orderScheduledAt: orderScheduledAt,
                    customerInformation: customerInformation
                        ? {
                              firstName: customerInformation.firstName,
                              email: customerInformation.email,
                              phoneNumber: customerInformation.phoneNumber,
                              signature: signatureS3Object,
                          }
                        : null,
                    notes: notes,
                    eftposReceipt: transactionEftposReceipts,
                    payments: payments,
                    paymentAmounts: paymentAmounts,
                    total: total,
                    surcharge: surcharge || undefined,
                    discount: promotion ? promotion.discountedAmount : undefined,
                    promotionId: promotion ? promotion.promotion.id : undefined,
                    promotionType: promotion ? promotion.promotion.type : undefined,
                    subTotal: subTotal,
                    preparationTimeInMinutes: restaurant.preparationTimeInMinutes,
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

            if (buzzerNumber == null || buzzerNumber == "") {
                delete variables.buzzer;
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

                // if (product.isAgeRescricted == null) {
                delete product.isAgeRescricted;
                // }
            });

            console.log("Order variables: ", variables);

            if (parkedOrderId) {
                const res: any = await updateOrderMutation({
                    variables: { orderId: parkedOrderId, ...variables },
                });

                console.log("update order mutation result: ", res);
                return res.data.updateOrder;
            } else {
                return await retryCreateOrder(variables);
            }
        } catch (e) {
            console.log("process order mutation error: ", e);

            await logError(e, JSON.stringify({ error: e, variables: variables }));
            throw e;
        }
    };

    const retryCreateOrder = async (variables) => {
        //If the create order fails, retry up to 5 times
        for (let i = 0; i < 5; i++) {
            try {
                const res: any = await createOrderMutation({
                    variables: variables,
                });

                console.log("create order mutation result: ", res);

                return res.data.createOrder;
            } catch (error) {
                await logError(`Attempt ${i + 1} failed: ${error}`, variables);
                console.log(`Attempt ${i + 1} failed: ${error}`, variables);

                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
        }

        console.log("xxx...creating order via backup method");

        for (let i = 0; i < 5; i++) {
            try {
                const result = await axios.post(`https://36p0xwo1cl.execute-api.ap-southeast-2.amazonaws.com/prod`, variables);
                const newBackupOrder: IGET_RESTAURANT_ORDER_FRAGMENT = result.data;

                console.log("backup method result", newBackupOrder);

                return newBackupOrder;
            } catch (error) {
                await logError(`Backup: Attempt ${i + 1} failed: ${error}`, variables);
                console.log(`Backup: Attempt ${i + 1} failed: ${error}`, variables);

                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
        }

        await logError(`Maximum retry attempts reached. Unable to create order`, variables);
        throw new Error(`Maximum retry attempts reached. Unable to create order`);
    };

    const performEftposTransaction = async (amount: number): Promise<IEftposTransactionOutcome> => {
        try {
            let outcome: IEftposTransactionOutcome | null = null;

            if (register.eftposProvider == EEftposProvider.SMARTPAY) {
                let delayedShown = false;

                const delayed = (outcome: IEftposTransactionOutcome) => {
                    if (!delayedShown) {
                        delayedShown = true;
                        setEftposTransactionProcessMessage("This transaction is delayed. Please wait...");
                    }
                };

                const pollingUrl = await smartpayCreateTransaction(amount, "Card.Purchase");
                outcome = await smartpayPollForOutcome(pollingUrl, delayed);
            } else if (register.eftposProvider == EEftposProvider.WINDCAVE) {
                outcome = await windcaveCreateTransaction(
                    register.windcaveStationId,
                    register.windcaveStationUser,
                    register.windcaveStationKey,
                    amount,
                    "Purchase"
                );
            } else if (register.eftposProvider == EEftposProvider.VERIFONE) {
                const setEftposMessage = (message: string | null) => setEftposTransactionProcessMessage(message);

                outcome = await verifoneCreateTransaction(
                    amount,
                    register.eftposIpAddress,
                    register.eftposPortNumber,
                    restaurant.id,
                    setEftposMessage
                );
            } else if (register.eftposProvider == EEftposProvider.TYRO) {
                const setEftposMessage = (message: string | null) => setEftposTransactionProcessMessage(message);

                outcome = await tyroCreateTransaction(amount.toString(), "f90891541e4c7c1e695b105e6ecae092", setEftposMessage);
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
        } finally {
            setEftposTransactionProcessMessage(null);
        }
    };

    const onUpdateProduct = (index: number, product: ICartProduct) => {
        updateProduct(index, product);

        if (!isPOS) setShowItemUpdatedModal(true);
    };

    const onClickApplyPromotionCode = async () => {
        setShowPromotionCodeModal(true);
    };

    const onConfirmTotalOrRetryEftposTransaction = async (amount: number) => {
        setPaymentModalState(EPaymentModalState.AwaitingCard);

        let outcome;

        if (amount === 0) {
            //If amount is 0 then bypass the eftpos transaction
            outcome = {
                platformTransactionOutcome: EVerifoneTransactionOutcome.Approved, //Using verifone transactoin approved here, but this field is not really used here so doesnt matter
                transactionOutcome: EEftposTransactionOutcome.Success,
                message: "Transaction Approved!",
                eftposReceipt: null,
            };
        } else {
            outcome = await performEftposTransaction(amount);
        }

        setEftposTransactionOutcome(outcome);

        if (outcome.eftposReceipt) {
            setTransactionEftposReceipts(`${transactionEftposReceipts}\n${outcome.eftposReceipt}`);
        }

        //If paid for everything
        if (outcome.transactionOutcome === EEftposTransactionOutcome.Success) {
            try {
                const newEftposPaymentAmounts = paymentAmounts.eftpos + amount;
                const newTotalPaymentAmounts = newEftposPaymentAmounts + paymentAmounts.cash;

                const newPaymentAmounts: ICartPaymentAmounts = {
                    ...paymentAmounts,
                    eftpos: newEftposPaymentAmounts,
                };
                const newPayments: ICartPayment[] = [...payments, { type: register.eftposProvider, amount: amount }];

                setPaymentAmounts(newPaymentAmounts);
                setPayments(newPayments);

                if (newTotalPaymentAmounts >= subTotal) {
                    //Passing paymentAmounts, payments via params so we send the most updated values
                    await onSubmitOrder(true, false, newPaymentAmounts, newPayments);

                    setPaymentModalState(EPaymentModalState.EftposResult);
                } else {
                    //Payment pending
                    if (isPOS) setPaymentModalState(EPaymentModalState.POSScreen);
                }
            } catch (e) {
                setCreateOrderError(e);
            }
        } else if (
            outcome.transactionOutcome === EEftposTransactionOutcome.Fail ||
            outcome.transactionOutcome === EEftposTransactionOutcome.ProcessMessage
        ) {
            setPaymentModalState(EPaymentModalState.EftposResult);
        }
    };

    const calculateCashChangeAmount = (totalCashAmount: number, subTotal: number): number => {
        const netAmount = totalCashAmount - subTotal;
        const floorToNearestTen = Math.floor(netAmount / 10) * 10; //Floor to nearest 10.

        return floorToNearestTen;
    };

    const onConfirmCashTransaction = async (amount: number) => {
        try {
            const nonCashPayments = paidSoFar - paymentAmounts.cash;
            const newCashPaymentAmounts = paymentAmounts.cash + amount;
            const newTotalPaymentAmounts = nonCashPayments + newCashPaymentAmounts;

            const newPaymentAmounts: ICartPaymentAmounts = {
                ...paymentAmounts,
                cash: newTotalPaymentAmounts >= subTotal ? subTotal - nonCashPayments : newCashPaymentAmounts, //Cannot pay more than subTotal amount
            };
            const newPayments: ICartPayment[] = [...payments, { type: "CASH", amount: amount }];

            setPaymentAmounts(newPaymentAmounts);
            setPayments(newPayments);

            //If paid for everything
            if (newTotalPaymentAmounts >= subTotal) {
                const changeAmount = calculateCashChangeAmount(newTotalPaymentAmounts, subTotal);

                setCashTransactionChangeAmount(changeAmount);

                //Passing paymentAmounts, payments via params so we send the most updated values
                await onSubmitOrder(true, false, newPaymentAmounts, newPayments);

                setPaymentModalState(EPaymentModalState.CashResult);
            }
        } catch (e) {
            setCreateOrderError(e);
        }
    };

    const onConfirmUberEatsTransaction = async (amount: number) => {
        try {
            const nonUberEatsPayments = paidSoFar - paymentAmounts.uberEats;
            const newUberEatsPaymentAmounts = paymentAmounts.uberEats + amount;
            const newTotalPaymentAmounts = nonUberEatsPayments + newUberEatsPaymentAmounts;

            const newPaymentAmounts: ICartPaymentAmounts = {
                ...paymentAmounts,
                uberEats: newTotalPaymentAmounts >= subTotal ? subTotal - nonUberEatsPayments : newUberEatsPaymentAmounts, //Cannot pay more than subTotal amount
            };
            const newPayments: ICartPayment[] = [...payments, { type: "UBEREATS", amount: amount }];

            setPaymentAmounts(newPaymentAmounts);
            setPayments(newPayments);

            //If paid for everything
            if (newTotalPaymentAmounts >= subTotal) {
                //Passing paymentAmounts, payments via params so we send the most updated values
                await onSubmitOrder(true, false, newPaymentAmounts, newPayments);

                setPaymentModalState(EPaymentModalState.UberEatsResult);
            }
        } catch (e) {
            setCreateOrderError(e);
        }
    };

    const onConfirmMenulogTransaction = async (amount: number) => {
        try {
            const nonMenulogPayments = paidSoFar - paymentAmounts.menulog;
            const newMenulogPaymentAmounts = paymentAmounts.menulog + amount;
            const newTotalPaymentAmounts = nonMenulogPayments + newMenulogPaymentAmounts;

            const newPaymentAmounts: ICartPaymentAmounts = {
                ...paymentAmounts,
                menulog: newTotalPaymentAmounts >= subTotal ? subTotal - nonMenulogPayments : newMenulogPaymentAmounts, //Cannot pay more than subTotal amount
            };
            const newPayments: ICartPayment[] = [...payments, { type: "MENULOG", amount: amount }];

            setPaymentAmounts(newPaymentAmounts);
            setPayments(newPayments);

            //If paid for everything
            if (newTotalPaymentAmounts >= subTotal) {
                //Passing paymentAmounts, payments via params so we send the most updated values
                await onSubmitOrder(true, false, newPaymentAmounts, newPayments);

                setPaymentModalState(EPaymentModalState.MenulogResult);
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

        const newPaymentAmounts: ICartPaymentAmounts = {
            cash: 0,
            eftpos: 0,
            online: 0,
            uberEats: 0,
            menulog: 0,
        };
        const newPayments: ICartPayment[] = [];

        try {
            await onSubmitOrder(false, false, newPaymentAmounts, newPayments);

            setPaymentModalState(EPaymentModalState.PayLater);
        } catch (e) {
            setCreateOrderError(e);
        }
    };

    const onParkOrder = async () => {
        setShowPaymentModal(true);

        const newPaymentAmounts: ICartPaymentAmounts = {
            cash: 0,
            eftpos: 0,
            online: 0,
            uberEats: 0,
            menulog: 0,
        };
        const newPayments: ICartPayment[] = [];

        setPaymentModalState(EPaymentModalState.Park);

        try {
            await onSubmitOrder(false, true, newPaymentAmounts, newPayments);
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
                if (category.availablePlatforms && !category.availablePlatforms.includes(register.type)) return;

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
                                const isAlreadyAdded = upSellCrossSaleProductItems.some((item) => item.product.id === upSellProduct.id);

                                if (!isAlreadyAdded) {
                                    upSellCrossSaleProductItems.push({
                                        category: category,
                                        product: p.product,
                                    });
                                }
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

    const thresholdMessageModal = () => {
        return (
            <>
                {showOrderThresholdMessageModal && (
                    <OrderThresholdMessageModal
                        isOpen={showOrderThresholdMessageModal}
                        onClose={onCloseOrderThresholdMessageModal}
                        onContinue={() => setIsShownOrderThresholdMessageModal(true)}
                    />
                )}
            </>
        );
    };

    const r18MessageModal = () => {
        return (
            <>
                {showModal && (
                    <R18MessageModal
                        isOpen={showModal}
                        message={showModal}
                        onClose={onCloseR18MessageModal}
                        onContinue={() => setShowModal("")}
                        paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                        incrementRedirectTimer={incrementRedirectTimer}
                    />
                )}
            </>
        );
    };

    const paymentModal = () => {
        return (
            <>
                {showPaymentModal && (
                    <PaymentModal
                        isOpen={showPaymentModal}
                        onClose={onClosePaymentModal}
                        paymentModalState={paymentModalState}
                        eftposTransactionProcessMessage={eftposTransactionProcessMessage}
                        eftposTransactionOutcome={eftposTransactionOutcome}
                        cashTransactionChangeAmount={cashTransactionChangeAmount}
                        onPrintCustomerReceipt={() => createdOrder.current && onPrintCustomerReceipt(createdOrder.current)}
                        onPrintParkedOrderReceipts={() => createdOrder.current && onPrintParkedOrderReceipts(createdOrder.current)}
                        paymentOutcomeOrderNumber={paymentOutcomeOrderNumber}
                        incrementRedirectTimer={incrementRedirectTimer}
                        paymentOutcomeApprovedRedirectTimeLeft={paymentOutcomeApprovedRedirectTimeLeft}
                        onContinueToNextOrder={onContinueToNextOrder}
                        createOrderError={createOrderError}
                        onConfirmTotalOrRetryEftposTransaction={onConfirmTotalOrRetryEftposTransaction}
                        onConfirmCashTransaction={onConfirmCashTransaction}
                        onConfirmUberEatsTransaction={onConfirmUberEatsTransaction}
                        onConfirmMenulogTransaction={onConfirmMenulogTransaction}
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
            {thresholdMessageModal()}
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

    const restaurantBuzzerNumber = (
        <div className="checkout-buzzer-number">
            <div className="h3">Buzzer Number: {buzzerNumber}</div>
            <Link onClick={onUpdateBuzzerNumber}>Change</Link>
        </div>
    );

    const restaurantCustomerInformation = (
        <div className="checkout-customer-details">
            <div className="h3">
                Customer Details: {`${customerInformation?.firstName} ${customerInformation?.email} ${customerInformation?.phoneNumber}`}
            </div>
            <Link onClick={onUpdateCustomerInformation}>Change</Link>
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

    const orderScheduleTitle = (
        <div className="title mb-1 mb-2">
            <div className="h2">Order Time</div>
        </div>
    );

    const onChangeScheduleDateTime = (dateTimeLocalISO: string | null) => {
        updateOrderScheduledAt(dateTimeLocalISO);
    };

    const restaurantNotes = (
        <>
            <div className="h2 mb-3">Special Instructions</div>
            <TextArea placeholder={"Leave a note for the restaurant"} value={notes} onChange={onNotesChange} />
        </>
    );

    const scrollDown = () => {
        const scrollableDiv = document.getElementById("productsWrapperScroll");
        if (scrollableDiv) {
            scrollableDiv.scrollTop += 100;
        }
    };

    const order = (
        <>
            <div className={isPOS ? "mt-4" : "mt-10"}></div>
            {title}
            {register && register.availableOrderTypes.length > 1 && restaurantOrderType}
            {promotionInformation}
            {tableNumber && <div className="mb-4">{restaurantTableNumber}</div>}
            {buzzerNumber && <div className="mb-4">{restaurantBuzzerNumber}</div>}
            {customerInformation && <div className="mb-4">{restaurantCustomerInformation}</div>}
            <div className="separator-6"></div>
            {orderSummary}
            <div className="restaurant-notes-wrapper">{restaurantNotes}</div>
            <div className={isPOS ? "mb-4" : "mb-10"}></div>
        </>
    );

    const parkOrderFooter = (
        <div className="park-order-footer">
            <div className="park-order-link p-2">
                <Link onClick={onParkOrder}>Park Order</Link>
            </div>
        </div>
    );

    const checkoutFooter = (
        <div>
            {/* <div className="order-schedule-date-time-wrapper">
                {orderScheduleTitle}
                <OrderScheduleDateTime
                    onChange={onChangeScheduleDateTime}
                    operatingHours={restaurant.operatingHours}
                    preparationTimeInMinutes={restaurant.preparationTimeInMinutes || 10}
                />
            </div>
            <div className="mb-2"></div> */}
            {promotion ? (
                <div className="h3 text-center mb-2">
                    {`Discount${promotion.promotion.code ? ` (${promotion.promotion.code})` : ""}: -$${convertCentsToDollars(
                        promotion.discountedAmount
                    )}`}{" "}
                    {userAppliedPromotionCode && <Link onClick={removeUserAppliedPromotion}> (Remove) </Link>}
                </div>
            ) : (
                <></>
            )}
            {surcharge ? <div className="h3 text-center mb-2">Surcharge: ${convertCentsToDollars(surcharge)}</div> : <></>}
            {paidSoFar > 0 ? <div className="h3 text-center mb-2">Paid So Far: ${convertCentsToDollars(paidSoFar)}</div> : <></>}
            {orderTypeSurcharge > 0 ? (
                <div className="h3 text-center mb-2">Order Type Surcharge: ${convertCentsToDollars(orderTypeSurcharge)}</div>
            ) : (
                <></>
            )}
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
                {payments.length === 0 && register.enablePayLater && (
                    <div className={`pay-later-link ${isPOS ? "mt-3" : "mt-4"}`}>
                        <Link onClick={onClickPayLater}>Pay later at counter...</Link>
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
                        <div
                            ref={(ref) => setProductsWrapperElement(ref)}
                            className={`order ${isPOS ? "mr-4 ml-4" : "mr-10 ml-10"}`}
                            id="productsWrapperScroll"
                        >
                            {(!products || products.length == 0) && cartEmptyDisplay}
                            {products && products.length > 0 && order}
                            {isScrollable ? (
                                <div className={register.type === "POS" ? "mr-btm fixed-button" : "fixed-button"} onClick={scrollDown}>
                                    <div className={`arrow-container ${isScrollable ? "fade-in" : "fade-out"}`}>
                                        <FiArrowDownCircle size="46" />
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                    {isPOS && payments.length === 0 && <div>{parkOrderFooter}</div>}
                    {products && products.length > 0 && (
                        <div className="footer p-4" id="footer">
                            {checkoutFooter}
                        </div>
                    )}
                </div>
                {r18MessageModal()}
                {modalsAndSpinners}
            </PageWrapper>
        </>
    );
};

export default Checkout;
