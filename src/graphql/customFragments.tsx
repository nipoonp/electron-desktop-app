import { gql } from "@apollo/client";
import { EOrderStatus, EOrderType, IS3Object } from "./customQueries";

export const ORDER_FIELDS_FRAGMENT = gql`
    fragment OrderFieldsFragment on Order {
        id
        placedAt
        completedAt
        cancelledAt
        refundedAt
        notes
        eftposReceipt
        total
        discount
        promotionId
        subTotal
        paid
        paymentAmounts {
            cash
            eftpos
            online
            uberEats
            menulog
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
    placedAt: string;
    completedAt: string | null;
    cancelledAt: string | null;
    refundedAt: string | null;
    notes: string | null;
    eftposReceipt: string | null;
    total: number;
    discount: number | null;
    promotionId: string | null;
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
    } | null;
    status: EOrderStatus;
    type: EOrderType;
    number: string;
    table: string | null;
    buzzer: string | null;
    registerId: string;
    products: IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT[];
}

export interface IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT {
  id: string;
  name: string;
  kitchenName: string | null;
  price: number;
  totalPrice: number;
  discount: number;
  availablePlatforms: ERegisterType[];
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
    uberEats: number;
    menulog: number;
}
