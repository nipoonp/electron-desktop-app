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

// export const SIGN_UP_TO_GET_NOTIFIED = gql`
//   mutation signUpToGetNotified($email: String!) {
//     signUpToGetNotified(input: { email: $email }) {
//       status
//     }
//   }
// `;

// export interface ISIGN_UP_TO_GET_NOTIFIED {
//   status: string;
// }

// export const UPDATE_CART = gql`
//   mutation updateCart($id: ID!, $cart: CartInput!) {
//     updateCart(input: { id: $id, cart: $cart }) {
//       ... on UpdateCartSuccess {
//         user {
//           id
//           cart {
//             restaurant {
//               id
//               name
//               averagePreparationTimeInMinutes
//             }
//             discountClass
//             discountCode
//             amount {
//               amountCharge
//               cardCharge
//               discountAmount
//               total
//             }
//             products {
//               product {
//                 id
//                 name
//                 price
//                 category {
//                   id
//                   name
//                   restaurant {
//                     id
//                     name
//                   }
//                 }
//               }
//               modifiers {
//                 modifier {
//                   id
//                   name
//                   price
//                   group {
//                     id
//                     name
//                   }
//                 }
//                 quantity
//               }
//               quantity
//               notes
//             }
//           }
//         }
//       }
//       ... on Error {
//         message
//       }
//       # Not currently used
//       ... on ProductSoldOutError {
//         productID
//         message
//       }
//       # Not currently used
//       ... on ProductNotExistError {
//         productID
//         message
//       }
//       # Not currently used
//       ... on ProductInvalidError {
//         productID
//         message
//       }
//       # Not currently used
//       ... on ProductInvalidModifierError {
//         productID
//         modifierID
//         message
//       }
//       # Not currently used
//       ... on ProductCategoryNotExistError {
//         productCategoryID
//         message
//       }
//       # Not currently used
//       ... on ModifierSoldOutError {
//         modifierID
//         message
//       }
//       # Not currently used
//       ... on ModifierNotExistError {
//         modifierID
//         message
//       }
//       # Not currently used
//       ... on ModifierQuantityError {
//         modifierID
//         message
//       }
//       # Not currently used
//       ... on ModifierGroupQuantityError {
//         modifierGroupID
//         message
//       }
//       # Not currently used
//       ... on ScheduleTimeInvalidError {
//         message
//       }
//       ... on DiscountNotFoundError {
//         code
//         message
//       }
//       ... on DiscountWrongRestaurantError {
//         code
//         message
//       }
//       ... on DiscountExpiredError {
//         code
//         message
//       }
//       ... on DiscountWrongDayError {
//         code
//         message
//       }
//       ... on DiscountGlobalLimitError {
//         code
//         message
//       }
//       ... on DiscountUserLimitError {
//         code
//         message
//       }
//     }
//   }
// `;

// export interface IUPDATE_CART {
//   data: {
//     updateCart: {
//       id: string;
//       firstName: string;
//       lastName: string;
//       phoneNumber: string | null;
//       phoneVerified: boolean;
//       cart?: {
//         products: {
//           product: {
//             id: string;
//             name: string;
//             price: number;
//             category: {
//               id: string;
//               name: string;
//               restaurant: {
//                 // for validation (all products same restaurant)
//                 // and for getting the restaurant's opening hours
//                 id: string;
//                 name: string;
//               };
//             };
//           };
//           modifiers: {
//             modifier: {
//               id: string;
//               name: string;
//               price: number;
//               group: {
//                 id: string;
//                 name: string;
//               };
//             };
//             quantity: number;
//           }[];
//           quantity: number;
//           notes?: string;
//         }[];
//       };
//     };
//   };
// }

// export const DELETE_CART = gql`
//   mutation deleteCart($id: ID!) {
//     deleteCart(input: { id: $id }) {
//       id
//       firstName
//       lastName
//       phoneNumber
//       phoneVerified
//       cart {
//         products {
//           product {
//             id
//             name
//             price
//             category {
//               id
//               name
//               restaurant {
//                 id
//                 name
//               }
//             }
//           }
//           modifiers {
//             modifier {
//               id
//               name
//               price
//               group {
//                 id
//                 name
//               }
//             }
//             quantity
//           }
//           quantity
//           notes
//         }
//       }
//     }
//   }
// `;

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

// export interface IError {
//   message: string;
// }

// export const CANCEL_ORDER = gql`
//   mutation CancelOrder($id: ID!) {
//     cancelOrder(input: { id: $id }) {
//       id
//       status
//     }
//   }
// `;

// export interface ICANCEL_ORDER {
//   id: string;
//   status: string;
// }

// export const ADD_CARD = gql`
//   mutation AddCard($id: ID!, $sourceID: String!) {
//     addCard(input: { id: $id, sourceID: $sourceID }) {
//       ... on AddCardSuccess {
//         user {
//           id
//           balance
//           card {
//             id
//             brand
//             last4
//           }
//         }
//       }
//       ... on CardError {
//         message
//       }
//     }
//   }
// `;

