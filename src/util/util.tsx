import { format, getDay, isWithinInterval } from "date-fns";
import { IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT } from "../graphql/customFragments";
import {
    EDiscountType,
    ERegisterType,
    IGET_RESTAURANT_PROMOTION,
    IGET_RESTAURANT_PROMOTION_DISCOUNT,
    IGET_RESTAURANT_PROMOTION_ITEMS,
    IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS,
    IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES,
    IGET_RESTAURANT_PROMOTION_AVAILABILITY,
    IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES,
    IGET_RESTAURANT_REGISTER_PRINTER,
} from "../graphql/customQueries";
import {
    CheckIfPromotionValidResponse,
    ICartItemQuantitiesById,
    ICartItemQuantitiesByIdValue,
    ICartModifier,
    ICartModifierGroup,
    ICartProduct,
} from "../model/model";

export const convertDollarsToCents = (price: number) => (price * 100).toFixed(0);

export const convertDollarsToCentsReturnInt = (price: number) => parseInt((price * 100).toFixed(0));

export const convertCentsToDollars = (price: number) => (price / 100).toFixed(2);

export const convertCentsToDollarsReturnFloat = (price: number) => parseFloat((price / 100).toFixed(2));

export const getDollarString = (price: number) => `$${convertCentsToDollars(price)}`;

export const getOrderNumber = (orderNumberSuffix: string) => {
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

    return orderNumber + (orderNumberSuffix || "");
};

