/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type ProcessOrderInput = {
  orderRestaurantId: string,
  orderUserId: string,
  notes?: string | null,
  products?: Array< ProcessOrderProduct > | null,
  type: OrderType,
  number: string,
  table?: string | null,
  total: number,
  paid?: boolean | null,
  registerId?: string | null,
};

export type ProcessOrderProduct = {
  id: string,
  name: string,
  price: number,
  image?: ProcessOrderS3Object | null,
  quantity: number,
  notes?: string | null,
  category?: ProcessOrderCategory | null,
  modifierGroups?: Array< ProcessOrderModifierGroup | null > | null,
};

export type ProcessOrderS3Object = {
  bucket: string,
  region: string,
  key: string,
  identityPoolId?: string | null,
};

export type ProcessOrderCategory = {
  id: string,
  name: string,
  image?: ProcessOrderS3Object | null,
};

export type ProcessOrderModifierGroup = {
  id: string,
  name: string,
  hideForCustomer?: boolean | null,
  modifiers?: Array< ProcessOrderModifier | null > | null,
};

export type ProcessOrderModifier = {
  id: string,
  name: string,
  price: number,
  preSelectedQuantity?: number | null,
  quantity: number,
};

export enum OrderType {
  DINEIN = "DINEIN",
  TAKEAWAY = "TAKEAWAY",
}


export type UpdateUserInput = {
  id: string,
  email?: string | null,
  firstName?: string | null,
  lastName?: string | null,
  identityPoolId?: string | null,
  owner?: string | null,
};

export type ModelUserConditionInput = {
  email?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  lastName?: ModelStringInput | null,
  identityPoolId?: ModelStringInput | null,
  and?: Array< ModelUserConditionInput | null > | null,
  or?: Array< ModelUserConditionInput | null > | null,
  not?: ModelUserConditionInput | null,
};

export type ModelStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
  _null = "_null",
}


export type ModelSizeInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
};

export enum OrderStatus {
  NEW = "NEW",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}


export type CreateRestaurantInput = {
  id?: string | null,
  name: string,
  description?: string | null,
  image?: S3ObjectInput | null,
  address: AddressInput,
  _geoloc: LocationInput,
  verified: boolean,
  isAcceptingOrders: boolean,
  operatingHours: OperatingHoursInput,
  restaurantManagerId: string,
  deviceEndpoint?: string | null,
  owner?: string | null,
};

export type S3ObjectInput = {
  bucket: string,
  region: string,
  key: string,
  identityPoolId?: string | null,
};

export type AddressInput = {
  formattedAddress: string,
  aptSuite?: string | null,
};

export type LocationInput = {
  lat?: number | null,
  lng?: number | null,
};

export type OperatingHoursInput = {
  monday: Array< OperatingTimesInput >,
  tuesday: Array< OperatingTimesInput >,
  wednesday: Array< OperatingTimesInput >,
  thursday: Array< OperatingTimesInput >,
  friday: Array< OperatingTimesInput >,
  saturday: Array< OperatingTimesInput >,
  sunday: Array< OperatingTimesInput >,
};

export type OperatingTimesInput = {
  openingTime?: string | null,
  closingTime?: string | null,
};

export type ModelRestaurantConditionInput = {
  name?: ModelStringInput | null,
  description?: ModelStringInput | null,
  verified?: ModelBooleanInput | null,
  isAcceptingOrders?: ModelBooleanInput | null,
  restaurantManagerId?: ModelIDInput | null,
  deviceEndpoint?: ModelStringInput | null,
  and?: Array< ModelRestaurantConditionInput | null > | null,
  or?: Array< ModelRestaurantConditionInput | null > | null,
  not?: ModelRestaurantConditionInput | null,
};

