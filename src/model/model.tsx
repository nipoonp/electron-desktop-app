import {
    IGET_RESTAURANT_ORDER_CATEGORY_FRAGMENT,
    IGET_RESTAURANT_ORDER_FRAGMENT,
    IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT,
    IOrderPaymentAmounts,
} from "../graphql/customFragments";
import { IGET_RESTAURANT_PROMOTION, IGET_RESTAURANT_CATEGORY, IGET_RESTAURANT_PRODUCT, IS3Object, EOrderStatus } from "../graphql/customQueries";

export enum ECountry {
    nz = "nz",
    au = "au",
}

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

export interface IPrintReceiptDataInput {
    printer: {
        printerType: ERegisterPrinterType;
        printerAddress: string;
    };
    eftposReceipt: string;
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
    // ProcessMessage,
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

export enum ETyroTransactionOutcome {
    APPROVED,
    CANCELLED,
    REVERSED,
    DECLINED,
    SYSTEMERROR,
    NOTSTARTED,
    UNKNOWN,
}

export enum EMX51TransactionOutcome {
    Success,
    Failed,
    Unknown,
}

export interface IEftposTransactionOutcome {
    platformTransactionOutcome:
        | ESmartpayTransactionOutcome
        | EWindcaveTransactionOutcome
        | EVerifoneTransactionOutcome
        | ETyroTransactionOutcome
        | EMX51TransactionOutcome
        | null;
    transactionOutcome: EEftposTransactionOutcome;
    message: string;
    eftposReceipt: string | null;
    eftposCardType?: EEftposTransactionOutcomeCardType;
    eftposSurcharge?: number;
    eftposTip?: number;
}

export interface IMX51GetPaymentProviders {
    paymnetProivderList: {
        code: string;
        name: string;
    }[];
    paymentProvider: string;
}

export interface IMX51PairingInput {
    posId: string;
    tenantCode: string;
    serialNumber: string;
    eftposAddress: string;
    autoAddressResolution: boolean;
    testMode: boolean;
}

export enum EMX51PairingStatus {
    Unpaired = "Unpaired",
    PairingProgress = "PairingProgress",
    PairingConfirmation = "PairingConfirmation",
    PairingSuccessful = "PairingSuccessful",
    PairingFailed = "PairingFailed",
    Paired = "Paired",
    PairedAndDisconnected = "PairedAndDisconnected",
}

export enum EEftposTransactionOutcomeCardType {
    VISA = "VISA",
    MASTERCARD = "MASTERCARD",
    AMEX = "AMEX",
    EFTPOS = "EFTPOS",
    ALIPAY = "ALIPAY",
}

export enum EPaymentModalState {
    POSScreen,
    AwaitingCard,
    EftposResult,
    CashResult,
    UberEatsResult,
    MenulogResult,
    DoordashResult,
    DelivereasyResult,
    PayLater,
    Park,
    ThirdPartyIntegrationAwaitingResponse,
    None,
}

export interface ITyroPairTerminalResponseReceivedCallback {
    status: "inProgress" | "success" | "failure"; //If inProgress more responses will follow.
    message: string; //Text to show the merchant.
    integrationKey: string; //Integration key to be used when transacting.
}

export interface ITyroInitiatePurchaseInput {
    amount: string; // The purchase amount in cents.
    cashout?: string; // Optional cash out amount in cents.
    integratedReceipt: boolean; // Indicate where receipts will be printed.
    mid?: number; // Optional MID for overriding configured MID.
    tid?: number; // Optional TID for overriding configured TID.
    integrationKey?: string; // Optional integration key.
    transactionId?: string; // Optional transaction Id.
    healthpointTransactionId?: string; // Optional HealthPoint Claim transaction ID.
    enableSurcharge?: boolean; // Optional flag to apply surcharge.
    requestCardToken?: boolean; // Optional flag to request card token.
}

export interface ITyroInitiateRefundInput {
    amount: string; // The purchase amount in cents.
    integratedReceipt: boolean; // Indicate where receipts will be printed.
    mid?: number; // Optional MID for overriding configured MID.
    tid?: number; // Optional TID for overriding configured TID.
    integrationKey?: string; // Optional integration key.
    transactionId?: string; // Optional transaction Id.
}

export interface ITyroTransactionCallback {
    questionCallback: (question: ITyroTransactionQuestionCallbackQuestion, answerCallback: (answer: string) => void) => void; // Invoked for merchant questions.
    statusMessageCallback: (statusMessage: string) => void; // Invoked for terminal status messages.
    receiptCallback?: (receipt: ITyroTransactionReceiptCallback) => void; // Invoked for merchant copy of the receipt.
    transactionCompleteCallback: (transactionData: ITyroTransactionCompleteCallback) => void; // Invoked upon transaction completion.
}

interface ITyroTransactionQuestionCallbackQuestion {
    text: string; // The message to present to the merchant.
    options: string[]; // The set of button labels to present for the merchant to choose from.
    isError?: boolean;
}

interface ITyroTransactionReceiptCallback {
    signatureRequired: boolean; // Indicates if a signature line should be printed.
    merchantReceipt: string; // Text representation of the Tyro receipt for the merchant.
}

interface ITyroTransactionCompleteCallback {
    result: "APPROVED" | "CANCELLED" | "REVERSED" | "DECLINED" | "SYSTEM ERROR" | "NOT STARTED" | "UNKNOWN"; //The merchant will only receive money if this value is APPROVED. UNKNOWN means the merchant should look at the terminal to determine what happened. Typically this would indicate a network error.
    cardType?: string; // The scheme displayed on the card.
    transactionReference?: string; // Tyro's reference to this transaction.
    authorisationCode?: string; // The Scheme's reference to the transaction.
    issuerActionCode?: string; // The raw result code returned by the card issuer.
    elidedPan?: string; // The (elided) credit card number used for this transaction.
    rrn?: string; // The Retrieval Reference Number, unique for a 7-day period.
    surchargeAmount?: string;
    tipAmount?: string; // The tip component, in cents, for Tip Completion transactions.
    tipCompletionReference?: string; // Tyro's reference to the Tip Completion.
    tabCompletionReference?: string; // Tyro's reference to a Tab Completion.
    preAuthCompletionReference?: string; // Tyro's reference to a PreAuth Completion.
    cardToken?: string; // The Card Token, if requested.
    cardTokenExpiryDate?: string; // The expiry of the Card Token, if requested.
    cardTokenStatusCode?: string; // The status code of the Card Token request.
    cardTokenErrorMessage?: string; // The error message, if the Card Token request fails.
    customerReceipt?: string; // Text representation of the Tyro receipt for the customer.
    //For Healthpoint Claims, Rebate Estimates and Cancellations
    healthpointRefTag: string; // The reference tag identifying a transaction per terminal.
    healthpointTotalBenefitAmount: string; // Total benefit amount for all claim items, in cents.
    healthpointSettlementDateTime: string; // Settlement date and time as decided by the iCS system/health fund.
    healthpointTerminalDateTime: string; // The transaction date and time of the claim/s.
    healthpointMemberNumber: string; // Private health fund member number of the cardholder.
    healthpointProviderId: string; // Provider ID matching the original request.
    healthpointServiceType: string; // Service type matching the original request.
    healthpointGapAmount: string; // The gap amount, present only on successful claims and voids.
    healthpointPhfResponseCode: string; // The response code from the private health fund.
    healthpointPhfResponseCodeDescription: string; // The description of the response code from the private health fund.
    healthpointHealthFundName: string; // The name of the private health fund.
    healthpointHealthFundIdentifyingDigits: string; // The identifying digits of the private health fund.
    healthpointClaimItems?: {
        claimAmount: string; // Claim Item amount in cents
        rebateAmount: string; // Rebate amount for the claim made
        serviceCode: string; // Item Service Code
        description: string; // Item description
        serviceReference: string; // Item Service Ref
        patientId: string; // Patient id as on card
        serviceDate: string; // Date of claim in format "yyyyMMddhhmmss"
        responseCode: string; // Individual response code for this item
    }[];
}

export interface ITyroEftposQuestion {
    text: string;
    options: string[];
    answerCallback: (answer: string) => void;
}

export interface IMX51EftposQuestion {
    receipt: string;
    answerCallback: (accepted: boolean) => void;
}

export enum EOrderType {
    DINEIN = "DINEIN",
    TAKEAWAY = "TAKEAWAY",
    PICKUP = "PICKUP",
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
    TYRO = "TYRO",
    MX51 = "MX51",
}

export enum ECustomCustomerFieldType {
    STRING = "STRING",
    NUMBER = "NUMBER",
    DROPDOWN = "DROPDOWN",
}

export interface ICustomerInformation {
    firstName: string;
    email: string;
    phoneNumber: string;
    signatureBase64: string;
    customFields: {
        label: string;
        value: string;
        type: ECustomCustomerFieldType;
    }[];
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
    isPreSelectedProduct?: boolean; //this is so that we cannot remove this product if preSelected
    id: string;
    name: string;
    kitchenName: string | null;
    price: number;
    totalPrice: number;
    discount: number;
    isAgeRescricted: boolean;
    image: IS3Object | null;
    quantity: number;
    incrementAmount?: number;
    maxQuantityPerOrder?: number;
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
    doordash: number;
    delivereasy: number;
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
    country: string;
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
        totalDiscountAmount: number;
        totalRefundAmount: number;
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
        totalDiscountAmount: number;
        totalRefundAmount: number;
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
