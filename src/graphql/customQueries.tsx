import { gql } from "@apollo/client";
import { EReceiptPrinterPrinterType } from "../model/model";
import { IGET_RESTAURANT_ORDER_FRAGMENT, ORDER_FIELDS_FRAGMENT } from "./customFragments";

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
    PICKUP = "PICKUP",
    DELIVERY = "DELIVERY",
}

export enum ERegisterType {
    KIOSK = "KIOSK",
    POS = "POS",
    ONLINE = "ONLINE",
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

export enum ELOYALTY_ACTION {
    EARN = "EARN",
    REDEEM = "REDEEM",
}

export const LIST_RESTAURANTS = gql`
    query ListRestaurants {
        listRestaurants(limit: 1000) {
            items {
                id
                name
                description
                verified
                restaurantManagerId
                users {
                    items {
                        user {
                            id
                        }
                    }
                }
            }
        }
    }
`;

export interface ILIST_RESTAURANTS {
    id: string;
    name: string;
    description: string;
    verified: boolean;
    restaurantManagerId: string;
    users: {
        items: {
            user: {
                id: string;
            };
        }[];
    };
}

export const GET_USER = gql`
    query GetUser($userId: ID!) {
        getUser(id: $userId) {
            id
            identityPoolId
            firstName
            lastName
            email
            restaurants(limit: 1000) {
                items {
                    id
                    name
                    verified
                    address {
                        formattedAddress
                    }
                }
            }
            userRestaurants(limit: 1000) {
                items {
                    restaurant {
                        id
                        name
                        verified
                        address {
                            formattedAddress
                        }
                    }
                }
            }
        }
    }
`;

export interface IGET_USER {
    id: string;
    identityPoolId: string;
    firstName: string;
    lastName: string;
    email: string;
    restaurants: {
        items: IGET_USER_RESTAURANT[];
    };
    userRestaurants: {
        items: {
            restaurant: IGET_USER_RESTAURANT;
        }[];
    };
}

export interface IGET_USER_RESTAURANT {
    id: string;
    name: string;
    verified: boolean;
    address: {
        formattedAddress: string;
    };
}

export interface IGET_USER_REGISTER_PRINTER {
    id: string;
    name: string;
    type: ERegisterPrinterType;
    printerType: EReceiptPrinterPrinterType;
    address: string;
    receiptFooterText: string | null;
    customerPrinter: boolean;
    kitchenPrinter: boolean;
    kitchenPrinterSmall: boolean;
    kitchenPrinterLarge: boolean;
    hidePreparationTime: boolean;
    hideModifierGroupName: boolean;
    skipReceiptCutCommand: boolean;
    printReceiptForEachProduct: boolean;
    ignoreCategories: {
        items: IGET_USER_REGISTER_PRINTER_IGNORE_CATEGORY[];
    };
    ignoreProducts: {
        items: IGET_USER_REGISTER_PRINTER_IGNORE_PRODUCT[];
    };
}

export interface IGET_USER_REGISTER_PRINTER_IGNORE_CATEGORY {
    id: string;
    category: {
        id: string;
        name: string;
    };
}

export interface IGET_USER_REGISTER_PRINTER_IGNORE_PRODUCT {
    id: string;
    product: {
        id: string;
        name: string;
    };
}

export const GET_RESTAURANT = gql`
    query GetRestaurant($restaurantId: ID!) {
        getRestaurant(id: $restaurantId) {
            id
            name
            description
            country
            isAcceptingOrders
            verified
            address {
                formattedAddress
            }
            operatingHours {
                monday {
                    openingTime
                    closingTime
                }
                tuesday {
                    openingTime
                    closingTime
                }
                wednesday {
                    openingTime
                    closingTime
                }
                thursday {
                    openingTime
                    closingTime
                }
                friday {
                    openingTime
                    closingTime
                }
                saturday {
                    openingTime
                    closingTime
                }
                sunday {
                    openingTime
                    closingTime
                }
            }
            logo {
                key
                bucket
                region
                identityPoolId
            }
            receiptLogo {
                key
                bucket
                region
                identityPoolId
            }
            gstNumber
            customStyleSheet {
                key
                bucket
                region
                identityPoolId
            }
            autoCompleteOrders
            enableLoyalty
            preparationTimeInMinutes
            delayBetweenOrdersInSeconds
            orderThresholdMessage
            surchargePercentage
            salesReportMailingList
            orderThresholds {
                enable
            }
            advertisements {
                items {
                    id
                    name
                    content {
                        key
                        bucket
                        region
                        identityPoolId
                    }
                    availability {
                        monday {
                            startTime
                            endTime
                        }
                        tuesday {
                            startTime
                            endTime
                        }
                        wednesday {
                            startTime
                            endTime
                        }
                        thursday {
                            startTime
                            endTime
                        }
                        friday {
                            startTime
                            endTime
                        }
                        saturday {
                            startTime
                            endTime
                        }
                        sunday {
                            startTime
                            endTime
                        }
                    }
                }
            }
            thirdPartyIntegrations {
                enable
                awaitThirdPartyResponse
                shift8 {
                    enable
                    storeApiUrl
                    storeUuid
                    storeLocationNumber
                }
                wizBang {
                    enable
                    storeApiUrl
                    username
                    password
                }
                doshii {
                    enable
                    locationId
                }
            }
            upSellCrossSell {
                id
                customCategories {
                    items {
                        id
                    }
                }
                customProducts {
                    items {
                        id
                        categories {
                            items {
                                category {
                                    id
                                }
                            }
                        }
                    }
                }
            }
            registers {
                items {
                    id
                    active
                    name
                    enableTableFlags
                    enableCovers
                    enableBuzzerNumbersForTakeaway
                    enableBuzzerNumbersForDineIn
                    enableSkuScanner
                    hideMostPopularCategory
                    enableFeedback
                    enablePayLater
                    enableCashPayments
                    enableEftposPayments
                    enableOnAccountPayments
                    enableUberEatsPayments
                    enableMenulogPayments
                    enableDoordashPayments
                    enableDelivereasyPayments
                    availableOrderTypes
                    orderTypeSurcharge {
                        dinein
                        takeaway
                    }
                    type
                    requestCustomerInformation {
                        firstName
                        email
                        phoneNumber
                        signature
                        customFields {
                            label
                            value
                            type
                        }
                    }
                    eftposProvider
                    eftposIpAddress
                    eftposPortNumber
                    windcaveStationId
                    windcaveStationUser
                    windcaveStationKey
                    tyroMerchantId
                    tyroTerminalId
                    skipEftposReceiptSignature
                    askToPrintCustomerReceipt
                    orderNumberSuffix
                    orderNumberStart
                    surchargePercentage
                    defaultCategoryView
                    preSelectedProducts
                    customStyleSheet {
                        key
                        bucket
                        region
                        identityPoolId
                    }
                    printers {
                        items {
                            id
                            name
                            type
                            printerType
                            address
                            receiptFooterText
                            customerPrinter
                            kitchenPrinter
                            kitchenPrinterSmall
                            kitchenPrinterLarge
                            hidePreparationTime
                            hideModifierGroupName
                            skipReceiptCutCommand
                            printReceiptForEachProduct
                            printAllOrderReceipts
                            printOnlineOrderReceipts
                            ignoreCategories(limit: 500) {
                                items {
                                    id
                                    category {
                                        id
                                        name
                                    }
                                }
                            }
                            ignoreProducts(limit: 500) {
                                items {
                                    id
                                    product {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
            promotions {
                items {
                    id
                    name
                    type
                    code
                    autoApply
                    startDate
                    endDate
                    availability {
                        monday {
                            startTime
                            endTime
                        }
                        tuesday {
                            startTime
                            endTime
                        }
                        wednesday {
                            startTime
                            endTime
                        }
                        thursday {
                            startTime
                            endTime
                        }
                        friday {
                            startTime
                            endTime
                        }
                        saturday {
                            startTime
                            endTime
                        }
                        sunday {
                            startTime
                            endTime
                        }
                    }
                    availablePlatforms
                    availableOrderTypes
                    totalNumberUsed
                    totalAvailableUses
                    minSpend
                    applyToCheapest
                    applyToModifiers
                    items {
                        items {
                            id
                            minQuantity
                            categoryIds
                            productIds
                        }
                    }
                    discounts {
                        items {
                            id
                            amount
                            type
                            items {
                                items {
                                    id
                                    minQuantity
                                    categoryIds
                                    productIds
                                }
                            }
                        }
                    }
                }
            }
            categories(limit: 20) {
                items {
                    id
                    name
                    kitchenName
                    description
                    soldOut
                    soldOutDate
                    imageUrl
                    image {
                        key
                        bucket
                        region
                        identityPoolId
                    }
                    displaySequence
                    availablePlatforms
                    availability {
                        monday {
                            startTime
                            endTime
                        }
                        tuesday {
                            startTime
                            endTime
                        }
                        wednesday {
                            startTime
                            endTime
                        }
                        thursday {
                            startTime
                            endTime
                        }
                        friday {
                            startTime
                            endTime
                        }
                        saturday {
                            startTime
                            endTime
                        }
                        sunday {
                            startTime
                            endTime
                        }
                    }
                    products(limit: 100) {
                        items {
                            id
                            displaySequence
                            product {
                                id
                                name
                                kitchenName
                                description
                                price
                                displayPrice
                                tags
                                totalQuantitySold
                                totalQuantityAvailable
                                soldOut
                                soldOutDate
                                imageUrl
                                image {
                                    key
                                    bucket
                                    region
                                    identityPoolId
                                }
                                availablePlatforms
                                isAgeRescricted
                                availability {
                                    monday {
                                        startTime
                                        endTime
                                    }
                                    tuesday {
                                        startTime
                                        endTime
                                    }
                                    wednesday {
                                        startTime
                                        endTime
                                    }
                                    thursday {
                                        startTime
                                        endTime
                                    }
                                    friday {
                                        startTime
                                        endTime
                                    }
                                    saturday {
                                        startTime
                                        endTime
                                    }
                                    sunday {
                                        startTime
                                        endTime
                                    }
                                }
                                subCategories
                                categories {
                                    items {
                                        category {
                                            id
                                            name
                                            kitchenName
                                            imageUrl
                                            image {
                                                key
                                                bucket
                                                region
                                                identityPoolId
                                            }
                                            displaySequence
                                            availablePlatforms
                                            availability {
                                                monday {
                                                    startTime
                                                    endTime
                                                }
                                                tuesday {
                                                    startTime
                                                    endTime
                                                }
                                                wednesday {
                                                    startTime
                                                    endTime
                                                }
                                                thursday {
                                                    startTime
                                                    endTime
                                                }
                                                friday {
                                                    startTime
                                                    endTime
                                                }
                                                saturday {
                                                    startTime
                                                    endTime
                                                }
                                                sunday {
                                                    startTime
                                                    endTime
                                                }
                                            }
                                        }
                                    }
                                }
                                modifierGroups(limit: 20) {
                                    items {
                                        id
                                        displaySequence
                                        hideForCustomer
                                        modifierGroup {
                                            id
                                            name
                                            kitchenName
                                            choiceMin
                                            choiceMax
                                            choiceDuplicate
                                            collapsedByDefault
                                            availablePlatforms
                                            alphabeticalSorting
                                            modifiers(limit: 50) {
                                                items {
                                                    id
                                                    displaySequence
                                                    preSelectedQuantity
                                                    modifier {
                                                        id
                                                        name
                                                        kitchenName
                                                        description
                                                        price
                                                        imageUrl
                                                        image {
                                                            key
                                                            bucket
                                                            region
                                                            identityPoolId
                                                        }
                                                        totalQuantitySold
                                                        totalQuantityAvailable
                                                        soldOut
                                                        soldOutDate
                                                        availablePlatforms
                                                        subModifierGroups
                                                        productModifier {
                                                            id
                                                            name
                                                            kitchenName
                                                            description
                                                            price
                                                            tags
                                                            totalQuantitySold
                                                            totalQuantityAvailable
                                                            soldOut
                                                            soldOutDate
                                                            imageUrl
                                                            image {
                                                                key
                                                                bucket
                                                                region
                                                                identityPoolId
                                                            }
                                                            categories {
                                                                items {
                                                                    category {
                                                                        id
                                                                        name
                                                                        kitchenName
                                                                        imageUrl
                                                                        image {
                                                                            key
                                                                            bucket
                                                                            region
                                                                            identityPoolId
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                            availability {
                                                                monday {
                                                                    startTime
                                                                    endTime
                                                                }
                                                                tuesday {
                                                                    startTime
                                                                    endTime
                                                                }
                                                                wednesday {
                                                                    startTime
                                                                    endTime
                                                                }
                                                                thursday {
                                                                    startTime
                                                                    endTime
                                                                }
                                                                friday {
                                                                    startTime
                                                                    endTime
                                                                }
                                                                saturday {
                                                                    startTime
                                                                    endTime
                                                                }
                                                                sunday {
                                                                    startTime
                                                                    endTime
                                                                }
                                                            }
                                                            modifierGroups(limit: 20) {
                                                                items {
                                                                    id
                                                                    displaySequence
                                                                    hideForCustomer
                                                                    modifierGroup {
                                                                        id
                                                                        name
                                                                        kitchenName
                                                                        choiceMin
                                                                        choiceMax
                                                                        choiceDuplicate
                                                                        collapsedByDefault
                                                                        availablePlatforms
                                                                        modifiers(limit: 50) {
                                                                            items {
                                                                                id
                                                                                displaySequence
                                                                                preSelectedQuantity
                                                                                modifier {
                                                                                    id
                                                                                    name
                                                                                    kitchenName
                                                                                    price
                                                                                    imageUrl
                                                                                    image {
                                                                                        key
                                                                                        bucket
                                                                                        region
                                                                                        identityPoolId
                                                                                    }
                                                                                    productModifier {
                                                                                        id
                                                                                        name
                                                                                        kitchenName
                                                                                        description
                                                                                        price
                                                                                        tags
                                                                                        totalQuantitySold
                                                                                        totalQuantityAvailable
                                                                                        soldOut
                                                                                        soldOutDate
                                                                                        imageUrl
                                                                                        image {
                                                                                            key
                                                                                            bucket
                                                                                            region
                                                                                            identityPoolId
                                                                                        }
                                                                                        categories {
                                                                                            items {
                                                                                                category {
                                                                                                    id
                                                                                                    name
                                                                                                    kitchenName
                                                                                                    imageUrl
                                                                                                    image {
                                                                                                        key
                                                                                                        bucket
                                                                                                        region
                                                                                                        identityPoolId
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                        availability {
                                                                                            monday {
                                                                                                startTime
                                                                                                endTime
                                                                                            }
                                                                                            tuesday {
                                                                                                startTime
                                                                                                endTime
                                                                                            }
                                                                                            wednesday {
                                                                                                startTime
                                                                                                endTime
                                                                                            }
                                                                                            thursday {
                                                                                                startTime
                                                                                                endTime
                                                                                            }
                                                                                            friday {
                                                                                                startTime
                                                                                                endTime
                                                                                            }
                                                                                            saturday {
                                                                                                startTime
                                                                                                endTime
                                                                                            }
                                                                                            sunday {
                                                                                                startTime
                                                                                                endTime
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                    totalQuantitySold
                                                                                    totalQuantityAvailable
                                                                                    soldOut
                                                                                    soldOutDate
                                                                                    availablePlatforms
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            products(limit: 500) {
                items {
                    id
                    name
                    soldOut
                    soldOutDate
                    totalQuantityAvailable
                }
            }
            # Only for stock component
            modifiers(limit: 500) {
                items {
                    id
                    name
                    soldOut
                    soldOutDate
                    totalQuantityAvailable
                    productModifier {
                        id
                        name
                        price
                    }
                }
            }
            loyalties(limit: 100) {
                items {
                    id
                    name
                    type
                    pointAmount
                    categories {
                        points
                        categoryId
                    }
                    products {
                        points
                        productId
                    }
                    rewards {
                        points
                        promotionId
                    }
                }
            }
        }
    }
`;

export interface IGET_RESTAURANT {
    id: string;
    name: string;
    description: string;
    country: string;
    isAcceptingOrders: boolean;
    verified: boolean;
    address: {
        formattedAddress: string;
    };
    operatingHours: IGET_RESTAURANT_OPERATING_HOURS;
    logo?: IS3Object;
    receiptLogo?: IS3Object;
    gstNumber: string | null;
    customStyleSheet?: IS3Object;
    autoCompleteOrders: boolean | null;
    enableLoyalty: boolean | null;
    preparationTimeInMinutes: number | null;
    delayBetweenOrdersInSeconds: number | null;
    orderThresholdMessage: string | null;
    surchargePercentage: number | null;
    salesReportMailingList: string | null;
    orderThresholds: {
        enable: boolean;
    } | null;
    advertisements: { items: IGET_RESTAURANT_ADVERTISEMENT[] };
    thirdPartyIntegrations: IThirdPartyIntegrations | null;
    upSellCrossSell?: IGET_RESTAURANT_UP_SELL_CROSS_SELL;
    registers: { items: IGET_RESTAURANT_REGISTER[] };
    promotions: { items: IGET_RESTAURANT_PROMOTION[] };
    loyalties: { items: IGET_RESTAURANT_LOYALTY[] };
    categories: {
        items: IGET_RESTAURANT_CATEGORY[];
    };
    products: {
        items: IGET_RESTAURANT_PRODUCT[];
    };
    modifiers: {
        items: IGET_RESTAURANT_MODIFIER[];
    };
}

export interface IThirdPartyIntegrations {
    enable: boolean | null;
    awaitThirdPartyResponse: boolean | null;
    shift8: IThirdPartyIntegrationsShift8 | null;
    wizBang: IThirdPartyIntegrationsWizBang | null;
    doshii: IThirdPartyIntegrationsDoshii | null;
}

export interface IThirdPartyIntegrationsShift8 {
    enable: boolean;
    storeApiUrl: string;
    storeUuid: string;
    storeLocationNumber: string;
}

export interface IThirdPartyIntegrationsWizBang {
    enable: boolean;
    storeApiUrl: string;
    username: string;
    password: string;
}

export interface IThirdPartyIntegrationsDoshii {
    enable: boolean;
    locationId: string;
}

export interface IGET_RESTAURANT_ADVERTISEMENT {
    id: string;
    name: string;
    content: IS3Object;
    availability: IGET_RESTAURANT_ADVERTISEMENT_AVAILABILITY_HOURS;
}

export interface IGET_RESTAURANT_ADVERTISEMENT_AVAILABILITY_HOURS {
    monday: IGET_RESTAURANT_ADVERTISEMENT_AVAILABILITY_TIMES[];
    tuesday: IGET_RESTAURANT_ADVERTISEMENT_AVAILABILITY_TIMES[];
    wednesday: IGET_RESTAURANT_ADVERTISEMENT_AVAILABILITY_TIMES[];
    thursday: IGET_RESTAURANT_ADVERTISEMENT_AVAILABILITY_TIMES[];
    friday: IGET_RESTAURANT_ADVERTISEMENT_AVAILABILITY_TIMES[];
    saturday: IGET_RESTAURANT_ADVERTISEMENT_AVAILABILITY_TIMES[];
    sunday: IGET_RESTAURANT_ADVERTISEMENT_AVAILABILITY_TIMES[];
    [key: string]: IGET_RESTAURANT_ADVERTISEMENT_AVAILABILITY_TIMES[]; //this is used to map over the operating hours object, https://www.logicbig.com/tutorials/misc/typescript/indexable-types.html
}

export interface IGET_RESTAURANT_ADVERTISEMENT_AVAILABILITY_TIMES {
    startTime: string;
    endTime: string;
}

export interface IGET_RESTAURANT_REGISTER {
    id: string;
    active: boolean;
    name: string;
    enableTableFlags: boolean;
    enableCovers: boolean;
    enableBuzzerNumbersForTakeaway: boolean;
    enableBuzzerNumbersForDineIn: boolean;
    enableSkuScanner: boolean;
    hideMostPopularCategory: boolean;
    enableFeedback: boolean;
    enablePayLater: boolean;
    enableCashPayments: boolean;
    enableEftposPayments: boolean;
    enableOnAccountPayments: boolean;
    enableUberEatsPayments: boolean;
    enableMenulogPayments: boolean;
    enableDoordashPayments: boolean;
    enableDelivereasyPayments: boolean;
    availableOrderTypes: EOrderType[];
    orderTypeSurcharge: OrderTypeSurchargeType;
    type: ERegisterType;
    requestCustomerInformation?: RequestCustomerInformationType;
    eftposProvider: string;
    eftposIpAddress: string;
    eftposPortNumber: string;
    windcaveStationId: string;
    windcaveStationUser: string;
    windcaveStationKey: string;
    tyroMerchantId: number;
    tyroTerminalId: number;
    skipEftposReceiptSignature: boolean;
    askToPrintCustomerReceipt: boolean;
    orderNumberSuffix: string;
    orderNumberStart: number;
    surchargePercentage: number;
    defaultCategoryView: string;
    preSelectedProducts: string[];
    customStyleSheet?: IS3Object;
    printers: {
        items: IGET_RESTAURANT_REGISTER_PRINTER[];
    };
}

export interface RequestCustomerInformationType {
    firstName: boolean;
    email: boolean;
    phoneNumber: boolean;
    signature: boolean;
    customFields?: {
        label: string;
        value: string;
        type: ECustomCustomerFieldType;
    }[];
}

export interface OrderTypeSurchargeType {
    dinein: number;
    takeaway: number;
}

export interface IGET_RESTAURANT_REGISTER_PRINTER {
    id: string;
    name: string;
    type: ERegisterPrinterType;
    printerType: EReceiptPrinterPrinterType;
    address: string;
    receiptFooterText: string | null;
    customerPrinter: boolean;
    kitchenPrinter: boolean;
    kitchenPrinterSmall: boolean;
    kitchenPrinterLarge: boolean;
    hidePreparationTime: boolean;
    hideModifierGroupName: boolean;
    skipReceiptCutCommand: boolean;
    printReceiptForEachProduct: boolean;
    printAllOrderReceipts: boolean;
    printOnlineOrderReceipts: boolean;
    ignoreCategories: {
        items: IGET_RESTAURANT_REGISTER_PRINTER_IGNORE_CATEGORY[];
    };
    ignoreProducts: {
        items: IGET_RESTAURANT_REGISTER_PRINTER_IGNORE_PRODUCT[];
    };
}

export interface IGET_RESTAURANT_REGISTER_PRINTER_IGNORE_CATEGORY {
    id: string;
    category: {
        id: string;
        name: string;
    };
}

export interface IGET_RESTAURANT_REGISTER_PRINTER_IGNORE_PRODUCT {
    id: string;
    product: {
        id: string;
        name: string;
    };
}

export interface IGET_RESTAURANT_UP_SELL_CROSS_SELL {
    id: string;
    customCategories: {
        items: IGET_RESTAURANT_UP_SELL_CROSS_SELL_CUSTOM_CATEGORY[];
    };
    customProducts: {
        items: IGET_RESTAURANT_UP_SELL_CROSS_SELL_CUSTOM_PRODUCT[];
    };
}

export interface IGET_RESTAURANT_UP_SELL_CROSS_SELL_CUSTOM_CATEGORY {
    id: string;
}

export interface IGET_RESTAURANT_UP_SELL_CROSS_SELL_CUSTOM_PRODUCT {
    id: string;
    categories: {
        items: IGET_RESTAURANT_UP_SELL_CROSS_SELL_CUSTOM_PRODUCT_CATEGORY[];
    };
}

export interface IGET_RESTAURANT_UP_SELL_CROSS_SELL_CUSTOM_PRODUCT_CATEGORY {
    id: string;
}

export interface IGET_RESTAURANT_OPERATING_HOURS {
    sunday: IGET_RESTAURANT_OPERATING_HOURS_TIME_SLOT[];
    monday: IGET_RESTAURANT_OPERATING_HOURS_TIME_SLOT[];
    tuesday: IGET_RESTAURANT_OPERATING_HOURS_TIME_SLOT[];
    wednesday: IGET_RESTAURANT_OPERATING_HOURS_TIME_SLOT[];
    thursday: IGET_RESTAURANT_OPERATING_HOURS_TIME_SLOT[];
    friday: IGET_RESTAURANT_OPERATING_HOURS_TIME_SLOT[];
    saturday: IGET_RESTAURANT_OPERATING_HOURS_TIME_SLOT[];
}

export interface IGET_RESTAURANT_OPERATING_HOURS_TIME_SLOT {
    openingTime: string;
    closingTime: string;
}

export interface IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS {
    monday: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[];
    tuesday: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[];
    wednesday: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[];
    thursday: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[];
    friday: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[];
    saturday: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[];
    sunday: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[];
    [key: string]: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[]; //this is used to map over the operating hours object, https://www.logicbig.com/tutorials/misc/typescript/indexable-types.html
}

export interface IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES {
    startTime: string;
    endTime: string;
}

export interface IGET_RESTAURANT_PROMOTION {
    id: string;
    name: string;
    code: string;
    autoApply: boolean;
    startDate: string;
    endDate: string;
    availability: IGET_RESTAURANT_PROMOTION_AVAILABILITY;
    availablePlatforms: ERegisterType[];
    availableOrderTypes: EOrderType[];
    totalNumberUsed: number;
    totalAvailableUses: number;
    minSpend: number;
    applyToCheapest: boolean;
    applyToModifiers: boolean;
    type: EPromotionType;
    items: { items: IGET_RESTAURANT_PROMOTION_ITEMS[] };
    discounts: { items: IGET_RESTAURANT_PROMOTION_DISCOUNT[] };
    promotionRestaurantId: string;
    owner: string;
    createdAt: string;
    updatedAt: string;
}

export interface IGET_RESTAURANT_PROMOTION_AVAILABILITY {
    monday: IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES[] | null;
    tuesday: IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES[] | null;
    wednesday: IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES[] | null;
    thursday: IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES[] | null;
    friday: IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES[] | null;
    saturday: IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES[] | null;
    sunday: IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES[] | null;
}

export interface IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES {
    startTime: string;
    endTime: string;
}

export enum EPromotionType {
    ENTIREORDER = "ENTIREORDER",
    COMBO = "COMBO",
    RELATEDITEMS = "RELATEDITEMS",
}

export interface IGET_RESTAURANT_PROMOTION_ITEMS {
    id: string;
    minQuantity: number;
    categoryIds: string[];
    productIds: string[];
}

export interface IGET_RESTAURANT_PROMOTION_DISCOUNT {
    id: string;
    amount: number;
    type: EDiscountType;
    items: { items: IGET_RESTAURANT_PROMOTION_ITEMS[] };
}

export enum EDiscountType {
    FIXED = "FIXED",
    PERCENTAGE = "PERCENTAGE",
    SETPRICE = "SETPRICE",
}

export interface IGET_RESTAURANT_LOYALTY {
    id: string;
    name: string;
    type: ELoyaltyType;
    pointAmount: number;
    categories: IGET_RESTAURANT_LOYALTY_CATEGORY[];
    products: IGET_RESTAURANT_LOYALTY_PRODUCT[];
    rewards: IGET_RESTAURANT_LOYALTY_REWARD[];
    loyaltyHistories: {
        items: IGET_RESTAURANT_LOYALTY_HISTORY[];
    };
    onAccountOrders: {
        items: IGET_RESTAURANT_ORDER_FRAGMENT[];
    };
}

export interface IGET_RESTAURANT_LOYALTY_CATEGORY {
    points: number;
    categoryId: string;
}

export interface IGET_RESTAURANT_LOYALTY_PRODUCT {
    points: number;
    productId: string;
}

export interface IGET_RESTAURANT_LOYALTY_REWARD {
    points: number;
    promotionId: string;
}

export interface IGET_RESTAURANT_LOYALTY_HISTORY {
    id: string;
    action: string;
    points: number;
    createdAt: string;
    loyaltyHistoryOrderId: string;
    loyaltyUser: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
    };
}

