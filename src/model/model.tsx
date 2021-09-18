import { IGET_DASHBOARD_PROMOTION, IGET_RESTAURANT_CATEGORY, IGET_RESTAURANT_PRODUCT, IS3Object } from "../graphql/customQueries";

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
}

export interface ICartItemQuantitiesById {
    [id: string]: ICartItemQuantitiesByIdValue;
}

export interface ICartItemQuantitiesByIdValue {
    id: string;
    name: string;
    quantity: number;
    price: number;
    categoryId?: string; //Only for products
}

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
    hideForCustomer?: boolean;
    modifiers: ICartModifier[];
}

export interface ICartModifier {
    id: string;
    name: string;
    price: number;
    preSelectedQuantity: number;
    quantity: number;
    productModifier?: ICartProductModifier;
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
    promotion: IGET_DASHBOARD_PROMOTION;
    matchingProducts: ICartItemQuantitiesById;
    discountedAmount: number;
}

export enum EReceiptPrinterType {
    BLUETOOTH = "BLUETOOTH",
    WIFI = "WIFI",
    USB = "USB",
}

export interface IOrderReceipt {
    printerType: EReceiptPrinterType;
    printerAddress: string;
    customerPrinter?: boolean;
    kitchenPrinter?: boolean;
    eftposReceipt?: string;
    hideModifierGroupsForCustomer?: boolean;
    restaurant: {
        name: string;
        address: string;
        gstNumber: string | null;
    };
    notes: string | null;
    products: ICartProduct[];
    total: number;
    discount?: number;
    subTotal: number;
    paid: boolean;
    type: EOrderType;
    number: string;
    table: string | null;
}

export interface IMatchingUpSellCrossSellCategoryItem {
    category: IGET_RESTAURANT_CATEGORY;
}

export interface IMatchingUpSellCrossSellProductItem {
    category: IGET_RESTAURANT_CATEGORY;
    product: IGET_RESTAURANT_PRODUCT;
}
