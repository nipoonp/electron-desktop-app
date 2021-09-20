export enum EOrderType {
    DINEIN = "DINEIN",
    TAKEAWAY = "TAKEAWAY",
}

export interface ICartProduct {
    id: string;
    name: string;
    price: number;
    quantity: number;
    notes: string | null;
    modifierGroups: ICartModifierGroup[];
}

export interface ICartModifierGroup {
    id: string;
    name: string;
    hideForCustomer?: boolean;
    modifiers: ICartModifier[];
}

export interface ICartModifier {
    id: string;
    name: string;
    price: number;
    preSelectedQuantity: number;
    quantity: number;
}

export interface IPreSelectedModifiers {
    [modifierGroupId: string]: ICartModifier[];
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
