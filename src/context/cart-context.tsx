import { createContext, useContext, useEffect, useState } from "react";
import { EOrderStatus, EPromotionType, IGET_RESTAURANT_PROMOTION } from "../graphql/customQueries";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../graphql/customFragments";

import {
    ICartProduct,
    EOrderType,
    ICartItemQuantitiesById,
    ICartPromotion,
    CheckIfPromotionValidResponse,
    ICartPaymentAmounts,
    ICartPayment,
    EPaymentMethod,
    ICustomerInformation,
} from "../model/model";
import { applyDiscountToCartProducts, checkIfPromotionValid, getOrderDiscountAmount } from "../util/util";
import { useRestaurant } from "./restaurant-context";
import { useRegister } from "./register-context";

const initialParkedOrderId = null;
const initialParkedOrderNumber = null;
const initialParkedOrderStatus = null;
const initialOrderType = null;
const initialPaymentMethod = null;
const initialCovers = null;
const initialTableNumber = null;
const initialBuzzerNumber = null;
const initialCustomerInformation = null;
const initialCustomerLoyaltyPoints = 0;
const initialProducts = null;
const initialNotes = "";
const initialCartCategoryQuantitiesById = {};
const initialCartProductQuantitiesById = {};
const initialCartModifierQuantitiesById = {};
const initialUserAppliedPromotionCode = null;
const initialPromotion = null;
const initialAvailablePromotions = [];
const initialUserAppliedLoyaltyId = null;
const initialTotal = 0;
const initialStaticDiscount = 0;
const initialPercentageDiscount = 0;
const initialSurcharge = 0;
const initialPaidSoFar = 0;
const initialOrderTypeSurcharge = 0;
const initialPaymentAmounts: ICartPaymentAmounts = { cash: 0, eftpos: 0, online: 0, uberEats: 0, menulog: 0, doordash: 0, delivereasy: 0 };
const initialSubTotal = 0;
const initialPayments = [];
const initialTransactionEftposReceipts = "";
const initialIsShownUpSellCrossSellModal = false;
const initialIsShownOrderThresholdMessageModal = false;
const initialOrderScheduledAt = null;
const initialOrderDetail = null;

type ContextProps = {
    // restaurant: IGET_RESTAURANT | null;
    // setRestaurant: (restaurant: IGET_RESTAURANT) => void;
    parkedOrderId: string | null;
    setParkedOrderId: (parkedOrderId: string | null) => void;
    parkedOrderNumber: string | null;
    setParkedOrderNumber: (parkedOrderNumber: string | null) => void;
    parkedOrderStatus: EOrderStatus | null;
    setParkedOrderStatus: (parkedOrderStatus: EOrderStatus | null) => void;
    orderType: EOrderType | null;
    setOrderType: (orderType: EOrderType) => void;
    paymentMethod: EPaymentMethod | null;
    setPaymentMethod: (paymentMethod: EPaymentMethod | null) => void;
    covers: number | null;
    setCovers: (covers: number | null) => void;
    tableNumber: string | null;
    setTableNumber: (tableNumber: string | null) => void;
    buzzerNumber: string | null;
    setBuzzerNumber: (buzzerNumber: string | null) => void;
    customerInformation: ICustomerInformation | null;
    setCustomerInformation: (customerInformation: ICustomerInformation | null) => void;
    customerLoyaltyPoints: number | null;
    setCustomerLoyaltyPoints: (customerLoyaltyPoints: number | null) => void;
    products: ICartProduct[] | null;
    cartProductQuantitiesById: ICartItemQuantitiesById;
    cartModifierQuantitiesById: ICartItemQuantitiesById;
    setProducts: (products: ICartProduct[]) => void;
    addProduct: (product: ICartProduct) => void;
    updateProduct: (index: number, product: ICartProduct) => void;
    updateProductQuantity: (index: number, quantity: number) => void;
    applyProductDiscount: (index: number, discount: number) => void;
    deleteProduct: (index: number) => void; // has a index input because multiple products in cart could have the same id
    clearCart: () => void;
    notes: string;
    setNotes: (notes: string) => void;
    promotion: ICartPromotion | null;
    userAppliedPromotionCode: string | null;
    setUserAppliedPromotion: (promotion: IGET_RESTAURANT_PROMOTION) => CheckIfPromotionValidResponse;
    removeUserAppliedPromotion: () => void;
    userAppliedLoyaltyId: string | null;
    setUserAppliedLoyaltyId: (userAppliedLoyaltyId) => void;
    total: number;
    staticDiscount: number;
    setStaticDiscount: (staticDiscount: number) => void;
    percentageDiscount: number;
    setPercentageDiscount: (percentageDiscount: number) => void;
    surcharge: number;
    subTotal: number;
    paidSoFar: number;
    orderTypeSurcharge: number;
    payments: ICartPayment[];
    setPayments: (payment: ICartPayment[]) => void;
    paymentAmounts: ICartPaymentAmounts;
    setPaymentAmounts: (paymentAmounts: ICartPaymentAmounts) => void;
    isShownUpSellCrossSellModal: boolean;
    setIsShownUpSellCrossSellModal: (isShownUpSellCrossSellModal: boolean) => void;
    isShownOrderThresholdMessageModal: boolean;
    setIsShownOrderThresholdMessageModal: (isShownOrderThresholdMessageModal: boolean) => void;
    orderScheduledAt: string | null;
    updateOrderScheduledAt: (orderScheduledAt: string | null) => void;
    orderDetail: IGET_RESTAURANT_ORDER_FRAGMENT | null;
    updateOrderDetail: (orderDetail: IGET_RESTAURANT_ORDER_FRAGMENT) => void;
};

