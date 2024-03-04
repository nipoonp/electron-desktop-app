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
        $timestamp: String
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
                timestamp: $timestamp
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
        $type: OrderType!
        $number: String!
        $table: String
        $buzzer: String
        $orderScheduledAt: String
        $customerInformation: OrderCustomerInformationInput
        $notes: String
        $eftposReceipt: String
        $payments: [OrderPaymentInput]
        $paymentAmounts: OrderPaymentAmountsInput
        $total: Int!
        $surcharge: Int
        $orderTypeSurcharge: Int
        $discount: Int
        $promotionId: ID
        $promotionType: PromotionType
        $subTotal: Int!
        $preparationTimeInMinutes: Int
        $registerId: ID!
        $products: [OrderProductInput!]
        $placedAt: String
        $placedAtUtc: String
        $completedAt: String
        $completedAtUtc: String
        $parkedAt: String
        $parkedAtUtc: String
        $orderUserId: ID!
        $orderRestaurantId: ID!
    ) {
        createOrder(
            input: {
                status: $status
                paid: $paid
                type: $type
                number: $number
                table: $table
                buzzer: $buzzer
                orderScheduledAt: $orderScheduledAt
                customerInformation: $customerInformation
                notes: $notes
                eftposReceipt: $eftposReceipt
                payments: $payments
                paymentAmounts: $paymentAmounts
                total: $total
                surcharge: $surcharge
                orderTypeSurcharge: $orderTypeSurcharge
                discount: $discount
                promotionId: $promotionId
                promotionType: $promotionType
                subTotal: $subTotal
                preparationTimeInMinutes: $preparationTimeInMinutes
                registerId: $registerId
                products: $products
                placedAt: $placedAt
                placedAtUtc: $placedAtUtc
                completedAt: $completedAt
                completedAtUtc: $completedAtUtc
                parkedAt: $parkedAt
                parkedAtUtc: $parkedAtUtc
                orderUserId: $orderUserId
                orderRestaurantId: $orderRestaurantId
            }
        ) {
            ...OrderFieldsFragment
        }
    }
`;

export const UPDATE_ORDER = gql`
    ${ORDER_FIELDS_FRAGMENT}
    mutation updateOrder(
        $orderId: ID!
        $status: OrderStatus!
        $paid: Boolean!
        $type: OrderType!
        $number: String!
        $table: String
        $buzzer: String
        $notes: String
        $eftposReceipt: String
        $payments: [OrderPaymentInput]
        $paymentAmounts: OrderPaymentAmountsInput
        $total: Int!
        $discount: Int
        $promotionId: ID
        $subTotal: Int!
        $preparationTimeInMinutes: Int
        $registerId: ID!
        $products: [OrderProductInput!]
        $placedAt: String
        $placedAtUtc: String
        $completedAt: String
        $completedAtUtc: String
        $parkedAt: String
        $parkedAtUtc: String
        $orderUserId: ID!
        $orderRestaurantId: ID!
    ) {
        updateOrder(
            input: {
                id: $orderId
                status: $status
                paid: $paid
                type: $type
                number: $number
                table: $table
                buzzer: $buzzer
                notes: $notes
                eftposReceipt: $eftposReceipt
                payments: $payments
                paymentAmounts: $paymentAmounts
                total: $total
                discount: $discount
                promotionId: $promotionId
                subTotal: $subTotal
                preparationTimeInMinutes: $preparationTimeInMinutes
                registerId: $registerId
                products: $products
                placedAt: $placedAt
                placedAtUtc: $placedAtUtc
                completedAt: $completedAt
                completedAtUtc: $completedAtUtc
                parkedAt: $parkedAt
                parkedAtUtc: $parkedAtUtc
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

// export const LOG_SLACK_ERROR = gql`
//     mutation LogSlackError($message: String!) {
//         logSlackError(input: { message: $message })
//     }
// `;

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

export const CREATE_FEEDBACK = gql`
    mutation CreateFeedback($createFeedbackInput: CreateFeedbackInput!) {
        createFeedback(input: $createFeedbackInput) {
            id
        }
    }
`;

export const GET_FEEDBACK_BY_RESTAURANT = gql`
    query GetFeedbackByRestaurant($feedbackRestaurantId: ID!) {
        getFeedbackByRestaurant(feedbackRestaurantId: $feedbackRestaurantId) {
            items {
                id
                averageRating
                totalNumberOfRatings
                comments {
                    comment
                    rating
                    orderId
                }
                feedbackRestaurantId
            }
        }
    }
`;

export const UPDATE_FEEDBACK = gql`
    mutation updateFeedback(
        $id: ID!
        $averageRating: Float
        $totalNumberOfRatings: Int
        $feedbackRestaurantId: ID
        $comments: [FeedbackCommentInput!]
    ) {
        updateFeedback(
            input: {
                id: $id
                averageRating: $averageRating
                totalNumberOfRatings: $totalNumberOfRatings
                feedbackRestaurantId: $feedbackRestaurantId
                comments: $comments
            }
        ) {
            id
            averageRating
            totalNumberOfRatings
            feedbackRestaurantId
            comments {
                comment
                rating
                orderId
            }
        }
    }
`;

export const GET_PRODUCT_BY_ID = gql`
    query GetProduct($id: ID!) {
        getProduct(id: $id) {
            id
            name
            soldOut
            soldOutDate
        }
    }
`;

export const LIST_PRODUCTS_BY_RESTAURANT_PRODUCT_FRAGMENT = gql`
    fragment ListProductsByRestaurantProductFragment on Product {
        id
        name
        description
        price
        skuCode
        soldOut
        soldOutDate
        totalQuantityAvailable
        subCategories
        categories {
            items {
                id
                category {
                    id
                }
            }
        }
        modifierGroups {
            items {
                id
            }
        }
    }
`;