import gql from "graphql-tag";

export const GET_PRODUCT = gql`
  query GetProduct($productID: ID!) {
    getProduct(id: $productID) {
      id
      name
      description
      price
      displaySequence
      soldOut
      soldOutDate
      image {
        key
        bucket
        region
        identityPoolId
      }
      category {
        id
        name
        restaurant {
          id
          name
        }
      }
      modifierGroups(limit: 100) {
        items {
          id
          displaySequence
          modifierGroup {
            id
            name
            numberChoiceMin
            numberChoiceMax
            numberOfAnySingleItem
            product(limit: 100) {
              items {
                product {
                  id
                  name
                }
              }
            }
            modifiers(limit: 100) {
              items {
                id
                name
                displaySequence
                price
                soldOut
                soldOutDate
                group {
                  id
                  name
                  numberOfAnySingleItem
                }
              }
            }
          }
        }
      }
    }
  }
`;

export interface IGET_PRODUCT {
  getProduct: {
    id: string;
    name: string;
    description: string;
    price: number;
    displaySequence: number;
    soldOut: boolean;
    soldOutDate: string;
    image: IS3Image;
    category: {
      id: string;
      name: string;
      restaurant: {
        id: string;
        name: string;
      };
    };
    modifierGroups: {
      items: {
        id: string;
        displaySequence: number;
        modifierGroup: {
          id: string;
          name: string;
          numberChoiceMin: number;
          numberChoiceMax: number;
          numberOfAnySingleItem: number;
          product: {
            items: {
              product: {
                id: string;
                name: string;
              };
            }[];
          };
          modifiers: {
            items: IGET_PRODUCT_MODIFIER[];
          };
        };
      }[];
    };
  };
}

export interface IGET_PRODUCT_MODIFIER {
  id: string;
  name: string;
  displaySequence: number;
  price: number;
  soldOut: boolean;
  soldOutDate: string;
  group: {
    id: string;
    name: string;
    numberOfAnySingleItem: number;
  };
}

export const GET_USER_RESTAURANTS = gql`
  query GetUser($userID: ID!) {
    getUser(id: $userID) {
      id
      restaurants {
        items {
          id
        }
      }
    }
  }
`;

export interface IGET_USER_RESTAURANTS {
  getUser: {
    id: string;
    restaurants: {
      items: {
        id: string;
      }[];
    };
  };
}