const CartContext = createContext<ContextProps>({
    // restaurant: initialRestaurant,
    // setRestaurant: () => {},
    parkedOrderId: initialParkedOrderId,
    setParkedOrderId: () => {},
    parkedOrderNumber: initialParkedOrderNumber,
    setParkedOrderNumber: () => {},
    parkedOrderStatus: initialParkedOrderStatus,
    setParkedOrderStatus: () => {},
    orderType: initialOrderType,
    setOrderType: () => {},
    paymentMethod: initialPaymentMethod,
    setPaymentMethod: () => {},
    tableNumber: initialTableNumber,
    setTableNumber: () => {},
    covers: initialCovers,
    setCovers: () => {},
    buzzerNumber: initialBuzzerNumber,
    setBuzzerNumber: () => {},
    customerInformation: initialCustomerInformation,
    setCustomerInformation: () => {},
    customerLoyaltyPoints: initialCustomerLoyaltyPoints,
    setCustomerLoyaltyPoints: () => {},
    products: initialProducts,
    cartProductQuantitiesById: {},
    cartModifierQuantitiesById: {},
    setProducts: () => {},
    addProduct: () => {},
    updateProduct: () => {},
    updateProductQuantity: () => {},
    applyProductDiscount: () => {},
    deleteProduct: () => {},
    clearCart: () => {},
    notes: initialNotes,
    setNotes: () => {},
    promotion: initialPromotion,
    userAppliedPromotionCode: "",
    setUserAppliedPromotion: () => CheckIfPromotionValidResponse.VALID,
    removeUserAppliedPromotion: () => {},
    userAppliedLoyaltyId: initialUserAppliedLoyaltyId,
    setUserAppliedLoyaltyId: (userAppliedLoyaltyId) => {},
    total: initialTotal,
    staticDiscount: initialStaticDiscount,
    setStaticDiscount: () => {},
    percentageDiscount: initialPercentageDiscount,
    setPercentageDiscount: () => {},
    surcharge: initialSurcharge,
    subTotal: initialSubTotal,
    paidSoFar: initialPaidSoFar,
    orderTypeSurcharge: initialOrderTypeSurcharge,
    payments: initialPayments,
    setPayments: () => {},
    paymentAmounts: initialPaymentAmounts,
    setPaymentAmounts: () => {},
    isShownUpSellCrossSellModal: initialIsShownUpSellCrossSellModal,
    isShownOrderThresholdMessageModal: initialIsShownOrderThresholdMessageModal,
    setIsShownUpSellCrossSellModal: () => {},
    setIsShownOrderThresholdMessageModal: () => {},
    orderScheduledAt: initialOrderScheduledAt,
    updateOrderScheduledAt: (orderScheduledAt: string | null) => {},
    orderDetail: initialOrderDetail,
    updateOrderDetail: (orderDetail: object) => {},
});