export enum ELoyaltyType {
    AMOUNT = "AMOUNT",
    PRODUCT = "PRODUCT",
    CATEGORY = "CATEGORY",
}

export interface IGET_RESTAURANT_CATEGORY {
    id: string;
    name: string;
    kitchenName: string | null;
    description: string;
    displaySequence: number;
    imageUrl?: string;
    image?: IS3Object;
    availablePlatforms: ERegisterType[];
    soldOut?: boolean;
    soldOutDate?: string;
    availability: IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS;
    products?: {
        items: IGET_RESTAURANT_PRODUCT_LINK[];
    };
}

export interface IGET_RESTAURANT_CATEGORY_LINK {
    category: IGET_RESTAURANT_CATEGORY;
}

export interface IGET_RESTAURANT_PRODUCT_LINK {
    id: string;
    displaySequence: number;
    product: IGET_RESTAURANT_PRODUCT;
}

export interface IGET_RESTAURANT_PRODUCT {
    id: string;
    name: string;
    kitchenName: string | null;
    description?: string;
    price: number;
    displayPrice: string;
    tags: string | null;
    totalQuantitySold?: number;
    totalQuantityAvailable?: number;
    soldOut?: boolean;
    soldOutDate?: string;
    imageUrl?: string;
    image?: IS3Object;
    availablePlatforms: ERegisterType[];
    isAgeRescricted: boolean;
    availability?: IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS;
    subCategories?: string;
    categories: { items: IGET_RESTAURANT_CATEGORY_LINK[] };
    modifierGroups?: {
        items: IGET_RESTAURANT_MODIFIER_GROUP_LINK[];
    };
}