export const filterPrintProducts = (products: IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT[], printer: IGET_RESTAURANT_REGISTER_PRINTER) => {
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

export const isItemSoldOut = (soldOut?: boolean, soldOutDate?: string) => {
    if (soldOut || soldOutDate == format(new Date(), "yyyy-MM-dd")) {
        return true;
    }

    return false;
};

export const isPromotionAvailable = (availability?: IGET_RESTAURANT_PROMOTION_AVAILABILITY) => {
    if (!availability) return true;

    const dayTimes: IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES[] = getPromotionDayData(availability);

    if (dayTimes.length == 0) return true;

    const currentDateTime = new Date();
    let isWithinTimeSlot = false;

    dayTimes.forEach((timeSlot) => {
        let startDateTime = new Date(
            currentDateTime.getFullYear(),
            currentDateTime.getMonth(),
            currentDateTime.getDate(),
            parseInt(timeSlot.startTime.split(":")[0]),
            parseInt(timeSlot.startTime.split(":")[1]),
            0,
            0
        );
        let endDateTime = new Date(
            currentDateTime.getFullYear(),
            currentDateTime.getMonth(),
            currentDateTime.getDate(),
            parseInt(timeSlot.endTime.split(":")[0]),
            parseInt(timeSlot.endTime.split(":")[1]),
            0,
            0
        );

        const isWithin = isWithinInterval(currentDateTime, { start: startDateTime, end: endDateTime });

        if (isWithin && !isWithinTimeSlot) {
            isWithinTimeSlot = true;
        }
    });

    return isWithinTimeSlot;
};

export const isItemAvailable = (availability?: IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS) => {
    if (!availability) return true;

    const dayTimes: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[] = getDayData(availability);

    if (dayTimes.length == 0) return true;

    const currentDateTime = new Date();
    let isWithinTimeSlot = false;

    dayTimes.forEach((timeSlot) => {
        let startDateTime = new Date(
            currentDateTime.getFullYear(),
            currentDateTime.getMonth(),
            currentDateTime.getDate(),
            parseInt(timeSlot.startTime.split(":")[0]),
            parseInt(timeSlot.startTime.split(":")[1]),
            0,
            0
        );
        let endDateTime = new Date(
            currentDateTime.getFullYear(),
            currentDateTime.getMonth(),
            currentDateTime.getDate(),
            parseInt(timeSlot.endTime.split(":")[0]),
            parseInt(timeSlot.endTime.split(":")[1]),
            0,
            0
        );

        const isWithin = isWithinInterval(currentDateTime, { start: startDateTime, end: endDateTime });

        if (isWithin && !isWithinTimeSlot) {
            isWithinTimeSlot = true;
        }
    });

    return isWithinTimeSlot;
};

export const getProductQuantityAvailable = (
    menuProductItem: {
        id: string;
        totalQuantityAvailable: number;
    },
    cartProducts: ICartItemQuantitiesById
) => {
    let quantityAvailable = menuProductItem.totalQuantityAvailable;

    if (cartProducts[menuProductItem.id] != undefined) {
        quantityAvailable -= cartProducts[menuProductItem.id].quantity;
    }

    return quantityAvailable;
};

export const isProductQuantityAvailable = (
    menuProductItem: {
        id: string;
        totalQuantityAvailable?: number;
    },
    cartProducts: ICartItemQuantitiesById
) => {
    if (!menuProductItem.totalQuantityAvailable) return true;

    const productQuantityAvailable = getProductQuantityAvailable(
        { id: menuProductItem.id, totalQuantityAvailable: menuProductItem.totalQuantityAvailable },
        cartProducts
    );

    return productQuantityAvailable > 0;
};

export const getModifierQuantityAvailable = (
    menuModifierItem: {
        id: string;
        totalQuantityAvailable: number;
    },
    cartModifiers: ICartItemQuantitiesById
) => {
    let quantityAvailable = menuModifierItem.totalQuantityAvailable;

    if (cartModifiers[menuModifierItem.id] != undefined) {
        quantityAvailable -= cartModifiers[menuModifierItem.id].quantity;
    }

    return quantityAvailable;
};

export const isModifierQuantityAvailable = (
    menuModifierItem: {
        id: string;
        totalQuantityAvailable?: number;
    },
    cartModifiers: ICartItemQuantitiesById
) => {
    if (!menuModifierItem.totalQuantityAvailable) return true;

    const modifierQuantityAvailable = getModifierQuantityAvailable(
        { id: menuModifierItem.id, totalQuantityAvailable: menuModifierItem.totalQuantityAvailable },
        cartModifiers
    );

    return modifierQuantityAvailable > 0;
};

export const getQuantityRemainingText = (quantityRemaining: number) => {
    if (quantityRemaining == 1) {
        return "Last one!";
    } else {
        return `${quantityRemaining} left!`;
    }
};

const getPromotionDayData = (availability: IGET_RESTAURANT_PROMOTION_AVAILABILITY) => {
    const day: number = getDay(new Date());

    switch (day) {
        case 1:
            return availability.monday;
        case 2:
            return availability.tuesday;
        case 3:
            return availability.wednesday;
        case 4:
            return availability.thursday;
        case 5:
            return availability.friday;
        case 6:
            return availability.saturday;
        case 0: //0 is sunday in date-fns
            return availability.sunday;
        default:
            return [];
    }
};

const getDayData = (availability: IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS) => {
    const day: number = getDay(new Date());

    switch (day) {
        case 1:
            return availability.monday;
        case 2:
            return availability.tuesday;
        case 3:
            return availability.wednesday;
        case 4:
            return availability.thursday;
        case 5:
            return availability.friday;
        case 6:
            return availability.saturday;
        case 0: //0 is sunday in date-fns
            return availability.sunday;
        default:
            return [];
    }
};

export const toLocalISOString = (date: Date) => {
    const pad = (num: number) => {
        var norm = Math.floor(Math.abs(num));
        return (norm < 10 ? "0" : "") + norm;
    };

    return (
        date.getFullYear() +
        "-" +
        pad(date.getMonth() + 1) +
        "-" +
        pad(date.getDate()) +
        "T" +
        pad(date.getHours()) +
        ":" +
        pad(date.getMinutes()) +
        ":" +
        pad(date.getSeconds()) +
        "." +
        pad(date.getMilliseconds())
    );
};

export const toDataURL = (url, callback) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
        const reader = new FileReader();

        reader.onloadend = () => {
            callback(reader.result);
        };

        reader.readAsDataURL(xhr.response);
    };

    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.send();
};

export const checkIfPromotionValid = (promotion: IGET_RESTAURANT_PROMOTION): CheckIfPromotionValidResponse => {
    const now = new Date();

    const platform = process.env.REACT_APP_PLATFORM;

    if (!platform || !promotion.availablePlatforms) return CheckIfPromotionValidResponse.INVALID_PLATFORM;
    if (!promotion.availablePlatforms.includes(ERegisterType[platform])) return CheckIfPromotionValidResponse.INVALID_PLATFORM;

    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);

    const isWithin = isWithinInterval(now, { start: startDate, end: endDate });

    if (!isWithin) return CheckIfPromotionValidResponse.EXPIRED;

    const isAvailable = promotion.availability && isPromotionAvailable(promotion.availability);

    if (!isAvailable) return CheckIfPromotionValidResponse.UNAVAILABLE;

    return CheckIfPromotionValidResponse.VALID;
};

