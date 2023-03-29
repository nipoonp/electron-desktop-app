import { createContext, useContext, useEffect, useState } from "react";
import { EPromotionType, IGET_RESTAURANT_PROMOTION } from "../graphql/customQueries";

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
import { checkIfPromotionValid, getOrderDiscountAmount } from "../util/util";
import { useRestaurant } from "./restaurant-context";

const initialParkedOrderId = null;
const initialParkedOrderNumber = null;
const initialOrderType = null;
const initialPaymentMethod = null;
const initialTableNumber = null;
const initialBuzzerNumber = null;
const initialCustomerInformation = null;
const initialProducts = null;
const initialNotes = "";
const initialCartCategoryQuantitiesById = {};
const initialCartProductQuantitiesById = {};
const initialCartModifierQuantitiesById = {};
const initialUserAppliedPromotionCode = null;
const initialPromotion = null;
const initialTotal = 0;
const initialPaidSoFar = 0;
const initialPaymentAmounts: ICartPaymentAmounts = { cash: 0, eftpos: 0, online: 0, uberEats: 0, menulog: 0 };
const initialSubTotal = 0;
const initialPayments = [];
const initialTransactionEftposReceipts = "";
const initialIsShownUpSellCrossSellModal = false;
const initialOrderScheduledAt = null;

type ContextProps = {
    // restaurant: IGET_RESTAURANT | null;
    // setRestaurant: (restaurant: IGET_RESTAURANT) => void;
    parkedOrderId: string | null;
    setParkedOrderId: (parkedOrderId: string | null) => void;
    parkedOrderNumber: string | null;
    setParkedOrderNumber: (parkedOrderNumber: string | null) => void;
    orderType: EOrderType | null;
    setOrderType: (orderType: EOrderType) => void;
    paymentMethod: EPaymentMethod | null;
    setPaymentMethod: (paymentMethod: EPaymentMethod | null) => void;
    tableNumber: string | null;
    setTableNumber: (tableNumber: string | null) => void;
    buzzerNumber: string | null;
    setBuzzerNumber: (buzzerNumber: string | null) => void;
    customerInformation: ICustomerInformation | null;
    setCustomerInformation: (customerInformation: ICustomerInformation | null) => void;
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
    total: number;
    subTotal: number;
    paidSoFar: number;
    payments: ICartPayment[];
    setPayments: (payment: ICartPayment[]) => void;
    paymentAmounts: ICartPaymentAmounts;
    setPaymentAmounts: (paymentAmounts: ICartPaymentAmounts) => void;
    transactionEftposReceipts: string;
    setTransactionEftposReceipts: (receipt: string) => void;
    isShownUpSellCrossSellModal: boolean;
    setIsShownUpSellCrossSellModal: (isShownUpSellCrossSellModal: boolean) => void;
    orderScheduledAt: string | null;
    updateOrderScheduledAt: (orderScheduledAt: string | null) => void;
};

const CartContext = createContext<ContextProps>({
    // restaurant: initialRestaurant,
    // setRestaurant: () => {},
    parkedOrderId: initialParkedOrderId,
    setParkedOrderId: () => {},
    parkedOrderNumber: initialParkedOrderNumber,
    setParkedOrderNumber: () => {},
    orderType: initialOrderType,
    setOrderType: () => {},
    paymentMethod: initialPaymentMethod,
    setPaymentMethod: () => {},
    tableNumber: initialTableNumber,
    setTableNumber: () => {},
    buzzerNumber: initialBuzzerNumber,
    setBuzzerNumber: () => {},
    customerInformation: initialCustomerInformation,
    setCustomerInformation: () => {},
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
    total: initialTotal,
    subTotal: initialSubTotal,
    paidSoFar: initialPaidSoFar,
    payments: initialPayments,
    setPayments: () => {},
    paymentAmounts: initialPaymentAmounts,
    setPaymentAmounts: () => {},
    transactionEftposReceipts: initialTransactionEftposReceipts,
    setTransactionEftposReceipts: () => {},
    isShownUpSellCrossSellModal: initialIsShownUpSellCrossSellModal,
    setIsShownUpSellCrossSellModal: () => {},
    orderScheduledAt: initialOrderScheduledAt,
    updateOrderScheduledAt: (orderScheduledAt: string | null) => {},
});

