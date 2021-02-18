import { IS3Image } from "../graphql/customQueries";

export interface ICognitoUser {
  attributes: {
    email: string;
    email_verified: boolean;
    family_name: string;
    name: string;
    sub: string;
  };
  username: string;
}

export interface IOrder {
  id: string;
  restaurant: {
    name: string;
    id: string;
  };
  orderedProducts: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
    category: {
      id: string;
      name: string;
    };
    modifiers:
    | {
      id: string;
      name: string;
      price: number;
      quantity: number;
      group: {
        id: string;
        name: string;
      };
    }[]
    | null;
  }[];
  notes?: string;
  createdAt: string;
}

export interface IRestaurantOrderHistory {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  orderedProducts: {
    productID: string;
    name: string;
    price: number;
    quantity: number;
    modifiers: {
      id: string;
      name: string;
      price: string;
    };
  }[];
  status:
  | "NEW"
  | "REVIEWED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
  scheduleTime: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  orderRestaurantId: string;
}

export enum EOrderType {
  DINEIN = "DINEIN",
  TAKEAWAY = "TAKEAWAY",
}

export interface ICartProduct {
  id: string;
  name: string;
  price: number;
  image: IS3Image | null;
  quantity: number;
  notes: string | null;
  category: ICartCategory;
  modifierGroups: ICartModifierGroup[];
}

export interface ICartCategory {
  id: string;
  name: string;
  image: IS3Image | null;
}

export interface ICartModifierGroup {
  id: string;
  name: string;
  hideForCustomer?: boolean;
  modifiers: ICartModifier[];
}

export interface ICartModifier {
  id: string;
  name: string;
  price: number;
  preSelectedQuantity: number;
  quantity: number;
}

export interface ISelectedProductModifiers {
  [modifierGroupId: string]: ICartModifier[];
}

export interface IOrderReceipt {
  printerAddress: string;
  eftposReceipt?: string;
  hideModifierGroupsForCustomer?: boolean;
  restaurant: {
    name: string;
    address: string;
  };
  notes: string | null;
  products: ICartProduct[];
  total: number;
  type: EOrderType;
  number: string;
  table: string | null;
}

export interface IModifierGroup {
  id: string;
  name: string;
  choiceMin: number;
  choiceMax: number;
  choiceDuplicate: number;
  product: {
    items: {
      product: {
        id: string;
        name: string;
      };
    }[];
  };
  modifiers: {
    items: IModifier[];
  };
}

export interface IModifier {
  id: string;
  name: string;
  displaySequence: number;
  price: number;
  soldOut: boolean;
  soldOutDate: string;
  group: {
    id: string;
    name: string;
  };
}

export interface IProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  soldOut: boolean;
  soldOutDate: string;
  category: {
    id: string;
    name: string;
    restaurant: {
      id: string;
      name: string;
    };
  };
  displaySequence: number;
  image?: IS3Image;
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
          items: IModifier[];
        };
      };
    }[];
  };
}

export interface IProductCategory {
  id: string;
  name: string;
  displaySequence: number;
  products: {
    items: IProduct[];
  };
}

export interface IRestaurant {
  id: string;
  name: string;
  description: string;
  averagePreparationTimeInMinutes: number;
  isAcceptingOrders: boolean;
  verified: boolean;
  address: {
    aptSuite: string;
    formattedAddress: string;
  };
  operatingHours: {
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
  };
  image?: IS3Image;
  productCategory: {
    items: {
      id: string;
      name: string;
      displaySequence: number;
      products: {
        items: IProduct[];
      };
    }[];
  };
}

export interface IOperatingHours {
  monday: IOperatingTimes[];
  tuesday: IOperatingTimes[];
  wednesday: IOperatingTimes[];
  thursday: IOperatingTimes[];
  friday: IOperatingTimes[];
  saturday: IOperatingTimes[];
  sunday: IOperatingTimes[];
  [key: string]: IOperatingTimes[]; //this is used to map over the operating hours object, https://www.logicbig.com/tutorials/misc/typescript/indexable-types.html
}

export interface IOperatingTimes {
  openingTime: string;
  closingTime: string;
}