export interface IGET_RESTAURANT_MODIFIER_GROUP_LINK {
    id: string;
    displaySequence: number;
    hideForCustomer: boolean | null;
    modifierGroup: IGET_RESTAURANT_MODIFIER_GROUP;
}

export interface IGET_RESTAURANT_MODIFIER_GROUP {
    id: string;
    name: string;
    kitchenName: string | null;
    choiceMin: number;
    choiceMax: number;
    choiceDuplicate: number;
    collapsedByDefault?: boolean | null;
    availablePlatforms: ERegisterType[];
    alphabeticalSorting: boolean;
    modifiers?: {
        items: IGET_RESTAURANT_MODIFIER_LINK[];
    };
}

export interface IGET_RESTAURANT_MODIFIER_LINK {
    id: string;
    displaySequence: number;
    preSelectedQuantity: number;
    modifier: IGET_RESTAURANT_MODIFIER;
}

export interface IGET_RESTAURANT_MODIFIER {
    id: string;
    name: string;
    kitchenName: string | null;
    description: string;
    price: number;
    imageUrl?: string;
    image?: IS3Object;
    totalQuantitySold?: number;
    totalQuantityAvailable?: number;
    soldOut?: boolean;
    soldOutDate?: string;
    availablePlatforms: ERegisterType[];
    isAgeRescricted: boolean;
    subModifierGroups: string;
    productModifier?: IGET_RESTAURANT_PRODUCT;
}

