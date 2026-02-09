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
    const platform = process.env.REACT_APP_PLATFORM;

    if (!platform || !promotion.availablePlatforms?.includes(ERegisterType[platform])) return CheckIfPromotionValidResponse.INVALID_PLATFORM;

    const now = new Date();
    const isWithin = isWithinInterval(now, {
        start: new Date(promotion.startDate),
        end: new Date(promotion.endDate),
    });

    if (!isWithin) return CheckIfPromotionValidResponse.EXPIRED;

    const isAvailable = promotion.availability && isPromotionAvailable(promotion.availability);
    if (!isAvailable) return CheckIfPromotionValidResponse.UNAVAILABLE;

    return CheckIfPromotionValidResponse.VALID;
};

const buildPromotionSortComparator = (applyToCheapest: boolean, applyToModifiers: boolean) => {
    const priceKey = applyToModifiers ? "totalPrice" : "price";
    const order = applyToCheapest ? 1 : -1;

    return (a: ICartProduct, b: ICartProduct) => (a[priceKey] - b[priceKey]) * order;
};

const findPromotionItemMatches = (cartProducts: ICartProduct[], item: IGET_RESTAURANT_PROMOTION_ITEMS) => {
    const matchingProducts = new Set<ICartProduct>();
    let quantityCounted = 0;

    cartProducts.forEach((cartProduct) => {
        const matchesCategory = cartProduct.category?.id && item.categoryIds?.includes(cartProduct.category.id);
        const matchesProduct = item.productIds?.includes(cartProduct.id);

        if (matchesCategory || matchesProduct) {
            matchingProducts.add(cartProduct);
            quantityCounted += cartProduct.quantity;
        }
    });

    return {
        matchingProducts: Array.from(matchingProducts),
        quantityCounted,
    };
};

const getMatchingPromotionProducts = (
    cartProducts: ICartProduct[],
    promotionItems: IGET_RESTAURANT_PROMOTION_ITEMS[],
    applyToCheapest: boolean,
    applyToModifiers: boolean,
    maxApplications?: number
): { matchingProducts: ICartProduct[]; matchingProductsPerApplication: ICartProduct[][]; applications: number } | null => {
    let applications = Number.MAX_SAFE_INTEGER;
    const matchingProductsByPromotionItem: { products: ICartProduct[]; item: IGET_RESTAURANT_PROMOTION_ITEMS }[] = [];

    // Check all promotion items meet minimum quantity requirements
    for (const item of promotionItems) {
        const { matchingProducts, quantityCounted } = findPromotionItemMatches(cartProducts, item);

        if (quantityCounted < item.minQuantity) {
            return null; // Condition not met
        }

        matchingProductsByPromotionItem.push({ products: matchingProducts, item });
        applications = Math.min(applications, Math.floor(quantityCounted / item.minQuantity));
    }

    if (maxApplications !== undefined) applications = Math.min(applications, maxApplications);

    if (applications === Number.MAX_SAFE_INTEGER || applications === 0) return null;

    // Distribute products across applications
    const comparator = buildPromotionSortComparator(applyToCheapest, applyToModifiers);
    const matchingProductsPerApplication: ICartProduct[][] = Array.from({ length: applications }, () => []);
    const aggregatedProducts = new Map<string, ICartProduct>();

    const getProductKey = (p: ICartProduct) => (p.index !== undefined ? `idx-${p.index}` : `id-${p.id}`);

    matchingProductsByPromotionItem.forEach(({ products, item }) => {
        const sortedProducts = [...products].sort(comparator);
        const minQuantity = item.minQuantity || 1;

        let applicationIndex = 0;
        let remainingForCurrentApplication = minQuantity;

        sortedProducts.forEach((p) => {
            let quantityLeft = p.quantity;

            while (quantityLeft > 0 && applicationIndex < applications) {
                const qtyToUse = Math.min(quantityLeft, remainingForCurrentApplication);
                const productForApplication = { ...p, quantity: qtyToUse };

                matchingProductsPerApplication[applicationIndex].push(productForApplication);

                const key = getProductKey(p);
                const existing = aggregatedProducts.get(key);
                if (existing) {
                    existing.quantity += qtyToUse;
                } else {
                    aggregatedProducts.set(key, { ...p, quantity: qtyToUse });
                }

                quantityLeft -= qtyToUse;
                remainingForCurrentApplication -= qtyToUse;

                if (remainingForCurrentApplication === 0) {
                    applicationIndex++;
                    remainingForCurrentApplication = minQuantity;
                }
            }
        });
    });

    return {
        matchingProducts: Array.from(aggregatedProducts.values()),
        matchingProductsPerApplication,
        applications,
    };
};