const CartProvider = (props: { children: React.ReactNode }) => {
    const { restaurant } = useRestaurant();

    const [parkedOrderId, _setParkedOrderId] = useState<string | null>(initialParkedOrderId);
    const [parkedOrderNumber, _setParkedOrderNumber] = useState<string | null>(initialParkedOrderNumber);
    const [orderType, _setOrderType] = useState<EOrderType | null>(initialOrderType);
    const [paymentMethod, _setPaymentMethod] = useState<EPaymentMethod | null>(initialPaymentMethod);
    const [tableNumber, _setTableNumber] = useState<string | null>(initialTableNumber);
    const [buzzerNumber, _setBuzzerNumber] = useState<string | null>(initialBuzzerNumber);
    const [customerInformation, _setCustomerInformation] = useState<ICustomerInformation | null>(initialCustomerInformation);
    const [products, _setProducts] = useState<ICartProduct[] | null>(initialProducts);
    const [notes, _setNotes] = useState<string>(initialNotes);
    const [total, _setTotal] = useState<number>(initialTotal);
    const [paymentAmounts, _setPaymentAmounts] = useState<ICartPaymentAmounts>(initialPaymentAmounts);
    const [subTotal, _setSubTotal] = useState<number>(initialSubTotal);
    const [payments, _setPayments] = useState<ICartPayment[]>(initialPayments);
    const [transactionEftposReceipts, _setTransactionEftposReceipts] = useState<string>(initialTransactionEftposReceipts);
    const [isShownUpSellCrossSellModal, _setIsShownUpSellCrossSellModal] = useState<boolean>(initialIsShownUpSellCrossSellModal);

    const [userAppliedPromotionCode, _setUserAppliedPromotionCode] = useState<string | null>(initialUserAppliedPromotionCode);
    const [promotion, _setPromotion] = useState<ICartPromotion | null>(initialPromotion);

    const [cartCategoryQuantitiesById, _setCartCategoryQuantitiesById] = useState<ICartItemQuantitiesById>(initialCartCategoryQuantitiesById);
    const [cartProductQuantitiesById, _setCartProductQuantitiesById] = useState<ICartItemQuantitiesById>(initialCartProductQuantitiesById);
    const [cartModifierQuantitiesById, _setCartModifierQuantitiesById] = useState<ICartItemQuantitiesById>(initialCartModifierQuantitiesById);
    const [availablePromotions, _setAvailablePromotions] = useState<IGET_RESTAURANT_PROMOTION[]>([]);

    const [orderScheduledAt, _setOrderScheduledAt] = useState<string | null>(initialOrderScheduledAt);

    // useEffect(() => {
    //     console.log("xxx...products", products);
    // }, [products]);

    useEffect(() => {
        let newSubTotal = 0;

        if (promotion) {
            newSubTotal = total - promotion.discountedAmount;
        } else {
            newSubTotal = total;
        }

        if (restaurant && restaurant.surchargePercentage) {
            newSubTotal = newSubTotal + Math.round((newSubTotal * restaurant.surchargePercentage) / 100);
        }

        _setSubTotal(newSubTotal);
    }, [total, promotion]);

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
        let bestPromotion: ICartPromotion | null = null;

        availablePromotions.forEach((promotion) => {
            if (!orderType || !promotion.availableOrderTypes) return;
            if (!promotion.availableOrderTypes.includes(EOrderType[orderType])) return;
            if (promotion.totalNumberUsed >= promotion.totalAvailableUses) return;
            if (total < promotion.minSpend) return;
            if (!products) return;

            const discount = getOrderDiscountAmount(promotion, JSON.parse(JSON.stringify(products)), total);

            if (!(discount.discountedAmount > 0)) return;

            if (!bestPromotion || discount.discountedAmount > bestPromotion.discountedAmount) {
                bestPromotion = {
                    discountedAmount: discount.discountedAmount,
                    matchingProducts: discount.matchingProducts,
                    promotion: promotion,
                };
            }
        });

        _setPromotion(bestPromotion);
    }, [cartProductQuantitiesById, cartModifierQuantitiesById, availablePromotions, orderType]);

    const setUserAppliedPromotion = (promotion: IGET_RESTAURANT_PROMOTION): CheckIfPromotionValidResponse => {
        const status = checkIfPromotionValid(promotion);

        if (status !== CheckIfPromotionValidResponse.VALID) return status;

        _setAvailablePromotions([promotion]);
        _setUserAppliedPromotionCode(promotion.code);

        return CheckIfPromotionValidResponse.VALID;
    };

    const removeUserAppliedPromotion = () => {
        _setUserAppliedPromotionCode(null);
        _setAvailablePromotions([]);
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
                    const modifiers: {
                        id: string;
                        quantity: number;
                        price: number;
                    }[] = [];

                    product.modifierGroups.forEach((modifierGroup) => {
                        modifierGroup.modifiers.forEach((modifier) => {
                            modifiers.push({ id: modifier.id, quantity: modifier.quantity, price: modifier.price });
                        });
                    });
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
                                id: product.id,
                                name: product.name,
                                quantity: product.quantity,
                                price: product.price,
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
                                        const changedQuantity = orderedProductModifierModifier.quantity - orderedProductModifierModifier.preSelectedQuantity;

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

    const setOrderType = (orderType: EOrderType) => {
        _setOrderType(orderType);
    };

    const setPaymentMethod = (paymentMethod: EPaymentMethod | null) => {
        _setPaymentMethod(paymentMethod);
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

    const setProducts = (products: ICartProduct[]) => {
        _setProducts(products);
        _setTotal(recalculateTotal(products));
        updateCartQuantities(products);
    };

    const addProduct = (product: ICartProduct) => {
        let newProducts = products;

        if (newProducts != null) {
            newProducts.push(product);
        } else {
            newProducts = [product];
        }

        _setProducts(newProducts);
        _setTotal(recalculateTotal(newProducts));
        updateCartQuantities(newProducts);
    };

    const updateProduct = (index: number, product: ICartProduct) => {
        // should never really end up here
        if (products == null) return;

        const newProducts = products;
        newProducts[index] = product;

        _setProducts(newProducts);
        _setTotal(recalculateTotal(newProducts));
        updateCartQuantities(newProducts);
    };

    const updateProductQuantity = (index: number, quantity: number) => {
        // should never really end up here
        if (products == null) return;

        const newProducts = products;
        const productAtIndex = newProducts[index];

        productAtIndex.quantity = quantity;
        newProducts[index] = productAtIndex;

        _setProducts(newProducts);
        _setTotal(recalculateTotal(newProducts));
        updateCartQuantities(newProducts);
    };

    const applyProductDiscount = (index: number, discount: number) => {
        // should never really end up here
        if (products == null) return;

        const newProducts = products;
        const productAtIndex = newProducts[index];

        productAtIndex.discount = discount;
        newProducts[index] = productAtIndex;

        _setProducts(newProducts);
        _setTotal(recalculateTotal(newProducts));
        updateCartQuantities(newProducts);
    };

    const deleteProduct = (index: number) => {
        // should never really end up here
        if (products == null) return;

        let newProducts = products;
        newProducts.splice(index, 1);

        _setProducts(newProducts);
        _setTotal(recalculateTotal(newProducts));
        updateCartQuantities(newProducts);
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

    const setTransactionEftposReceipts = (receipt: string) => {
        _setTransactionEftposReceipts(receipt);
    };

    const setIsShownUpSellCrossSellModal = (isShownUpSellCrossSellModal: boolean) => {
        _setIsShownUpSellCrossSellModal(isShownUpSellCrossSellModal);
    };

    const updateOrderScheduledAt = (orderScheduledAt: string | null) => {
        _setOrderScheduledAt(orderScheduledAt);
    };

    const clearCart = () => {
        _setParkedOrderId(initialParkedOrderId);
        _setParkedOrderNumber(initialParkedOrderNumber);
        _setOrderType(initialOrderType);
        _setTableNumber(initialTableNumber);
        _setBuzzerNumber(initialBuzzerNumber);
        _setCustomerInformation(initialCustomerInformation);
        _setBuzzerNumber(initialBuzzerNumber);
        _setBuzzerNumber(initialBuzzerNumber);
        _setPaymentMethod(initialPaymentMethod);
        _setProducts(initialProducts);
        _setNotes(initialNotes);
        _setCartCategoryQuantitiesById(initialCartCategoryQuantitiesById);
        _setCartProductQuantitiesById(initialCartProductQuantitiesById);
        _setCartModifierQuantitiesById(initialCartModifierQuantitiesById);
        _setUserAppliedPromotionCode(initialUserAppliedPromotionCode);
        _setPromotion(initialPromotion);
        _setTotal(initialTotal);
        _setPaymentAmounts(initialPaymentAmounts);
        _setSubTotal(initialSubTotal);
        _setPayments(initialPayments);
        _setTransactionEftposReceipts(initialTransactionEftposReceipts);
        _setIsShownUpSellCrossSellModal(initialIsShownUpSellCrossSellModal);
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
                orderType: orderType,
                setOrderType: setOrderType,
                paymentMethod: paymentMethod,
                setPaymentMethod: setPaymentMethod,
                tableNumber: tableNumber,
                setTableNumber: setTableNumber,
                buzzerNumber: buzzerNumber,
                setBuzzerNumber: setBuzzerNumber,
                customerInformation: customerInformation,
                setCustomerInformation: setCustomerInformation,
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
                total: total,
                subTotal: subTotal,
                paidSoFar: paymentAmounts.cash + paymentAmounts.eftpos + paymentAmounts.online + paymentAmounts.uberEats + paymentAmounts.menulog,
                paymentAmounts: paymentAmounts,
                setPaymentAmounts: setPaymentAmounts,
                payments: payments,
                setPayments: setPayments,
                transactionEftposReceipts: transactionEftposReceipts,
                setTransactionEftposReceipts: setTransactionEftposReceipts,
                isShownUpSellCrossSellModal: isShownUpSellCrossSellModal,
                setIsShownUpSellCrossSellModal: setIsShownUpSellCrossSellModal,
                orderScheduledAt: orderScheduledAt,
                updateOrderScheduledAt: updateOrderScheduledAt,
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