export interface IS3Object {
    key: string;
    bucket: string;
    region: string;
    identityPoolId: string;
}

export const GET_PROMOTION_BY_CODE = gql`
    query getPromotionsByCode($code: String!, $promotionRestaurantId: ID!) {
        getPromotionsByCode(code: $code, promotionRestaurantId: { eq: $promotionRestaurantId }) {
            items {
                id
                name
                type
                code
                autoApply
                startDate
                endDate
                availability {
                    monday {
                        startTime
                        endTime
                    }
                    tuesday {
                        startTime
                        endTime
                    }
                    wednesday {
                        startTime
                        endTime
                    }
                    thursday {
                        startTime
                        endTime
                    }
                    friday {
                        startTime
                        endTime
                    }
                    saturday {
                        startTime
                        endTime
                    }
                    sunday {
                        startTime
                        endTime
                    }
                }
                availablePlatforms
                availableOrderTypes
                totalNumberUsed
                totalAvailableUses
                minSpend
                applyToCheapest
                applyToModifiers
                items {
                    items {
                        id
                        minQuantity
                        categoryIds
                        productIds
                    }
                }
                discounts {
                    items {
                        id
                        amount
                        type
                        items {
                            items {
                                id
                                minQuantity
                                categoryIds
                                productIds
                            }
                        }
                    }
                }
            }
        }
    }
`;

