import {
    IGET_RESTAURANT_ORDER_CATEGORY_FRAGMENT,
    IGET_RESTAURANT_ORDER_FRAGMENT,
    IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT,
    IOrderPaymentAmounts,
} from "../graphql/customFragments";
import { IGET_RESTAURANT_PROMOTION, IGET_RESTAURANT_CATEGORY, IGET_RESTAURANT_PRODUCT, IS3Object, EOrderStatus } from "../graphql/customQueries";

export interface ITab {
    id: string;
    name: string;
    icon?: JSX.Element;
    route?: string;
    showOnMobile?: boolean;
    subTabs?: ISubTab[];
}

export interface ISubTab {
    id: string;
    name: string;
    route?: string;
}

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
    ProcessMessage,
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
    UberEatsResult,
    MenulogResult,
    PayLater,
    Park,
    ThirdPartyIntegrationAwaitingResponse,
    None,
}

export enum EOrderType {
    DINEIN = "DINEIN",
    TAKEAWAY = "TAKEAWAY",
    DELIVERY = "DELIVERY",
}

export enum EPaymentMethod {
    CASH = "CASH",
    EFTPOS = "EFTPOS",
    LATER = "LATER",
}

export enum EEftposProvider {
    SMARTPAY = "SMARTPAY",
    VERIFONE = "VERIFONE",
    WINDCAVE = "WINDCAVE",
}

export interface ICustomerInformation {
    firstName: string;
    email: string;
    phoneNumber: string;
    signatureBase64: string;
}

export interface ICartItemQuantitiesById {
    [id: string]: ICartItemQuantitiesByIdValue;
}

export interface ICartItemQuantitiesByIdValue {
    id: string;
    name: string;
    quantity: number;
    price: number;
    discount: number; //Discount amount added later on in the calculation
    categoryId: string | null; //Only for products
}

//ICartProduct is used to pass into the DB. So its good to have it as ? undefined rather than null. Null is a type in dynamoDB so it will create a field with type Null.
export interface ICartProduct {
  index?: number; //index is for promos
  id: string;
  name: string;
  kitchenName: string | null;
  price: number;
  totalPrice: number;
  discount: number;
  isAgeRescricted: boolean;
  image: IS3Object | null;
  quantity: number;
  notes: string | null;
  category: ICartCategory | null; //Product modifier do not have category
  modifierGroups: ICartModifierGroup[];
}

export enum ERegisterType {
  KIOSK = "KIOSK",
  POS = "POS",
  ONLINE = "ONLINE",
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

export interface ICartPromotion {
    promotion: IGET_RESTAURANT_PROMOTION;
    matchingProducts: ICartProduct[];
    discountedAmount: number;
}

export interface ICartPaymentAmounts {
    cash: number;
    eftpos: number;
    online: number;
    uberEats: number;
    menulog: number;
}

export interface ICartPayment {
    type: string;
    amount: number;
}

export enum ERegisterPrinterType {
    BLUETOOTH = "BLUETOOTH",
    WIFI = "WIFI",
    USB = "USB",
}

export enum EReceiptPrinterPrinterType {
    RECEIPT = "RECEIPT",
    LABEL = "LABEL",
}

export interface IOrderReceipt {
    orderId: string;
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
    } | null;
    notes: string | null;
    products: ICartProduct[];
    eftposReceipt: string | null;
    paymentAmounts: IOrderPaymentAmounts | null;
    total: number;
    discount: number | null;
    subTotal: number;
    paid: boolean;
    displayPaymentRequiredMessage: boolean;
    type: EOrderType;
    number: string;
    table: string | null;
    buzzer: string | null;
    placedAt: string;
    orderScheduledAt: string | null;
    preparationTimeInMinutes: number | null;
}

export interface IOrderLabel {
    orderId: string;
    printerName: string;
    printerType: ERegisterPrinterType;
    printerAddress: string;
    products: ICartProduct[];
    number: string;
    placedAt: string;
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
            id: string;
            name: string;
            price: number;
        };
        totalQuantity: number;
        totalAmount: number;
    };
}

export interface IPrintSalesDataInputMostSoldProducts {
    [id: string]: {
        item: {
            id: string;
            name: string;
            price: number;
        };
        totalQuantity: number;
        totalAmount: number;
    };
}

export interface IDailySales {
    [date: string]: {
        totalAmount: number;
        totalQuantity: number;
        orders: IGET_RESTAURANT_ORDER_FRAGMENT[];
        totalPaymentAmounts: IOrderPaymentAmounts;
    };
}

export interface ITopSoldItem {
    item: IGET_RESTAURANT_ORDER_CATEGORY_FRAGMENT | IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT | null;
    totalQuantity: number;
    totalAmount: number;
}

export interface IMostSoldItems {
    [id: string]: {
        item: IGET_RESTAURANT_ORDER_CATEGORY_FRAGMENT | IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT;
        totalQuantity: number;
        totalAmount: number;
    };
}

export interface IPrintSalesDataInput {
    type: "DAY" | "CATEGORY" | "PRODUCT";
    printer: {
        printerType: ERegisterPrinterType;
        printerAddress: string;
    } | null;
    startDate: string;
    endDate: string;
    dailySales: IDailySales;
    mostSoldCategories: IMostSoldItems;
    mostSoldProducts: IMostSoldItems;
}

export interface IPrintSalesData {
    type: "DAY" | "CATEGORY" | "PRODUCT";
    startDate: string;
    endDate: string;
    dailySales: IDailySales;
    mostSoldCategories: IMostSoldItems;
    mostSoldProducts: IMostSoldItems;
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
