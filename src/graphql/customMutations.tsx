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

export const UPDATE_LOYALTY_USER_RESTAURANT_LINK = gql`
    mutation UpdateLoyaltyUserRestaurantLink($id: ID!, $favourite: Boolean) {
        updateLoyaltyUserRestaurantLink(input: { id: $id, favourite: $favourite }) {
            id
            favourite
        }
    }
`;

export const CREATE_TABLE_PLAN = gql`
    mutation CreateTablePlan($input: CreateRestaurantTablePlanInput!) {
        createTablePlan(input: $input) {
            id
        }
    }
`;

export const UPDATE_TABLE_PLAN = gql`
    mutation UpdateTablePlan($input: UpdateRestaurantTablePlanInput!) {
        updateTablePlan(input: $input) {
            id
        }
    }
`;

export const CREATE_ORDER = gql`
    ${ORDER_FIELDS_FRAGMENT}
    mutation createOrder(
        $country: String
        $status: OrderStatus!
        $paid: Boolean!
        $type: OrderType!
        $number: String!
        $table: String
        $buzzer: String
        $covers: Int
        $orderScheduledAt: String
        $customerInformation: OrderCustomerInformationInput
        $notes: String
        $eftposReceipt: String
        $payments: [OrderPaymentInput]
        $paymentAmounts: OrderPaymentAmountsInput
        $total: Int!
        $surcharge: Int
        $orderTypeSurcharge: Int
        $eftposCardType: EftposCardType
        $eftposSurcharge: Int
        $eftposTip: Int
        $discount: Int
        $promotionId: ID
        $promotionType: PromotionType
        $loyaltyId: ID
        $tax: Int
        $subTotal: Int!
        $preparationTimeInMinutes: Int
        $registerId: ID!
        $products: [OrderProductInput!]
        $placedAt: String
        $placedAtUtc: String
        $settledAt: String
        $settledAtUtc: String
        $settledRegisterId: ID
        $completedAt: String
        $completedAtUtc: String
        $parkedAt: String
        $parkedAtUtc: String
        $orderUserId: ID!
        $orderRestaurantId: ID!
    ) {
        createOrder(
            input: {
                country: $country
                status: $status
                paid: $paid
                type: $type
                number: $number
                table: $table
                buzzer: $buzzer
                covers: $covers
                orderScheduledAt: $orderScheduledAt
                customerInformation: $customerInformation
                notes: $notes
                eftposReceipt: $eftposReceipt
                payments: $payments
                paymentAmounts: $paymentAmounts
                total: $total
                surcharge: $surcharge
                orderTypeSurcharge: $orderTypeSurcharge
                eftposCardType: $eftposCardType
                eftposSurcharge: $eftposSurcharge
                eftposTip: $eftposTip
                discount: $discount
                promotionId: $promotionId
                promotionType: $promotionType
                loyaltyId: $loyaltyId
                tax: $tax
                subTotal: $subTotal
                preparationTimeInMinutes: $preparationTimeInMinutes
                registerId: $registerId
                products: $products
                placedAt: $placedAt
                placedAtUtc: $placedAtUtc
                settledAt: $settledAt
                settledAtUtc: $settledAtUtc
                settledRegisterId: $settledRegisterId
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
        $settledAt: String
        $settledAtUtc: String
        $settledRegisterId: ID
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
                settledAt: $settledAt
                settledAtUtc: $settledAtUtc
                settledRegisterId: $settledRegisterId
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

export const UPDATE_ORDER_PRINTED_QUANTITIES = gql`
    mutation updateOrderPrintedQuantities($orderId: ID!, $printedQuantities: [OrderPrintedQuantityInput]) {
        updateOrder(input: { id: $orderId, printedQuantities: $printedQuantities }) {
            id
            printedQuantities {
                lineKey
                quantity
            }
        }
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

export const UPDATE_REGISTER_TYRO = gql`
    mutation UpdateRegister($id: ID!, $tyroMerchantId: Int!, $tyroTerminalId: Int!) {
        updateRegister(input: { id: $id, tyroMerchantId: $tyroMerchantId, tyroTerminalId: $tyroTerminalId }) {
            id
            tyroMerchantId
            tyroTerminalId
        }
    }
`;

export const CREATE_RESERVATION = gql`
    mutation CreateReservation(
        $restaurantId: ID!
        $date: AWSDate!
        $time: AWSTime!
        $covers: Int!
        $status: ReservationStatus!
        $customerName: String!
        $customerEmail: String
        $customerPhone: String
        $notes: String
        $tableNumber: String
    ) {
        createReservation(
            input: {
                restaurantId: $restaurantId
                date: $date
                time: $time
                covers: $covers
                status: $status
                customerName: $customerName
                customerEmail: $customerEmail
                customerPhone: $customerPhone
                notes: $notes
                tableNumber: $tableNumber
            }
        ) {
            id
            restaurantId
            date
            time
            covers
            status
            customerName
            customerEmail
            customerPhone
            notes
            tableNumber
            createdAt
            updatedAt
        }
    }
`;

export const CREATE_TAKINGS_SESSION = gql`
    # First cash-up release only persists the scalar fields needed to open a session from the POS.
    mutation CreateTakingsSession(
        $restaurantId: ID!
        $businessDate: AWSDate!
        $scopeType: TakingsScopeType!
        $scopeId: ID!
        $scopeKey: String!
        $sessionNumber: Int!
        $status: TakingsSessionStatus!
        $openedAt: String!
        $openedAtUtc: String
        $lastActivityAt: String
        $openedBy: ID
        $openingFloatCents: Int!
        $moneyInCents: Int
        $moneyOutCents: Int
        $cashDropsCents: Int
        $tipPayoutsCents: Int
        $expectedDrawerCashCents: Int!
        $countedDrawerCashCents: Int!
        $varianceCents: Int!
        $openOrdersCount: Int!
        $unpaidOrdersCount: Int!
        $parkedOrdersCount: Int!
        $owner: ID
    ) {
        createTakingsSession(
            input: {
                restaurantId: $restaurantId
                businessDate: $businessDate
                scopeType: $scopeType
                scopeId: $scopeId
                scopeKey: $scopeKey
                sessionNumber: $sessionNumber
                status: $status
                openedAt: $openedAt
                openedAtUtc: $openedAtUtc
                lastActivityAt: $lastActivityAt
                openedBy: $openedBy
                openingFloatCents: $openingFloatCents
                moneyInCents: $moneyInCents
                moneyOutCents: $moneyOutCents
                cashDropsCents: $cashDropsCents
                tipPayoutsCents: $tipPayoutsCents
                expectedDrawerCashCents: $expectedDrawerCashCents
                countedDrawerCashCents: $countedDrawerCashCents
                varianceCents: $varianceCents
                openOrdersCount: $openOrdersCount
                unpaidOrdersCount: $unpaidOrdersCount
                parkedOrdersCount: $parkedOrdersCount
                owner: $owner
            }
        ) {
            id
            restaurantId
            businessDate
            scopeType
            scopeId
            scopeKey
            sessionNumber
            status
            openedAt
            openedAtUtc
            lastActivityAt
            finalizedAt
            openedBy
            finalizedBy
            openingFloatCents
            moneyInCents
            moneyOutCents
            cashDropsCents
            tipPayoutsCents
            declaredClosingFloatCents
            expectedDrawerCashCents
            countedDrawerCashCents
            varianceCents
            recordedTotalCents
            countedTotalCents
            paymentVarianceCents
            paymentSummaryJson
            varianceReason
            openOrdersCount
            unpaidOrdersCount
            parkedOrdersCount
            notes
            owner
            createdAt
            updatedAt
        }
    }
`;

export const CREATE_CASH_MOVEMENT = gql`
    mutation CreateCashMovement($input: CreateCashMovementInput!) {
        createCashMovement(input: $input) {
            id
            restaurantId
            registerId
            staffId
            takingsSessionId
            scopeKey
            businessDate
            occurredAt
            type
            paymentMethod
            amountCents
            reason
            createdBy
            owner
            createdAt
            updatedAt
        }
    }
`;

export const UPDATE_RESERVATION = gql`
    mutation UpdateReservation(
        $id: ID!
        $date: AWSDate
        $time: AWSTime
        $covers: Int
        $status: ReservationStatus
        $customerName: String
        $customerEmail: String
        $customerPhone: String
        $notes: String
        $tableNumber: String
    ) {
        updateReservation(
            input: {
                id: $id
                date: $date
                time: $time
                covers: $covers
                status: $status
                customerName: $customerName
                customerEmail: $customerEmail
                customerPhone: $customerPhone
                notes: $notes
                tableNumber: $tableNumber
            }
        ) {
            id
            restaurantId
            date
            time
            covers
            status
            customerName
            customerEmail
            customerPhone
            notes
            tableNumber
            createdAt
            updatedAt
        }
    }
`;

export const UPDATE_TAKINGS_SESSION = gql`
    # Finalise/update cash up from the POS. Recorded totals are calculated from orders;
    # money movement fields remain scalar snapshots for backend compatibility.
    mutation UpdateTakingsSession(
        $id: ID!
        $businessDate: AWSDate
        $sessionNumber: Int
        $openingFloatCents: Int
        $status: TakingsSessionStatus
        $openedAt: String
        $openedAtUtc: String
        $lastActivityAt: String
        $openedBy: ID
        $finalizedAt: String
        $finalizedBy: ID
        $declaredClosingFloatCents: Int
        $cashSalesCents: Int
        $cashRefundsCents: Int
        $moneyInCents: Int
        $moneyOutCents: Int
        $cashDropsCents: Int
        $tipPayoutsCents: Int
        $expectedDrawerCashCents: Int
        $countedDrawerCashCents: Int
        $varianceCents: Int
        $recordedTotalCents: Int
        $countedTotalCents: Int
        $paymentVarianceCents: Int
        $paymentSummaryJson: AWSJSON
        $varianceReason: String
        $openOrdersCount: Int
        $unpaidOrdersCount: Int
        $parkedOrdersCount: Int
        $notes: String
    ) {
        updateTakingsSession(
            input: {
                id: $id
                businessDate: $businessDate
                sessionNumber: $sessionNumber
                openingFloatCents: $openingFloatCents
                status: $status
                openedAt: $openedAt
                openedAtUtc: $openedAtUtc
                lastActivityAt: $lastActivityAt
                openedBy: $openedBy
                finalizedAt: $finalizedAt
                finalizedBy: $finalizedBy
                declaredClosingFloatCents: $declaredClosingFloatCents
                cashSalesCents: $cashSalesCents
                cashRefundsCents: $cashRefundsCents
                moneyInCents: $moneyInCents
                moneyOutCents: $moneyOutCents
                cashDropsCents: $cashDropsCents
                tipPayoutsCents: $tipPayoutsCents
                expectedDrawerCashCents: $expectedDrawerCashCents
                countedDrawerCashCents: $countedDrawerCashCents
                varianceCents: $varianceCents
                recordedTotalCents: $recordedTotalCents
                countedTotalCents: $countedTotalCents
                paymentVarianceCents: $paymentVarianceCents
                paymentSummaryJson: $paymentSummaryJson
                varianceReason: $varianceReason
                openOrdersCount: $openOrdersCount
                unpaidOrdersCount: $unpaidOrdersCount
                parkedOrdersCount: $parkedOrdersCount
                notes: $notes
            }
        ) {
            id
            restaurantId
            businessDate
            scopeType
            scopeId
            scopeKey
            sessionNumber
            status
            openedAt
            openedAtUtc
            lastActivityAt
            finalizedAt
            openedBy
            finalizedBy
            openingFloatCents
            declaredClosingFloatCents
            cashSalesCents
            cashRefundsCents
            moneyInCents
            moneyOutCents
            cashDropsCents
            tipPayoutsCents
            expectedDrawerCashCents
            countedDrawerCashCents
            varianceCents
            recordedTotalCents
            countedTotalCents
            paymentVarianceCents
            paymentSummaryJson
            varianceReason
            openOrdersCount
            unpaidOrdersCount
            parkedOrdersCount
            notes
            owner
            createdAt
            updatedAt
        }
    }
`;
