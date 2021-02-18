/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getUser = /* GraphQL */ `
  query GetUser($id: ID!) {
    getUser(id: $id) {
      id
      email
      firstName
      lastName
      identityPoolId
      restaurants {
        items {
          id
          name
          description
          verified
          isAcceptingOrders
          restaurantManagerId
          deviceEndpoint
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      orders {
        items {
          id
          status
          paid
          type
          number
          table
          notes
          total
          registerId
          placedAt
          placedAtUtc
          completedAt
          completedAtUtc
          cancelledAt
          cancelledAtUtc
          orderUserId
          orderRestaurantId
          createdAt
          updatedAt
        }
        nextToken
      }
      owner
      createdAt
      updatedAt
    }
  }
`;
export const getRestaurant = /* GraphQL */ `
  query GetRestaurant($id: ID!) {
    getRestaurant(id: $id) {
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
      operatingHours {
        monday {
          openingTime
          closingTime
        }
        tuesday {
          openingTime
          closingTime
        }
        wednesday {
          openingTime
          closingTime
        }
        thursday {
          openingTime
          closingTime
        }
        friday {
          openingTime
          closingTime
        }
        saturday {
          openingTime
          closingTime
        }
        sunday {
          openingTime
          closingTime
        }
      }
      restaurantManagerId
      deviceEndpoint
      registers {
        items {
          id
          name
          active
          orderNumberSuffix
          enableTableFlags
          enablePayLater
          type
          eftposProvider
          eftposIpAddress
          eftposPortNumber
          registerRestaurantId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      advertisements {
        items {
          id
          name
          active
          contentDurationInSeconds
          advertisementRestaurantId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      categories {
        items {
          id
          name
          displaySequence
          categoryRestaurantId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      products {
        items {
          id
          name
          description
          price
          soldOutDate
          soldOut
          productRestaurantId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      modifierGroups {
        items {
          id
          name
          choiceDuplicate
          choiceMin
          choiceMax
          modifierGroupRestaurantId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      modifiers {
        items {
          id
          name
          price
          soldOutDate
          soldOut
          modifierRestaurantId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      orders {
        items {
          id
          status
          paid
          type
          number
          table
          notes
          total
          registerId
          placedAt
          placedAtUtc
          completedAt
          completedAtUtc
          cancelledAt
          cancelledAtUtc
          orderUserId
          orderRestaurantId
          createdAt
          updatedAt
        }
        nextToken
      }
      ordersByStatusPlacedAt {
        items {
          id
          status
          paid
          type
          number
          table
          notes
          total
          registerId
          placedAt
          placedAtUtc
          completedAt
          completedAtUtc
          cancelledAt
          cancelledAtUtc
          orderUserId
          orderRestaurantId
          createdAt
          updatedAt
        }
        nextToken
      }
      owner
      createdAt
      updatedAt
    }
  }
`;
export const listRestaurants = /* GraphQL */ `
  query ListRestaurants(
    $filter: ModelRestaurantFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listRestaurants(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
        restaurantManagerId
        deviceEndpoint
        registers {
          nextToken
        }
        advertisements {
          nextToken
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
        orders {
          nextToken
        }
        ordersByStatusPlacedAt {
          nextToken
        }
        owner
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;