export const applyDiscountToCartProducts = (promotion: ICartPromotion | null, cartProducts: ICartProduct[]) => {
    const cartProductsCpy = cartProducts.map((p) => ({ ...p, discount: 0 }));

    promotion?.matchingProducts.forEach((matchingProduct) => {
        if (matchingProduct.index !== undefined) {
            cartProductsCpy[matchingProduct.index].discount = matchingProduct.discount;
        }
    });

    return cartProductsCpy;
};

const discountMatchingProducts = (
    matchingProducts: ICartProduct[],
    discountedAmount: number,
    applyToModifiers: boolean,
    applications: number = 1,
    matchingProductsPerApplication?: ICartProduct[][],
    perApplicationDiscounts?: number[]
) => {
    if (matchingProducts.length === 0) return matchingProducts;

    const matchingProductsCpy = matchingProducts.map((p) => ({ ...p }));
    const productsPerApplication = matchingProductsPerApplication?.length ? matchingProductsPerApplication : [matchingProductsCpy];
    const applicationsToUse = Math.max(1, applications || 1);

    const getProductKey = (p: ICartProduct) => (p.index !== undefined ? `idx-${p.index}` : `id-${p.id}`);
    const discountMap = new Map<string, number>();

    for (let i = 0; i < applicationsToUse; i++) {
        const appProducts = productsPerApplication[i] || [];
        const appDiscountTotal = perApplicationDiscounts?.[i] ?? discountedAmount / applicationsToUse;
        let remainingAppDiscount = appDiscountTotal;

        const priceKey = applyToModifiers ? "totalPrice" : "price";
        const sortedProducts = [...appProducts].sort((a, b) => a[priceKey] - b[priceKey]);

        for (const p of sortedProducts) {
            if (remainingAppDiscount <= 0) break;

            const discountablePerUnit = applyToModifiers ? p.totalPrice : p.price;
            const maxDiscountForProduct = discountablePerUnit * p.quantity;
            const appliedDiscount = Math.min(remainingAppDiscount, maxDiscountForProduct);
            const key = getProductKey(p);

            discountMap.set(key, (discountMap.get(key) || 0) + appliedDiscount);
            remainingAppDiscount -= appliedDiscount;
        }
    }

    matchingProductsCpy.forEach((p) => {
        p.discount = discountMap.get(getProductKey(p)) || 0;
    });

    return matchingProductsCpy;
};

const calculateApplicationDiscount = (discount: IGET_RESTAURANT_PROMOTION_DISCOUNT, discountableAmount: number): number => {
    switch (discount.type) {
        case EDiscountType.FIXED:
            return Math.min(discountableAmount, discount.amount);
        case EDiscountType.PERCENTAGE:
            return (discountableAmount * discount.amount) / 100;
        case EDiscountType.SETPRICE:
            return Math.max(0, discountableAmount - discount.amount);
        default:
            return 0;
    }
};

