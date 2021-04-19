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

export const PROCESS_ORDER = gql`
    mutation processOrder(
        $orderRestaurantId: String!
        $orderUserId: String!
        $notes: String
        $products: [ProcessOrderProduct!]
        $type: OrderType!
        $number: String!
        $table: String
        $total: Int!
        $paid: Boolean!
        $registerId: ID
    ) {
        processOrder(
            input: {
                orderRestaurantId: $orderRestaurantId
                orderUserId: $orderUserId
                notes: $notes
                products: $products
                type: $type
                number: $number
                table: $table
                total: $total
                paid: $paid
                registerId: $registerId
            }
        )
    }
`;
