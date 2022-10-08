export enum EOrderStatus {
    NEW = "NEW",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED",
    PARKED = "PARKED",
}

export enum EOrderType {
    DINEIN = "DINEIN",
    TAKEAWAY = "TAKEAWAY",
}

export enum ERegisterPrinterType {
    BLUETOOTH = "BLUETOOTH",
    WIFI = "WIFI",
    USB = "USB",
}

export interface ICartProduct {
    id: string;
    name: string;
    price: number;
    totalPrice: number;
    discount: number;
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

export interface IOrderReceipt {
    orderId: string;
    status: EOrderStatus;
    printerType: ERegisterPrinterType;
    printerAddress: string;
    customerPrinter: boolean | null;
    kitchenPrinter: boolean | null;
    kitchenPrinterSmall: boolean | null;
    kitchenPrinterLarge: boolean | null;
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
    paymentAmounts: IOrderPaymentAmounts | null;
    total: number;
    discount: number | null;
    subTotal: number;
    paid: boolean;
    type: EOrderType;
    number: string;
    table: string | null;
    buzzer: string | null;
    placedAt: string;
    orderScheduledAt: string | null;
}

export interface IPrintSalesDataInputDailySales {
    [date: string]: {
        totalAmount: number;
        totalQuantity: number;
        totalPaymentAmounts: IOrderPaymentAmounts;
    };
}

export interface IPrintSalesDataInputMostSoldCategories {
    [id: string]: {
        item: {
            name: string;
        };
        totalQuantity: number;
        totalAmount: number;
    };
}

export interface IPrintSalesDataInputMostSoldProducts {
    [id: string]: {
        item: {
            name: string;
        };
        totalQuantity: number;
        totalAmount: number;
    };
}

export interface IPrintSalesDataInput {
    type: "DAY" | "CATEGORY" | "PRODUCT";
    printer: {
        printerType: ERegisterPrinterType;
        printerAddress: string;
    };
    startDate: string;
    endDate: string;
    dailySales: IPrintSalesDataInputDailySales;
    mostSoldCategories: IPrintSalesDataInputMostSoldCategories;
    mostSoldProducts: IPrintSalesDataInputMostSoldProducts;
}

export interface IPrintSalesDataOutput {
    error: any;
    printSalesDataInput: IPrintSalesDataInput;
}

export interface IOrderPaymentAmounts {
    cash: number;
    eftpos: number;
    online: number;
    uberEats: number;
    menulog: number;
}

export interface IPrintReceiptDataOutput {
    error: any;
    order: IOrderReceipt;
}

export interface IPrintReceiptOutput {
    error: any;
}
