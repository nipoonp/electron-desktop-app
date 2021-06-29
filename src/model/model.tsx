import { IGET_RESTAURANT_CATEGORY, IGET_RESTAURANT_PRODUCT, IS3Object } from "../graphql/customQueries";

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
    [id: string]: number;
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
}

export interface ISelectedProductModifiers {
    [modifierGroupId: string]: ICartModifier[];
}

export interface IOrderReceipt {
    printerAddress: string;
    kitchenPrinter?: boolean;
    eftposReceipt?: string;
    hideModifierGroupsForCustomer?: boolean;
    restaurant: {
        name: string;
        address: string;
    };
    notes: string | null;
    products: ICartProduct[];
    total: number;
    paid: boolean;
    type: EOrderType;
    number: string;
    table: string | null;
}

export interface IMatchingUpSellCrossSellItem {
    category: IGET_RESTAURANT_CATEGORY;
    product: IGET_RESTAURANT_PRODUCT;
}
