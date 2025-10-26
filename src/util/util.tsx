import { eachMinuteOfInterval, format, getDay, isAfter, isWithinInterval, startOfDay } from "date-fns";
import { addDays, isEqual } from "date-fns";
import { IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT } from "../graphql/customFragments";
import {
    EDiscountType,
    EOrderType,
    ERegisterType,
    IGET_RESTAURANT_PROMOTION,
    IGET_RESTAURANT_PROMOTION_DISCOUNT,
    IGET_RESTAURANT_PROMOTION_ITEMS,
    IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS,
    IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES,
    IGET_RESTAURANT_PROMOTION_AVAILABILITY,
    IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES,
    IGET_RESTAURANT_REGISTER_PRINTER,
    IGET_RESTAURANT_ADVERTISEMENT_AVAILABILITY_HOURS,
    IGET_RESTAURANT_ADVERTISEMENT_AVAILABILITY_TIMES,
    IGET_RESTAURANT_OPERATING_HOURS,
    IGET_RESTAURANT_OPERATING_HOURS_TIME_SLOT,
    EPromotionType,
    ELOYALTY_ACTION,
} from "../graphql/customQueries";
import {
    CheckIfPromotionValidResponse,
    ICartItemQuantitiesById,
    ICartItemQuantitiesByIdValue,
    ICartModifier,
    ICartModifierGroup,
    ICartProduct,
    ICartPromotion,
} from "../model/model";

export const taxRates = {
    nz: 0.15,
    au: 0.1,
};

export const calculateTaxAmount = (country: string, total: number) => {
    const rate = taxRates[country] ?? taxRates.nz; // Default NZ
    return total - total / (1 + rate);
};

export const convertDollarsToCents = (price: number) => (price * 100).toFixed(0);

export const convertDollarsToCentsReturnInt = (price: number) => parseInt((price * 100).toFixed(0));

export const convertCentsToDollars = (price: number) => (price / 100).toFixed(2);

export const convertCentsToDollarsReturnFloat = (price: number) => parseFloat((price / 100).toFixed(2));

export const getDollarString = (price: number) => `$${convertCentsToDollars(price)}`;

export const isVideoFile = (filename) => {
    var videoExtensions = ["mp4", "m4v", "mov", "avi", "wmv", "flv", "webm"];
    var ext = filename.split(".").pop().toLowerCase();
    return videoExtensions.includes(ext);
};

export const getOrderNumber = (orderNumberSuffix: string, orderNumberStart: number) => {
    let todayDate = format(new Date(), "dd/MM/yyyy");

    let orderNumberStored: string | null = localStorage.getItem("orderNumber");
    let orderNumberDateStored: string | null = localStorage.getItem("orderNumberDate");

    let orderNumber: number;

    if (todayDate == orderNumberDateStored) {
        orderNumber = Number(orderNumberStored) + 1;

        localStorage.setItem("orderNumber", String(orderNumber));
    } else {
        orderNumber = 1;
        localStorage.setItem("orderNumber", String(orderNumber));
        localStorage.setItem("orderNumberDate", todayDate);
    }

    const orderNumberWithStart = orderNumberStart + orderNumber;

    return String(orderNumberWithStart) + (orderNumberSuffix || "");
};