export const getMatchingPromotionProducts = (
    cartCategoryQuantitiesById: ICartItemQuantitiesById,
    cartProductQuantitiesById: ICartItemQuantitiesById,
    promotionItems: IGET_RESTAURANT_PROMOTION_ITEMS[],
    applyToCheapest: boolean
) => {
    //For promotions with multiple item groups, it would become a && condition. For example, if first group is category: Vege Pizza (min quantity = 2).
    //And second group is category: Sides (min quantity = 1.
    //Then the user would need to select at least 2 Vege Pizza AND a side to get the discount

    let matchingProducts: ICartItemQuantitiesById = {};
    let matchingCondition = true;

    promotionItems.forEach((item) => {
        if (!matchingCondition) return;

        const matchingProductsTemp: ICartItemQuantitiesByIdValue[] = [];
        let quantityCounted = 0;

        item.categories.items.forEach((c) => {
            if (cartCategoryQuantitiesById[c.id]) {
                quantityCounted += cartCategoryQuantitiesById[c.id].quantity;

                Object.values(cartProductQuantitiesById).forEach((p) => {
                    if (p.categoryId == cartCategoryQuantitiesById[c.id].id) {
                        matchingProductsTemp.push(p);
                    }
                });
            }
        });

        item.products.items.forEach((p) => {
            if (cartProductQuantitiesById[p.id]) {
                quantityCounted += cartProductQuantitiesById[p.id].quantity;

                matchingProductsTemp.push(cartProductQuantitiesById[p.id]);
            }
        });

        if (quantityCounted < item.minQuantity) {
            //Didn't match the condition
            matchingCondition = false;
        } else {
            //Sort by price and get the lowest item.minQuantity
            const matchingProductsTempCpy: ICartItemQuantitiesByIdValue[] = [...matchingProductsTemp];

            const matchingProductsTempCpySorted = matchingProductsTempCpy.sort((a, b) => {
                if (applyToCheapest) {
                    return a.price > b.price ? 1 : -1;
                } else {
                    //reverse sort: largest to smallest
                    return a.price > b.price ? -1 : 1;
                }
            });

            let counter = item.minQuantity;

            matchingProductsTempCpySorted.forEach((p) => {
                if (counter == 0) return;

                const quantity = p.quantity;

                if (counter > quantity) {
                    matchingProducts[p.id] = p;
                    counter -= quantity;
                } else {
                    matchingProducts[p.id] = { ...p, quantity: counter };
                    counter = 0;
                }
            });
        }
    });

    return matchingCondition ? matchingProducts : null;
};

export const processPromotionDiscounts = (
    cartCategoryQuantitiesById: ICartItemQuantitiesById,
    cartProductQuantitiesById: ICartItemQuantitiesById,
    discounts: IGET_RESTAURANT_PROMOTION_DISCOUNT[],
    matchingProducts: ICartItemQuantitiesById = {},
    total: number = 0,
    applyToCheapest: boolean = false
) => {
    let maxDiscountedAmount = 0;
    let totalDiscountableAmount = 0;

    if (total) {
        totalDiscountableAmount = total;
    } else {
        if (!matchingProducts)
            return {
                matchingProducts: {},
                discountedAmount: 0,
            };

        Object.values(matchingProducts).forEach((p) => {
            totalDiscountableAmount += p.price * p.quantity;
        });
    }

    discounts.forEach((discount) => {
        let discountedAmount = 0;

        let matchingDiscountProducts: ICartItemQuantitiesById | null = null;

        //For related items promotion
        if (discount.items && discount.items.items.length > 0) {
            //Reset discountable amount because we want to discount the matchingDiscountProducts not the original matchingProducts
            totalDiscountableAmount = 0;
            matchingDiscountProducts = getMatchingPromotionProducts(
                cartCategoryQuantitiesById,
                cartProductQuantitiesById,
                discount.items.items,
                applyToCheapest
            );

            if (!matchingDiscountProducts)
                return {
                    matchingProducts: {},
                    discountedAmount: 0,
                };

            matchingProducts = { ...matchingProducts, ...matchingDiscountProducts };

            Object.values(matchingDiscountProducts).forEach((p) => {
                totalDiscountableAmount += p.price * p.quantity;
            });
        }

        switch (discount.type) {
            case EDiscountType.FIXED:
                discountedAmount = discount.amount;
                break;
            case EDiscountType.PERCENTAGE:
                discountedAmount = (totalDiscountableAmount * discount.amount) / 100;
                break;
            case EDiscountType.SETPRICE:
                discountedAmount = totalDiscountableAmount - discount.amount;
                break;
            default:
                break;
        }

        if (maxDiscountedAmount < discountedAmount) {
            maxDiscountedAmount = discountedAmount;
        }
    });

    return {
        matchingProducts: matchingProducts,
        discountedAmount: maxDiscountedAmount,
    };
};