export const GET_ORDERS_BY_RESTAURANT_BY_BEGIN_WITH_PLACEDAT = gql`
    ${ORDER_FIELDS_FRAGMENT}
    query GetOrdersByRestaurantByPlacedAt($orderRestaurantId: ID!, $placedAt: String!) {
        getOrdersByRestaurantByPlacedAt(
            limit: 1000000
            sortDirection: DESC
            orderRestaurantId: $orderRestaurantId
            placedAt: { beginsWith: $placedAt }
        ) {
            items {
                ...OrderFieldsFragment
            }
        }
    }
`;

export const GET_ONLINE_ORDERS_BY_RESTAURANT_BY_BEGIN_WITH_PLACEDAT = gql`
    ${ORDER_FIELDS_FRAGMENT}
    query GetOrdersByRestaurantByPlacedAt($orderRestaurantId: ID!, $placedAt: String!) {
        getOrdersByRestaurantByPlacedAt(
            limit: 1000000
            sortDirection: DESC
            orderRestaurantId: $orderRestaurantId
            placedAt: { beginsWith: $placedAt }
            filter: { onlineOrder: { eq: true } }
        ) {
            items {
                ...OrderFieldsFragment
            }
        }
    }
`;

export const GET_ONLINE_ORDERS_BY_RESTAURANT_BY_BEGIN_WITH_ORDERSCHEDULEDAT = gql`
    ${ORDER_FIELDS_FRAGMENT}
    query GetOrdersByRestaurantByOrderScheduledAt($orderRestaurantId: ID!, $orderscheduledAt: String!) {
        getOrdersByRestaurantByOrderScheduledAt(
            limit: 1000000
            sortDirection: DESC
            orderRestaurantId: $orderRestaurantId
            orderscheduledAt: { beginsWith: $orderscheduledAt }
            filter: { onlineOrder: { eq: true } }
        ) {
            items {
                ...OrderFieldsFragment
            }
        }
    }
`;

