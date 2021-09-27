import { IGET_RESTAURANT_PROMOTION, IGET_RESTAURANT_CATEGORY, IGET_RESTAURANT_PRODUCT, IS3Object } from "../graphql/customQueries";

export interface IPrintReceiptDataOutput {
    error: any;
    order: IOrderReceipt;
}

export interface ICognitoUser {
    attributes: {
        email: string;
        email_verified: boolean;
        family_name: string;
        name: string;
        sub: string;
    };
    username: string;
}

export enum EOrderType {
    DINEIN = "DINEIN",
    TAKEAWAY = "TAKEAWAY",
    DELIVERY = "DELIVERY",
}

export interface ICartItemQuantitiesById {
    [id: string]: ICartItemQuantitiesByIdValue;
}

export interface ICartItemQuantitiesByIdValue {
    id: string;
    name: string;
    quantity: number;
    price: number;
    categoryId: string | null; //Only for products
}

//ICartProduct is used to pass into the DB. So its good to have it as ? undefined rather than null. Null is a type in dynamoDB so it will create a field with type Null.
export interface ICartProduct {
    id: string;
    name: string;
    price: number;
    image: IS3Object | null;
    quantity: number;
    notes: string | null;
    category: ICartCategory;
    modifierGroups: ICartModifierGroup[];
}

export interface ICartCategory {
    id: string;
    name: string;
    image: IS3Object | null;
}

export interface ICartModifierGroup {
    id: string;
    name: string;
    choiceDuplicate: number;
    choiceMin: number;
    choiceMax: number;
    hideForCustomer: boolean | null;
    modifiers: ICartModifier[];
}

export interface ICartModifier {
    id: string;
    name: string;
    price: number;
    preSelectedQuantity: number;
    quantity: number;
    productModifier: ICartProductModifier | null;
    image: IS3Object | null;
}

export interface ICartProductModifier {
    id: string;
    name: string;
    price: number;
}

export interface IPreSelectedModifiers {
    [modifierGroupId: string]: ICartModifier[];
}

export interface ICartPromotion {
    promotion: IGET_RESTAURANT_PROMOTION;
    matchingProducts: ICartItemQuantitiesById;
    discountedAmount: number;
}

export enum EReceiptPrinterType {
    BLUETOOTH = "BLUETOOTH",
    WIFI = "WIFI",
    USB = "USB",
}

export interface IOrderReceipt {
    orderId: string;
    printerType: EReceiptPrinterType;
    printerAddress: string;
    customerPrinter: boolean | null;
    kitchenPrinter: boolean | null;
    hideModifierGroupsForCustomer: boolean | null;
    restaurant: {
        name: string;
        address: string;
        gstNumber: string | null;
    };
    customerInformation: {
        firstName: string | null;
        email: string | null;
        phoneNumber: string | null;
    } | null;
    notes: string | null;
    products: ICartProduct[];
    eftposReceipt: string | null;
    total: number;
    discount: number | null;
    subTotal: number;
    paid: boolean;
    type: EOrderType;
    number: string;
    table: string | null;
    placedAt: string;
    orderScheduledAt: string | null;
}

export interface IMatchingUpSellCrossSellCategoryItem {
    category: IGET_RESTAURANT_CATEGORY;
}

export interface IMatchingUpSellCrossSellProductItem {
    category: IGET_RESTAURANT_CATEGORY;
    product: IGET_RESTAURANT_PRODUCT;
}

export enum CheckIfPromotionValidResponse {
    VALID = "VALID",
    UNAVAILABLE = "UNAVAILABLE",
    EXPIRED = "EXPIRED",
    INVALID_PLATFORM = "INVALID_PLATFORM",
}
