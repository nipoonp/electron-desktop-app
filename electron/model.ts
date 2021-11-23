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
    productModifiers: ICartProduct[] | null;
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

export interface IPrintSalesByDayDataInput {
    printerType: EReceiptPrinterType;
    printerAddress: string;
    saleData: {
        [date: string]: {
            totalAmount: number;
            totalQuantity: number;
            totalPaymentAmounts: IOrderPaymentAmounts;
        };
    };
}

export interface IOrderPaymentAmounts {
    cash: number;
    eftpos: number;
    online: number;
}

export interface IPrintReceiptDataOutput {
    error: any;
    order: IOrderReceipt;
}

export interface IPrintSalesByDayDataOutput {
    error: any;
    printSalesByDayDataInput: IPrintSalesByDayDataInput;
}

export interface IPrintReceiptOutput {
    error: any;
}
