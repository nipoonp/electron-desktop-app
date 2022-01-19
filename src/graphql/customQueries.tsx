import { gql } from "@apollo/client";
import { EReceiptPrinterType } from "../model/model";
import { ORDER_FIELDS_FRAGMENT } from "./customFragments";

export enum EOrderStatus {
    NEW = "NEW",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED",
}

export enum EOrderType {
    DINEIN = "DINEIN",
    TAKEAWAY = "TAKEAWAY",
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

export const GET_USER = gql`
    query GetUser($userID: ID!) {
        getUser(id: $userID) {
            id
            identityPoolId
            firstName
            lastName
            email
            restaurants {
                items {
                    id
                    name
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
                    registers {
                        items {
                            id
                            active
                            name
                            enableTableFlags
                            enablePayLater
                            availableOrderTypes
                            type
                            eftposProvider
                            eftposIpAddress
                            eftposPortNumber
                            windcaveStationId
                            windcaveStationUser
                            windcaveStationKey
                            orderNumberSuffix
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
                                    address
                                    customerPrinter
                                    kitchenPrinter
                                    printAllOrderReceipts
                                    printOnlineOrderReceipts
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
}

export interface IGET_USER_RESTAURANT {
    id: string;
    name: string;
}

export interface IGET_USER_REGISTER_PRINTER {
    id: string;
    name: string;
    type: EReceiptPrinterType;
    address: string;
    customerPrinter: boolean;
    kitchenPrinter: boolean;
    ignoreProducts: {
        items: IGET_USER_REGISTER_PRINTER_IGNORE_PRODUCT[];
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
            isAcceptingOrders
            verified
            address {
                aptSuite
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
            gstNumber
            customStyleSheet {
                key
                bucket
                region
                identityPoolId
            }
            autoCompleteOrders
            salesReportMailingList
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
                    enablePayLater
                    availableOrderTypes
                    type
                    eftposProvider
                    eftposIpAddress
                    eftposPortNumber
                    windcaveStationId
                    windcaveStationUser
                    windcaveStationKey
                    orderNumberSuffix
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
                            address
                            customerPrinter
                            kitchenPrinter
                            printAllOrderReceipts
                            printOnlineOrderReceipts
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
                    minSpend
                    applyToCheapest
                    items {
                        items {
                            id
                            minQuantity
                            categories {
                                items {
                                    id
                                    name
                                }
                            }
                            products {
                                items {
                                    id
                                    name
                                }
                            }
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
                                    categories {
                                        items {
                                            id
                                            name
                                        }
                                    }
                                    products {
                                        items {
                                            id
                                            name
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            categories(limit: 500) {
                items {
                    id
                    name
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
                    products(limit: 500) {
                        items {
                            id
                            displaySequence
                            product {
                                id
                                name
                                description
                                price
                                tags
                                totalQuantitySold
                                totalQuantityAvailable
                                soldOut
                                soldOutDate
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
                                                            image {
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
                }
            }
        }
    }
`;

export interface IGET_RESTAURANT {
    id: string;
    name: string;
    description: string;
    // averagePreparationTimeInMinutes: number;
    isAcceptingOrders: boolean;
    verified: boolean;
    address: {
        aptSuite: string;
        formattedAddress: string;
    };
    operatingHours: IGET_RESTAURANT_OPERATING_HOURS;
    logo?: IS3Object;
    gstNumber: string | null;
    customStyleSheet?: IS3Object;
    autoCompleteOrders: boolean | null;
    salesReportMailingList: string | null;
    advertisements: { items: IGET_RESTAURANT_ADVERTISEMENT[] };
    upSellCrossSell?: IGET_RESTAURANT_UP_SELL_CROSS_SELL;
    registers: { items: IGET_RESTAURANT_REGISTER[] };
    promotions: { items: IGET_RESTAURANT_PROMOTION[] };
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

export interface IGET_RESTAURANT_ADVERTISEMENT {
    id: string;
    name: string;
    content: IS3Object;
}

export interface IGET_RESTAURANT_REGISTER {
    id: string;
    active: boolean;
    name: string;
    enableTableFlags: boolean;
    enablePayLater: boolean;
    availableOrderTypes: EOrderType[];
    type: ERegisterType;
    eftposProvider: string;
    eftposIpAddress: string;
    eftposPortNumber: string;
    windcaveStationId: string;
    windcaveStationUser: string;
    windcaveStationKey: string;
    orderNumberSuffix: string;
    customStyleSheet?: IS3Object;
    printers: {
        items: IGET_RESTAURANT_REGISTER_PRINTER[];
    };
}

export interface IGET_RESTAURANT_REGISTER_PRINTER {
    id: string;
    name: string;
    type: EReceiptPrinterType;
    address: string;
    customerPrinter: boolean;
    kitchenPrinter: boolean;
    printAllOrderReceipts: boolean;
    printOnlineOrderReceipts: boolean;
    ignoreProducts: {
        items: IGET_RESTAURANT_REGISTER_PRINTER_IGNORE_PRODUCT[];
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
    sunday: {
        openingTime: string;
        closingTime: string;
    }[];
    monday: {
        openingTime: string;
        closingTime: string;
    }[];
    tuesday: {
        openingTime: string;
        closingTime: string;
    }[];
    wednesday: {
        openingTime: string;
        closingTime: string;
    }[];
    thursday: {
        openingTime: string;
        closingTime: string;
    }[];
    friday: {
        openingTime: string;
        closingTime: string;
    }[];
    saturday: {
        openingTime: string;
        closingTime: string;
    }[];
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
    minSpend: number;
    applyToCheapest: boolean;
    type: EPromotionType;
    items: { items: IGET_RESTAURANT_PROMOTION_ITEMS[] };
    discounts: { items: IGET_RESTAURANT_PROMOTION_DISCOUNT[] };
    promotionRestaurantId: string;
    owner: string;
    createdAt: string;
    updatedAt: string;
}

export interface IGET_RESTAURANT_PROMOTION_AVAILABILITY {
    monday: IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES[];
    tuesday: IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES[];
    wednesday: IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES[];
    thursday: IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES[];
    friday: IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES[];
    saturday: IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES[];
    sunday: IGET_RESTAURANT_PROMOTION_AVAILABILITY_TIMES[];
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
    categories: {
        items: {
            id: string;
            name: string;
        }[];
    };
    products: {
        items: {
            id: string;
            name: string;
        }[];
    };
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

export interface IGET_RESTAURANT_CATEGORY {
    id: string;
    name: string;
    displaySequence: number;
    image?: IS3Object;
    availablePlatforms: ERegisterType[];
    availability: IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS;
    products?: {
        items: IGET_RESTAURANT_PRODUCT_LINK[];
    };
}

export interface IGET_RESTAURANT_PRODUCT_LINK {
    id: string;
    displaySequence: number;
    product: IGET_RESTAURANT_PRODUCT;
}

export interface IGET_RESTAURANT_PRODUCT {
    id: string;
    name: string;
    description?: string;
    price: number;
    tags: string | null;
    totalQuantitySold?: number;
    totalQuantityAvailable?: number;
    soldOut?: boolean;
    soldOutDate?: string;
    image?: IS3Object;
    availablePlatforms: ERegisterType[];
    availability?: IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS;
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
    choiceMin: number;
    choiceMax: number;
    choiceDuplicate: number;
    availablePlatforms: ERegisterType[];
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
    price: number;
    image?: IS3Object;
    totalQuantitySold?: number;
    totalQuantityAvailable?: number;
    soldOut?: boolean;
    soldOutDate?: string;
    availablePlatforms: ERegisterType[];
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
                minSpend
                applyToCheapest
                items {
                    items {
                        id
                        minQuantity
                        categories {
                            items {
                                id
                                name
                            }
                        }
                        products {
                            items {
                                id
                                name
                            }
                        }
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
                                categories {
                                    items {
                                        id
                                        name
                                    }
                                }
                                products {
                                    items {
                                        id
                                        name
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

export const GET_ORDERS_BY_RESTAURANT_BY_BETWEEN_PLACEDAT = gql`
    ${ORDER_FIELDS_FRAGMENT}
    query GetOrdersByRestaurantByPlacedAt($orderRestaurantId: ID!, $placedAtStartDate: String!, $placedAtEndDate: String!) {
        getOrdersByRestaurantByPlacedAt(
            limit: 1000000
            orderRestaurantId: $orderRestaurantId
            placedAt: { between: [$placedAtStartDate, $placedAtEndDate] }
        ) {
            items {
                ...OrderFieldsFragment
            }
        }
    }
`;