export const GET_USER = gql`
  query GetUser($userID: ID!) {
    getUser(id: $userID) {
      id
      identityPoolId
      firstName
      lastName
      email
      restaurants {
        items {
          id
          name
          advertisements {
            items {
              id
              name
              content {
                key
                bucket
                region
                identityPoolId
              }
            }
          }
          registers {
            items {
              id
              active
              name
              enableTableFlags
              enablePayLater
              type
              eftposProvider
              eftposIpAddress
              eftposPortNumber
              orderNumberSuffix
              printers {
                items {
                  id
                  name
                  address
                  ignoreProducts(limit: 500) {
                    items {
                      id
                      product {
                        id
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export interface IGET_USER {
  id: string;
  identityPoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  restaurants: {
    items: {
      id: string;
      name: string;
      advertisements: { items: IGET_USER_RESTAURANT_ADVERTISEMENT[] };
      registers: { items: IGET_USER_RESTAURANT_REGISTER[] };
    }[];
  };
}

export interface IGET_USER_RESTAURANT_ADVERTISEMENT {
  id: string;
  name: string;
  content: IS3Image;
}

export interface IGET_USER_RESTAURANT_REGISTER {
  id: string;
  active: boolean;
  name: string;
  enableTableFlags: boolean;
  enablePayLater: boolean;
  type: string;
  eftposProvider: string;
  eftposIpAddress: string;
  eftposPortNumber: string;
  orderNumberSuffix: string;
  printers: {
    items: IGET_USER_REGISTER_PRINTER[];
  };
}

export interface IGET_USER_REGISTER_PRINTER {
  id: string;
  name: string;
  address: string;
  ignoreProducts: {
    items: IGET_USER_REGISTER_PRINTER_IGNORE_PRODUCT[];
  };
}

export interface IGET_USER_REGISTER_PRINTER_IGNORE_PRODUCT {
  id: string;
  product: {
    id: string;
    name: string;
  }
}

export const GET_RESTAURANT = gql`
  query GetRestaurant($restaurantID: ID!) {
    getRestaurant(id: $restaurantID) {
      id
      name
      description
      isAcceptingOrders
      verified
      address {
        aptSuite
        formattedAddress
      }
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
      image {
        key
        bucket
        region
        identityPoolId
      }
      advertisements {
        items {
          id
          name
          content {
            key
            bucket
            region
            identityPoolId
          }
        }
      }
      registers {
        items {
          id
          active
          name
          enableTableFlags
          enablePayLater
          type
          eftposProvider
          eftposIpAddress
          eftposPortNumber
          orderNumberSuffix
          printers {
            items {
              id
              name
              address
              ignoreProducts(limit: 500) {
                items {
                  id
                  product {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
      categories(limit: 100) {
        items {
          id
          name
          image {
            key
            bucket
            region
            identityPoolId
          }
          displaySequence
          availability {
            monday {
              startTime
              endTime
            }
            tuesday {
              startTime
              endTime
            }
            wednesday {
              startTime
              endTime
            }
            thursday {
              startTime
              endTime
            }
            friday {
              startTime
              endTime
            }
            saturday {
              startTime
              endTime
            }
            sunday {
              startTime
              endTime
            }
          }
          products(limit: 200) {
            items {
              id
              displaySequence
              product {
                id
                name
                description
                price
                soldOut
                soldOutDate
                image {
                  key
                  bucket
                  region
                  identityPoolId
                }
                availability {
                  monday {
                    startTime
                    endTime
                  }
                  tuesday {
                    startTime
                    endTime
                  }
                  wednesday {
                    startTime
                    endTime
                  }
                  thursday {
                    startTime
                    endTime
                  }
                  friday {
                    startTime
                    endTime
                  }
                  saturday {
                    startTime
                    endTime
                  }
                  sunday {
                    startTime
                    endTime
                  }
                }
                modifierGroups(limit: 100) {
                  items {
                    id
                    displaySequence
                    hideForCustomer
                    modifierGroup {
                      id
                      name
                      choiceMin
                      choiceMax
                      choiceDuplicate
                      modifiers(limit: 100) {
                        items {
                          id
                          displaySequence
                          preSelectedQuantity
                          modifier {
                            id
                            name
                            price
                            soldOut
                            soldOutDate
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export interface IGET_RESTAURANT {
  id: string;
  name: string;
  description: string;
  // averagePreparationTimeInMinutes: number;
  isAcceptingOrders: boolean;
  verified: boolean;
  address: {
    aptSuite: string;
    formattedAddress: string;
  };
  operatingHours: IGET_RESTAURANT_OPERATING_HOURS;
  image?: IS3Image;
  advertisements: { items: IGET_RESTAURANT_ADVERTISEMENT[] };
  registers: { items: IGET_RESTAURANT_REGISTER[] };
  categories: {
    items: IGET_RESTAURANT_CATEGORY[];
  };
}

export interface IGET_RESTAURANT_ADVERTISEMENT {
  id: string;
  name: string;
  content: IS3Image;
}

export interface IGET_RESTAURANT_REGISTER {
  id: string;
  active: boolean;
  name: string;
  enableTableFlags: boolean;
  enablePayLater: boolean;
  type: string;
  eftposProvider: string;
  eftposIpAddress: string;
  eftposPortNumber: string;
  orderNumberSuffix: string;
  printers: {
    items: IGET_RESTAURANT_REGISTER_PRINTER[];
  };
}

export interface IGET_RESTAURANT_REGISTER_PRINTER {
  id: string;
  name: string;
  address: string;
  ignoreProducts: {
    items: IGET_RESTAURANT_REGISTER_PRINTER_IGNORE_PRODUCT[];
  };
}

export interface IGET_RESTAURANT_REGISTER_PRINTER_IGNORE_PRODUCT {
  id: string;
  product: {
    id: string;
    name: string;
  }
}

export interface IGET_RESTAURANT_OPERATING_HOURS {
  sunday: {
    openingTime: string;
    closingTime: string;
  }[];
  monday: {
    openingTime: string;
    closingTime: string;
  }[];
  tuesday: {
    openingTime: string;
    closingTime: string;
  }[];
  wednesday: {
    openingTime: string;
    closingTime: string;
  }[];
  thursday: {
    openingTime: string;
    closingTime: string;
  }[];
  friday: {
    openingTime: string;
    closingTime: string;
  }[];
  saturday: {
    openingTime: string;
    closingTime: string;
  }[];
}


export interface IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS {
  monday: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[];
  tuesday: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[];
  wednesday: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[];
  thursday: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[];
  friday: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[];
  saturday: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[];
  sunday: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[];
  [key: string]: IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES[]; //this is used to map over the operating hours object, https://www.logicbig.com/tutorials/misc/typescript/indexable-types.html
}

export interface IGET_RESTAURANT_ITEM_AVAILABILITY_TIMES {
  startTime: string;
  endTime: string;
}

export interface IGET_DASHBOARD_REGISTER {
  id: string;
  active: boolean;
  name: string;
  enableTableFlags: boolean;
  enablePayLater: boolean;
  type: string;
  eftposProvider: string;
  eftposIpAddress: string;
  eftposPortNumber: string;
  orderNumberSuffix: string;
  printers: {
    items: IGET_DASHBOARD_REGISTER_PRINTER[];
  };
}

export interface IGET_DASHBOARD_REGISTER_PRINTER {
  id: string;
  name: string;
  address: string;
  ignoreProducts: {
    items: IGET_DASHBOARD_REGISTER_PRINTER_IGNORE_PRODUCT[];
  };
}

export interface IGET_DASHBOARD_REGISTER_PRINTER_IGNORE_PRODUCT {
  id: string;
  product: {
    id: string;
    name: string;
  }
}

export interface IGET_RESTAURANT_CATEGORY {
  id: string;
  name: string;
  displaySequence: number;
  image?: IS3Image;
  availability: IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS;
  products: {
    items: IGET_RESTAURANT_PRODUCT_LINK[];
  };
}

export interface IGET_RESTAURANT_PRODUCT_LINK {
  id: string;
  displaySequence: number;
  product: IGET_RESTAURANT_PRODUCT;
}

export interface IGET_RESTAURANT_PRODUCT {
  id: string;
  name: string;
  description: string;
  price: number;
  soldOut: boolean;
  soldOutDate: string;
  image?: IS3Image;
  availability: IGET_RESTAURANT_ITEM_AVAILABILITY_HOURS;
  modifierGroups: {
    items: IGET_RESTAURANT_MODIFIER_GROUP_LINK[];
  };
}

export interface IGET_RESTAURANT_MODIFIER_GROUP_LINK {
  id: string;
  displaySequence: number;
  hideForCustomer?: boolean;
  modifierGroup: IGET_RESTAURANT_MODIFIER_GROUP;
}

export interface IGET_RESTAURANT_MODIFIER_GROUP {
  id: string;
  name: string;
  choiceMin: number;
  choiceMax: number;
  choiceDuplicate: number;
  modifiers: {
    items: IGET_RESTAURANT_MODIFIER_LINK[];
  };
}

export interface IGET_RESTAURANT_MODIFIER_LINK {
  id: string;
  displaySequence: number;
  preSelectedQuantity: number;
  modifier: IGET_RESTAURANT_MODIFIER;
}

export interface IGET_RESTAURANT_MODIFIER {
  id: string;
  name: string;
  price: number;
  soldOut: boolean;
  soldOutDate: string;
}

export const LIST_DASHBOARD_RESTAURANTS = gql`
  query ListRestaurants {
    listRestaurants {
      items {
        id
        name
        description
        restaurantManagerId
      }
    }
  }
`;

export interface ILIST_DASHBOARD_RESTAURANTS {
  id: string;
  name: string;
  description: string;
  restaurantManagerId: string;
}

export const GET_DASHBOARD_RESTAURANT = gql`
  query GetDashboardRestaurant($restaurantID: ID!) {
    getRestaurant(id: $restaurantID) {
      id
      name
      description
      restaurantManagerId
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
      advertisements {
        items {
          id
          name
          content {
            key
            bucket
            region
            identityPoolId
          }
        }
      }
      registers {
        items {
          id
          active
          name
          enableTableFlags
          enablePayLater
          type
          eftposProvider
          eftposIpAddress
          eftposPortNumber
          orderNumberSuffix
          printers {
            items {
              id
              name
              address
              ignoreProducts(limit: 500) {
                items {
                  id
                  product {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
      categories(limit: 500) {
        items {
          id
          name
          displaySequence
          availability {
            monday {
              startTime
              endTime
            }
            tuesday {
              startTime
              endTime
            }
            wednesday {
              startTime
              endTime
            }
            thursday {
              startTime
              endTime
            }
            friday {
              startTime
              endTime
            }
            saturday {
              startTime
              endTime
            }
            sunday {
              startTime
              endTime
            }
          }
          products(limit: 500) {
            items {
              id
              displaySequence
              product {
                id
                name
                description
                price
                modifierGroups(limit: 500) {
                  items {
                    id
                    displaySequence
                    modifierGroup {
                      id
                      name
                      choiceDuplicate
                      choiceMin
                      choiceMax
                      modifiers(limit: 500) {
                        items {
                          id
                          displaySequence
                          preSelectedQuantity
                          modifier {
                            id
                            name
                            price
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      products(limit: 500) {
        items {
          id
          name
          description
          price
          availability {
            monday {
              startTime
              endTime
            }
            tuesday {
              startTime
              endTime
            }
            wednesday {
              startTime
              endTime
            }
            thursday {
              startTime
              endTime
            }
            friday {
              startTime
              endTime
            }
            saturday {
              startTime
              endTime
            }
            sunday {
              startTime
              endTime
            }
          }
          categories(limit: 500) {
            items {
              id
              displaySequence
              category {
                id
                name
              }
            }
          }
          modifierGroups(limit: 500) {
            items {
              id
              modifierGroup {
                id
                name
                choiceDuplicate
                choiceMin
                choiceMax
                modifiers(limit: 500) {
                  items {
                    id
                    modifier {
                      id
                      name
                      price
                    }
                  }
                }
              }
            }
          }
        }
      }
      modifierGroups(limit: 500) {
        items {
          id
          name
          choiceDuplicate
          choiceMin
          choiceMax
          products(limit: 500) {
            items {
              id
              displaySequence
              hideForCustomer
              product {
                id
                name
              }
            }
          }
          modifiers(limit: 500) {
            items {
              id
              modifier {
                id
                name
                price
              }
            }
          }
        }
      }
      modifiers(limit: 500) {
        items {
          id
          name
          price
          modifierGroups(limit: 500) {
            items {
              id
              displaySequence
              preSelectedQuantity
              modifierGroup {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`;

export interface IGET_DASHBOARD_RESTAURANT {
  id: string;
  name: string;
  description: string;
  restaurantManagerId: string;
  operatingHours: IGET_DASHBOARD_OPERATING_HOURS;
  advertisements: { items: IGET_DASHBOARD_ADVERTISEMENT[] };
  registers: {
    items: IGET_DASHBOARD_REGISTER[];
  };
  categories: {
    items: IGET_DASHBOARD_CATEGORY[];
  };
  products: { items: IGET_DASHBOARD_PRODUCT[] };
  modifierGroups: {
    items: IGET_DASHBOARD_MODIFIER_GROUP[];
  };
  modifiers: {
    items: IGET_DASHBOARD_MODIFIER[];
  };
}

export interface IGET_DASHBOARD_ADVERTISEMENT {
  id: string;
  name: string;
  content: IS3Image;
}

export interface IGET_DASHBOARD_OPERATING_HOURS {
  monday: IGET_DASHBOARD_OPERATING_TIMES[];
  tuesday: IGET_DASHBOARD_OPERATING_TIMES[];
  wednesday: IGET_DASHBOARD_OPERATING_TIMES[];
  thursday: IGET_DASHBOARD_OPERATING_TIMES[];
  friday: IGET_DASHBOARD_OPERATING_TIMES[];
  saturday: IGET_DASHBOARD_OPERATING_TIMES[];
  sunday: IGET_DASHBOARD_OPERATING_TIMES[];
  [key: string]: IGET_DASHBOARD_OPERATING_TIMES[]; //this is used to map over the operating hours object, https://www.logicbig.com/tutorials/misc/typescript/indexable-types.html
}

export interface IGET_DASHBOARD_OPERATING_TIMES {
  openingTime: string;
  closingTime: string;
}

export interface IGET_DASHBOARD_ITEM_AVAILABILITY_HOURS {
  monday: IGET_DASHBOARD_ITEM_AVAILABILITY_TIMES[];
  tuesday: IGET_DASHBOARD_ITEM_AVAILABILITY_TIMES[];
  wednesday: IGET_DASHBOARD_ITEM_AVAILABILITY_TIMES[];
  thursday: IGET_DASHBOARD_ITEM_AVAILABILITY_TIMES[];
  friday: IGET_DASHBOARD_ITEM_AVAILABILITY_TIMES[];
  saturday: IGET_DASHBOARD_ITEM_AVAILABILITY_TIMES[];
  sunday: IGET_DASHBOARD_ITEM_AVAILABILITY_TIMES[];
  [key: string]: IGET_DASHBOARD_ITEM_AVAILABILITY_TIMES[]; //this is used to map over the operating hours object, https://www.logicbig.com/tutorials/misc/typescript/indexable-types.html
}

export interface IGET_DASHBOARD_ITEM_AVAILABILITY_TIMES {
  startTime: string;
  endTime: string;
}

export interface IGET_DASHBOARD_CATEGORY {
  id: string;
  name: string;
  displaySequence: number;
  availability: IGET_DASHBOARD_ITEM_AVAILABILITY_HOURS;
  products: { items: IGET_DASHBOARD_PRODUCTS[] };
}

export interface IGET_DASHBOARD_PRODUCTS {
  id: string;
  displaySequence: number;
  category: IGET_DASHBOARD_CATEGORY;
  product: IGET_DASHBOARD_PRODUCT;
}

export interface IGET_DASHBOARD_PRODUCT {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: IS3Image;
  availability: IGET_DASHBOARD_ITEM_AVAILABILITY_HOURS;
  categories: { items: IGET_DASHBOARD_PRODUCTS[] };
  modifierGroups: {
    items: IGET_DASHBOARD_MODIFIER_GROUPS[];
  };
}

export interface IGET_DASHBOARD_MODIFIER_GROUPS {
  id: string;
  displaySequence: number;
  hideForCustomer?: boolean;
  product: IGET_DASHBOARD_PRODUCT;
  modifierGroup: IGET_DASHBOARD_MODIFIER_GROUP;
}

export interface IGET_DASHBOARD_MODIFIER_GROUP {
  id: string;
  name: string;
  choiceDuplicate: number;
  choiceMin: number;
  choiceMax: number;
  products: {
    items: IGET_DASHBOARD_MODIFIER_GROUPS[];
  };
  modifiers: {
    items: IGET_DASHBOARD_MODIFIERS[];
  };
}

export interface IGET_DASHBOARD_MODIFIERS {
  id: string;
  displaySequence: number;
  preSelectedQuantity: number;
  modifierGroup: IGET_DASHBOARD_MODIFIER_GROUP;
  modifier: IGET_DASHBOARD_MODIFIER;
}

export interface IGET_DASHBOARD_MODIFIER {
  id: string;
  name: string;
  price: number;
  modifierGroups: {
    items: IGET_DASHBOARD_MODIFIERS[];
  };
}

export interface IS3Image {
  key: string;
  bucket: string;
  region: string;
  identityPoolId: string;
}