export const GET_PRODUCTS_BY_SKUCODE_BY_EQ_RESTAURANT = gql`
    query GetProductsBySKUCodeByRestaurant($skuCode: String!, $productRestaurantId: ID!) {
        getProductsBySKUCodeByRestaurant(limit: 1, sortDirection: DESC, skuCode: $skuCode, productRestaurantId: { eq: $productRestaurantId }) {
            items {
                id
                name
                description
                price
                tags
                totalQuantitySold
                totalQuantityAvailable
                soldOut
                soldOutDate
                imageUrl
                image {
                    key
                    bucket
                    region
                    identityPoolId
                }
                availablePlatforms
                availability {
                    monday {
                        startTime
                        endTime
                    }
                    tuesday {
                        startTime
                        endTime
                    }
                    wednesday {
                        startTime
                        endTime
                    }
                    thursday {
                        startTime
                        endTime
                    }
                    friday {
                        startTime
                        endTime
                    }
                    saturday {
                        startTime
                        endTime
                    }
                    sunday {
                        startTime
                        endTime
                    }
                }
                subCategories
                categories {
                    items {
                        category {
                            id
                            name
                            imageUrl
                            image {
                                key
                                bucket
                                region
                                identityPoolId
                            }
                            displaySequence
                            availablePlatforms
                            availability {
                                monday {
                                    startTime
                                    endTime
                                }
                                tuesday {
                                    startTime
                                    endTime
                                }
                                wednesday {
                                    startTime
                                    endTime
                                }
                                thursday {
                                    startTime
                                    endTime
                                }
                                friday {
                                    startTime
                                    endTime
                                }
                                saturday {
                                    startTime
                                    endTime
                                }
                                sunday {
                                    startTime
                                    endTime
                                }
                            }
                        }
                    }
                }
                modifierGroups(limit: 500) {
                    items {
                        id
                        displaySequence
                        hideForCustomer
                        modifierGroup {
                            id
                            name
                            choiceMin
                            choiceMax
                            choiceDuplicate
                            collapsedByDefault
                            availablePlatforms
                            modifiers(limit: 500) {
                                items {
                                    id
                                    displaySequence
                                    preSelectedQuantity
                                    modifier {
                                        id
                                        name
                                        price
                                        imageUrl
                                        image {
                                            key
                                            bucket
                                            region
                                            identityPoolId
                                        }
                                        totalQuantitySold
                                        totalQuantityAvailable
                                        soldOut
                                        soldOutDate
                                        availablePlatforms
                                        productModifier {
                                            id
                                            name
                                            description
                                            price
                                            tags
                                            totalQuantitySold
                                            totalQuantityAvailable
                                            soldOut
                                            soldOutDate
                                            imageUrl
                                            image {
                                                key
                                                bucket
                                                region
                                                identityPoolId
                                            }
                                            categories {
                                                items {
                                                    category {
                                                        id
                                                        name
                                                        imageUrl
                                                        image {
                                                            key
                                                            bucket
                                                            region
                                                            identityPoolId
                                                        }
                                                    }
                                                }
                                            }
                                            availability {
                                                monday {
                                                    startTime
                                                    endTime
                                                }
                                                tuesday {
                                                    startTime
                                                    endTime
                                                }
                                                wednesday {
                                                    startTime
                                                    endTime
                                                }
                                                thursday {
                                                    startTime
                                                    endTime
                                                }
                                                friday {
                                                    startTime
                                                    endTime
                                                }
                                                saturday {
                                                    startTime
                                                    endTime
                                                }
                                                sunday {
                                                    startTime
                                                    endTime
                                                }
                                            }
                                            modifierGroups(limit: 500) {
                                                items {
                                                    id
                                                    displaySequence
                                                    hideForCustomer
                                                    modifierGroup {
                                                        id
                                                        name
                                                        choiceMin
                                                        choiceMax
                                                        choiceDuplicate
                                                        collapsedByDefault
                                                        availablePlatforms
                                                        modifiers(limit: 500) {
                                                            items {
                                                                id
                                                                displaySequence
                                                                preSelectedQuantity
                                                                modifier {
                                                                    id
                                                                    name
                                                                    price
                                                                    imageUrl
                                                                    image {
                                                                        key
                                                                        bucket
                                                                        region
                                                                        identityPoolId
                                                                    }
                                                                    totalQuantitySold
                                                                    totalQuantityAvailable
                                                                    soldOut
                                                                    soldOutDate
                                                                    availablePlatforms
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`;