// export interface IADD_CARD {
//   id: string;
//   brand?:
//     | "American Express"
//     | "Diners Club"
//     | "Discover"
//     | "JCB"
//     | "MasterCard"
//     | "UnionPay"
//     | "Visa"
//     | "Unknown";
//   last4?: string;
// }

// export const DELETE_CARD = gql`
//   mutation DeleteCard($id: ID!) {
//     deleteCard(input: { id: $id }) {
//       id
//       balance
//       card {
//         id
//         brand
//         last4
//       }
//     }
//   }
// `;

// export const CONTACT_US = gql`
//   mutation ContactUs(
//     $firstName: String!
//     $lastName: String!
//     $email: String!
//     $phoneNumber: String!
//     $supportType: String!
//     $message: String!
//   ) {
//     contactUs(
//       input: {
//         firstName: $firstName
//         lastName: $lastName
//         phoneNumber: $phoneNumber
//         email: $email
//         supportType: $supportType
//         message: $message
//       }
//     ) {
//       status
//     }
//   }
// `;

// export const CREATE_DISCOUNT = gql`
//   mutation createDiscount(
//     $name: String!
//     $description: String
//     $class: String
//     $code: String!
//     $type: String!
//     $amount: Int
//     $percent: Int
//     $expiryDate: String
//     $limitGlobal: Int
//     $limitPerUser: Int
//     $productType: String
//     $limitPerProduct: Int
//     $everyXProduct: Int
//     $everyXOrder: Int
//     $minimumAmount: Int
//     $promotionDay: String
//     $promoted: Boolean!
//   ) {
//     createDiscount(
//       input: {
//         name: $name
//         description: $description
//         class: $class
//         code: $code
//         type: $type
//         amount: $amount
//         percent: $percent
//         expiryDate: $expiryDate
//         limitGlobal: $limitGlobal
//         limitPerUser: $limitPerUser
//         productType: $productType
//         limitPerProduct: $limitPerProduct
//         everyXProduct: $everyXProduct
//         everyXOrder: $everyXOrder
//         minimumAmount: $minimumAmount
//         promotionDay: $promotionDay
//         promoted: $promoted
//       }
//     ) {
//       class
//       code
//       type
//       amount
//       percent
//       expiryDate
//     }
//   }
// `;

// export interface ICREATE_DISCOUNT {
//   class: string;
//   code: string;
//   type: string;
//   amount: number;
//   percent: number;
//   expiryDate: string;
// }

// export const UPDATE_DISCOUNT = gql`
//   mutation updateDiscount(
//     $name: String
//     $description: String
//     $class: String
//     $code: String!
//     $type: String
//     $amount: Int
//     $percent: Int
//     $expiryDate: String
//     $limitGlobal: Int
//     $limitPerUser: Int
//     $productType: String
//     $limitPerProduct: Int
//     $everyXProduct: Int
//     $everyXOrder: Int
//     $minimumAmount: Int
//     $promotionDay: String
//     $promoted: Boolean
//   ) {
//     updateDiscount(
//       input: {
//         name: $name
//         description: $description
//         class: $class
//         code: $code
//         type: $type
//         amount: $amount
//         percent: $percent
//         expiryDate: $expiryDate
//         limitGlobal: $limitGlobal
//         limitPerUser: $limitPerUser
//         productType: $productType
//         limitPerProduct: $limitPerProduct
//         everyXProduct: $everyXProduct
//         everyXOrder: $everyXOrder
//         minimumAmount: $minimumAmount
//         promotionDay: $promotionDay
//         promoted: $promoted
//       }
//     ) {
//       class
//       code
//       type
//       amount
//       percent
//       expiryDate
//     }
//   }
// `;

// export interface IUPDATE_DISCOUNT {
//   class: string;
//   code: string;
//   type: string;
//   amount: number;
//   percent: number;
//   expiryDate: string;
// }

// export const DELETE_DISCOUNT = gql`
//   mutation deleteDiscount($class: String, $code: String!) {
//     deleteDiscount(input: { class: $class, code: $code }) {
//       class
//       code
//     }
//   }
// `;

// export const UPDATE_DISCOUNT_PROMOTED = gql`
//   mutation updateDiscount($class: String, $code: String!, $promoted: Boolean) {
//     updateDiscount(input: { class: $class, code: $code, promoted: $promoted }) {
//       class
//       code
//       promoted
//     }
//   }
// `;

// export const STRIPE_UPDATE_INFORMATION = gql`
//   mutation StripeUpdateInformation(
//     $restaurantID: String!
//     $successURL: String!
//     $failureURL: String!
//   ) {
//     stripeUpdateInformation(
//       input: {
//         restaurantID: $restaurantID
//         successURL: $successURL
//         failureURL: $failureURL
//       }
//     ) {
//       link
//     }
//   }
// `;

// export interface ISTRIPE_UPDATE_INFORMATION {
//   link: string;
// }
