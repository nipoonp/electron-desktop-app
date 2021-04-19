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

export const CREATE_RECOMMENDATION_EVENT = gql`
    mutation CreateRecommendationEvent(
        $type: RecommendationEventType
        $user_id: ID
        $user_timestamp: Int
        $user_deleted: Boolean
        $item_Id: ID
        $item_name: String
        $item_price: String
        $item_restaurantId: ID
        $item_deleted: Int
        $item_timestamp: Int
        $interaction_userId: ID
        $interaction_itemId: ID
        $interaction_eventType: RecommendationEventInteractionEventType
        $interaction_eventValue: Float
        $interaction_impression: String
        $interaction_recommendationId: String
        $interaction_restaurantId: ID
        $interaction_timestamp: Int
    ) {
        createRecommendationEvent(
            input: {
                type: $type
                user_id: $user_id
                user_timestamp: $user_timestamp
                user_deleted: $user_deleted
                item_Id: $item_Id
                item_name: $item_name
                item_price: $item_price
                item_restaurantId: $item_restaurantId
                item_deleted: $item_deleted
                item_timestamp: $item_timestamp
                interaction_userId: $interaction_userId
                interaction_itemId: $interaction_itemId
                interaction_eventType: $interaction_eventType
                interaction_eventValue: $interaction_eventValue
                interaction_impression: $interaction_impression
                interaction_recommendationId: $interaction_recommendationId
                interaction_restaurantId: $interaction_restaurantId
                interaction_timestamp: $interaction_timestamp
            }
        ) {
            id
        }
    }
`;