export const convertProductTypesForPrint = (products: IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT[]): ICartProduct[] => {
    const convertedP: ICartProduct[] = [];

    products.forEach((p) => {
        const convertedMG: ICartModifierGroup[] = [];

        p.modifierGroups &&
            p.modifierGroups.forEach((mg) => {
                const convertedM: ICartModifier[] = [];

                mg.modifiers.forEach((m) => {
                    const converted_PM_P: ICartProduct[] = [];

                    m.productModifiers &&
                        m.productModifiers.forEach((pm_p) => {
                            const converted_PM_MG: ICartModifierGroup[] = [];

                            pm_p.modifierGroups &&
                                pm_p.modifierGroups.forEach((pm_mg) => {
                                    const converted_PM_M: ICartModifier[] = [];

                                    pm_mg.modifiers.forEach((pm_m) => {
                                        converted_PM_M.push({
                                            id: pm_m.id,
                                            name: pm_m.name,
                                            price: pm_m.price,
                                            preSelectedQuantity: pm_m.preSelectedQuantity,
                                            quantity: pm_m.quantity,
                                            productModifiers: null,
                                            image: pm_m.image,
                                        });
                                    });

                                    converted_PM_MG.push({
                                        id: pm_mg.id,
                                        name: pm_mg.name,
                                        choiceDuplicate: pm_mg.choiceDuplicate,
                                        choiceMin: pm_mg.choiceMin,
                                        choiceMax: pm_mg.choiceMax,
                                        hideForCustomer: pm_mg.hideForCustomer,
                                        modifiers: converted_PM_M,
                                    });
                                });

                            converted_PM_P.push({
                                id: pm_p.id,
                                name: pm_p.name,
                                price: pm_p.price,
                                discount: pm_p.discount,
                                image: pm_p.image,
                                quantity: pm_p.quantity,
                                notes: pm_p.notes,
                                category: pm_p.category
                                    ? {
                                          id: pm_p.category.id,
                                          name: pm_p.category.name,
                                          image: pm_p.category.image,
                                      }
                                    : {
                                          id: "invalid",
                                          name: "invalid",
                                          image: null,
                                      },
                                modifierGroups: converted_PM_MG,
                            });
                        });

                    convertedM.push({
                        id: m.id,
                        name: m.name,
                        price: m.price,
                        preSelectedQuantity: m.preSelectedQuantity,
                        quantity: m.quantity,
                        productModifiers: converted_PM_P,
                        image: m.image,
                    });
                });

                convertedMG.push({
                    id: mg.id,
                    name: mg.name,
                    choiceDuplicate: mg.choiceDuplicate,
                    choiceMin: mg.choiceMin,
                    choiceMax: mg.choiceMax,
                    hideForCustomer: mg.hideForCustomer,
                    modifiers: convertedM,
                });
            });

        convertedP.push({
            id: p.id,
            name: p.name,
            price: p.price,
            discount: p.discount,
            image: p.image,
            quantity: p.quantity,
            notes: p.notes,
            category: p.category
                ? {
                      id: p.category.id,
                      name: p.category.name,
                      image: p.category.image,
                  }
                : {
                      id: "invalid",
                      name: "invalid",
                      image: null,
                  },
            modifierGroups: convertedMG,
        });
    });

    return convertedP;
};

export const downloadFile = (blob: Blob, fileName: string, extention: string) => {
    var fileURL = window.URL.createObjectURL(blob);

    var fileLink = document.createElement("a");
    fileLink.href = fileURL;
    fileLink.setAttribute("download", `${fileName}${extention}`);
    fileLink.click();
};