const CartProvider = (props: { children: React.ReactNode }) => {
    const { restaurant } = useRestaurant();
    const { register } = useRegister();

    const [parkedOrderId, _setParkedOrderId] = useState<string | null>(initialParkedOrderId);
    const [parkedOrderNumber, _setParkedOrderNumber] = useState<string | null>(initialParkedOrderNumber);
    const [parkedOrderStatus, _setParkedOrderStatus] = useState<EOrderStatus | null>(initialParkedOrderStatus);
    const [orderType, _setOrderType] = useState<EOrderType | null>(initialOrderType);
    const [paymentMethod, _setPaymentMethod] = useState<EPaymentMethod | null>(initialPaymentMethod);
    const [covers, _setCovers] = useState<number | null>(initialCovers);
    const [tableNumber, _setTableNumber] = useState<string | null>(initialTableNumber);
    const [buzzerNumber, _setBuzzerNumber] = useState<string | null>(initialBuzzerNumber);
    const [customerInformation, _setCustomerInformation] = useState<ICustomerInformation | null>(initialCustomerInformation);
    const [customerLoyaltyPoints, _setCustomerLoyaltyPoints] = useState<number | null>(initialCustomerLoyaltyPoints);
    const [products, _setProducts] = useState<ICartProduct[] | null>(initialProducts);
    const [notes, _setNotes] = useState<string>(initialNotes);
    const [total, _setTotal] = useState<number>(initialTotal);
    const [staticDiscount, _setStaticDiscount] = useState<number>(initialStaticDiscount);
    const [percentageDiscount, _setPercentageDiscount] = useState<number>(initialPercentageDiscount);
    const [surcharge, _setSurcharge] = useState<number>(initialSurcharge);
    const [paymentAmounts, _setPaymentAmounts] = useState<ICartPaymentAmounts>(initialPaymentAmounts);
    const [subTotal, _setSubTotal] = useState<number>(initialSubTotal);
    const [payments, _setPayments] = useState<ICartPayment[]>(initialPayments);
    const [orderTypeSurcharge, _setOrderTypeSurcharge] = useState<number>(initialOrderTypeSurcharge);
    const [isShownUpSellCrossSellModal, _setIsShownUpSellCrossSellModal] = useState<boolean>(initialIsShownUpSellCrossSellModal);
    const [isShownOrderThresholdMessageModal, _setIsShownOrderThresholdMessageModal] = useState(initialIsShownOrderThresholdMessageModal);

    const [userAppliedPromotionCode, _setUserAppliedPromotionCode] = useState<string | null>(initialUserAppliedPromotionCode);
    const [promotion, _setPromotion] = useState<ICartPromotion | null>(initialPromotion);
    const [availablePromotions, _setAvailablePromotions] = useState<IGET_RESTAURANT_PROMOTION[]>(initialAvailablePromotions);

    const [userAppliedLoyaltyId, _setUserAppliedLoyaltyId] = useState<string | null>(initialUserAppliedLoyaltyId);

    const [cartCategoryQuantitiesById, _setCartCategoryQuantitiesById] = useState<ICartItemQuantitiesById>(initialCartCategoryQuantitiesById);
    const [cartProductQuantitiesById, _setCartProductQuantitiesById] = useState<ICartItemQuantitiesById>(initialCartProductQuantitiesById);
    const [cartModifierQuantitiesById, _setCartModifierQuantitiesById] = useState<ICartItemQuantitiesById>(initialCartModifierQuantitiesById);

    const [orderScheduledAt, _setOrderScheduledAt] = useState<string | null>(initialOrderScheduledAt);
    const [orderDetail, _setOrderDetail] = useState<IGET_RESTAURANT_ORDER_FRAGMENT | null>(initialOrderDetail);

    // useEffect(() => {
    // console.log("xxx...products", products);
    // }, [products]);

    useEffect(() => {
        if (!products) return;

        let newSubTotal = total;
        let newSurcharge = 0;
        if (promotion) {
            if (promotion.discountedAmount > newSubTotal) {
                newSubTotal = 0;
            } else {
                newSubTotal -= promotion.discountedAmount;
            }
        }

        if (restaurant && restaurant.surchargePercentage) {
            newSurcharge += Math.round((newSubTotal * restaurant.surchargePercentage) / 100);
        }

        if (register && register.surchargePercentage) {
            newSurcharge += Math.round((newSubTotal * register.surchargePercentage) / 100);
        }

        _setSurcharge(newSurcharge);
        _setSubTotal(newSubTotal + newSurcharge + orderTypeSurcharge - staticDiscount - percentageDiscount);
    }, [total, promotion, restaurant, orderTypeSurcharge, staticDiscount, percentageDiscount]);

    useEffect(() => {
        if (userAppliedPromotionCode) return; //Only apply restaurant promos if user has not applied one themselves
        const availPromotions: IGET_RESTAURANT_PROMOTION[] = [];

        restaurant &&
            restaurant.promotions.items.forEach((promotion) => {
                if (!promotion.autoApply) return;

                const status = checkIfPromotionValid(promotion);

                if (status !== CheckIfPromotionValidResponse.VALID) return;

                availPromotions.push(promotion);
            });

        _setAvailablePromotions(availPromotions);
    }, [restaurant, userAppliedPromotionCode]);

    useEffect(() => {
        if (!products) return;

        processPromotions(products, total);
    }, [userAppliedPromotionCode]);

    //This function should be a useEffect hook. But cannot make this because it cause infinite state change loop issue
    const processPromotions = (products: ICartProduct[], newTotal: number, newOrderType?: EOrderType) => {
        //Passing in newTotal here because if we take it from state it returns old total value.
        let bestPromotion: ICartPromotion | null = null;
        const odrType = newOrderType || orderType;

        let productsCpy: ICartProduct[] = JSON.parse(JSON.stringify(products));

        productsCpy = productsCpy.map((p, index) => ({
            ...p,
            index,
        }));
        availablePromotions.forEach((promotion) => {
            if (!odrType || !promotion.availableOrderTypes) return;
            if (!promotion.availableOrderTypes.includes(EOrderType[odrType])) return;
            if (promotion.totalAvailableUses !== null) {
                if (promotion.totalNumberUsed >= promotion.totalAvailableUses) return;
            }
            //We need the most up to date total amount
            if (newTotal < promotion.minSpend) {
                _setProducts(products);
                _setPromotion(null);
                return;
            }

            const discount = getOrderDiscountAmount(promotion, productsCpy, newTotal);

            if (!discount || discount.discountedAmount <= 0) return;

            if (!bestPromotion || discount.discountedAmount > bestPromotion.discountedAmount) {
                bestPromotion = {
                    discountedAmount: discount.discountedAmount,
                    matchingProducts: discount.matchingProducts,
                    promotion: promotion,
                };
            }
        });

        console.log("xxx...bestPromotion", bestPromotion);

        //If bestPromotion is null, the function will still reset all the product.discount values to 0
        const discountedProducts = applyDiscountToCartProducts(bestPromotion, products);
        console.log("bestPromotion", bestPromotion);
        _setProducts(discountedProducts);
        _setPromotion(bestPromotion);

        if (bestPromotion) {
            _setStaticDiscount(0);
            _setPercentageDiscount(0);
        }
    };

    const setUserAppliedPromotion = (promotion: IGET_RESTAURANT_PROMOTION): CheckIfPromotionValidResponse => {
        if (!products) return CheckIfPromotionValidResponse.UNAVAILABLE;

        const status = promotion.startDate == null || promotion.endDate == null ? "VALID" : checkIfPromotionValid(promotion);

        if (status !== CheckIfPromotionValidResponse.VALID) return status;

        _setAvailablePromotions([promotion]);
        _setUserAppliedPromotionCode(promotion.code);

        return CheckIfPromotionValidResponse.VALID;
    };

    const removeUserAppliedPromotion = () => {
        _setUserAppliedPromotionCode(null);
        _setAvailablePromotions([]);
    };

    const setUserAppliedLoyaltyId = (loyaltyId: string) => {
        _setUserAppliedLoyaltyId(loyaltyId);
    };

    const updateCartQuantities = (products: ICartProduct[] | null) => {
        const newCartCategoryQuantitiesById: ICartItemQuantitiesById = {};
        const newCartProductQuantitiesById: ICartItemQuantitiesById = {};
        const newCartModifierQuantitiesById: ICartItemQuantitiesById = {};

        products &&
            products.forEach((product) => {
                if (!product.category) return; //Product will not have a product.category only if its productModifier

                if (newCartCategoryQuantitiesById[product.category.id]) {
                    //We use product.quantity here because category does not have quantity assigned to it. The number of products select is same as the quantity for the category.
                    newCartCategoryQuantitiesById[product.category.id].quantity += product.quantity;
                } else {
                    newCartCategoryQuantitiesById[product.category.id] = {
                        id: product.category.id,
                        name: product.category.name,
                        quantity: product.quantity,
                        price: product.price,
                        discount: 0,
                        categoryId: null,
                    };
                }
                //We do this because there could be the same product in the products array twice.
                if (newCartProductQuantitiesById[product.id]) {
                    newCartProductQuantitiesById[product.id].quantity += product.quantity;
                } else {
                    newCartProductQuantitiesById[product.id] = {
                        id: product.id,
                        name: product.name,
                        quantity: product.quantity,
                        price: product.price,
                        discount: 0,
                        categoryId: product.category.id,
                    };
                }

                product.modifierGroups.forEach((modifierGroup) => {
                    modifierGroup.modifiers.forEach((modifier) => {
                        //Not sure if we should be calculating quantity of productModifiers.
                        // if (modifier.productModifiers) {
                        //     modifier.productModifiers.forEach((productModifier) => {
                        //         if (newCartProductQuantitiesById[productModifier.id]) {
                        //             newCartProductQuantitiesById[productModifier.id].quantity += product.quantity * modifier.quantity;
                        //         } else {
                        //             newCartProductQuantitiesById[productModifier.id] = {
                        //                 id: product.id,
                        //                 name: product.name,
                        //                 quantity: product.quantity,
                        //                 price: product.price,
                        //                 categoryId: product.category.id,
                        //             };
                        //         }
                        //     });
                        // } else {
                        if (newCartModifierQuantitiesById[modifier.id]) {
                            newCartModifierQuantitiesById[modifier.id].quantity += product.quantity * modifier.quantity;
                        } else {
                            newCartModifierQuantitiesById[modifier.id] = {
                                id: modifier.id,
                                name: modifier.name,
                                quantity: product.quantity * modifier.quantity,
                                price: modifier.price,
                                discount: 0,
                                categoryId: null,
                            };
                        }
                        // }
                    });
                });
            });

        _setCartCategoryQuantitiesById(newCartCategoryQuantitiesById);
        _setCartProductQuantitiesById(newCartProductQuantitiesById);
        _setCartModifierQuantitiesById(newCartModifierQuantitiesById);
    };

    const recalculateTotal = (products: ICartProduct[] | null) => {
        let totalPrice = 0;

        products &&
            products.forEach((p) => {
                let price = p.price - p.discount;

                p.modifierGroups.forEach((mg) => {
                    mg.modifiers.forEach((m) => {
                        const changedQuantity = m.quantity - m.preSelectedQuantity;

                        if (changedQuantity > 0) {
                            price += m.price * changedQuantity;
                        }

                        if (m.productModifiers) {
                            m.productModifiers.forEach((productModifier) => {
                                productModifier.modifierGroups.forEach((orderedProductModifierModifierGroup) => {
                                    orderedProductModifierModifierGroup.modifiers.forEach((orderedProductModifierModifier) => {
                                        const changedQuantity =
                                            orderedProductModifierModifier.quantity - orderedProductModifierModifier.preSelectedQuantity;

                                        if (changedQuantity > 0) {
                                            price += orderedProductModifierModifier.price * changedQuantity;
                                        }
                                    });
                                });
                            });
                        }
                    });
                });

                totalPrice += price * p.quantity;
            });

        return totalPrice;
    };

    const setParkedOrderId = (parkedOrderId: string | null) => {
        _setParkedOrderId(parkedOrderId);
    };

    const setParkedOrderNumber = (parkedOrderNumber: string | null) => {
        _setParkedOrderNumber(parkedOrderNumber);
    };

    const setParkedOrderStatus = (parkedOrderStatus: EOrderStatus | null) => {
        _setParkedOrderStatus(parkedOrderStatus);
    };

    const setOrderType = (orderType: EOrderType) => {
        const order_type_surcharge = register?.orderTypeSurcharge != null ? register?.orderTypeSurcharge[orderType.toLocaleLowerCase()] : 0;
        _setOrderType(orderType);
        _setOrderTypeSurcharge(order_type_surcharge);

        // setBuzzerNumber(null); //Reset buzzer number if you change order type

        if (products) processPromotions(products, total, orderType);
    };

    const setPaymentMethod = (paymentMethod: EPaymentMethod | null) => {
        _setPaymentMethod(paymentMethod);
    };

    const setCovers = (covers: number | null) => {
        _setCovers(covers);
    };

    const setTableNumber = (tableNumber: string | null) => {
        _setTableNumber(tableNumber);
    };

    const setBuzzerNumber = (buzzerNumber: string | null) => {
        _setBuzzerNumber(buzzerNumber);
    };

    const setCustomerInformation = (customerInformation: ICustomerInformation | null) => {
        _setCustomerInformation(customerInformation);
    };

    const setCustomerLoyaltyPoints = (customerLoyaltyPoints: number | null) => {
        _setCustomerLoyaltyPoints(customerLoyaltyPoints);
    };

    const setProducts = (newProducts: ICartProduct[]) => {
        const newTotal = recalculateTotal(newProducts);

        _setProducts(newProducts);
        _setTotal(newTotal);
        updateCartQuantities(newProducts);
        processPromotions(newProducts, newTotal);
    };

    const addProduct = (product: ICartProduct) => {
        const { quantity: productQuantity, ...productWithoutQuantiy } = product;
        const serializedProduct = JSON.stringify(productWithoutQuantiy);

        let newProducts = products || [];

        const matchingProductIndex = newProducts.findIndex((p) => {
            const { quantity, ...pWithoutQuantiy } = p;
            return JSON.stringify(pWithoutQuantiy) === serializedProduct;
        });

        if (matchingProductIndex !== -1) {
            newProducts[matchingProductIndex].quantity += productQuantity;
        } else {
            newProducts.push(product);
        }

        const newTotal = recalculateTotal(newProducts);

        _setProducts(newProducts);
        _setTotal(newTotal);
        updateCartQuantities(newProducts);
        processPromotions(newProducts, newTotal);
    };

    const updateProduct = (index: number, product: ICartProduct) => {
        // should never really end up here
        if (products == null) return;

        const newProducts = products;
        newProducts[index] = product;

        const newTotal = recalculateTotal(newProducts);

        _setProducts(newProducts);
        _setTotal(newTotal);
        updateCartQuantities(newProducts);
        processPromotions(newProducts, newTotal);
    };

    const updateProductQuantity = (index: number, quantity: number) => {
        // should never really end up here
        if (products == null) return;

        const newProducts = products;
        const productAtIndex = newProducts[index];

        productAtIndex.quantity = quantity;
        newProducts[index] = productAtIndex;

        const newTotal = recalculateTotal(newProducts);

        _setProducts(newProducts);
        _setTotal(newTotal);
        updateCartQuantities(newProducts);
        processPromotions(newProducts, newTotal);
    };

    const applyProductDiscount = (index: number, discount: number) => {
        // should never really end up here
        if (products == null) return;

        const newProducts = products;
        const productAtIndex = newProducts[index];

        productAtIndex.discount = discount;
        newProducts[index] = productAtIndex;

        const newTotal = recalculateTotal(newProducts);

        _setProducts(newProducts);
        _setTotal(newTotal);
        updateCartQuantities(newProducts);
        // processPromotions(newProducts, newTotal);
    };

    const setStaticDiscount = (staticDiscount: number) => {
        _setStaticDiscount(staticDiscount);
        _setPercentageDiscount(0);
    };

    const setPercentageDiscount = (percentageDiscount: number) => {
        _setPercentageDiscount(percentageDiscount);
        _setStaticDiscount(0);
    };

    const deleteProduct = (index: number) => {
        // should never really end up here
        if (products == null) return;

        let newProducts = products;
        newProducts.splice(index, 1);

        const newTotal = recalculateTotal(newProducts);

        _setProducts(newProducts);
        _setTotal(newTotal);
        updateCartQuantities(newProducts);
        processPromotions(newProducts, newTotal);
    };

    const setNotes = (notes: string) => {
        _setNotes(notes);
    };

    const setPaymentAmounts = (amount: ICartPaymentAmounts) => {
        _setPaymentAmounts(amount);
    };

    const setPayments = (payments: ICartPayment[]) => {
        _setPayments(payments);
    };

    const setIsShownUpSellCrossSellModal = (isShownUpSellCrossSellModal: boolean) => {
        _setIsShownUpSellCrossSellModal(isShownUpSellCrossSellModal);
    };

    const setIsShownOrderThresholdMessageModal = (isShownOrderThresholdMessageModal: boolean) => {
        _setIsShownOrderThresholdMessageModal(isShownOrderThresholdMessageModal);
    };

    const updateOrderScheduledAt = (orderScheduledAt: string | null) => {
        _setOrderScheduledAt(orderScheduledAt);
    };

    const updateOrderDetail = (orderDetail: IGET_RESTAURANT_ORDER_FRAGMENT) => {
        _setOrderDetail(orderDetail);
    };

    const clearCart = () => {
        _setParkedOrderId(initialParkedOrderId);
        _setParkedOrderNumber(initialParkedOrderNumber);
        _setParkedOrderStatus(initialParkedOrderStatus);
        _setOrderType(initialOrderType);
        _setPaymentMethod(initialPaymentMethod);
        _setCovers(initialCovers);
        _setTableNumber(initialTableNumber);
        _setBuzzerNumber(initialBuzzerNumber);
        _setCustomerInformation(initialCustomerInformation);
        _setCustomerLoyaltyPoints(initialCustomerLoyaltyPoints);
        _setProducts(initialProducts);
        _setNotes(initialNotes);
        _setCartCategoryQuantitiesById(initialCartCategoryQuantitiesById);
        _setCartProductQuantitiesById(initialCartProductQuantitiesById);
        _setCartModifierQuantitiesById(initialCartModifierQuantitiesById);
        _setUserAppliedPromotionCode(initialUserAppliedPromotionCode);
        _setPromotion(initialPromotion);
        // _setAvailablePromotions(initialAvailablePromotions); //Don't need this. Otherwise, it will erase availablePromotions when you clear the cart
        _setUserAppliedLoyaltyId(initialUserAppliedLoyaltyId);
        _setTotal(initialTotal);
        _setStaticDiscount(initialStaticDiscount);
        _setPercentageDiscount(initialPercentageDiscount);
        _setSurcharge(initialSurcharge);
        _setPaymentAmounts(initialPaymentAmounts);
        _setSubTotal(initialSubTotal);
        _setPayments(initialPayments);
        _setIsShownUpSellCrossSellModal(initialIsShownUpSellCrossSellModal);
        _setIsShownOrderThresholdMessageModal(initialIsShownOrderThresholdMessageModal);
        _setOrderScheduledAt(initialOrderScheduledAt);
    };

    return (
        <CartContext.Provider
            value={{
                // restaurant: restaurant,
                // setRestaurant: setRestaurant,
                parkedOrderId: parkedOrderId,
                setParkedOrderId: setParkedOrderId,
                parkedOrderNumber: parkedOrderNumber,
                setParkedOrderNumber: setParkedOrderNumber,
                parkedOrderStatus: parkedOrderStatus,
                setParkedOrderStatus: setParkedOrderStatus,
                orderType: orderType,
                setOrderType: setOrderType,
                paymentMethod: paymentMethod,
                setPaymentMethod: setPaymentMethod,
                covers: covers,
                setCovers: setCovers,
                tableNumber: tableNumber,
                setTableNumber: setTableNumber,
                buzzerNumber: buzzerNumber,
                setBuzzerNumber: setBuzzerNumber,
                customerInformation: customerInformation,
                setCustomerInformation: setCustomerInformation,
                customerLoyaltyPoints: customerLoyaltyPoints,
                setCustomerLoyaltyPoints: setCustomerLoyaltyPoints,
                products: products,
                cartProductQuantitiesById: cartProductQuantitiesById,
                cartModifierQuantitiesById: cartModifierQuantitiesById,
                setProducts: setProducts,
                addProduct: addProduct,
                updateProduct: updateProduct,
                updateProductQuantity: updateProductQuantity,
                applyProductDiscount: applyProductDiscount,
                deleteProduct: deleteProduct,
                clearCart: clearCart,
                notes: notes,
                setNotes: setNotes,
                promotion: promotion,
                userAppliedPromotionCode: userAppliedPromotionCode,
                setUserAppliedPromotion: setUserAppliedPromotion,
                removeUserAppliedPromotion: removeUserAppliedPromotion,
                userAppliedLoyaltyId: userAppliedLoyaltyId,
                setUserAppliedLoyaltyId: setUserAppliedLoyaltyId,
                total: total,
                staticDiscount: staticDiscount,
                setStaticDiscount: setStaticDiscount,
                percentageDiscount: percentageDiscount,
                setPercentageDiscount: setPercentageDiscount,
                surcharge: surcharge,
                subTotal: subTotal,
                paidSoFar:
                    paymentAmounts.cash +
                    paymentAmounts.eftpos +
                    paymentAmounts.online +
                    paymentAmounts.uberEats +
                    paymentAmounts.menulog +
                    paymentAmounts.doordash +
                    paymentAmounts.delivereasy,
                orderTypeSurcharge: orderTypeSurcharge,
                paymentAmounts: paymentAmounts,
                setPaymentAmounts: setPaymentAmounts,
                payments: payments,
                setPayments: setPayments,
                isShownUpSellCrossSellModal: isShownUpSellCrossSellModal,
                isShownOrderThresholdMessageModal: isShownOrderThresholdMessageModal,
                setIsShownUpSellCrossSellModal: setIsShownUpSellCrossSellModal,
                setIsShownOrderThresholdMessageModal: setIsShownOrderThresholdMessageModal,
                orderScheduledAt: orderScheduledAt,
                updateOrderScheduledAt: updateOrderScheduledAt,
                orderDetail: orderDetail,
                updateOrderDetail: updateOrderDetail,
            }}
            children={props.children}
        />
    );
};

const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error(`useCart must be used within a CartProvider`);
    }
    return context;
};

export { CartProvider, useCart };
