import { IOrderPaymentAmounts } from "../graphql/customFragments";
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

export enum EEftposTransactionOutcome {
    Success,
    Delay,
    Fail,
}

export enum ESmartpayTransactionOutcome {
    Accepted, // TransactionResult = "OK-ACCEPTED"
    Delayed, // TransactionStatus == "PENDING", TransactionResult == "OK-DELAYED"
    Declined, // TransactionResult = "OK-DECLINED"
    Cancelled, // TransactionResult = "CANCELLED", Result != "FAILED-INTERFACE"
    DeviceOffline, // TransactionResult = "CANCELLED", Result = "FAILED-INTERFACE"
    Failed, // Everything else
}

export enum EWindcaveTransactionOutcome {
    Accepted,
    Declined,
    Cancelled,
    Failed,
}

export enum EVerifoneTransactionOutcome {
    Approved, // 00
    ApprovedWithSignature, // 09
    Cancelled, // CC
    Declined, // 55
    SettledOk, // 90
    HostUnavailable, // 91
    SystemError, // 99
    TransactionInProgress, // ??
    TerminalBusy, // BB
}

export interface IEftposTransactionOutcome {
    platformTransactionOutcome: ESmartpayTransactionOutcome | EWindcaveTransactionOutcome | EVerifoneTransactionOutcome | null;
    transactionOutcome: EEftposTransactionOutcome;
    message: string;
    eftposReceipt: string | null;
}

export enum EPaymentModalState {
    POSScreen,
    AwaitingCard,
    EftposResult,
    CashResult,
    PayLater,
    None,
}

export enum EOrderType {
    DINEIN = "DINEIN",
    TAKEAWAY = "TAKEAWAY",
    DELIVERY = "DELIVERY",
}

export enum EEftposProvider {
    SMARTPAY = "SMARTPAY",
    VERIFONE = "VERIFONE",
    WINDCAVE = "WINDCAVE",
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
    totalPrice: number;
    discount: number;
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
    productModifiers: ICartProduct[] | null;
    image: IS3Object | null;
}

export interface IPreSelectedModifiers {
    [modifierGroupId: string]: ICartModifier[];
}

export interface ICartPromotion {
    promotion: IGET_RESTAURANT_PROMOTION;
    matchingProducts: ICartItemQuantitiesById;
    discountedAmount: number;
}

export interface ICartPaymentAmounts {
    cash: number;
    eftpos: number;
    online: number;
}

export interface ICartPayment {
    type: string;
    amount: number;
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
    paymentAmounts: IOrderPaymentAmounts | null;
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
