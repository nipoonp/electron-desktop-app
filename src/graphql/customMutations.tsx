import { gql } from "@apollo/client";
import { ORDER_FIELDS_FRAGMENT } from "./customFragments";

export const CREATE_EFTPOS_TRANSACTION_LOG = gql`
    mutation createEftposTransactionLog(
        $eftposProvider: EftposProvider!
        $transactionId: Int
        $merchantId: Int
        $amount: Int
        $type: String
        $payload: String!
        $restaurantId: ID!
        $expiry: Int!
    ) {
        createEftposTransactionLog(
            input: {
                eftposProvider: $eftposProvider
                transactionId: $transactionId
                merchantId: $merchantId
                amount: $amount
                type: $type
                payload: $payload
                restaurantId: $restaurantId
                expiry: $expiry
            }
        ) {
            id
        }
    }
`;

export const UPDATE_REGISTER_KEY = gql`
    mutation UpdateRegister($id: ID!, $active: Boolean!) {
        updateRegister(input: { id: $id, active: $active }) {
            id
            active
        }
    }
`;

export const CREATE_ORDER = gql`
    ${ORDER_FIELDS_FRAGMENT}
    mutation createOrder(
        $status: OrderStatus!
        $paid: Boolean!
        $cashPayment: Boolean!
        $type: OrderType!
        $number: String!
        $table: String
        $notes: String
        $eftposReceipt: String
        $total: Int!
        $discount: Int
        $promotionId: ID
        $subTotal: Int!
        $registerId: ID!
        $products: [OrderProductInput!]
        $placedAt: String!
        $placedAtUtc: String!
        $orderUserId: ID!
        $orderRestaurantId: ID!
    ) {
        createOrder(
            input: {
                status: $status
                paid: $paid
                cashPayment: $cashPayment
                type: $type
                number: $number
                table: $table
                notes: $notes
                eftposReceipt: $eftposReceipt
                total: $total
                discount: $discount
                promotionId: $promotionId
                subTotal: $subTotal
                registerId: $registerId
                products: $products
                placedAt: $placedAt
                placedAtUtc: $placedAtUtc
                orderUserId: $orderUserId
                orderRestaurantId: $orderRestaurantId
            }
        ) {
            ...OrderFieldsFragment
        }
    }
`;

export const UPDATE_PRODUCT = gql`
    mutation UpdateProduct($id: ID!, $soldOut: Boolean, $soldOutDate: String, $totalQuantityAvailable: Int) {
        updateProduct(input: { id: $id, soldOut: $soldOut, soldOutDate: $soldOutDate, totalQuantityAvailable: $totalQuantityAvailable }) {
            id
        }
    }
`;

export const UPDATE_MODIFIER = gql`
    mutation UpdateModifier($id: ID!, $soldOut: Boolean, $soldOutDate: String, $totalQuantityAvailable: Int) {
        updateModifier(input: { id: $id, soldOut: $soldOut, soldOutDate: $soldOutDate, totalQuantityAvailable: $totalQuantityAvailable }) {
            id
        }
    }
`;

export const EMAIL_SALES_REPORTS = gql`
    mutation EmailSalesReports($restaurantId: String!, $emails: String!) {
        emailSalesReports(input: { restaurantId: $restaurantId, emails: $emails })
    }
`;

export const LOG_SLACK_ERROR = gql`
    mutation LogSlackError($message: String!) {
        logSlackError(input: { message: $message })
    }
`;

export const UPDATE_ORDER_STATUS = gql`
    mutation updateOrder(
        $orderId: ID!
        $status: OrderStatus!
        $placedAt: String!
        $paid: Boolean
        $completedAt: String
        $completedAtUtc: String
        $cancelledAt: String
        $cancelledAtUtc: String
        $refundedAt: String
        $refundedAtUtc: String
    ) {
        updateOrder(
            input: {
                id: $orderId
                status: $status
                placedAt: $placedAt
                paid: $paid
                completedAt: $completedAt
                completedAtUtc: $completedAtUtc
                cancelledAt: $cancelledAt
                cancelledAtUtc: $cancelledAtUtc
                refundedAt: $refundedAt
                refundedAtUtc: $refundedAtUtc
            }
        ) {
            id
        }
    }
`;