const processPromotionDiscounts = (
    cartProducts: ICartProduct[],
    discounts: IGET_RESTAURANT_PROMOTION_DISCOUNT[],
    matchingPromotionProducts?: { matchingProducts: ICartProduct[]; matchingProductsPerApplication: ICartProduct[][]; applications: number },
    total: number = 0,
    applyToCheapest: boolean = false,
    applyToModifiers: boolean = false,
    maxApplications?: number | null
) => {
    let currentBestDiscount = {
        amount: 0,
        matchingProducts: [] as ICartProduct[],
        matchingProductsPerApplication: [] as ICartProduct[][],
        applications: 1,
        perApplicationDiscounts: [] as number[],
    };

    const getTotalDiscountableAmount = (products: ICartProduct[]) => {
        const priceKey = applyToModifiers ? "totalPrice" : "price";
        return products.reduce((sum, p) => sum + p[priceKey] * p.quantity, 0);
    };

    discounts.forEach((discount) => {
        let baseApplications = matchingPromotionProducts?.applications ?? (total ? 1 : 0);
        if (maxApplications != null && baseApplications) {
            baseApplications = Math.min(baseApplications, maxApplications);
        }

        let applications = baseApplications;
        let matchingDiscountProducts: ICartProduct[] | null = null;
        let matchingDiscountProductsPerApplication: ICartProduct[][] | null = null;

        // Handle related items promotion
        if (discount.items?.items.length > 0) {
            const matchingDiscountResults = getMatchingPromotionProducts(
                cartProducts,
                discount.items.items,
                applyToCheapest,
                applyToModifiers,
                baseApplications
            );

            if (!matchingDiscountResults) return;

            matchingDiscountProducts = matchingDiscountResults.matchingProducts;
            matchingDiscountProductsPerApplication = matchingDiscountResults.matchingProductsPerApplication;
            applications =
                baseApplications && matchingDiscountResults.applications
                    ? Math.min(baseApplications, matchingDiscountResults.applications)
                    : matchingDiscountResults.applications ?? baseApplications;
        }

        const applicationCount = applications || 1;
        const productsForDiscount = matchingDiscountProducts || matchingPromotionProducts?.matchingProducts || [];
        const perApplicationProducts = matchingDiscountProductsPerApplication || matchingPromotionProducts?.matchingProductsPerApplication || [];
        const productsPerApplication = perApplicationProducts.length ? perApplicationProducts : [productsForDiscount];

        const perApplicationDiscounts: number[] = [];
        let totalDiscountAmount = 0;

        for (let i = 0; i < applicationCount; i++) {
            const appProducts = productsPerApplication[i] || [];
            const appDiscountableAmount = total ? total / applicationCount : getTotalDiscountableAmount(appProducts);

            const applicationDiscount = calculateApplicationDiscount(discount, appDiscountableAmount);
            perApplicationDiscounts.push(applicationDiscount);
            totalDiscountAmount += applicationDiscount;
        }

        if (currentBestDiscount.amount < totalDiscountAmount) {
            currentBestDiscount = {
                amount: totalDiscountAmount,
                matchingProducts: productsForDiscount,
                matchingProductsPerApplication: productsPerApplication,
                applications: applicationCount,
                perApplicationDiscounts,
            };
        }
    });

    return {
        matchingProducts: currentBestDiscount.matchingProducts,
        matchingProductsPerApplication: currentBestDiscount.matchingProductsPerApplication,
        perApplicationDiscounts: currentBestDiscount.perApplicationDiscounts,
        applications: currentBestDiscount.applications,
        discountedAmount: Math.floor(currentBestDiscount.amount),
    };
};

export const getOrderDiscountAmount = (promotion: IGET_RESTAURANT_PROMOTION, cartProducts: ICartProduct[], total?: number) => {
    const isEntireOrder = promotion.type === EPromotionType.ENTIREORDER;
    const maxApplications = promotion.maxApplicationsPerOrder ?? 1;

    let bestPromotionDiscount;

    if (isEntireOrder) {
        bestPromotionDiscount = processPromotionDiscounts(
            cartProducts,
            promotion.discounts.items,
            undefined,
            total,
            undefined,
            promotion.applyToModifiers,
            maxApplications
        );

        bestPromotionDiscount.matchingProducts = discountMatchingProducts(
            cartProducts,
            bestPromotionDiscount.discountedAmount,
            promotion.applyToModifiers,
            bestPromotionDiscount.applications,
            bestPromotionDiscount.matchingProductsPerApplication,
            bestPromotionDiscount.perApplicationDiscounts
        );
    } else {
        const matchingPromotionProducts = getMatchingPromotionProducts(
            cartProducts,
            promotion.items.items,
            promotion.applyToCheapest,
            promotion.applyToModifiers,
            maxApplications
        );

        if (!matchingPromotionProducts) return null;

        bestPromotionDiscount = processPromotionDiscounts(
            cartProducts,
            promotion.discounts.items,
            matchingPromotionProducts,
            undefined,
            promotion.applyToCheapest,
            promotion.applyToModifiers,
            maxApplications
        );

        bestPromotionDiscount.matchingProducts = discountMatchingProducts(
            bestPromotionDiscount.matchingProducts,
            bestPromotionDiscount.discountedAmount,
            promotion.applyToModifiers,
            bestPromotionDiscount.applications,
            bestPromotionDiscount.matchingProductsPerApplication,
            bestPromotionDiscount.perApplicationDiscounts
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
