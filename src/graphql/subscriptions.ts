// tslint:disable
// eslint-disable
// this is an auto generated file. This will be overwritten

export const onCreateOrder = /* GraphQL */ `
  subscription OnCreateOrder($owner: String) {
    onCreateOrder(owner: $owner) {
      id
      status
      notes
      total
      orderProducts {
        id
        name
        price
        quantity
        notes
        modifierGroups {
          id
          name
        }
      }
      user {
        id
        email
        firstName
        lastName
        identityPoolId
        restaurants {
          nextToken
        }
        orders {
          nextToken
        }
      }
      restaurant {
        id
        name
        description
        image {
          bucket
          region
          key
          identityPoolId
        }
        address {
          formattedAddress
          aptSuite
        }
        _geoloc {
          lat
          lng
        }
        verified
        isAcceptingOrders
        manager {
          id
          email
          firstName
          lastName
          identityPoolId
        }
        categories {
          nextToken
        }
        products {
          nextToken
        }
        modifierGroups {
          nextToken
        }
        modifiers {
          nextToken
        }
        deviceEndpoint
        orders {
          nextToken
        }
        owner
      }
      owner
    }
  }
`;
export const onUpdateOrder = /* GraphQL */ `
  subscription OnUpdateOrder {
    onUpdateOrder {
      id
      status
      notes
      total
      orderProducts {
        id
        name
        price
        quantity
        notes
        modifierGroups {
          id
          name
        }
      }
      user {
        id
        email
        firstName
        lastName
        identityPoolId
        restaurants {
          nextToken
        }
        orders {
          nextToken
        }
      }
      restaurant {
        id
        name
        description
        image {
          bucket
          region
          key
          identityPoolId
        }
        address {
          formattedAddress
          aptSuite
        }
        _geoloc {
          lat
          lng
        }
        verified
        isAcceptingOrders
        manager {
          id
          email
          firstName
          lastName
          identityPoolId
        }
        categories {
          nextToken
        }
        products {
          nextToken
        }
        modifierGroups {
          nextToken
        }
        modifiers {
          nextToken
        }
        deviceEndpoint
        orders {
          nextToken
        }
        owner
      }
      owner
    }
  }
`;
export const onDeleteOrder = /* GraphQL */ `
  subscription OnDeleteOrder($owner: String) {
    onDeleteOrder(owner: $owner) {
      id
      status
      notes
      total
      orderProducts {
        id
        name
        price
        quantity
        notes
        modifierGroups {
          id
          name
        }
      }
      user {
        id
        email
        firstName
        lastName
        identityPoolId
        restaurants {
          nextToken
        }
        orders {
          nextToken
        }
      }
      restaurant {
        id
        name
        description
        image {
          bucket
          region
          key
          identityPoolId
        }
        address {
          formattedAddress
          aptSuite
        }
        _geoloc {
          lat
          lng
        }
        verified
        isAcceptingOrders
        manager {
          id
          email
          firstName
          lastName
          identityPoolId
        }
        categories {
          nextToken
        }
        products {
          nextToken
        }
        modifierGroups {
          nextToken
        }
        modifiers {
          nextToken
        }
        deviceEndpoint
        orders {
          nextToken
        }
        owner
      }
      owner
    }
  }
`;
