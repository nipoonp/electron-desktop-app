import { gql } from "@apollo/client";
import { ECustomCustomerFieldType, EOrderStatus, EOrderType, IS3Object } from "./customQueries";

export const ORDER_FIELDS_FRAGMENT = gql`
    fragment OrderFieldsFragment on Order {
        id
        country
        placedAt
        completedAt
        cancelledAt
        refundedAt
        notes
        eftposReceipt
        total
        surcharge
        orderTypeSurcharge
        eftposSurcharge
        eftposTip
        discount
        promotionId
        subTotal
        tax
        paid
        paymentAmounts {
            cash
            eftpos
            online
            onAccount
            uberEats
            menulog
            doordash
            delivereasy
        }
        onlineOrder
        guestCheckout
        orderScheduledAt
        customerInformation {
            firstName
            email
            phoneNumber
            signature {
                bucket
                region
                key
                identityPoolId
            }
        }
        status
        type
        number
        table
        buzzer
        registerId
        products {
            id
            name
            kitchenName
            price
            totalPrice
            discount
            quantity
            notes
            image {
                bucket
                region
                key
                identityPoolId
            }
            category {
                id
                name
                kitchenName
                image {
                    bucket
                    region
                    key
                    identityPoolId
                }
            }
            modifierGroups {
                id
                name
                kitchenName
                choiceDuplicate
                choiceMin
                choiceMax
                hideForCustomer
                modifiers {
                    id
                    name
                    kitchenName
                    price
                    preSelectedQuantity
                    quantity
                    productModifiers {
                        id
                        name
                        kitchenName
                        price
                        quantity
                        notes
                        image {
                            bucket
                            region
                            key
                            identityPoolId
                        }
                        category {
                            id
                            name
                            kitchenName
                            image {
                                bucket
                                region
                                key
                                identityPoolId
                            }
                        }
                        modifierGroups {
                            id
                            name
                            kitchenName
                            choiceDuplicate
                            choiceMin
                            choiceMax
                            hideForCustomer
                            modifiers {
                                id
                                name
                                kitchenName
                                price
                                preSelectedQuantity
                                quantity
                                image {
                                    bucket
                                    region
                                    key
                                    identityPoolId
                                }
                                productModifiers {
                                    id
                                    name
                                    kitchenName
                                    price
                                    quantity
                                    notes
                                    image {
                                        bucket
                                        region
                                        key
                                        identityPoolId
                                    }
                                    category {
                                        id
                                        name
                                        kitchenName
                                        image {
                                            bucket
                                            region
                                            key
                                            identityPoolId
                                        }
                                    }
                                    modifierGroups {
                                        id
                                        name
                                        kitchenName
                                        choiceDuplicate
                                        choiceMin
                                        choiceMax
                                        hideForCustomer
                                        modifiers {
                                            id
                                            name
                                            kitchenName
                                            price
                                            preSelectedQuantity
                                            quantity
                                            image {
                                                bucket
                                                region
                                                key
                                                identityPoolId
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    image {
                        bucket
                        region
                        key
                        identityPoolId
                    }
                }
            }
        }
    }
`;

export interface IGET_RESTAURANT_ORDER_FRAGMENT {
    id: string;
    country: string;
    placedAt: string;
    parkedAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    refundedAt: string | null;
    notes: string | null;
    eftposReceipt: string | null;
    total: number;
    surcharge: number | null;
    orderTypeSurcharge: number | null;
    eftposCardType: EEftposCardType | null;
    eftposSurcharge: number | null;
    eftposTip: number | null;
    discount: number | null;
    promotionId: string | null;
    tax: number;
    subTotal: number;
    paid: boolean;
    paymentAmounts: IOrderPaymentAmounts | null;
    onlineOrder: boolean | null;
    guestCheckout: boolean | null;
    orderScheduledAt: string | null;
    customerInformation: {
        firstName: string | null;
        email: string | null;
        phoneNumber: string | null;
        signature: IS3Object | null;
        customFields: {
            label: string;
            value: string;
            type: ECustomCustomerFieldType;
        }[];
    } | null;
    status: EOrderStatus;
    type: EOrderType;
    number: string;
    table: string | null;
    buzzer: string | null;
    covers: number | null;
    registerId: string;
    thirdPartyIntegrationResult: {
        isSuccess: boolean;
        errorMessage: string;
    };
    products: IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT[];
}

export interface IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT {
    id: string;
    name: string;
    kitchenName: string | null;
    price: number;
    totalPrice: number;
    discount: number;
    isAgeRescricted: boolean;
    quantity: number;
    notes: string | null;
    image: IS3Object | null;
    category: IGET_RESTAURANT_ORDER_CATEGORY_FRAGMENT | null;
    modifierGroups: IGET_RESTAURANT_ORDER_MODIFIER_GROUP_FRAGMENT[] | null;
}

export enum ERegisterType {
    KIOSK = "KIOSK",
    POS = "POS",
    ONLINE = "ONLINE",
}

export enum EEftposCardType {
    VISA = "VISA",
    MASTERCARD = "MASTERCARD",
    AMEX = "AMEX",
    EFTPOS = "EFTPOS",
    ALIPAY = "ALIPAY",
}

export interface IGET_RESTAURANT_ORDER_CATEGORY_FRAGMENT {
    id: string;
    name: string;
    kitchenName: string | null;
    image: IS3Object | null;
}

export interface IGET_RESTAURANT_ORDER_MODIFIER_GROUP_FRAGMENT {
    id: string;
    name: string;
    kitchenName: string | null;
    choiceDuplicate: number;
    choiceMin: number;
    choiceMax: number;
    hideForCustomer: boolean | null;
    modifiers: IGET_RESTAURANT_ORDER_MODIFIER_FRAGMENT[];
}

export interface IGET_RESTAURANT_ORDER_MODIFIER_FRAGMENT {
    id: string;
    name: string;
    kitchenName: string | null;
    price: number;
    preSelectedQuantity: number;
    quantity: number;
    productModifiers: IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT[] | null;
    image: IS3Object | null;
}

export interface IOrderPaymentAmounts {
    cash: number;
    eftpos: number;
    online: number;
    onAccount: number;
    uberEats: number;
    menulog: number;
    doordash: number;
    delivereasy: number;
    eftposSurcharge?: number;
}
