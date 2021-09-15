import { isWithinInterval } from "date-fns";
import { createContext, useContext, useEffect, useState } from "react";
import { EDiscountType, EPromotionType, ERegisterType, IGET_DASHBOARD_PROMOTION } from "../graphql/customQueries";

import { ICartProduct, EOrderType, ICartItemQuantitiesById, ICartPromotion } from "../model/model";
import { isPromotionAvailable } from "../util/util";
import { useRestaurant } from "./restaurant-context";

const initialOrderType = null;
const initialTableNumber = null;
const initialProducts = null;
const initialNotes = "";
const initialCartProductQuantitiesById = {};
const initialCartModifierQuantitiesById = {};
const initialPromotion = null;
const initialTotal = 0;
const initialSubTotal = 0;

type ContextProps = {
    // restaurant: IGET_RESTAURANT | null;
    // setRestaurant: (restaurant: IGET_RESTAURANT) => void;
    orderType: EOrderType | null;
    setOrderType: (orderType: EOrderType) => void;
    tableNumber: string | null;
    setTableNumber: (tableNumber: string) => void;
    products: ICartProduct[] | null;
    cartProductQuantitiesById: ICartItemQuantitiesById;
    cartModifierQuantitiesById: ICartItemQuantitiesById;
    addItem: (product: ICartProduct) => void;
    updateItem: (index: number, product: ICartProduct) => void;
    updateItemQuantity: (index: number, quantity: number) => void;
    deleteItem: (index: number) => void; // has a index input because multiple products in cart could have the same id
    clearCart: () => void;
    notes: string;
    setNotes: (notes: string) => void;
    promotion: ICartPromotion | null;
    total: number;
    subTotal: number;
};

const CartContext = createContext<ContextProps>({
    // restaurant: initialRestaurant,
    // setRestaurant: () => {},
    orderType: initialOrderType,
    setOrderType: () => {},
    tableNumber: initialTableNumber,
    setTableNumber: () => {},
    products: initialProducts,
    cartProductQuantitiesById: {},
    cartModifierQuantitiesById: {},
    addItem: () => {},
    updateItem: () => {},
    updateItemQuantity: () => {},
    deleteItem: () => {},
    clearCart: () => {},
    notes: initialNotes,
    setNotes: () => {},
    promotion: initialPromotion,
    total: initialTotal,
    subTotal: initialSubTotal,
});

