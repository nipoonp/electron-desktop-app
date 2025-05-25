export enum ECountry {
    nz = "nz",
    au = "au",
}

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

export enum ECustomCustomerFieldType {
    STRING = "STRING",
    NUMBER = "NUMBER",
    DROPDOWN = "DROPDOWN",
}

export interface IS3Object {
    key: string;
    bucket: string;
    region: string;
    identityPoolId: string;
}

export interface ICartProduct {
    index?: number; //index is for promos
    isPreSelectedProduct?: boolean; //this is so that we cannot remove this product if preSelected
    id: string;
    name: string;
    kitchenName: string | null;
    price: number;
    totalPrice: number;
    discount: number;
    image: IS3Object | null;
    quantity: number;
    notes: string | null;
    category: ICartCategory | null; //Product modifier do not have category
    modifierGroups: ICartModifierGroup[];
}

export interface ICartCategory {
    id: string;
    name: string;
    kitchenName: string | null;
    image: IS3Object | null;
}

export interface ICartModifierGroup {
    id: string;
    name: string;
    kitchenName: string | null;
    choiceDuplicate: number;
    choiceMin: number;
    choiceMax: number;
    hideForCustomer: boolean | null;
    modifiers: ICartModifier[];
}

export interface ICartModifier {
    id: string;
    name: string;
    kitchenName: string | null;
    price: number;
    preSelectedQuantity: number;
    quantity: number;
    productModifiers: ICartProduct[] | null;
    image: IS3Object | null;
}

export interface IPreSelectedModifiers {
    [modifierGroupId: string]: ICartModifier[];
}

export interface IOrderReceipt {
    orderId: string;
    country: string;
    futureOrder: boolean;
    orderReminder: boolean;
    status: EOrderStatus;
    printerType: ERegisterPrinterType;
    printerAddress: string;
    receiptFooterText: string | null;
    customerPrinter: boolean | null;
    kitchenPrinter: boolean | null;
    kitchenPrinterSmall: boolean | null;
    kitchenPrinterLarge: boolean | null;
    hidePreparationTime: boolean | null;
    hideModifierGroupName: boolean | null;
    skipReceiptCutCommand: boolean | null;
    printReceiptForEachProduct: boolean | null;
    hideOrderType: boolean;
    hideModifierGroupsForCustomer: boolean | null;
    restaurant: {
        name: string;
        address: string;
        gstNumber: string | null;
    };
    restaurantLogoBase64: string | null;
    customerInformation: {
        firstName: string | null;
        email: string | null;
        phoneNumber: string | null;
        signatureBase64: string | null;
        customFields:
            | {
                  label: string | null;
                  value: string | null;
                  type: ECustomCustomerFieldType | null;
              }[]
            | null;
    } | null;
    notes: string | null;
    products: ICartProduct[];
    eftposReceipt: string | null;
    paymentAmounts: IOrderPaymentAmounts | null;
    total: number;
    discount: number | null;
    tax: number;
    subTotal: number;
    paid: boolean;
    surcharge: number | null;
    orderTypeSurcharge: number | null;
    eftposSurcharge: number | null;
    eftposTip: number | null;
    displayPaymentRequiredMessage: boolean;
    type: EOrderType;
    number: string;
    table: string | null;
    buzzer: string | null;
    placedAt: string;
    orderScheduledAt: string | null;
    preparationTimeInMinutes: number | null;
    enableLoyalty: boolean | null;
}

export interface IEftposReceipt {
    printer: {
        printerType: ERegisterPrinterType;
        printerAddress: string;
    };
    eftposReceipt: string;
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

export interface IPrintNoSaleReceiptDataInput {
    printer: {
        printerType: ERegisterPrinterType;
        printerAddress: string;
    };
}

export interface IPrintSalesDataOutput {
    error: any;
    printSalesDataInput: IPrintSalesDataInput;
}

export interface IPrintNoSaleDataOutput {
    error: any;
}

export interface IOrderPaymentAmounts {
    cash: number;
    eftpos: number;
    online: number;
    uberEats: number;
    menulog: number;
    doordash: number;
    delivereasy: number;
}

export interface IPrintReceiptDataOutput {
    error: any;
    order: IOrderReceipt;
}

export interface IPrintReceiptOutput {
    error: any;
}

export interface IPrintNoSaleOutput {
    error: any;
}

export interface IPrintReceiptDataInput {
    printer: {
        printerType: ERegisterPrinterType;
        printerAddress: string;
    };
    receipt: string;
}

export interface IEftposReceiptOutput {
    error: any;
    receipt: IEftposReceipt;
}