export type ModelBooleanInput = {
  ne?: boolean | null,
  eq?: boolean | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type ModelIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export enum RegisterType {
  KIOSK = "KIOSK",
  POS = "POS",
}


export enum EftposProvider {
  SMARTPAY = "SMARTPAY",
  VERIFONE = "VERIFONE",
}


export type UpdateRestaurantInput = {
  id: string,
  name?: string | null,
  description?: string | null,
  image?: S3ObjectInput | null,
  address?: AddressInput | null,
  _geoloc?: LocationInput | null,
  verified?: boolean | null,
  isAcceptingOrders?: boolean | null,
  operatingHours?: OperatingHoursInput | null,
  restaurantManagerId?: string | null,
  deviceEndpoint?: string | null,
  owner?: string | null,
};

export type CreateAdvertisementInput = {
  id?: string | null,
  name: string,
  active?: boolean | null,
  activeDaysOfWeek?: Array< AdvertisementDayInput | null > | null,
  content: S3ObjectInput,
  contentDurationInSeconds?: number | null,
  advertisementRestaurantId: string,
  owner?: string | null,
};

export type AdvertisementDayInput = {
  monday: Array< AdvertisementTimeInput >,
  tuesday: Array< AdvertisementTimeInput >,
  wednesday: Array< AdvertisementTimeInput >,
  thursday: Array< AdvertisementTimeInput >,
  friday: Array< AdvertisementTimeInput >,
  saturday: Array< AdvertisementTimeInput >,
  sunday: Array< AdvertisementTimeInput >,
};

export type AdvertisementTimeInput = {
  startTime?: string | null,
  endTime?: string | null,
};

export type ModelAdvertisementConditionInput = {
  name?: ModelStringInput | null,
  active?: ModelBooleanInput | null,
  contentDurationInSeconds?: ModelIntInput | null,
  advertisementRestaurantId?: ModelIDInput | null,
  and?: Array< ModelAdvertisementConditionInput | null > | null,
  or?: Array< ModelAdvertisementConditionInput | null > | null,
  not?: ModelAdvertisementConditionInput | null,
};

export type ModelIntInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type UpdateAdvertisementInput = {
  id: string,
  name?: string | null,
  active?: boolean | null,
  activeDaysOfWeek?: Array< AdvertisementDayInput | null > | null,
  content?: S3ObjectInput | null,
  contentDurationInSeconds?: number | null,
  advertisementRestaurantId?: string | null,
  owner?: string | null,
};

export type DeleteAdvertisementInput = {
  id?: string | null,
};

export type CreateRegisterInput = {
  id?: string | null,
  name: string,
  active: boolean,
  orderNumberSuffix?: string | null,
  enableTableFlags?: boolean | null,
  enablePayLater?: boolean | null,
  type: RegisterType,
  eftposProvider?: EftposProvider | null,
  eftposIpAddress?: string | null,
  eftposPortNumber?: string | null,
  registerRestaurantId: string,
  owner?: string | null,
};

export type ModelRegisterConditionInput = {
  name?: ModelStringInput | null,
  active?: ModelBooleanInput | null,
  orderNumberSuffix?: ModelStringInput | null,
  enableTableFlags?: ModelBooleanInput | null,
  enablePayLater?: ModelBooleanInput | null,
  type?: ModelRegisterTypeInput | null,
  eftposProvider?: ModelEftposProviderInput | null,
  eftposIpAddress?: ModelStringInput | null,
  eftposPortNumber?: ModelStringInput | null,
  registerRestaurantId?: ModelIDInput | null,
  and?: Array< ModelRegisterConditionInput | null > | null,
  or?: Array< ModelRegisterConditionInput | null > | null,
  not?: ModelRegisterConditionInput | null,
};

export type ModelRegisterTypeInput = {
  eq?: RegisterType | null,
  ne?: RegisterType | null,
};

export type ModelEftposProviderInput = {
  eq?: EftposProvider | null,
  ne?: EftposProvider | null,
};

export type UpdateRegisterInput = {
  id: string,
  name?: string | null,
  active?: boolean | null,
  orderNumberSuffix?: string | null,
  enableTableFlags?: boolean | null,
  enablePayLater?: boolean | null,
  type?: RegisterType | null,
  eftposProvider?: EftposProvider | null,
  eftposIpAddress?: string | null,
  eftposPortNumber?: string | null,
  registerRestaurantId?: string | null,
  owner?: string | null,
};

export type DeleteRegisterInput = {
  id?: string | null,
};

export type CreateRegisterPrinterInput = {
  id?: string | null,
  name: string,
  address: string,
  registerPrinterRegisterId: string,
  owner?: string | null,
};

export type ModelRegisterPrinterConditionInput = {
  name?: ModelStringInput | null,
  address?: ModelStringInput | null,
  registerPrinterRegisterId?: ModelIDInput | null,
  and?: Array< ModelRegisterPrinterConditionInput | null > | null,
  or?: Array< ModelRegisterPrinterConditionInput | null > | null,
  not?: ModelRegisterPrinterConditionInput | null,
};

export type UpdateRegisterPrinterInput = {
  id: string,
  name?: string | null,
  address?: string | null,
  registerPrinterRegisterId?: string | null,
  owner?: string | null,
};

export type DeleteRegisterPrinterInput = {
  id?: string | null,
};

export type CreateRegisterPrinterProductLinkInput = {
  id?: string | null,
  registerPrinterProductLinkRegisterPrinterId: string,
  registerPrinterProductLinkProductId: string,
  owner?: string | null,
};

export type ModelRegisterPrinterProductLinkConditionInput = {
  registerPrinterProductLinkRegisterPrinterId?: ModelIDInput | null,
  registerPrinterProductLinkProductId?: ModelIDInput | null,
  and?: Array< ModelRegisterPrinterProductLinkConditionInput | null > | null,
  or?: Array< ModelRegisterPrinterProductLinkConditionInput | null > | null,
  not?: ModelRegisterPrinterProductLinkConditionInput | null,
};

export type UpdateRegisterPrinterProductLinkInput = {
  id: string,
  registerPrinterProductLinkRegisterPrinterId?: string | null,
  registerPrinterProductLinkProductId?: string | null,
  owner?: string | null,
};

export type DeleteRegisterPrinterProductLinkInput = {
  id?: string | null,
};

export type CreateCategoryInput = {
  id?: string | null,
  name: string,
  image?: S3ObjectInput | null,
  displaySequence: number,
  availability?: ItemAvailabilityInput | null,
  categoryRestaurantId: string,
  owner?: string | null,
};

export type ItemAvailabilityInput = {
  monday: Array< ItemAvailabilityTimeInput >,
  tuesday: Array< ItemAvailabilityTimeInput >,
  wednesday: Array< ItemAvailabilityTimeInput >,
  thursday: Array< ItemAvailabilityTimeInput >,
  friday: Array< ItemAvailabilityTimeInput >,
  saturday: Array< ItemAvailabilityTimeInput >,
  sunday: Array< ItemAvailabilityTimeInput >,
};

export type ItemAvailabilityTimeInput = {
  startTime?: string | null,
  endTime?: string | null,
};

export type ModelCategoryConditionInput = {
  name?: ModelStringInput | null,
  displaySequence?: ModelIntInput | null,
  categoryRestaurantId?: ModelIDInput | null,
  and?: Array< ModelCategoryConditionInput | null > | null,
  or?: Array< ModelCategoryConditionInput | null > | null,
  not?: ModelCategoryConditionInput | null,
};

export type UpdateCategoryInput = {
  id: string,
  name?: string | null,
  image?: S3ObjectInput | null,
  displaySequence?: number | null,
  availability?: ItemAvailabilityInput | null,
  categoryRestaurantId?: string | null,
  owner?: string | null,
};

export type DeleteCategoryInput = {
  id?: string | null,
};

export type CreateCategoryProductLinkInput = {
  id?: string | null,
  displaySequence: number,
  categoryProductLinkCategoryId: string,
  categoryProductLinkProductId: string,
  owner?: string | null,
};

export type ModelCategoryProductLinkConditionInput = {
  displaySequence?: ModelIntInput | null,
  categoryProductLinkCategoryId?: ModelIDInput | null,
  categoryProductLinkProductId?: ModelIDInput | null,
  and?: Array< ModelCategoryProductLinkConditionInput | null > | null,
  or?: Array< ModelCategoryProductLinkConditionInput | null > | null,
  not?: ModelCategoryProductLinkConditionInput | null,
};

export type UpdateCategoryProductLinkInput = {
  id: string,
  displaySequence?: number | null,
  categoryProductLinkCategoryId?: string | null,
  categoryProductLinkProductId?: string | null,
  owner?: string | null,
};

export type DeleteCategoryProductLinkInput = {
  id?: string | null,
};

export type CreateProductInput = {
  id?: string | null,
  name: string,
  description?: string | null,
  image?: S3ObjectInput | null,
  price: number,
  soldOutDate?: string | null,
  soldOut?: boolean | null,
  availability?: ItemAvailabilityInput | null,
  productRestaurantId: string,
  owner?: string | null,
};

export type ModelProductConditionInput = {
  name?: ModelStringInput | null,
  description?: ModelStringInput | null,
  price?: ModelIntInput | null,
  soldOutDate?: ModelStringInput | null,
  soldOut?: ModelBooleanInput | null,
  productRestaurantId?: ModelIDInput | null,
  and?: Array< ModelProductConditionInput | null > | null,
  or?: Array< ModelProductConditionInput | null > | null,
  not?: ModelProductConditionInput | null,
};

export type UpdateProductInput = {
  id: string,
  name?: string | null,
  description?: string | null,
  image?: S3ObjectInput | null,
  price?: number | null,
  soldOutDate?: string | null,
  soldOut?: boolean | null,
  availability?: ItemAvailabilityInput | null,
  productRestaurantId?: string | null,
  owner?: string | null,
};

export type DeleteProductInput = {
  id?: string | null,
};

export type CreateProductModifierGroupLinkInput = {
  id?: string | null,
  displaySequence: number,
  hideForCustomer?: boolean | null,
  productModifierGroupLinkProductId: string,
  productModifierGroupLinkModifierGroupId: string,
  owner?: string | null,
};

export type ModelProductModifierGroupLinkConditionInput = {
  displaySequence?: ModelIntInput | null,
  hideForCustomer?: ModelBooleanInput | null,
  productModifierGroupLinkProductId?: ModelIDInput | null,
  productModifierGroupLinkModifierGroupId?: ModelIDInput | null,
  and?: Array< ModelProductModifierGroupLinkConditionInput | null > | null,
  or?: Array< ModelProductModifierGroupLinkConditionInput | null > | null,
  not?: ModelProductModifierGroupLinkConditionInput | null,
};

export type UpdateProductModifierGroupLinkInput = {
  id: string,
  displaySequence?: number | null,
  hideForCustomer?: boolean | null,
  productModifierGroupLinkProductId?: string | null,
  productModifierGroupLinkModifierGroupId?: string | null,
  owner?: string | null,
};

export type DeleteProductModifierGroupLinkInput = {
  id?: string | null,
};

export type CreateModifierGroupInput = {
  id?: string | null,
  name: string,
  choiceDuplicate: number,
  choiceMin: number,
  choiceMax: number,
  modifierGroupRestaurantId: string,
  owner?: string | null,
};

export type ModelModifierGroupConditionInput = {
  name?: ModelStringInput | null,
  choiceDuplicate?: ModelIntInput | null,
  choiceMin?: ModelIntInput | null,
  choiceMax?: ModelIntInput | null,
  modifierGroupRestaurantId?: ModelIDInput | null,
  and?: Array< ModelModifierGroupConditionInput | null > | null,
  or?: Array< ModelModifierGroupConditionInput | null > | null,
  not?: ModelModifierGroupConditionInput | null,
};

export type UpdateModifierGroupInput = {
  id: string,
  name?: string | null,
  choiceDuplicate?: number | null,
  choiceMin?: number | null,
  choiceMax?: number | null,
  modifierGroupRestaurantId?: string | null,
  owner?: string | null,
};

export type DeleteModifierGroupInput = {
  id?: string | null,
};

export type CreateModifierGroupModifierLinkInput = {
  id?: string | null,
  displaySequence: number,
  preSelectedQuantity?: number | null,
  modifierGroupModifierLinkModifierGroupId: string,
  modifierGroupModifierLinkModifierId: string,
  owner?: string | null,
};

export type ModelModifierGroupModifierLinkConditionInput = {
  displaySequence?: ModelIntInput | null,
  preSelectedQuantity?: ModelIntInput | null,
  modifierGroupModifierLinkModifierGroupId?: ModelIDInput | null,
  modifierGroupModifierLinkModifierId?: ModelIDInput | null,
  and?: Array< ModelModifierGroupModifierLinkConditionInput | null > | null,
  or?: Array< ModelModifierGroupModifierLinkConditionInput | null > | null,
  not?: ModelModifierGroupModifierLinkConditionInput | null,
};

export type UpdateModifierGroupModifierLinkInput = {
  id: string,
  displaySequence?: number | null,
  preSelectedQuantity?: number | null,
  modifierGroupModifierLinkModifierGroupId?: string | null,
  modifierGroupModifierLinkModifierId?: string | null,
  owner?: string | null,
};

export type DeleteModifierGroupModifierLinkInput = {
  id?: string | null,
};

export type CreateModifierInput = {
  id?: string | null,
  name: string,
  price: number,
  soldOutDate?: string | null,
  soldOut?: boolean | null,
  modifierRestaurantId: string,
  owner?: string | null,
};

export type ModelModifierConditionInput = {
  name?: ModelStringInput | null,
  price?: ModelIntInput | null,
  soldOutDate?: ModelStringInput | null,
  soldOut?: ModelBooleanInput | null,
  modifierRestaurantId?: ModelIDInput | null,
  and?: Array< ModelModifierConditionInput | null > | null,
  or?: Array< ModelModifierConditionInput | null > | null,
  not?: ModelModifierConditionInput | null,
};

export type UpdateModifierInput = {
  id: string,
  name?: string | null,
  price?: number | null,
  soldOutDate?: string | null,
  soldOut?: boolean | null,
  modifierRestaurantId?: string | null,
  owner?: string | null,
};

export type DeleteModifierInput = {
  id?: string | null,
};

export type CreateOrderInput = {
  id?: string | null,
  status: OrderStatus,
  paid?: boolean | null,
  type: OrderType,
  number: string,
  table?: string | null,
  notes?: string | null,
  total: number,
  registerId?: string | null,
  products?: Array< OrderProductInput > | null,
  placedAt?: string | null,
  placedAtUtc?: string | null,
  completedAt?: string | null,
  completedAtUtc?: string | null,
  cancelledAt?: string | null,
  cancelledAtUtc?: string | null,
  orderUserId: string,
  orderRestaurantId: string,
};

export type OrderProductInput = {
  id: string,
  name: string,
  price: number,
  image?: S3ObjectInput | null,
  quantity: number,
  notes?: string | null,
  category?: OrderCategoryInput | null,
  modifierGroups?: Array< OrderModifierGroupInput | null > | null,
};

export type OrderCategoryInput = {
  id: string,
  name: string,
  image?: S3ObjectInput | null,
};

export type OrderModifierGroupInput = {
  id: string,
  name: string,
  modifiers?: Array< OrderModifierInput | null > | null,
};

export type OrderModifierInput = {
  id: string,
  name: string,
  price: number,
  quantity: number,
};

export type ModelOrderConditionInput = {
  status?: ModelOrderStatusInput | null,
  paid?: ModelBooleanInput | null,
  type?: ModelOrderTypeInput | null,
  number?: ModelStringInput | null,
  table?: ModelStringInput | null,
  notes?: ModelStringInput | null,
  total?: ModelIntInput | null,
  registerId?: ModelIDInput | null,
  placedAt?: ModelStringInput | null,
  placedAtUtc?: ModelStringInput | null,
  completedAt?: ModelStringInput | null,
  completedAtUtc?: ModelStringInput | null,
  cancelledAt?: ModelStringInput | null,
  cancelledAtUtc?: ModelStringInput | null,
  orderUserId?: ModelIDInput | null,
  orderRestaurantId?: ModelIDInput | null,
  and?: Array< ModelOrderConditionInput | null > | null,
  or?: Array< ModelOrderConditionInput | null > | null,
  not?: ModelOrderConditionInput | null,
};

export type ModelOrderStatusInput = {
  eq?: OrderStatus | null,
  ne?: OrderStatus | null,
};

export type ModelOrderTypeInput = {
  eq?: OrderType | null,
  ne?: OrderType | null,
};

export type UpdateOrderInput = {
  id: string,
  status?: OrderStatus | null,
  paid?: boolean | null,
  type?: OrderType | null,
  number?: string | null,
  table?: string | null,
  notes?: string | null,
  total?: number | null,
  registerId?: string | null,
  products?: Array< OrderProductInput > | null,
  placedAt?: string | null,
  placedAtUtc?: string | null,
  completedAt?: string | null,
  completedAtUtc?: string | null,
  cancelledAt?: string | null,
  cancelledAtUtc?: string | null,
  orderUserId?: string | null,
  orderRestaurantId?: string | null,
};

export type DeleteOrderInput = {
  id?: string | null,
};

export type CreateVerifoneTransactionLogInput = {
  id?: string | null,
  transactionId: number,
  merchantId: number,
  amount: number,
  type: string,
  payload: string,
  restaurantId: string,
  timestampEpoch: number,
};

export type ModelVerifoneTransactionLogConditionInput = {
  transactionId?: ModelIntInput | null,
  merchantId?: ModelIntInput | null,
  amount?: ModelIntInput | null,
  type?: ModelStringInput | null,
  payload?: ModelStringInput | null,
  restaurantId?: ModelIDInput | null,
  timestampEpoch?: ModelIntInput | null,
  and?: Array< ModelVerifoneTransactionLogConditionInput | null > | null,
  or?: Array< ModelVerifoneTransactionLogConditionInput | null > | null,
  not?: ModelVerifoneTransactionLogConditionInput | null,
};

export type UpdateVerifoneTransactionLogInput = {
  id: string,
  transactionId?: number | null,
  merchantId?: number | null,
  amount?: number | null,
  type?: string | null,
  payload?: string | null,
  restaurantId?: string | null,
  timestampEpoch?: number | null,
};

export type DeleteVerifoneTransactionLogInput = {
  id?: string | null,
};

export type ModelRestaurantFilterInput = {
  id?: ModelIDInput | null,
  name?: ModelStringInput | null,
  description?: ModelStringInput | null,
  verified?: ModelBooleanInput | null,
  isAcceptingOrders?: ModelBooleanInput | null,
  restaurantManagerId?: ModelIDInput | null,
  deviceEndpoint?: ModelStringInput | null,
  owner?: ModelIDInput | null,
  and?: Array< ModelRestaurantFilterInput | null > | null,
  or?: Array< ModelRestaurantFilterInput | null > | null,
  not?: ModelRestaurantFilterInput | null,
};

export type ProcessOrderMutationVariables = {
  input: ProcessOrderInput,
};

export type ProcessOrderMutation = {
  processOrder: string | null,
};

export type UpdateUserMutationVariables = {
  input: UpdateUserInput,
  condition?: ModelUserConditionInput | null,
};

export type UpdateUserMutation = {
  updateUser:  {
    __typename: "User",
    id: string,
    email: string,
    firstName: string | null,
    lastName: string | null,
    identityPoolId: string,
    restaurants:  {
      __typename: "ModelRestaurantConnection",
      items:  Array< {
        __typename: "Restaurant",
        id: string,
        name: string,
        description: string | null,
        verified: boolean,
        isAcceptingOrders: boolean,
        restaurantManagerId: string,
        deviceEndpoint: string | null,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    orders:  {
      __typename: "ModelOrderConnection",
      items:  Array< {
        __typename: "Order",
        id: string,
        status: OrderStatus,
        paid: boolean | null,
        type: OrderType,
        number: string,
        table: string | null,
        notes: string | null,
        total: number,
        registerId: string | null,
        placedAt: string | null,
        placedAtUtc: string | null,
        completedAt: string | null,
        completedAtUtc: string | null,
        cancelledAt: string | null,
        cancelledAtUtc: string | null,
        orderUserId: string,
        orderRestaurantId: string,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateRestaurantMutationVariables = {
  input: CreateRestaurantInput,
  condition?: ModelRestaurantConditionInput | null,
};

export type CreateRestaurantMutation = {
  createRestaurant:  {
    __typename: "Restaurant",
    id: string,
    name: string,
    description: string | null,
    image:  {
      __typename: "S3Object",
      bucket: string,
      region: string,
      key: string,
      identityPoolId: string | null,
    } | null,
    address:  {
      __typename: "Address",
      formattedAddress: string,
      aptSuite: string | null,
    },
    _geoloc:  {
      __typename: "Location",
      lat: number | null,
      lng: number | null,
    },
    verified: boolean,
    isAcceptingOrders: boolean,
    operatingHours:  {
      __typename: "OperatingHours",
      monday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
      tuesday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
      wednesday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
      thursday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
      friday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
      saturday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
      sunday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
    },
    restaurantManagerId: string,
    deviceEndpoint: string | null,
    registers:  {
      __typename: "ModelRegisterConnection",
      items:  Array< {
        __typename: "Register",
        id: string,
        name: string,
        active: boolean,
        orderNumberSuffix: string | null,
        enableTableFlags: boolean | null,
        enablePayLater: boolean | null,
        type: RegisterType,
        eftposProvider: EftposProvider | null,
        eftposIpAddress: string | null,
        eftposPortNumber: string | null,
        registerRestaurantId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    advertisements:  {
      __typename: "ModelAdvertisementConnection",
      items:  Array< {
        __typename: "Advertisement",
        id: string,
        name: string,
        active: boolean | null,
        contentDurationInSeconds: number | null,
        advertisementRestaurantId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    categories:  {
      __typename: "ModelCategoryConnection",
      items:  Array< {
        __typename: "Category",
        id: string,
        name: string,
        displaySequence: number,
        categoryRestaurantId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    products:  {
      __typename: "ModelProductConnection",
      items:  Array< {
        __typename: "Product",
        id: string,
        name: string,
        description: string | null,
        price: number,
        soldOutDate: string | null,
        soldOut: boolean | null,
        productRestaurantId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    modifierGroups:  {
      __typename: "ModelModifierGroupConnection",
      items:  Array< {
        __typename: "ModifierGroup",
        id: string,
        name: string,
        choiceDuplicate: number,
        choiceMin: number,
        choiceMax: number,
        modifierGroupRestaurantId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    modifiers:  {
      __typename: "ModelModifierConnection",
      items:  Array< {
        __typename: "Modifier",
        id: string,
        name: string,
        price: number,
        soldOutDate: string | null,
        soldOut: boolean | null,
        modifierRestaurantId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    orders:  {
      __typename: "ModelOrderConnection",
      items:  Array< {
        __typename: "Order",
        id: string,
        status: OrderStatus,
        paid: boolean | null,
        type: OrderType,
        number: string,
        table: string | null,
        notes: string | null,
        total: number,
        registerId: string | null,
        placedAt: string | null,
        placedAtUtc: string | null,
        completedAt: string | null,
        completedAtUtc: string | null,
        cancelledAt: string | null,
        cancelledAtUtc: string | null,
        orderUserId: string,
        orderRestaurantId: string,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    ordersByStatusPlacedAt:  {
      __typename: "ModelOrderConnection",
      items:  Array< {
        __typename: "Order",
        id: string,
        status: OrderStatus,
        paid: boolean | null,
        type: OrderType,
        number: string,
        table: string | null,
        notes: string | null,
        total: number,
        registerId: string | null,
        placedAt: string | null,
        placedAtUtc: string | null,
        completedAt: string | null,
        completedAtUtc: string | null,
        cancelledAt: string | null,
        cancelledAtUtc: string | null,
        orderUserId: string,
        orderRestaurantId: string,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateRestaurantMutationVariables = {
  input: UpdateRestaurantInput,
  condition?: ModelRestaurantConditionInput | null,
};

export type UpdateRestaurantMutation = {
  updateRestaurant:  {
    __typename: "Restaurant",
    id: string,
    name: string,
    description: string | null,
    image:  {
      __typename: "S3Object",
      bucket: string,
      region: string,
      key: string,
      identityPoolId: string | null,
    } | null,
    address:  {
      __typename: "Address",
      formattedAddress: string,
      aptSuite: string | null,
    },
    _geoloc:  {
      __typename: "Location",
      lat: number | null,
      lng: number | null,
    },
    verified: boolean,
    isAcceptingOrders: boolean,
    operatingHours:  {
      __typename: "OperatingHours",
      monday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
      tuesday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
      wednesday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
      thursday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
      friday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
      saturday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
      sunday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
    },
    restaurantManagerId: string,
    deviceEndpoint: string | null,
    registers:  {
      __typename: "ModelRegisterConnection",
      items:  Array< {
        __typename: "Register",
        id: string,
        name: string,
        active: boolean,
        orderNumberSuffix: string | null,
        enableTableFlags: boolean | null,
        enablePayLater: boolean | null,
        type: RegisterType,
        eftposProvider: EftposProvider | null,
        eftposIpAddress: string | null,
        eftposPortNumber: string | null,
        registerRestaurantId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    advertisements:  {
      __typename: "ModelAdvertisementConnection",
      items:  Array< {
        __typename: "Advertisement",
        id: string,
        name: string,
        active: boolean | null,
        contentDurationInSeconds: number | null,
        advertisementRestaurantId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    categories:  {
      __typename: "ModelCategoryConnection",
      items:  Array< {
        __typename: "Category",
        id: string,
        name: string,
        displaySequence: number,
        categoryRestaurantId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    products:  {
      __typename: "ModelProductConnection",
      items:  Array< {
        __typename: "Product",
        id: string,
        name: string,
        description: string | null,
        price: number,
        soldOutDate: string | null,
        soldOut: boolean | null,
        productRestaurantId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    modifierGroups:  {
      __typename: "ModelModifierGroupConnection",
      items:  Array< {
        __typename: "ModifierGroup",
        id: string,
        name: string,
        choiceDuplicate: number,
        choiceMin: number,
        choiceMax: number,
        modifierGroupRestaurantId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    modifiers:  {
      __typename: "ModelModifierConnection",
      items:  Array< {
        __typename: "Modifier",
        id: string,
        name: string,
        price: number,
        soldOutDate: string | null,
        soldOut: boolean | null,
        modifierRestaurantId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    orders:  {
      __typename: "ModelOrderConnection",
      items:  Array< {
        __typename: "Order",
        id: string,
        status: OrderStatus,
        paid: boolean | null,
        type: OrderType,
        number: string,
        table: string | null,
        notes: string | null,
        total: number,
        registerId: string | null,
        placedAt: string | null,
        placedAtUtc: string | null,
        completedAt: string | null,
        completedAtUtc: string | null,
        cancelledAt: string | null,
        cancelledAtUtc: string | null,
        orderUserId: string,
        orderRestaurantId: string,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    ordersByStatusPlacedAt:  {
      __typename: "ModelOrderConnection",
      items:  Array< {
        __typename: "Order",
        id: string,
        status: OrderStatus,
        paid: boolean | null,
        type: OrderType,
        number: string,
        table: string | null,
        notes: string | null,
        total: number,
        registerId: string | null,
        placedAt: string | null,
        placedAtUtc: string | null,
        completedAt: string | null,
        completedAtUtc: string | null,
        cancelledAt: string | null,
        cancelledAtUtc: string | null,
        orderUserId: string,
        orderRestaurantId: string,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateAdvertisementMutationVariables = {
  input: CreateAdvertisementInput,
  condition?: ModelAdvertisementConditionInput | null,
};

export type CreateAdvertisementMutation = {
  createAdvertisement:  {
    __typename: "Advertisement",
    id: string,
    name: string,
    active: boolean | null,
    activeDaysOfWeek:  Array< {
      __typename: "AdvertisementDay",
      monday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      tuesday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      wednesday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      thursday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      friday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      saturday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      sunday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
    } | null > | null,
    content:  {
      __typename: "S3Object",
      bucket: string,
      region: string,
      key: string,
      identityPoolId: string | null,
    },
    contentDurationInSeconds: number | null,
    advertisementRestaurantId: string,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateAdvertisementMutationVariables = {
  input: UpdateAdvertisementInput,
  condition?: ModelAdvertisementConditionInput | null,
};

export type UpdateAdvertisementMutation = {
  updateAdvertisement:  {
    __typename: "Advertisement",
    id: string,
    name: string,
    active: boolean | null,
    activeDaysOfWeek:  Array< {
      __typename: "AdvertisementDay",
      monday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      tuesday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      wednesday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      thursday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      friday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      saturday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      sunday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
    } | null > | null,
    content:  {
      __typename: "S3Object",
      bucket: string,
      region: string,
      key: string,
      identityPoolId: string | null,
    },
    contentDurationInSeconds: number | null,
    advertisementRestaurantId: string,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteAdvertisementMutationVariables = {
  input: DeleteAdvertisementInput,
  condition?: ModelAdvertisementConditionInput | null,
};

export type DeleteAdvertisementMutation = {
  deleteAdvertisement:  {
    __typename: "Advertisement",
    id: string,
    name: string,
    active: boolean | null,
    activeDaysOfWeek:  Array< {
      __typename: "AdvertisementDay",
      monday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      tuesday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      wednesday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      thursday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      friday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      saturday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      sunday:  Array< {
        __typename: "AdvertisementTime",
        startTime: string | null,
        endTime: string | null,
      } >,
    } | null > | null,
    content:  {
      __typename: "S3Object",
      bucket: string,
      region: string,
      key: string,
      identityPoolId: string | null,
    },
    contentDurationInSeconds: number | null,
    advertisementRestaurantId: string,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateRegisterMutationVariables = {
  input: CreateRegisterInput,
  condition?: ModelRegisterConditionInput | null,
};

export type CreateRegisterMutation = {
  createRegister:  {
    __typename: "Register",
    id: string,
    name: string,
    active: boolean,
    orderNumberSuffix: string | null,
    enableTableFlags: boolean | null,
    enablePayLater: boolean | null,
    type: RegisterType,
    eftposProvider: EftposProvider | null,
    eftposIpAddress: string | null,
    eftposPortNumber: string | null,
    printers:  {
      __typename: "ModelRegisterPrinterConnection",
      items:  Array< {
        __typename: "RegisterPrinter",
        id: string,
        name: string,
        address: string,
        registerPrinterRegisterId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    registerRestaurantId: string,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateRegisterMutationVariables = {
  input: UpdateRegisterInput,
  condition?: ModelRegisterConditionInput | null,
};

export type UpdateRegisterMutation = {
  updateRegister:  {
    __typename: "Register",
    id: string,
    name: string,
    active: boolean,
    orderNumberSuffix: string | null,
    enableTableFlags: boolean | null,
    enablePayLater: boolean | null,
    type: RegisterType,
    eftposProvider: EftposProvider | null,
    eftposIpAddress: string | null,
    eftposPortNumber: string | null,
    printers:  {
      __typename: "ModelRegisterPrinterConnection",
      items:  Array< {
        __typename: "RegisterPrinter",
        id: string,
        name: string,
        address: string,
        registerPrinterRegisterId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    registerRestaurantId: string,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteRegisterMutationVariables = {
  input: DeleteRegisterInput,
  condition?: ModelRegisterConditionInput | null,
};

export type DeleteRegisterMutation = {
  deleteRegister:  {
    __typename: "Register",
    id: string,
    name: string,
    active: boolean,
    orderNumberSuffix: string | null,
    enableTableFlags: boolean | null,
    enablePayLater: boolean | null,
    type: RegisterType,
    eftposProvider: EftposProvider | null,
    eftposIpAddress: string | null,
    eftposPortNumber: string | null,
    printers:  {
      __typename: "ModelRegisterPrinterConnection",
      items:  Array< {
        __typename: "RegisterPrinter",
        id: string,
        name: string,
        address: string,
        registerPrinterRegisterId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    registerRestaurantId: string,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateRegisterPrinterMutationVariables = {
  input: CreateRegisterPrinterInput,
  condition?: ModelRegisterPrinterConditionInput | null,
};

export type CreateRegisterPrinterMutation = {
  createRegisterPrinter:  {
    __typename: "RegisterPrinter",
    id: string,
    name: string,
    address: string,
    ignoreProducts:  {
      __typename: "ModelRegisterPrinterProductLinkConnection",
      items:  Array< {
        __typename: "RegisterPrinterProductLink",
        id: string,
        registerPrinterProductLinkRegisterPrinterId: string,
        registerPrinterProductLinkProductId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    registerPrinterRegisterId: string,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateRegisterPrinterMutationVariables = {
  input: UpdateRegisterPrinterInput,
  condition?: ModelRegisterPrinterConditionInput | null,
};

export type UpdateRegisterPrinterMutation = {
  updateRegisterPrinter:  {
    __typename: "RegisterPrinter",
    id: string,
    name: string,
    address: string,
    ignoreProducts:  {
      __typename: "ModelRegisterPrinterProductLinkConnection",
      items:  Array< {
        __typename: "RegisterPrinterProductLink",
        id: string,
        registerPrinterProductLinkRegisterPrinterId: string,
        registerPrinterProductLinkProductId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    registerPrinterRegisterId: string,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteRegisterPrinterMutationVariables = {
  input: DeleteRegisterPrinterInput,
  condition?: ModelRegisterPrinterConditionInput | null,
};

export type DeleteRegisterPrinterMutation = {
  deleteRegisterPrinter:  {
    __typename: "RegisterPrinter",
    id: string,
    name: string,
    address: string,
    ignoreProducts:  {
      __typename: "ModelRegisterPrinterProductLinkConnection",
      items:  Array< {
        __typename: "RegisterPrinterProductLink",
        id: string,
        registerPrinterProductLinkRegisterPrinterId: string,
        registerPrinterProductLinkProductId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    registerPrinterRegisterId: string,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateRegisterPrinterProductLinkMutationVariables = {
  input: CreateRegisterPrinterProductLinkInput,
  condition?: ModelRegisterPrinterProductLinkConditionInput | null,
};

export type CreateRegisterPrinterProductLinkMutation = {
  createRegisterPrinterProductLink:  {
    __typename: "RegisterPrinterProductLink",
    id: string,
    registerPrinterProductLinkRegisterPrinterId: string,
    registerPrinterProductLinkProductId: string,
    registerPrinter:  {
      __typename: "RegisterPrinter",
      id: string,
      name: string,
      address: string,
      ignoreProducts:  {
        __typename: "ModelRegisterPrinterProductLinkConnection",
        nextToken: string | null,
      } | null,
      registerPrinterRegisterId: string,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    product:  {
      __typename: "Product",
      id: string,
      name: string,
      description: string | null,
      image:  {
        __typename: "S3Object",
        bucket: string,
        region: string,
        key: string,
        identityPoolId: string | null,
      } | null,
      price: number,
      soldOutDate: string | null,
      soldOut: boolean | null,
      categories:  {
        __typename: "ModelCategoryProductLinkConnection",
        nextToken: string | null,
      } | null,
      modifierGroups:  {
        __typename: "ModelProductModifierGroupLinkConnection",
        nextToken: string | null,
      } | null,
      productRestaurantId: string,
      productIgnoredOnRegisterPrinters:  {
        __typename: "ModelRegisterPrinterProductLinkConnection",
        nextToken: string | null,
      } | null,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateRegisterPrinterProductLinkMutationVariables = {
  input: UpdateRegisterPrinterProductLinkInput,
  condition?: ModelRegisterPrinterProductLinkConditionInput | null,
};

export type UpdateRegisterPrinterProductLinkMutation = {
  updateRegisterPrinterProductLink:  {
    __typename: "RegisterPrinterProductLink",
    id: string,
    registerPrinterProductLinkRegisterPrinterId: string,
    registerPrinterProductLinkProductId: string,
    registerPrinter:  {
      __typename: "RegisterPrinter",
      id: string,
      name: string,
      address: string,
      ignoreProducts:  {
        __typename: "ModelRegisterPrinterProductLinkConnection",
        nextToken: string | null,
      } | null,
      registerPrinterRegisterId: string,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    product:  {
      __typename: "Product",
      id: string,
      name: string,
      description: string | null,
      image:  {
        __typename: "S3Object",
        bucket: string,
        region: string,
        key: string,
        identityPoolId: string | null,
      } | null,
      price: number,
      soldOutDate: string | null,
      soldOut: boolean | null,
      categories:  {
        __typename: "ModelCategoryProductLinkConnection",
        nextToken: string | null,
      } | null,
      modifierGroups:  {
        __typename: "ModelProductModifierGroupLinkConnection",
        nextToken: string | null,
      } | null,
      productRestaurantId: string,
      productIgnoredOnRegisterPrinters:  {
        __typename: "ModelRegisterPrinterProductLinkConnection",
        nextToken: string | null,
      } | null,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteRegisterPrinterProductLinkMutationVariables = {
  input: DeleteRegisterPrinterProductLinkInput,
  condition?: ModelRegisterPrinterProductLinkConditionInput | null,
};

export type DeleteRegisterPrinterProductLinkMutation = {
  deleteRegisterPrinterProductLink:  {
    __typename: "RegisterPrinterProductLink",
    id: string,
    registerPrinterProductLinkRegisterPrinterId: string,
    registerPrinterProductLinkProductId: string,
    registerPrinter:  {
      __typename: "RegisterPrinter",
      id: string,
      name: string,
      address: string,
      ignoreProducts:  {
        __typename: "ModelRegisterPrinterProductLinkConnection",
        nextToken: string | null,
      } | null,
      registerPrinterRegisterId: string,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    product:  {
      __typename: "Product",
      id: string,
      name: string,
      description: string | null,
      image:  {
        __typename: "S3Object",
        bucket: string,
        region: string,
        key: string,
        identityPoolId: string | null,
      } | null,
      price: number,
      soldOutDate: string | null,
      soldOut: boolean | null,
      categories:  {
        __typename: "ModelCategoryProductLinkConnection",
        nextToken: string | null,
      } | null,
      modifierGroups:  {
        __typename: "ModelProductModifierGroupLinkConnection",
        nextToken: string | null,
      } | null,
      productRestaurantId: string,
      productIgnoredOnRegisterPrinters:  {
        __typename: "ModelRegisterPrinterProductLinkConnection",
        nextToken: string | null,
      } | null,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateCategoryMutationVariables = {
  input: CreateCategoryInput,
  condition?: ModelCategoryConditionInput | null,
};

export type CreateCategoryMutation = {
  createCategory:  {
    __typename: "Category",
    id: string,
    name: string,
    image:  {
      __typename: "S3Object",
      bucket: string,
      region: string,
      key: string,
      identityPoolId: string | null,
    } | null,
    displaySequence: number,
    availability:  {
      __typename: "ItemAvailability",
      monday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      tuesday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      wednesday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      thursday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      friday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      saturday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      sunday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
    } | null,
    products:  {
      __typename: "ModelCategoryProductLinkConnection",
      items:  Array< {
        __typename: "CategoryProductLink",
        id: string,
        displaySequence: number,
        categoryProductLinkCategoryId: string,
        categoryProductLinkProductId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    categoryRestaurantId: string,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateCategoryMutationVariables = {
  input: UpdateCategoryInput,
  condition?: ModelCategoryConditionInput | null,
};

export type UpdateCategoryMutation = {
  updateCategory:  {
    __typename: "Category",
    id: string,
    name: string,
    image:  {
      __typename: "S3Object",
      bucket: string,
      region: string,
      key: string,
      identityPoolId: string | null,
    } | null,
    displaySequence: number,
    availability:  {
      __typename: "ItemAvailability",
      monday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      tuesday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      wednesday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      thursday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      friday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      saturday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      sunday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
    } | null,
    products:  {
      __typename: "ModelCategoryProductLinkConnection",
      items:  Array< {
        __typename: "CategoryProductLink",
        id: string,
        displaySequence: number,
        categoryProductLinkCategoryId: string,
        categoryProductLinkProductId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    categoryRestaurantId: string,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteCategoryMutationVariables = {
  input: DeleteCategoryInput,
  condition?: ModelCategoryConditionInput | null,
};

export type DeleteCategoryMutation = {
  deleteCategory:  {
    __typename: "Category",
    id: string,
    name: string,
    image:  {
      __typename: "S3Object",
      bucket: string,
      region: string,
      key: string,
      identityPoolId: string | null,
    } | null,
    displaySequence: number,
    availability:  {
      __typename: "ItemAvailability",
      monday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      tuesday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      wednesday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      thursday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      friday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      saturday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      sunday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
    } | null,
    products:  {
      __typename: "ModelCategoryProductLinkConnection",
      items:  Array< {
        __typename: "CategoryProductLink",
        id: string,
        displaySequence: number,
        categoryProductLinkCategoryId: string,
        categoryProductLinkProductId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    categoryRestaurantId: string,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateCategoryProductLinkMutationVariables = {
  input: CreateCategoryProductLinkInput,
  condition?: ModelCategoryProductLinkConditionInput | null,
};

export type CreateCategoryProductLinkMutation = {
  createCategoryProductLink:  {
    __typename: "CategoryProductLink",
    id: string,
    displaySequence: number,
    categoryProductLinkCategoryId: string,
    categoryProductLinkProductId: string,
    category:  {
      __typename: "Category",
      id: string,
      name: string,
      image:  {
        __typename: "S3Object",
        bucket: string,
        region: string,
        key: string,
        identityPoolId: string | null,
      } | null,
      displaySequence: number,
      products:  {
        __typename: "ModelCategoryProductLinkConnection",
        nextToken: string | null,
      } | null,
      categoryRestaurantId: string,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    product:  {
      __typename: "Product",
      id: string,
      name: string,
      description: string | null,
      image:  {
        __typename: "S3Object",
        bucket: string,
        region: string,
        key: string,
        identityPoolId: string | null,
      } | null,
      price: number,
      soldOutDate: string | null,
      soldOut: boolean | null,
      categories:  {
        __typename: "ModelCategoryProductLinkConnection",
        nextToken: string | null,
      } | null,
      modifierGroups:  {
        __typename: "ModelProductModifierGroupLinkConnection",
        nextToken: string | null,
      } | null,
      productRestaurantId: string,
      productIgnoredOnRegisterPrinters:  {
        __typename: "ModelRegisterPrinterProductLinkConnection",
        nextToken: string | null,
      } | null,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateCategoryProductLinkMutationVariables = {
  input: UpdateCategoryProductLinkInput,
  condition?: ModelCategoryProductLinkConditionInput | null,
};

export type UpdateCategoryProductLinkMutation = {
  updateCategoryProductLink:  {
    __typename: "CategoryProductLink",
    id: string,
    displaySequence: number,
    categoryProductLinkCategoryId: string,
    categoryProductLinkProductId: string,
    category:  {
      __typename: "Category",
      id: string,
      name: string,
      image:  {
        __typename: "S3Object",
        bucket: string,
        region: string,
        key: string,
        identityPoolId: string | null,
      } | null,
      displaySequence: number,
      products:  {
        __typename: "ModelCategoryProductLinkConnection",
        nextToken: string | null,
      } | null,
      categoryRestaurantId: string,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    product:  {
      __typename: "Product",
      id: string,
      name: string,
      description: string | null,
      image:  {
        __typename: "S3Object",
        bucket: string,
        region: string,
        key: string,
        identityPoolId: string | null,
      } | null,
      price: number,
      soldOutDate: string | null,
      soldOut: boolean | null,
      categories:  {
        __typename: "ModelCategoryProductLinkConnection",
        nextToken: string | null,
      } | null,
      modifierGroups:  {
        __typename: "ModelProductModifierGroupLinkConnection",
        nextToken: string | null,
      } | null,
      productRestaurantId: string,
      productIgnoredOnRegisterPrinters:  {
        __typename: "ModelRegisterPrinterProductLinkConnection",
        nextToken: string | null,
      } | null,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteCategoryProductLinkMutationVariables = {
  input: DeleteCategoryProductLinkInput,
  condition?: ModelCategoryProductLinkConditionInput | null,
};

export type DeleteCategoryProductLinkMutation = {
  deleteCategoryProductLink:  {
    __typename: "CategoryProductLink",
    id: string,
    displaySequence: number,
    categoryProductLinkCategoryId: string,
    categoryProductLinkProductId: string,
    category:  {
      __typename: "Category",
      id: string,
      name: string,
      image:  {
        __typename: "S3Object",
        bucket: string,
        region: string,
        key: string,
        identityPoolId: string | null,
      } | null,
      displaySequence: number,
      products:  {
        __typename: "ModelCategoryProductLinkConnection",
        nextToken: string | null,
      } | null,
      categoryRestaurantId: string,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    product:  {
      __typename: "Product",
      id: string,
      name: string,
      description: string | null,
      image:  {
        __typename: "S3Object",
        bucket: string,
        region: string,
        key: string,
        identityPoolId: string | null,
      } | null,
      price: number,
      soldOutDate: string | null,
      soldOut: boolean | null,
      categories:  {
        __typename: "ModelCategoryProductLinkConnection",
        nextToken: string | null,
      } | null,
      modifierGroups:  {
        __typename: "ModelProductModifierGroupLinkConnection",
        nextToken: string | null,
      } | null,
      productRestaurantId: string,
      productIgnoredOnRegisterPrinters:  {
        __typename: "ModelRegisterPrinterProductLinkConnection",
        nextToken: string | null,
      } | null,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateProductMutationVariables = {
  input: CreateProductInput,
  condition?: ModelProductConditionInput | null,
};

export type CreateProductMutation = {
  createProduct:  {
    __typename: "Product",
    id: string,
    name: string,
    description: string | null,
    image:  {
      __typename: "S3Object",
      bucket: string,
      region: string,
      key: string,
      identityPoolId: string | null,
    } | null,
    price: number,
    soldOutDate: string | null,
    soldOut: boolean | null,
    availability:  {
      __typename: "ItemAvailability",
      monday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      tuesday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      wednesday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      thursday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      friday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      saturday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      sunday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
    } | null,
    categories:  {
      __typename: "ModelCategoryProductLinkConnection",
      items:  Array< {
        __typename: "CategoryProductLink",
        id: string,
        displaySequence: number,
        categoryProductLinkCategoryId: string,
        categoryProductLinkProductId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    modifierGroups:  {
      __typename: "ModelProductModifierGroupLinkConnection",
      items:  Array< {
        __typename: "ProductModifierGroupLink",
        id: string,
        displaySequence: number,
        hideForCustomer: boolean | null,
        productModifierGroupLinkProductId: string,
        productModifierGroupLinkModifierGroupId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    productRestaurantId: string,
    productIgnoredOnRegisterPrinters:  {
      __typename: "ModelRegisterPrinterProductLinkConnection",
      items:  Array< {
        __typename: "RegisterPrinterProductLink",
        id: string,
        registerPrinterProductLinkRegisterPrinterId: string,
        registerPrinterProductLinkProductId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateProductMutationVariables = {
  input: UpdateProductInput,
  condition?: ModelProductConditionInput | null,
};

export type UpdateProductMutation = {
  updateProduct:  {
    __typename: "Product",
    id: string,
    name: string,
    description: string | null,
    image:  {
      __typename: "S3Object",
      bucket: string,
      region: string,
      key: string,
      identityPoolId: string | null,
    } | null,
    price: number,
    soldOutDate: string | null,
    soldOut: boolean | null,
    availability:  {
      __typename: "ItemAvailability",
      monday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      tuesday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      wednesday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      thursday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      friday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      saturday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      sunday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
    } | null,
    categories:  {
      __typename: "ModelCategoryProductLinkConnection",
      items:  Array< {
        __typename: "CategoryProductLink",
        id: string,
        displaySequence: number,
        categoryProductLinkCategoryId: string,
        categoryProductLinkProductId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    modifierGroups:  {
      __typename: "ModelProductModifierGroupLinkConnection",
      items:  Array< {
        __typename: "ProductModifierGroupLink",
        id: string,
        displaySequence: number,
        hideForCustomer: boolean | null,
        productModifierGroupLinkProductId: string,
        productModifierGroupLinkModifierGroupId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    productRestaurantId: string,
    productIgnoredOnRegisterPrinters:  {
      __typename: "ModelRegisterPrinterProductLinkConnection",
      items:  Array< {
        __typename: "RegisterPrinterProductLink",
        id: string,
        registerPrinterProductLinkRegisterPrinterId: string,
        registerPrinterProductLinkProductId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteProductMutationVariables = {
  input: DeleteProductInput,
  condition?: ModelProductConditionInput | null,
};

export type DeleteProductMutation = {
  deleteProduct:  {
    __typename: "Product",
    id: string,
    name: string,
    description: string | null,
    image:  {
      __typename: "S3Object",
      bucket: string,
      region: string,
      key: string,
      identityPoolId: string | null,
    } | null,
    price: number,
    soldOutDate: string | null,
    soldOut: boolean | null,
    availability:  {
      __typename: "ItemAvailability",
      monday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      tuesday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      wednesday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      thursday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      friday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      saturday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
      sunday:  Array< {
        __typename: "ItemAvailabilityTime",
        startTime: string | null,
        endTime: string | null,
      } >,
    } | null,
    categories:  {
      __typename: "ModelCategoryProductLinkConnection",
      items:  Array< {
        __typename: "CategoryProductLink",
        id: string,
        displaySequence: number,
        categoryProductLinkCategoryId: string,
        categoryProductLinkProductId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    modifierGroups:  {
      __typename: "ModelProductModifierGroupLinkConnection",
      items:  Array< {
        __typename: "ProductModifierGroupLink",
        id: string,
        displaySequence: number,
        hideForCustomer: boolean | null,
        productModifierGroupLinkProductId: string,
        productModifierGroupLinkModifierGroupId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    productRestaurantId: string,
    productIgnoredOnRegisterPrinters:  {
      __typename: "ModelRegisterPrinterProductLinkConnection",
      items:  Array< {
        __typename: "RegisterPrinterProductLink",
        id: string,
        registerPrinterProductLinkRegisterPrinterId: string,
        registerPrinterProductLinkProductId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateProductModifierGroupLinkMutationVariables = {
  input: CreateProductModifierGroupLinkInput,
  condition?: ModelProductModifierGroupLinkConditionInput | null,
};

export type CreateProductModifierGroupLinkMutation = {
  createProductModifierGroupLink:  {
    __typename: "ProductModifierGroupLink",
    id: string,
    displaySequence: number,
    hideForCustomer: boolean | null,
    productModifierGroupLinkProductId: string,
    productModifierGroupLinkModifierGroupId: string,
    product:  {
      __typename: "Product",
      id: string,
      name: string,
      description: string | null,
      image:  {
        __typename: "S3Object",
        bucket: string,
        region: string,
        key: string,
        identityPoolId: string | null,
      } | null,
      price: number,
      soldOutDate: string | null,
      soldOut: boolean | null,
      categories:  {
        __typename: "ModelCategoryProductLinkConnection",
        nextToken: string | null,
      } | null,
      modifierGroups:  {
        __typename: "ModelProductModifierGroupLinkConnection",
        nextToken: string | null,
      } | null,
      productRestaurantId: string,
      productIgnoredOnRegisterPrinters:  {
        __typename: "ModelRegisterPrinterProductLinkConnection",
        nextToken: string | null,
      } | null,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    modifierGroup:  {
      __typename: "ModifierGroup",
      id: string,
      name: string,
      choiceDuplicate: number,
      choiceMin: number,
      choiceMax: number,
      products:  {
        __typename: "ModelProductModifierGroupLinkConnection",
        nextToken: string | null,
      } | null,
      modifiers:  {
        __typename: "ModelModifierGroupModifierLinkConnection",
        nextToken: string | null,
      } | null,
      modifierGroupRestaurantId: string,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateProductModifierGroupLinkMutationVariables = {
  input: UpdateProductModifierGroupLinkInput,
  condition?: ModelProductModifierGroupLinkConditionInput | null,
};

export type UpdateProductModifierGroupLinkMutation = {
  updateProductModifierGroupLink:  {
    __typename: "ProductModifierGroupLink",
    id: string,
    displaySequence: number,
    hideForCustomer: boolean | null,
    productModifierGroupLinkProductId: string,
    productModifierGroupLinkModifierGroupId: string,
    product:  {
      __typename: "Product",
      id: string,
      name: string,
      description: string | null,
      image:  {
        __typename: "S3Object",
        bucket: string,
        region: string,
        key: string,
        identityPoolId: string | null,
      } | null,
      price: number,
      soldOutDate: string | null,
      soldOut: boolean | null,
      categories:  {
        __typename: "ModelCategoryProductLinkConnection",
        nextToken: string | null,
      } | null,
      modifierGroups:  {
        __typename: "ModelProductModifierGroupLinkConnection",
        nextToken: string | null,
      } | null,
      productRestaurantId: string,
      productIgnoredOnRegisterPrinters:  {
        __typename: "ModelRegisterPrinterProductLinkConnection",
        nextToken: string | null,
      } | null,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    modifierGroup:  {
      __typename: "ModifierGroup",
      id: string,
      name: string,
      choiceDuplicate: number,
      choiceMin: number,
      choiceMax: number,
      products:  {
        __typename: "ModelProductModifierGroupLinkConnection",
        nextToken: string | null,
      } | null,
      modifiers:  {
        __typename: "ModelModifierGroupModifierLinkConnection",
        nextToken: string | null,
      } | null,
      modifierGroupRestaurantId: string,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteProductModifierGroupLinkMutationVariables = {
  input: DeleteProductModifierGroupLinkInput,
  condition?: ModelProductModifierGroupLinkConditionInput | null,
};

export type DeleteProductModifierGroupLinkMutation = {
  deleteProductModifierGroupLink:  {
    __typename: "ProductModifierGroupLink",
    id: string,
    displaySequence: number,
    hideForCustomer: boolean | null,
    productModifierGroupLinkProductId: string,
    productModifierGroupLinkModifierGroupId: string,
    product:  {
      __typename: "Product",
      id: string,
      name: string,
      description: string | null,
      image:  {
        __typename: "S3Object",
        bucket: string,
        region: string,
        key: string,
        identityPoolId: string | null,
      } | null,
      price: number,
      soldOutDate: string | null,
      soldOut: boolean | null,
      categories:  {
        __typename: "ModelCategoryProductLinkConnection",
        nextToken: string | null,
      } | null,
      modifierGroups:  {
        __typename: "ModelProductModifierGroupLinkConnection",
        nextToken: string | null,
      } | null,
      productRestaurantId: string,
      productIgnoredOnRegisterPrinters:  {
        __typename: "ModelRegisterPrinterProductLinkConnection",
        nextToken: string | null,
      } | null,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    modifierGroup:  {
      __typename: "ModifierGroup",
      id: string,
      name: string,
      choiceDuplicate: number,
      choiceMin: number,
      choiceMax: number,
      products:  {
        __typename: "ModelProductModifierGroupLinkConnection",
        nextToken: string | null,
      } | null,
      modifiers:  {
        __typename: "ModelModifierGroupModifierLinkConnection",
        nextToken: string | null,
      } | null,
      modifierGroupRestaurantId: string,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateModifierGroupMutationVariables = {
  input: CreateModifierGroupInput,
  condition?: ModelModifierGroupConditionInput | null,
};

export type CreateModifierGroupMutation = {
  createModifierGroup:  {
    __typename: "ModifierGroup",
    id: string,
    name: string,
    choiceDuplicate: number,
    choiceMin: number,
    choiceMax: number,
    products:  {
      __typename: "ModelProductModifierGroupLinkConnection",
      items:  Array< {
        __typename: "ProductModifierGroupLink",
        id: string,
        displaySequence: number,
        hideForCustomer: boolean | null,
        productModifierGroupLinkProductId: string,
        productModifierGroupLinkModifierGroupId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    modifiers:  {
      __typename: "ModelModifierGroupModifierLinkConnection",
      items:  Array< {
        __typename: "ModifierGroupModifierLink",
        id: string,
        displaySequence: number,
        preSelectedQuantity: number | null,
        modifierGroupModifierLinkModifierGroupId: string,
        modifierGroupModifierLinkModifierId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    modifierGroupRestaurantId: string,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateModifierGroupMutationVariables = {
  input: UpdateModifierGroupInput,
  condition?: ModelModifierGroupConditionInput | null,
};

export type UpdateModifierGroupMutation = {
  updateModifierGroup:  {
    __typename: "ModifierGroup",
    id: string,
    name: string,
    choiceDuplicate: number,
    choiceMin: number,
    choiceMax: number,
    products:  {
      __typename: "ModelProductModifierGroupLinkConnection",
      items:  Array< {
        __typename: "ProductModifierGroupLink",
        id: string,
        displaySequence: number,
        hideForCustomer: boolean | null,
        productModifierGroupLinkProductId: string,
        productModifierGroupLinkModifierGroupId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    modifiers:  {
      __typename: "ModelModifierGroupModifierLinkConnection",
      items:  Array< {
        __typename: "ModifierGroupModifierLink",
        id: string,
        displaySequence: number,
        preSelectedQuantity: number | null,
        modifierGroupModifierLinkModifierGroupId: string,
        modifierGroupModifierLinkModifierId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    modifierGroupRestaurantId: string,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteModifierGroupMutationVariables = {
  input: DeleteModifierGroupInput,
  condition?: ModelModifierGroupConditionInput | null,
};

export type DeleteModifierGroupMutation = {
  deleteModifierGroup:  {
    __typename: "ModifierGroup",
    id: string,
    name: string,
    choiceDuplicate: number,
    choiceMin: number,
    choiceMax: number,
    products:  {
      __typename: "ModelProductModifierGroupLinkConnection",
      items:  Array< {
        __typename: "ProductModifierGroupLink",
        id: string,
        displaySequence: number,
        hideForCustomer: boolean | null,
        productModifierGroupLinkProductId: string,
        productModifierGroupLinkModifierGroupId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    modifiers:  {
      __typename: "ModelModifierGroupModifierLinkConnection",
      items:  Array< {
        __typename: "ModifierGroupModifierLink",
        id: string,
        displaySequence: number,
        preSelectedQuantity: number | null,
        modifierGroupModifierLinkModifierGroupId: string,
        modifierGroupModifierLinkModifierId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    modifierGroupRestaurantId: string,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateModifierGroupModifierLinkMutationVariables = {
  input: CreateModifierGroupModifierLinkInput,
  condition?: ModelModifierGroupModifierLinkConditionInput | null,
};

export type CreateModifierGroupModifierLinkMutation = {
  createModifierGroupModifierLink:  {
    __typename: "ModifierGroupModifierLink",
    id: string,
    displaySequence: number,
    preSelectedQuantity: number | null,
    modifierGroupModifierLinkModifierGroupId: string,
    modifierGroupModifierLinkModifierId: string,
    modifierGroup:  {
      __typename: "ModifierGroup",
      id: string,
      name: string,
      choiceDuplicate: number,
      choiceMin: number,
      choiceMax: number,
      products:  {
        __typename: "ModelProductModifierGroupLinkConnection",
        nextToken: string | null,
      } | null,
      modifiers:  {
        __typename: "ModelModifierGroupModifierLinkConnection",
        nextToken: string | null,
      } | null,
      modifierGroupRestaurantId: string,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    modifier:  {
      __typename: "Modifier",
      id: string,
      name: string,
      price: number,
      soldOutDate: string | null,
      soldOut: boolean | null,
      modifierGroups:  {
        __typename: "ModelModifierGroupModifierLinkConnection",
        nextToken: string | null,
      } | null,
      modifierRestaurantId: string,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateModifierGroupModifierLinkMutationVariables = {
  input: UpdateModifierGroupModifierLinkInput,
  condition?: ModelModifierGroupModifierLinkConditionInput | null,
};

export type UpdateModifierGroupModifierLinkMutation = {
  updateModifierGroupModifierLink:  {
    __typename: "ModifierGroupModifierLink",
    id: string,
    displaySequence: number,
    preSelectedQuantity: number | null,
    modifierGroupModifierLinkModifierGroupId: string,
    modifierGroupModifierLinkModifierId: string,
    modifierGroup:  {
      __typename: "ModifierGroup",
      id: string,
      name: string,
      choiceDuplicate: number,
      choiceMin: number,
      choiceMax: number,
      products:  {
        __typename: "ModelProductModifierGroupLinkConnection",
        nextToken: string | null,
      } | null,
      modifiers:  {
        __typename: "ModelModifierGroupModifierLinkConnection",
        nextToken: string | null,
      } | null,
      modifierGroupRestaurantId: string,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    modifier:  {
      __typename: "Modifier",
      id: string,
      name: string,
      price: number,
      soldOutDate: string | null,
      soldOut: boolean | null,
      modifierGroups:  {
        __typename: "ModelModifierGroupModifierLinkConnection",
        nextToken: string | null,
      } | null,
      modifierRestaurantId: string,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteModifierGroupModifierLinkMutationVariables = {
  input: DeleteModifierGroupModifierLinkInput,
  condition?: ModelModifierGroupModifierLinkConditionInput | null,
};

export type DeleteModifierGroupModifierLinkMutation = {
  deleteModifierGroupModifierLink:  {
    __typename: "ModifierGroupModifierLink",
    id: string,
    displaySequence: number,
    preSelectedQuantity: number | null,
    modifierGroupModifierLinkModifierGroupId: string,
    modifierGroupModifierLinkModifierId: string,
    modifierGroup:  {
      __typename: "ModifierGroup",
      id: string,
      name: string,
      choiceDuplicate: number,
      choiceMin: number,
      choiceMax: number,
      products:  {
        __typename: "ModelProductModifierGroupLinkConnection",
        nextToken: string | null,
      } | null,
      modifiers:  {
        __typename: "ModelModifierGroupModifierLinkConnection",
        nextToken: string | null,
      } | null,
      modifierGroupRestaurantId: string,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    modifier:  {
      __typename: "Modifier",
      id: string,
      name: string,
      price: number,
      soldOutDate: string | null,
      soldOut: boolean | null,
      modifierGroups:  {
        __typename: "ModelModifierGroupModifierLinkConnection",
        nextToken: string | null,
      } | null,
      modifierRestaurantId: string,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    },
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateModifierMutationVariables = {
  input: CreateModifierInput,
  condition?: ModelModifierConditionInput | null,
};

export type CreateModifierMutation = {
  createModifier:  {
    __typename: "Modifier",
    id: string,
    name: string,
    price: number,
    soldOutDate: string | null,
    soldOut: boolean | null,
    modifierGroups:  {
      __typename: "ModelModifierGroupModifierLinkConnection",
      items:  Array< {
        __typename: "ModifierGroupModifierLink",
        id: string,
        displaySequence: number,
        preSelectedQuantity: number | null,
        modifierGroupModifierLinkModifierGroupId: string,
        modifierGroupModifierLinkModifierId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    modifierRestaurantId: string,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateModifierMutationVariables = {
  input: UpdateModifierInput,
  condition?: ModelModifierConditionInput | null,
};

export type UpdateModifierMutation = {
  updateModifier:  {
    __typename: "Modifier",
    id: string,
    name: string,
    price: number,
    soldOutDate: string | null,
    soldOut: boolean | null,
    modifierGroups:  {
      __typename: "ModelModifierGroupModifierLinkConnection",
      items:  Array< {
        __typename: "ModifierGroupModifierLink",
        id: string,
        displaySequence: number,
        preSelectedQuantity: number | null,
        modifierGroupModifierLinkModifierGroupId: string,
        modifierGroupModifierLinkModifierId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    modifierRestaurantId: string,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteModifierMutationVariables = {
  input: DeleteModifierInput,
  condition?: ModelModifierConditionInput | null,
};

export type DeleteModifierMutation = {
  deleteModifier:  {
    __typename: "Modifier",
    id: string,
    name: string,
    price: number,
    soldOutDate: string | null,
    soldOut: boolean | null,
    modifierGroups:  {
      __typename: "ModelModifierGroupModifierLinkConnection",
      items:  Array< {
        __typename: "ModifierGroupModifierLink",
        id: string,
        displaySequence: number,
        preSelectedQuantity: number | null,
        modifierGroupModifierLinkModifierGroupId: string,
        modifierGroupModifierLinkModifierId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    modifierRestaurantId: string,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateOrderMutationVariables = {
  input: CreateOrderInput,
  condition?: ModelOrderConditionInput | null,
};

export type CreateOrderMutation = {
  createOrder:  {
    __typename: "Order",
    id: string,
    status: OrderStatus,
    paid: boolean | null,
    type: OrderType,
    number: string,
    table: string | null,
    notes: string | null,
    total: number,
    registerId: string | null,
    products:  Array< {
      __typename: "OrderProduct",
      id: string,
      name: string,
      price: number,
      image:  {
        __typename: "S3Object",
        bucket: string,
        region: string,
        key: string,
        identityPoolId: string | null,
      } | null,
      quantity: number,
      notes: string | null,
      category:  {
        __typename: "OrderCategory",
        id: string,
        name: string,
      } | null,
      modifierGroups:  Array< {
        __typename: "OrderModifierGroup",
        id: string,
        name: string,
      } | null > | null,
    } > | null,
    placedAt: string | null,
    placedAtUtc: string | null,
    completedAt: string | null,
    completedAtUtc: string | null,
    cancelledAt: string | null,
    cancelledAtUtc: string | null,
    orderUserId: string,
    orderRestaurantId: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateOrderMutationVariables = {
  input: UpdateOrderInput,
  condition?: ModelOrderConditionInput | null,
};

export type UpdateOrderMutation = {
  updateOrder:  {
    __typename: "Order",
    id: string,
    status: OrderStatus,
    paid: boolean | null,
    type: OrderType,
    number: string,
    table: string | null,
    notes: string | null,
    total: number,
    registerId: string | null,
    products:  Array< {
      __typename: "OrderProduct",
      id: string,
      name: string,
      price: number,
      image:  {
        __typename: "S3Object",
        bucket: string,
        region: string,
        key: string,
        identityPoolId: string | null,
      } | null,
      quantity: number,
      notes: string | null,
      category:  {
        __typename: "OrderCategory",
        id: string,
        name: string,
      } | null,
      modifierGroups:  Array< {
        __typename: "OrderModifierGroup",
        id: string,
        name: string,
      } | null > | null,
    } > | null,
    placedAt: string | null,
    placedAtUtc: string | null,
    completedAt: string | null,
    completedAtUtc: string | null,
    cancelledAt: string | null,
    cancelledAtUtc: string | null,
    orderUserId: string,
    orderRestaurantId: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteOrderMutationVariables = {
  input: DeleteOrderInput,
  condition?: ModelOrderConditionInput | null,
};

export type DeleteOrderMutation = {
  deleteOrder:  {
    __typename: "Order",
    id: string,
    status: OrderStatus,
    paid: boolean | null,
    type: OrderType,
    number: string,
    table: string | null,
    notes: string | null,
    total: number,
    registerId: string | null,
    products:  Array< {
      __typename: "OrderProduct",
      id: string,
      name: string,
      price: number,
      image:  {
        __typename: "S3Object",
        bucket: string,
        region: string,
        key: string,
        identityPoolId: string | null,
      } | null,
      quantity: number,
      notes: string | null,
      category:  {
        __typename: "OrderCategory",
        id: string,
        name: string,
      } | null,
      modifierGroups:  Array< {
        __typename: "OrderModifierGroup",
        id: string,
        name: string,
      } | null > | null,
    } > | null,
    placedAt: string | null,
    placedAtUtc: string | null,
    completedAt: string | null,
    completedAtUtc: string | null,
    cancelledAt: string | null,
    cancelledAtUtc: string | null,
    orderUserId: string,
    orderRestaurantId: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateVerifoneTransactionLogMutationVariables = {
  input: CreateVerifoneTransactionLogInput,
  condition?: ModelVerifoneTransactionLogConditionInput | null,
};

export type CreateVerifoneTransactionLogMutation = {
  createVerifoneTransactionLog:  {
    __typename: "VerifoneTransactionLog",
    id: string,
    transactionId: number,
    merchantId: number,
    amount: number,
    type: string,
    payload: string,
    restaurantId: string,
    timestampEpoch: number,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateVerifoneTransactionLogMutationVariables = {
  input: UpdateVerifoneTransactionLogInput,
  condition?: ModelVerifoneTransactionLogConditionInput | null,
};

export type UpdateVerifoneTransactionLogMutation = {
  updateVerifoneTransactionLog:  {
    __typename: "VerifoneTransactionLog",
    id: string,
    transactionId: number,
    merchantId: number,
    amount: number,
    type: string,
    payload: string,
    restaurantId: string,
    timestampEpoch: number,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteVerifoneTransactionLogMutationVariables = {
  input: DeleteVerifoneTransactionLogInput,
  condition?: ModelVerifoneTransactionLogConditionInput | null,
};

export type DeleteVerifoneTransactionLogMutation = {
  deleteVerifoneTransactionLog:  {
    __typename: "VerifoneTransactionLog",
    id: string,
    transactionId: number,
    merchantId: number,
    amount: number,
    type: string,
    payload: string,
    restaurantId: string,
    timestampEpoch: number,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type GetUserQueryVariables = {
  id: string,
};

export type GetUserQuery = {
  getUser:  {
    __typename: "User",
    id: string,
    email: string,
    firstName: string | null,
    lastName: string | null,
    identityPoolId: string,
    restaurants:  {
      __typename: "ModelRestaurantConnection",
      items:  Array< {
        __typename: "Restaurant",
        id: string,
        name: string,
        description: string | null,
        verified: boolean,
        isAcceptingOrders: boolean,
        restaurantManagerId: string,
        deviceEndpoint: string | null,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    orders:  {
      __typename: "ModelOrderConnection",
      items:  Array< {
        __typename: "Order",
        id: string,
        status: OrderStatus,
        paid: boolean | null,
        type: OrderType,
        number: string,
        table: string | null,
        notes: string | null,
        total: number,
        registerId: string | null,
        placedAt: string | null,
        placedAtUtc: string | null,
        completedAt: string | null,
        completedAtUtc: string | null,
        cancelledAt: string | null,
        cancelledAtUtc: string | null,
        orderUserId: string,
        orderRestaurantId: string,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type GetRestaurantQueryVariables = {
  id: string,
};

export type GetRestaurantQuery = {
  getRestaurant:  {
    __typename: "Restaurant",
    id: string,
    name: string,
    description: string | null,
    image:  {
      __typename: "S3Object",
      bucket: string,
      region: string,
      key: string,
      identityPoolId: string | null,
    } | null,
    address:  {
      __typename: "Address",
      formattedAddress: string,
      aptSuite: string | null,
    },
    _geoloc:  {
      __typename: "Location",
      lat: number | null,
      lng: number | null,
    },
    verified: boolean,
    isAcceptingOrders: boolean,
    operatingHours:  {
      __typename: "OperatingHours",
      monday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
      tuesday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
      wednesday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
      thursday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
      friday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
      saturday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
      sunday:  Array< {
        __typename: "OperatingTimes",
        openingTime: string | null,
        closingTime: string | null,
      } >,
    },
    restaurantManagerId: string,
    deviceEndpoint: string | null,
    registers:  {
      __typename: "ModelRegisterConnection",
      items:  Array< {
        __typename: "Register",
        id: string,
        name: string,
        active: boolean,
        orderNumberSuffix: string | null,
        enableTableFlags: boolean | null,
        enablePayLater: boolean | null,
        type: RegisterType,
        eftposProvider: EftposProvider | null,
        eftposIpAddress: string | null,
        eftposPortNumber: string | null,
        registerRestaurantId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    advertisements:  {
      __typename: "ModelAdvertisementConnection",
      items:  Array< {
        __typename: "Advertisement",
        id: string,
        name: string,
        active: boolean | null,
        contentDurationInSeconds: number | null,
        advertisementRestaurantId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    categories:  {
      __typename: "ModelCategoryConnection",
      items:  Array< {
        __typename: "Category",
        id: string,
        name: string,
        displaySequence: number,
        categoryRestaurantId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    products:  {
      __typename: "ModelProductConnection",
      items:  Array< {
        __typename: "Product",
        id: string,
        name: string,
        description: string | null,
        price: number,
        soldOutDate: string | null,
        soldOut: boolean | null,
        productRestaurantId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    modifierGroups:  {
      __typename: "ModelModifierGroupConnection",
      items:  Array< {
        __typename: "ModifierGroup",
        id: string,
        name: string,
        choiceDuplicate: number,
        choiceMin: number,
        choiceMax: number,
        modifierGroupRestaurantId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    modifiers:  {
      __typename: "ModelModifierConnection",
      items:  Array< {
        __typename: "Modifier",
        id: string,
        name: string,
        price: number,
        soldOutDate: string | null,
        soldOut: boolean | null,
        modifierRestaurantId: string,
        owner: string | null,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    orders:  {
      __typename: "ModelOrderConnection",
      items:  Array< {
        __typename: "Order",
        id: string,
        status: OrderStatus,
        paid: boolean | null,
        type: OrderType,
        number: string,
        table: string | null,
        notes: string | null,
        total: number,
        registerId: string | null,
        placedAt: string | null,
        placedAtUtc: string | null,
        completedAt: string | null,
        completedAtUtc: string | null,
        cancelledAt: string | null,
        cancelledAtUtc: string | null,
        orderUserId: string,
        orderRestaurantId: string,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    ordersByStatusPlacedAt:  {
      __typename: "ModelOrderConnection",
      items:  Array< {
        __typename: "Order",
        id: string,
        status: OrderStatus,
        paid: boolean | null,
        type: OrderType,
        number: string,
        table: string | null,
        notes: string | null,
        total: number,
        registerId: string | null,
        placedAt: string | null,
        placedAtUtc: string | null,
        completedAt: string | null,
        completedAtUtc: string | null,
        cancelledAt: string | null,
        cancelledAtUtc: string | null,
        orderUserId: string,
        orderRestaurantId: string,
        createdAt: string,
        updatedAt: string,
      } | null > | null,
      nextToken: string | null,
    } | null,
    owner: string | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListRestaurantsQueryVariables = {
  filter?: ModelRestaurantFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListRestaurantsQuery = {
  listRestaurants:  {
    __typename: "ModelRestaurantConnection",
    items:  Array< {
      __typename: "Restaurant",
      id: string,
      name: string,
      description: string | null,
      image:  {
        __typename: "S3Object",
        bucket: string,
        region: string,
        key: string,
        identityPoolId: string | null,
      } | null,
      address:  {
        __typename: "Address",
        formattedAddress: string,
        aptSuite: string | null,
      },
      _geoloc:  {
        __typename: "Location",
        lat: number | null,
        lng: number | null,
      },
      verified: boolean,
      isAcceptingOrders: boolean,
      restaurantManagerId: string,
      deviceEndpoint: string | null,
      registers:  {
        __typename: "ModelRegisterConnection",
        nextToken: string | null,
      } | null,
      advertisements:  {
        __typename: "ModelAdvertisementConnection",
        nextToken: string | null,
      } | null,
      categories:  {
        __typename: "ModelCategoryConnection",
        nextToken: string | null,
      } | null,
      products:  {
        __typename: "ModelProductConnection",
        nextToken: string | null,
      } | null,
      modifierGroups:  {
        __typename: "ModelModifierGroupConnection",
        nextToken: string | null,
      } | null,
      modifiers:  {
        __typename: "ModelModifierConnection",
        nextToken: string | null,
      } | null,
      orders:  {
        __typename: "ModelOrderConnection",
        nextToken: string | null,
      } | null,
      ordersByStatusPlacedAt:  {
        __typename: "ModelOrderConnection",
        nextToken: string | null,
      } | null,
      owner: string | null,
      createdAt: string,
      updatedAt: string,
    } | null > | null,
    nextToken: string | null,
  } | null,
};