export const GET_THIRD_PARTY_ORDER_RESPONSE = gql`
    query getOrder($id: ID!) {
        getOrder(id: $id) {
            id
            thirdPartyIntegrationResult {
                isSuccess
                errorMessage
            }
        }
    }
`;

export interface IGET_THIRD_PARTY_ORDER_RESPONSE {
    id: string;
    thirdPartyIntegrationResult: {
        isSuccess: boolean;
        errorMessage: string;
    } | null;
}

export const GET_RESTAURANT_PING_DATA = gql`
    query GetRestaurant($restaurantId: ID!) {
        getRestaurant(id: $restaurantId) {
            id
            preparationTimeInMinutes
            advertisements {
                items {
                    id
                    name
                    content {
                        key
                        bucket
                        region
                        identityPoolId
                    }
                }
            }
        }
    }
`;

export interface IGET_RESTAURANT_PING_DATA {
    id: string;
    preparationTimeInMinutes: number | null;
}

export interface IGET_FEEDBACK_BY_RESTAURANT {
    id: string;
    averageRating: number;
    totalNumberOfRatings: number;
    comments: IGET_FEEDBACK_BY_RESTAURANT_COMMENT[];
    feedbackRestaurantId: string;
}

export interface IGET_FEEDBACK_BY_RESTAURANT_COMMENT {
    comment: string;
    rating: number;
    orderId: string;
}

