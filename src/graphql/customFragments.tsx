import { gql } from "@apollo/client";
import { EOrderStatus, EOrderType } from "./customQueries";

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
        cashPayment
        onlineOrder
        guestCheckout
        orderScheduledAt
        customerInformation {
            firstName
            email
            phoneNumber
        }
        status
        type
        number
        table
        products {
            id
            name
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
                modifiers {
                    id
                    name
                    price
                    preSelectedQuantity
                    quantity
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
    cashPayment: boolean | null;
    onlineOrder: boolean | null;
    guestCheckout: boolean | null;
    orderScheduledAt: string | null;
    customerInformation: {
        firstName: string | null;
        email: string | null;
        phoneNumber: string | null;
    } | null;
    status: EOrderStatus;
    type: EOrderType;
    number: string;
    table: string | null;
    products: IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT[];
}

export interface IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT {
    id: string;
    name: string;
    price: number;
    quantity: number;
    notes: string | null;
    image: {
        bucket: string;
        region: string;
        key: string;
        identityPoolId: string | null;
    } | null;
    category: {
        id: string;
        name: string;
        image: {
            bucket: string;
            region: string;
            key: string;
            identityPoolId: string | null;
        } | null;
    } | null;
    modifierGroups: IGET_RESTAURANT_ORDER_MODIFIER_GROUP_FRAGMENT[] | null;
}

export interface IGET_RESTAURANT_ORDER_MODIFIER_GROUP_FRAGMENT {
    id: string;
    name: string;
    modifiers: IGET_RESTAURANT_ORDER_MODIFIER_FRAGMENT[];
}

export interface IGET_RESTAURANT_ORDER_MODIFIER_FRAGMENT {
    id: string;
    name: string;
    price: number;
    preSelectedQuantity: number;
    quantity: number;
}
