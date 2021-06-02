import gql from "graphql-tag";

export const CREATE_VERIFONE_TRANSACTION_LOG = gql`
    mutation createVerifoneTransactionLog(
        $transactionId: Int!
        $merchantId: Int!
        $amount: Int!
        $type: String!
        $payload: String!
        $restaurantId: ID!
        $timestampEpoch: Int!
    ) {
        createVerifoneTransactionLog(
            input: {
                transactionId: $transactionId
                merchantId: $merchantId
                amount: $amount
                type: $type
                payload: $payload
                restaurantId: $restaurantId
                timestampEpoch: $timestampEpoch
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
    mutation createOrder(
        $status: OrderStatus!
        $paid: Boolean!
        $type: OrderType!
        $number: String!
        $table: String
        $notes: String
        $total: Int!
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
                type: $type
                number: $number
                table: $table
                notes: $notes
                total: $total
                registerId: $registerId
                products: $products
                placedAt: $placedAt
                placedAtUtc: $placedAtUtc
                orderUserId: $orderUserId
                orderRestaurantId: $orderRestaurantId
            }
        ){
            id
        }
    }
`;