export const UPDATE_RESTAURANT_PREPARATION_TIME = gql`
    mutation UpdateRestaurant($id: ID!, $preparationTimeInMinutes: Int, $delayBetweenOrdersInSeconds: Int) {
        updateRestaurant(
            input: { id: $id, preparationTimeInMinutes: $preparationTimeInMinutes, delayBetweenOrdersInSeconds: $delayBetweenOrdersInSeconds }
        ) {
            id
            preparationTimeInMinutes
            delayBetweenOrdersInSeconds
        }
    }
`;

export const GET_LOYALTY_USER_BY_PHONE_NUMBER = gql`
    ${ORDER_FIELDS_FRAGMENT}
    query listLoyaltyUser($phoneNumber: String, $loyaltyHistoryRestaurantId: ID) {
        listLoyaltyUser(filter: { phoneNumber: { eq: $phoneNumber } }, limit: 1000000) {
            items {
                id
                firstName
                lastName
                phoneNumber
                email
                loyaltyHistories(filter: { loyaltyHistoryRestaurantId: { eq: $loyaltyHistoryRestaurantId } }, limit: 1000000) {
                    items {
                        id
                        action
                        points
                        createdAt
                    }
                }
                onAccountOrders(filter: { orderRestaurantId: { eq: $loyaltyHistoryRestaurantId } }, limit: 1000000) {
                    items {
                        ...OrderFieldsFragment
                    }
                }
            }
        }
    }
`;

export const GET_LOYALTY_USER_CONTAINS_PHONE_NUMBER = gql`
    ${ORDER_FIELDS_FRAGMENT}
    query listLoyaltyUser($phoneNumber: String, $loyaltyHistoryRestaurantId: ID) {
        listLoyaltyUser(filter: { phoneNumber: { contains: $phoneNumber } }, limit: 1000000) {
            items {
                id
                firstName
                lastName
                phoneNumber
                email
                loyaltyHistories(filter: { loyaltyHistoryRestaurantId: { eq: $loyaltyHistoryRestaurantId } }, limit: 1000000) {
                    items {
                        id
                        action
                        points
                        createdAt
                    }
                }
                onAccountOrders(filter: { orderRestaurantId: { eq: $loyaltyHistoryRestaurantId } }, limit: 1000000) {
                    items {
                        ...OrderFieldsFragment
                    }
                }
            }
        }
    }
`;

export const GET_LOYALTY_USER_BY_EMAIL = gql`
    ${ORDER_FIELDS_FRAGMENT}
    query listLoyaltyUser($email: String, $loyaltyHistoryRestaurantId: ID) {
        listLoyaltyUser(filter: { email: { eq: $email } }) {
            items(limit: 1000000) {
                id
                firstName
                lastName
                phoneNumber
                email
                loyaltyHistories(filter: { loyaltyHistoryRestaurantId: { eq: $loyaltyHistoryRestaurantId } }, limit: 1000000) {
                    items {
                        id
                        action
                        points
                        createdAt
                    }
                }
                onAccountOrders(filter: { orderRestaurantId: { eq: $loyaltyHistoryRestaurantId } }, limit: 1000000) {
                    items {
                        ...OrderFieldsFragment
                    }
                }
            }
        }
    }
`;

export interface IGET_LOYALTY_USER_BY_PHONE_NUMBER_EMAIL {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    loyaltyHistories: {
        items: IGET_RESTAURANT_LOYALTY_HISTORY[];
    };
    onAccountOrders: {
        items: IGET_RESTAURANT_ORDER_FRAGMENT[];
    };
}

export const GET_LOYALTY_USER_CONTAINS_EMAIL = gql`
    ${ORDER_FIELDS_FRAGMENT}
    query listLoyaltyUser($email: String, $loyaltyHistoryRestaurantId: ID) {
        listLoyaltyUser(filter: { email: { contains: $email } }, limit: 1000000) {
            items {
                id
                firstName
                lastName
                phoneNumber
                email
                loyaltyHistories(filter: { loyaltyHistoryRestaurantId: { eq: $loyaltyHistoryRestaurantId } }, limit: 1000000) {
                    items {
                        id
                        action
                        points
                        createdAt
                    }
                }
                onAccountOrders(filter: { orderRestaurantId: { eq: $loyaltyHistoryRestaurantId } }, limit: 1000000) {
                    items {
                        ...OrderFieldsFragment
                    }
                }
            }
        }
    }
`;

export interface IGET_LOYALTY_USER_CONTAINS_PHONE_NUMBER_EMAIL {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    loyaltyHistories: {
        items: IGET_RESTAURANT_LOYALTY_HISTORY[];
    };
    onAccountOrders: {
        items: IGET_RESTAURANT_ORDER_FRAGMENT[];
    };
}