export const filterPrintProducts = (products: IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT[], printer: IGET_RESTAURANT_REGISTER_PRINTER) => {
    if (
        (!printer.ignoreCategories || printer.ignoreCategories.items.length == 0) &&
        (!printer.ignoreProducts || printer.ignoreProducts.items.length == 0)
    )
        return products;

    products.forEach((product) => {
        printer.ignoreCategories.items.forEach((ignoreCategory) => {
            if (product.category && product.category.id === ignoreCategory.category.id) {
                products = products.filter((p) => p.category && p.category.id != ignoreCategory.category.id);
            }
        });

        printer.ignoreProducts.items.forEach((ignoreProduct) => {
            if (ignoreProduct.product.id === product.id) {
                products = products.filter((p) => p.id != ignoreProduct.product.id);
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

export const isOrderTypeAllowed = (orderType: EOrderType | null, availableOrderTypes?: EOrderType[] | null) => {
    if (!orderType) return true;
    if (!availableOrderTypes || availableOrderTypes.length === 0) return true;
    return availableOrderTypes.includes(orderType);
};

export const isPromotionAvailable = (availability?: IGET_RESTAURANT_PROMOTION_AVAILABILITY) => {
    if (!availability) return true;

    const dayTimes: IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES[] | null = getPromotionDayData(availability);

    if (dayTimes?.length == 0) return true;

    const currentDateTime = new Date();
    let isWithinTimeSlot = false;

    dayTimes?.forEach((timeSlot) => {
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

        //Check if endDateTime is set for 12:00AM, if it is add one day because it should be start of next day.
        if (isEqual(endDateTime, startOfDay(endDateTime))) {
            endDateTime = addDays(endDateTime, 1);
        }

        const isWithin = isWithinInterval(currentDateTime, {
            start: startDateTime,
            end: endDateTime,
        });

        if (isWithin && !isWithinTimeSlot) {
            isWithinTimeSlot = true;
        }
    });

    return isWithinTimeSlot;
};

export const isItemAvailable = (availability?: IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS | IGET_RESTAURANT_ADVERTISEMENT_AVAILABILITY_HOURS) => {
    if (!availability) return true;
    const dayTimes: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[] | null = getDayData(availability);

    if (dayTimes?.length == 0) return true;

    const currentDateTime = new Date();
    let isWithinTimeSlot = false;

    dayTimes?.forEach((timeSlot) => {
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

        if (isAfter(startDateTime, endDateTime)) return;

        //Check if endDateTime is set for 12:00AM, if it is add one day because it should be start of next day.
        if (isEqual(endDateTime, startOfDay(endDateTime))) {
            endDateTime = addDays(endDateTime, 1);
        }

        const isWithin = isWithinInterval(currentDateTime, {
            start: startDateTime,
            end: endDateTime,
        });

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
    cartProducts: ICartItemQuantitiesById,
    maxQuantityPerOrder: number | undefined
) => {
    let quantityAvailable = menuProductItem.totalQuantityAvailable;

    if (cartProducts[menuProductItem.id] != undefined) {
        quantityAvailable -= cartProducts[menuProductItem.id].quantity;
    }

    if (maxQuantityPerOrder && maxQuantityPerOrder < quantityAvailable) {
        quantityAvailable = maxQuantityPerOrder;
    }

    return quantityAvailable;
};

export const isProductQuantityAvailable = (
    menuProductItem: {
        id: string;
        totalQuantityAvailable?: number;
    },
    cartProducts: ICartItemQuantitiesById,
    maxQuantityPerOrder: number | undefined
) => {
    if (!menuProductItem.totalQuantityAvailable) return true;

    const productQuantityAvailable = getProductQuantityAvailable(
        {
            id: menuProductItem.id,
            totalQuantityAvailable: menuProductItem.totalQuantityAvailable,
        },
        cartProducts,
        maxQuantityPerOrder
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
        {
            id: menuModifierItem.id,
            totalQuantityAvailable: menuModifierItem.totalQuantityAvailable,
        },
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
            return availability !== null ? availability.monday : [];
        case 2:
            return availability !== null ? availability.tuesday : [];
        case 3:
            return availability !== null ? availability.wednesday : [];
        case 4:
            return availability !== null ? availability.thursday : [];
        case 5:
            return availability !== null ? availability.friday : [];
        case 6:
            return availability !== null ? availability.saturday : [];
        case 0: //0 is sunday in date-fns
            return availability !== null ? availability.sunday : [];
        default:
            return [];
    }
};

const getDayData = (availability: IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS | IGET_RESTAURANT_ADVERTISEMENT_AVAILABILITY_HOURS) => {
    const day: number = getDay(new Date());

    switch (day) {
        case 1:
            return availability !== null ? availability.monday : [];
        case 2:
            return availability !== null ? availability.tuesday : [];
        case 3:
            return availability !== null ? availability.wednesday : [];
        case 4:
            return availability !== null ? availability.thursday : [];
        case 5:
            return availability !== null ? availability.friday : [];
        case 6:
            return availability !== null ? availability.saturday : [];
        case 0: //0 is sunday in date-fns
            return availability !== null ? availability.sunday : [];
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

const getMatchingPromotionProducts = (
    cartProducts: ICartProduct[],
    promotionItems: IGET_RESTAURANT_PROMOTION_ITEMS[],
    applyToCheapest: boolean,
    applyToModifiers: boolean
) => {
    //For promotions with multiple item groups, it would become a && condition. For example, if first group is category: Vege Pizza (min quantity = 2).
    //And second group is category: Sides (min quantity = 1.
    //Then the user would need to select at least 2 Vege Pizza AND a side to get the discount

    let matchingProducts: ICartProduct[] = [];
    let matchingCondition = true;

    promotionItems.forEach((item) => {
        if (!matchingCondition) return;

        const matchingProductsTemp: ICartProduct[] = [];
        let quantityCounted = 0;

        item.categoryIds?.forEach((categoryId) => {
            cartProducts.forEach((cartProduct) => {
                if (categoryId === cartProduct.category?.id) {
                    quantityCounted += cartProduct.quantity;

                    matchingProductsTemp.push(cartProduct);
                }
            });
        });

        item.productIds?.forEach((productId) => {
            cartProducts.forEach((cartProduct) => {
                if (productId === cartProduct.id) {
                    quantityCounted += cartProduct.quantity;

                    matchingProductsTemp.push(cartProduct);
                }
            });
        });

        if (quantityCounted < item.minQuantity) {
            //Didn't match the condition
            matchingCondition = false;
        } else {
            //Sort by price and get the lowest item.minQuantity
            const matchingProductsTempCpy: ICartProduct[] = matchingProductsTemp;

            const matchingProductsTempCpySorted = matchingProductsTempCpy.sort((a, b) => {
                if (applyToCheapest) {
                    if (applyToModifiers) {
                        return a.totalPrice > b.totalPrice ? 1 : -1;
                    } else {
                        return a.price > b.price ? 1 : -1;
                    }
                } else {
                    if (applyToModifiers) {
                        //reverse sort: largest to smallest
                        return a.totalPrice > b.totalPrice ? -1 : 1;
                    } else {
                        return a.price > b.price ? 1 : -1;
                    }
                }
            });

            let counter = item.minQuantity;

            matchingProductsTempCpySorted.forEach((p) => {
                if (counter == 0) return;

                const quantity = p.quantity;

                if (counter > quantity) {
                    matchingProducts.push(p);
                    counter -= quantity;
                } else {
                    matchingProducts.push({ ...p, quantity: counter });
                    counter = 0;
                }
            });
        }
    });

    return matchingCondition ? matchingProducts : null;
};

export const applyDiscountToCartProducts = (promotion: ICartPromotion | null, cartProducts: ICartProduct[]) => {
    const cartProductsCpy: ICartProduct[] = JSON.parse(JSON.stringify(cartProducts));

    //Reset all discount values
    cartProductsCpy.forEach((cartProduct) => {
        cartProduct.discount = 0;
    });

    promotion?.matchingProducts.forEach((matchingProduct) => {
        if (matchingProduct.index === undefined) return;

        cartProductsCpy[matchingProduct.index].discount = matchingProduct.discount;
    });

    return cartProductsCpy;
};

const discountMatchingProducts = (matchingProducts: ICartProduct[], discountedAmount: number, applyToModifiers: boolean) => {
    if (matchingProducts.length === 0) return matchingProducts;

    const matchingProductsCpy: ICartProduct[] = JSON.parse(JSON.stringify(matchingProducts));

    const totalQty = matchingProducts.reduce((total, p) => total + p.quantity, 0);

    let remainingAmount = discountedAmount;
    let remainingQty = totalQty;

    matchingProductsCpy
        .sort((a, b) => {
            if (applyToModifiers) {
                return a.totalPrice - b.totalPrice;
            } else {
                return a.price - b.price;
            }
        }) //Required to sort from smallest to largest
        .forEach((p) => {
            const discountAmountPerProduct = remainingAmount / remainingQty;

            if (applyToModifiers) {
                p.discount = discountAmountPerProduct > p.totalPrice ? p.totalPrice * p.quantity : discountAmountPerProduct * p.quantity;
            } else {
                p.discount = discountAmountPerProduct > p.price ? p.price * p.quantity : discountAmountPerProduct * p.quantity;
            }

            remainingAmount -= p.discount;
            remainingQty -= p.quantity;
        });

    return matchingProductsCpy;
};

const processPromotionDiscounts = (
    cartProducts: ICartProduct[],
    discounts: IGET_RESTAURANT_PROMOTION_DISCOUNT[],
    matchingProducts: ICartProduct[] = [],
    total: number = 0,
    applyToCheapest: boolean = false,
    applyToModifiers: boolean = false
) => {
    let currentBestDiscount: { amount: number; matchingProducts: ICartProduct[] } = { amount: 0, matchingProducts: [] };
    let totalDiscountableAmount = 0;

    if (total) {
        //Entire Order discount
        totalDiscountableAmount = total;
    } else {
        matchingProducts.forEach((p) => {
            if (applyToModifiers) {
                totalDiscountableAmount += p.totalPrice * p.quantity;
            } else {
                totalDiscountableAmount += p.price * p.quantity;
            }
        });
    }

    discounts.forEach((discount) => {
        let discountedAmount = 0;
        let matchingDiscountProducts: ICartProduct[] | null = null;

        //For related items promotion
        if (discount.items && discount.items.items.length > 0) {
            //Reset discountable amount because we want to discount the matchingDiscountProducts not the original matchingProducts
            totalDiscountableAmount = 0;
            matchingDiscountProducts = getMatchingPromotionProducts(cartProducts, discount.items.items, applyToCheapest, applyToModifiers);

            if (!matchingDiscountProducts) return;

            matchingProducts = JSON.parse(JSON.stringify(matchingDiscountProducts));

            matchingProducts.forEach((p) => {
                if (applyToModifiers) {
                    totalDiscountableAmount += p.totalPrice * p.quantity;
                } else {
                    totalDiscountableAmount += p.price * p.quantity;
                }
            });
        }

        switch (discount.type) {
            case EDiscountType.FIXED:
                if (totalDiscountableAmount < discount.amount) {
                    //For example if totalDiscountableAmount = 100 and discount.amount = 200. Then discountAmount should be 100 not 200.
                    discountedAmount = totalDiscountableAmount;
                } else {
                    discountedAmount = discount.amount;
                }
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

        if (currentBestDiscount.amount < discountedAmount) {
            currentBestDiscount = { amount: discountedAmount, matchingProducts: matchingProducts };
        }
    });

    return {
        matchingProducts: currentBestDiscount.matchingProducts,
        discountedAmount: Math.floor(currentBestDiscount.amount), //Round to nearest number so we are not working with floats
    };
};

export const getOrderDiscountAmount = (promotion: IGET_RESTAURANT_PROMOTION, cartProducts: ICartProduct[], total?: number) => {
    let bestPromotionDiscount: {
        matchingProducts: ICartProduct[];
        discountedAmount: number;
    };

    if (promotion.type === EPromotionType.ENTIREORDER) {
        bestPromotionDiscount = processPromotionDiscounts(
            cartProducts,
            promotion.discounts.items,
            undefined,
            total,
            undefined,
            promotion.applyToModifiers
        );
    } else {
        const matchingProducts = getMatchingPromotionProducts(
            cartProducts,
            promotion.items.items,
            promotion.applyToCheapest,
            promotion.applyToModifiers
        );

        if (!matchingProducts) return null;

        bestPromotionDiscount = processPromotionDiscounts(
            cartProducts,
            promotion.discounts.items,
            matchingProducts,
            undefined,
            promotion.applyToCheapest,
            promotion.applyToModifiers
        );

        bestPromotionDiscount.matchingProducts = discountMatchingProducts(
            bestPromotionDiscount.matchingProducts,
            bestPromotionDiscount.discountedAmount,
            promotion.applyToModifiers
        );
    }

    return bestPromotionDiscount;
};

const processProductsForPrint = (products: IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT[]) => {
    const convertedP: ICartProduct[] = [];

    products.forEach((p) => {
        const convertedMG: ICartModifierGroup[] = [];

        p.modifierGroups &&
            p.modifierGroups.forEach((mg) => {
                const convertedM: ICartModifier[] = [];

                mg.modifiers.forEach((m) => {
                    let converted_PM_P: ICartProduct[] | null = null;

                    if (m.productModifiers) {
                        converted_PM_P = processProductsForPrint(m.productModifiers);
                    }

                    convertedM.push({
                        id: m.id,
                        name: m.name,
                        kitchenName: m.kitchenName,
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
                    kitchenName: mg.kitchenName,
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
            kitchenName: p.kitchenName,
            price: p.price,
            totalPrice: p.totalPrice,
            discount: p.discount,
            image: p.image,
            quantity: p.quantity,
            isAgeRescricted: p.isAgeRescricted,
            notes: p.notes,
            category: p.category
                ? {
                      id: p.category.id,
                      name: p.category.name,
                      kitchenName: p.category.kitchenName,
                      image: p.category.image,
                  }
                : {
                      id: "invalid",
                      name: "invalid",
                      kitchenName: "invalid",
                      image: null,
                  },
            modifierGroups: convertedMG,
        });
    });

    return convertedP;
};

export const convertProductTypesForPrint = (products: IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT[]): ICartProduct[] => {
    let convertedReturnP: ICartProduct[] = [];

    convertedReturnP = processProductsForPrint(products);

    return convertedReturnP;
};

export const downloadFile = (blob: Blob, fileName: string, extention: string) => {
    var fileURL = window.URL.createObjectURL(blob);

    var fileLink = document.createElement("a");
    fileLink.href = fileURL;
    fileLink.setAttribute("download", `${fileName}${extention}`);
    fileLink.click();
};

export const convertBase64ToFile = (base64Image, filename, mimeType) => {
    return new Promise(async (resolve, reject) => {
        const res = await fetch(base64Image);
        const buf = await res.arrayBuffer();
        const file = new File([buf], filename, { type: mimeType });

        resolve(file);
    });
};

export const resizeBase64ImageToWidth = (base64Image: string, imageWidth: number, mineType: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        var canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const image = new Image();
        image.crossOrigin = "*";

        image.src = base64Image;

        image.onload = async () => {
            if (image.width < imageWidth) imageWidth = image.width;

            canvas.width = imageWidth;
            canvas.height = image.height * (imageWidth / image.width);

            //@ts-ignore
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

            resolve(canvas.toDataURL(mineType));
        };
    });
};

export const getBase64FromUrlImage = (url: string, imageWidth: number, mineType: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        var canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const image = new Image();
        image.crossOrigin = "*";

        image.src = url;

        image.onload = async () => {
            if (image.width < imageWidth) imageWidth = image.width;

            canvas.width = imageWidth;
            canvas.height = image.height * (imageWidth / image.width);

            //@ts-ignore
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

            resolve(canvas.toDataURL(mineType));
        };
    });
};

export const getIsRestaurantOpen = (operatingHours: IGET_RESTAURANT_OPERATING_HOURS, day: number) => {
    let isOpen = false;

    switch (day) {
        case 0:
            isOpen = operatingHours.sunday.length != 0;
            break;
        case 1:
            isOpen = operatingHours.monday.length != 0;
            break;
        case 2:
            isOpen = operatingHours.tuesday.length != 0;
            break;
        case 3:
            isOpen = operatingHours.wednesday.length != 0;
            break;
        case 4:
            isOpen = operatingHours.thursday.length != 0;
            break;
        case 5:
            isOpen = operatingHours.friday.length != 0;
            break;
        case 6:
            isOpen = operatingHours.saturday.length != 0;
            break;
        default:
            isOpen = false;
            break;
    }

    return isOpen;
};

export const getRestaurantTimings = (operatingHours: IGET_RESTAURANT_OPERATING_HOURS, date: Date, day: number, timeInterval: number): Date[] => {
    let timings: Date[] = [];

    const getTimings = (timeSlots: IGET_RESTAURANT_OPERATING_HOURS_TIME_SLOT[]): Date[] => {
        const intervals: Date[] = [];

        timeSlots.forEach((timeSlot) => {
            const openingTimeSlotHour = timeSlot.openingTime.split(":")[0];
            const openingTimeSlotMinute = timeSlot.openingTime.split(":")[1];
            const closingTimeSlotHour = timeSlot.closingTime.split(":")[0];
            const closingTimeSlotMinute = timeSlot.closingTime.split(":")[1];

            try {
                const newIntervals = eachMinuteOfInterval(
                    {
                        start: new Date(
                            date.getFullYear(),
                            date.getMonth(),
                            date.getDate(),
                            parseInt(openingTimeSlotHour),
                            parseInt(openingTimeSlotMinute)
                        ),
                        end: new Date(
                            date.getFullYear(),
                            date.getMonth(),
                            date.getDate(),
                            parseInt(closingTimeSlotHour),
                            parseInt(closingTimeSlotMinute)
                        ),
                    },
                    { step: timeInterval }
                );

                intervals.push(...newIntervals);
            } catch (err) {
                //Can end up here if start date and end date are the same.
                console.error("Error: eachMinuteOfInterval", err);
            }
        });

        return intervals;
    };

    switch (day) {
        case 0:
            timings = getTimings(operatingHours.sunday);
            break;
        case 1:
            timings = getTimings(operatingHours.monday);
            break;
        case 2:
            timings = getTimings(operatingHours.tuesday);
            break;
        case 3:
            timings = getTimings(operatingHours.wednesday);
            break;
        case 4:
            timings = getTimings(operatingHours.thursday);
            break;
        case 5:
            timings = getTimings(operatingHours.friday);
            break;
        case 6:
            timings = getTimings(operatingHours.saturday);
            break;
        default:
            break;
    }

    return timings;
};

export const calculateTotalLoyaltyPoints = (
    histories: { action: ELOYALTY_ACTION; points: number; loyaltyHistoryLoyaltyId?: string | null }[],
    loyaltyGroupList: string[] = []
): number => {
    let total = 0;

    for (const { action, points, loyaltyHistoryLoyaltyId } of histories) {
        const isRelevant = !loyaltyHistoryLoyaltyId || loyaltyGroupList.includes(loyaltyHistoryLoyaltyId);
        if (!isRelevant) continue;

        if (action === ELOYALTY_ACTION.EARN) total += points;
        else if (action === ELOYALTY_ACTION.REDEEM) total -= points;
    }

    return total;
};