const CartProvider = (props: { children: React.ReactNode }) => {
    const { restaurant } = useRestaurant();

    // const [restaurant, _setRestaurant] = useState<IGET_RESTAURANT | null>(initialRestaurant);
    const [orderType, _setOrderType] = useState<EOrderType | null>(initialOrderType);
    const [tableNumber, _setTableNumber] = useState<string | null>(initialTableNumber);
    const [products, _setProducts] = useState<ICartProduct[] | null>(initialProducts);
    const [notes, _setNotes] = useState<string>(initialNotes);
    const [total, _setTotal] = useState<number>(initialTotal);
    const [subTotal, _setSubTotal] = useState<number>(initialSubTotal);
    const [promotion, _setPromotion] = useState<ICartPromotion | null>(initialPromotion);

    const [cartProductQuantitiesById, _setCartProductQuantitiesById] = useState<ICartItemQuantitiesById>(initialCartProductQuantitiesById);
    const [cartModifierQuantitiesById, _setCartModifierQuantitiesById] = useState<ICartItemQuantitiesById>(initialCartModifierQuantitiesById);
    const [availablePromotions, _setAvailablePromotions] = useState<IGET_DASHBOARD_PROMOTION[]>([]);

    console.log("xxx...promotion", promotion);
    console.log("xxx...availablePromotions", availablePromotions);

    useEffect(() => {
        if (promotion) {
            _setSubTotal(total - promotion.discount);
        } else {
            _setSubTotal(total);
        }
    }, [total, promotion]);

    useEffect(() => {
        const now = new Date();

        const availPromotions: IGET_DASHBOARD_PROMOTION[] = [];

        restaurant &&
            restaurant.promotions.items.forEach((promotion) => {
                // if (!promotion.autoApply) return;

                // const platform = process.env.REACT_APP_PLATFORM;

                // if (!platform || !promotion.availablePlatforms) return;
                // if (!promotion.availablePlatforms.includes(ERegisterType[platform])) return;

                // const startDate = new Date(promotion.startDate);
                // const endDate = new Date(promotion.endDate);

                // const isWithin = isWithinInterval(now, { start: startDate, end: endDate });

                // if (!isWithin) return;

                // const isAvailable = promotion.availability && isPromotionAvailable(promotion.availability);

                // if (!isAvailable) return;

                availPromotions.push(promotion);
            });

        _setAvailablePromotions(availPromotions);
    }, [restaurant]);

    const getEntireOrderDiscountAmount = (promotion: IGET_DASHBOARD_PROMOTION, total: number) => {
        let discountedAmount = 0;

        promotion.discounts.items.forEach((discount) => {
            switch (discount.type) {
                case EDiscountType.FIXED:
                    discountedAmount = discount.amount;
                    break;
                case EDiscountType.PERCENTAGE:
                    discountedAmount = (total * discount.amount) / 100;
                    break;
                case EDiscountType.SETPRICE:
                    discountedAmount = total - discount.amount;
                    break;
                default:
                    break;
            }
        });

        return discountedAmount;
    };

    useEffect(() => {
        // console.log("xxx...cartProductQuantitiesById", cartProductQuantitiesById);
        // console.log("xxx...cartModifierQuantitiesById", cartModifierQuantitiesById);

        if (availablePromotions.length == 0) return;
        if (!products || products.length == 0) return;

        let bestPromotion: ICartPromotion | null = null;

        availablePromotions.forEach((promotion) => {
            // if (!orderType || !promotion.availableOrderTypes) return;
            // if (!promotion.availableOrderTypes.includes(ERegisterType[orderType])) return;

            if (total < promotion.minSpend) return;

            let discountAmount = 0;

            switch (promotion.type) {
                case EPromotionType.COMBO:
                    break;
                case EPromotionType.ENTIREORDER:
                    discountAmount = getEntireOrderDiscountAmount(promotion, total);
                    break;
                case EPromotionType.RELATEDITEMS:
                    break;
                default:
                    break;
            }

            if (!bestPromotion || discountAmount > bestPromotion.discount) {
                bestPromotion = {
                    discount: discountAmount,
                    promotion: promotion,
                };
            }
        });

        _setPromotion(bestPromotion);

        console.log("yyy...bestPromotion", bestPromotion);
    }, [cartProductQuantitiesById, cartModifierQuantitiesById, availablePromotions]);

    const updateCartQuantities = (products: ICartProduct[] | null) => {
        const newCartProductQuantitiesById = {};
        const newCartModifierQuantitiesById = {};

        products &&
            products.forEach((product) => {
                //We do this because there could be the same product in the products array twice.
                if (newCartProductQuantitiesById[product.id]) {
                    newCartProductQuantitiesById[product.id] += product.quantity;
                } else {
                    newCartProductQuantitiesById[product.id] = product.quantity;
                }

                product.modifierGroups.forEach((modifierGroup) => {
                    modifierGroup.modifiers.forEach((modifier) => {
                        if (modifier.productModifier) {
                            if (newCartProductQuantitiesById[modifier.productModifier.id]) {
                                newCartProductQuantitiesById[modifier.productModifier.id] += product.quantity * modifier.quantity;
                            } else {
                                newCartProductQuantitiesById[modifier.productModifier.id] = product.quantity * modifier.quantity;
                            }
                        } else {
                            if (newCartModifierQuantitiesById[modifier.id]) {
                                newCartModifierQuantitiesById[modifier.id] += product.quantity * modifier.quantity;
                            } else {
                                newCartModifierQuantitiesById[modifier.id] = product.quantity * modifier.quantity;
                            }
                        }
                    });
                });
            });

        _setCartProductQuantitiesById(newCartProductQuantitiesById);
        _setCartModifierQuantitiesById(newCartModifierQuantitiesById);
    };

    const recalculateTotal = (products: ICartProduct[] | null) => {
        let totalPrice = 0;

        products &&
            products.forEach((p) => {
                totalPrice += p.price * p.quantity;
                p.modifierGroups.forEach((mg) => {
                    mg.modifiers.forEach((m) => {
                        const changedQuantity = m.quantity - m.preSelectedQuantity;

                        if (changedQuantity > 0) {
                            totalPrice += m.price * changedQuantity * p.quantity;
                        }
                    });
                });
            });

        return totalPrice;
    };

    const setOrderType = (orderType: EOrderType) => {
        _setOrderType(orderType);
    };

    const setTableNumber = (tableNumber: string) => {
        _setTableNumber(tableNumber);
    };

    const addItem = (product: ICartProduct) => {
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

    const updateItem = (index: number, product: ICartProduct) => {
        if (products == null) {
            // should never really end up here
            return;
        }

        const newProducts = products;
        newProducts[index] = product;

        _setProducts(newProducts);
        _setTotal(recalculateTotal(newProducts));
        updateCartQuantities(newProducts);
    };

    const updateItemQuantity = (index: number, quantity: number) => {
        if (products == null) {
            // should never really end up here
            return;
        }

        const newProducts = products;
        const productAtIndex = newProducts[index];

        productAtIndex.quantity = quantity;
        newProducts[index] = productAtIndex;

        _setProducts(newProducts);
        _setTotal(recalculateTotal(newProducts));
        updateCartQuantities(newProducts);
    };

    const deleteItem = (index: number) => {
        if (products == null) {
            // should never really end up here
            return;
        }

        let newProducts = products;
        newProducts.splice(index, 1);

        _setProducts(newProducts);
        _setTotal(recalculateTotal(newProducts));
        updateCartQuantities(newProducts);
    };

    const clearCart = () => {
        // _setRestaurant(initialRestaurant);
        _setOrderType(initialOrderType);
        _setProducts(initialProducts);
        _setNotes(initialNotes);
        _setTotal(initialTotal);
        _setTableNumber(initialTableNumber);
        _setCartProductQuantitiesById(initialCartProductQuantitiesById);
        _setCartModifierQuantitiesById(initialCartModifierQuantitiesById);
    };

    const setNotes = (notes: string) => {
        _setNotes(notes);
    };

    return (
        <CartContext.Provider
            value={{
                // restaurant: restaurant,
                // setRestaurant: setRestaurant,
                orderType: orderType,
                setOrderType: setOrderType,
                tableNumber: tableNumber,
                setTableNumber: setTableNumber,
                products: products,
                cartProductQuantitiesById: cartProductQuantitiesById,
                cartModifierQuantitiesById: cartModifierQuantitiesById,
                addItem: addItem,
                updateItem: updateItem,
                updateItemQuantity: updateItemQuantity,
                deleteItem: deleteItem,
                clearCart: clearCart,
                notes: notes,
                setNotes: setNotes,
                promotion: promotion,
                total: total,
                subTotal: subTotal,
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
