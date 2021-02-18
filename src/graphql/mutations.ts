/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const processOrder = /* GraphQL */ `
  mutation ProcessOrder($input: ProcessOrderInput!) {
    processOrder(input: $input)
  }
`;
export const updateUser = /* GraphQL */ `
  mutation UpdateUser(
    $input: UpdateUserInput!
    $condition: ModelUserConditionInput
  ) {
    updateUser(input: $input, condition: $condition) {
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
export const createRestaurant = /* GraphQL */ `
  mutation CreateRestaurant(
    $input: CreateRestaurantInput!
    $condition: ModelRestaurantConditionInput
  ) {
    createRestaurant(input: $input, condition: $condition) {
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
export const updateRestaurant = /* GraphQL */ `
  mutation UpdateRestaurant(
    $input: UpdateRestaurantInput!
    $condition: ModelRestaurantConditionInput
  ) {
    updateRestaurant(input: $input, condition: $condition) {
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
export const createAdvertisement = /* GraphQL */ `
  mutation CreateAdvertisement(
    $input: CreateAdvertisementInput!
    $condition: ModelAdvertisementConditionInput
  ) {
    createAdvertisement(input: $input, condition: $condition) {
      id
      name
      active
      activeDaysOfWeek {
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
      content {
        bucket
        region
        key
        identityPoolId
      }
      contentDurationInSeconds
      advertisementRestaurantId
      owner
      createdAt
      updatedAt
    }
  }
`;
export const updateAdvertisement = /* GraphQL */ `
  mutation UpdateAdvertisement(
    $input: UpdateAdvertisementInput!
    $condition: ModelAdvertisementConditionInput
  ) {
    updateAdvertisement(input: $input, condition: $condition) {
      id
      name
      active
      activeDaysOfWeek {
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
      content {
        bucket
        region
        key
        identityPoolId
      }
      contentDurationInSeconds
      advertisementRestaurantId
      owner
      createdAt
      updatedAt
    }
  }
`;
export const deleteAdvertisement = /* GraphQL */ `
  mutation DeleteAdvertisement(
    $input: DeleteAdvertisementInput!
    $condition: ModelAdvertisementConditionInput
  ) {
    deleteAdvertisement(input: $input, condition: $condition) {
      id
      name
      active
      activeDaysOfWeek {
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
      content {
        bucket
        region
        key
        identityPoolId
      }
      contentDurationInSeconds
      advertisementRestaurantId
      owner
      createdAt
      updatedAt
    }
  }
`;
export const createRegister = /* GraphQL */ `
  mutation CreateRegister(
    $input: CreateRegisterInput!
    $condition: ModelRegisterConditionInput
  ) {
    createRegister(input: $input, condition: $condition) {
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
      printers {
        items {
          id
          name
          address
          registerPrinterRegisterId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      registerRestaurantId
      owner
      createdAt
      updatedAt
    }
  }
`;
export const updateRegister = /* GraphQL */ `
  mutation UpdateRegister(
    $input: UpdateRegisterInput!
    $condition: ModelRegisterConditionInput
  ) {
    updateRegister(input: $input, condition: $condition) {
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
      printers {
        items {
          id
          name
          address
          registerPrinterRegisterId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      registerRestaurantId
      owner
      createdAt
      updatedAt
    }
  }
`;
export const deleteRegister = /* GraphQL */ `
  mutation DeleteRegister(
    $input: DeleteRegisterInput!
    $condition: ModelRegisterConditionInput
  ) {
    deleteRegister(input: $input, condition: $condition) {
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
      printers {
        items {
          id
          name
          address
          registerPrinterRegisterId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      registerRestaurantId
      owner
      createdAt
      updatedAt
    }
  }
`;
export const createRegisterPrinter = /* GraphQL */ `
  mutation CreateRegisterPrinter(
    $input: CreateRegisterPrinterInput!
    $condition: ModelRegisterPrinterConditionInput
  ) {
    createRegisterPrinter(input: $input, condition: $condition) {
      id
      name
      address
      ignoreProducts {
        items {
          id
          registerPrinterProductLinkRegisterPrinterId
          registerPrinterProductLinkProductId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      registerPrinterRegisterId
      owner
      createdAt
      updatedAt
    }
  }
`;
export const updateRegisterPrinter = /* GraphQL */ `
  mutation UpdateRegisterPrinter(
    $input: UpdateRegisterPrinterInput!
    $condition: ModelRegisterPrinterConditionInput
  ) {
    updateRegisterPrinter(input: $input, condition: $condition) {
      id
      name
      address
      ignoreProducts {
        items {
          id
          registerPrinterProductLinkRegisterPrinterId
          registerPrinterProductLinkProductId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      registerPrinterRegisterId
      owner
      createdAt
      updatedAt
    }
  }
`;
export const deleteRegisterPrinter = /* GraphQL */ `
  mutation DeleteRegisterPrinter(
    $input: DeleteRegisterPrinterInput!
    $condition: ModelRegisterPrinterConditionInput
  ) {
    deleteRegisterPrinter(input: $input, condition: $condition) {
      id
      name
      address
      ignoreProducts {
        items {
          id
          registerPrinterProductLinkRegisterPrinterId
          registerPrinterProductLinkProductId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      registerPrinterRegisterId
      owner
      createdAt
      updatedAt
    }
  }
`;
export const createRegisterPrinterProductLink = /* GraphQL */ `
  mutation CreateRegisterPrinterProductLink(
    $input: CreateRegisterPrinterProductLinkInput!
    $condition: ModelRegisterPrinterProductLinkConditionInput
  ) {
    createRegisterPrinterProductLink(input: $input, condition: $condition) {
      id
      registerPrinterProductLinkRegisterPrinterId
      registerPrinterProductLinkProductId
      registerPrinter {
        id
        name
        address
        ignoreProducts {
          nextToken
        }
        registerPrinterRegisterId
        owner
        createdAt
        updatedAt
      }
      product {
        id
        name
        description
        image {
          bucket
          region
          key
          identityPoolId
        }
        price
        soldOutDate
        soldOut
        categories {
          nextToken
        }
        modifierGroups {
          nextToken
        }
        productRestaurantId
        productIgnoredOnRegisterPrinters {
          nextToken
        }
        owner
        createdAt
        updatedAt
      }
      owner
      createdAt
      updatedAt
    }
  }
`;
export const updateRegisterPrinterProductLink = /* GraphQL */ `
  mutation UpdateRegisterPrinterProductLink(
    $input: UpdateRegisterPrinterProductLinkInput!
    $condition: ModelRegisterPrinterProductLinkConditionInput
  ) {
    updateRegisterPrinterProductLink(input: $input, condition: $condition) {
      id
      registerPrinterProductLinkRegisterPrinterId
      registerPrinterProductLinkProductId
      registerPrinter {
        id
        name
        address
        ignoreProducts {
          nextToken
        }
        registerPrinterRegisterId
        owner
        createdAt
        updatedAt
      }
      product {
        id
        name
        description
        image {
          bucket
          region
          key
          identityPoolId
        }
        price
        soldOutDate
        soldOut
        categories {
          nextToken
        }
        modifierGroups {
          nextToken
        }
        productRestaurantId
        productIgnoredOnRegisterPrinters {
          nextToken
        }
        owner
        createdAt
        updatedAt
      }
      owner
      createdAt
      updatedAt
    }
  }
`;
export const deleteRegisterPrinterProductLink = /* GraphQL */ `
  mutation DeleteRegisterPrinterProductLink(
    $input: DeleteRegisterPrinterProductLinkInput!
    $condition: ModelRegisterPrinterProductLinkConditionInput
  ) {
    deleteRegisterPrinterProductLink(input: $input, condition: $condition) {
      id
      registerPrinterProductLinkRegisterPrinterId
      registerPrinterProductLinkProductId
      registerPrinter {
        id
        name
        address
        ignoreProducts {
          nextToken
        }
        registerPrinterRegisterId
        owner
        createdAt
        updatedAt
      }
      product {
        id
        name
        description
        image {
          bucket
          region
          key
          identityPoolId
        }
        price
        soldOutDate
        soldOut
        categories {
          nextToken
        }
        modifierGroups {
          nextToken
        }
        productRestaurantId
        productIgnoredOnRegisterPrinters {
          nextToken
        }
        owner
        createdAt
        updatedAt
      }
      owner
      createdAt
      updatedAt
    }
  }
`;
export const createCategory = /* GraphQL */ `
  mutation CreateCategory(
    $input: CreateCategoryInput!
    $condition: ModelCategoryConditionInput
  ) {
    createCategory(input: $input, condition: $condition) {
      id
      name
      image {
        bucket
        region
        key
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
      products {
        items {
          id
          displaySequence
          categoryProductLinkCategoryId
          categoryProductLinkProductId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      categoryRestaurantId
      owner
      createdAt
      updatedAt
    }
  }
`;
export const updateCategory = /* GraphQL */ `
  mutation UpdateCategory(
    $input: UpdateCategoryInput!
    $condition: ModelCategoryConditionInput
  ) {
    updateCategory(input: $input, condition: $condition) {
      id
      name
      image {
        bucket
        region
        key
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
      products {
        items {
          id
          displaySequence
          categoryProductLinkCategoryId
          categoryProductLinkProductId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      categoryRestaurantId
      owner
      createdAt
      updatedAt
    }
  }
`;
export const deleteCategory = /* GraphQL */ `
  mutation DeleteCategory(
    $input: DeleteCategoryInput!
    $condition: ModelCategoryConditionInput
  ) {
    deleteCategory(input: $input, condition: $condition) {
      id
      name
      image {
        bucket
        region
        key
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
      products {
        items {
          id
          displaySequence
          categoryProductLinkCategoryId
          categoryProductLinkProductId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      categoryRestaurantId
      owner
      createdAt
      updatedAt
    }
  }
`;
export const createCategoryProductLink = /* GraphQL */ `
  mutation CreateCategoryProductLink(
    $input: CreateCategoryProductLinkInput!
    $condition: ModelCategoryProductLinkConditionInput
  ) {
    createCategoryProductLink(input: $input, condition: $condition) {
      id
      displaySequence
      categoryProductLinkCategoryId
      categoryProductLinkProductId
      category {
        id
        name
        image {
          bucket
          region
          key
          identityPoolId
        }
        displaySequence
        products {
          nextToken
        }
        categoryRestaurantId
        owner
        createdAt
        updatedAt
      }
      product {
        id
        name
        description
        image {
          bucket
          region
          key
          identityPoolId
        }
        price
        soldOutDate
        soldOut
        categories {
          nextToken
        }
        modifierGroups {
          nextToken
        }
        productRestaurantId
        productIgnoredOnRegisterPrinters {
          nextToken
        }
        owner
        createdAt
        updatedAt
      }
      owner
      createdAt
      updatedAt
    }
  }
`;
export const updateCategoryProductLink = /* GraphQL */ `
  mutation UpdateCategoryProductLink(
    $input: UpdateCategoryProductLinkInput!
    $condition: ModelCategoryProductLinkConditionInput
  ) {
    updateCategoryProductLink(input: $input, condition: $condition) {
      id
      displaySequence
      categoryProductLinkCategoryId
      categoryProductLinkProductId
      category {
        id
        name
        image {
          bucket
          region
          key
          identityPoolId
        }
        displaySequence
        products {
          nextToken
        }
        categoryRestaurantId
        owner
        createdAt
        updatedAt
      }
      product {
        id
        name
        description
        image {
          bucket
          region
          key
          identityPoolId
        }
        price
        soldOutDate
        soldOut
        categories {
          nextToken
        }
        modifierGroups {
          nextToken
        }
        productRestaurantId
        productIgnoredOnRegisterPrinters {
          nextToken
        }
        owner
        createdAt
        updatedAt
      }
      owner
      createdAt
      updatedAt
    }
  }
`;
export const deleteCategoryProductLink = /* GraphQL */ `
  mutation DeleteCategoryProductLink(
    $input: DeleteCategoryProductLinkInput!
    $condition: ModelCategoryProductLinkConditionInput
  ) {
    deleteCategoryProductLink(input: $input, condition: $condition) {
      id
      displaySequence
      categoryProductLinkCategoryId
      categoryProductLinkProductId
      category {
        id
        name
        image {
          bucket
          region
          key
          identityPoolId
        }
        displaySequence
        products {
          nextToken
        }
        categoryRestaurantId
        owner
        createdAt
        updatedAt
      }
      product {
        id
        name
        description
        image {
          bucket
          region
          key
          identityPoolId
        }
        price
        soldOutDate
        soldOut
        categories {
          nextToken
        }
        modifierGroups {
          nextToken
        }
        productRestaurantId
        productIgnoredOnRegisterPrinters {
          nextToken
        }
        owner
        createdAt
        updatedAt
      }
      owner
      createdAt
      updatedAt
    }
  }
`;
export const createProduct = /* GraphQL */ `
  mutation CreateProduct(
    $input: CreateProductInput!
    $condition: ModelProductConditionInput
  ) {
    createProduct(input: $input, condition: $condition) {
      id
      name
      description
      image {
        bucket
        region
        key
        identityPoolId
      }
      price
      soldOutDate
      soldOut
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
      categories {
        items {
          id
          displaySequence
          categoryProductLinkCategoryId
          categoryProductLinkProductId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      modifierGroups {
        items {
          id
          displaySequence
          hideForCustomer
          productModifierGroupLinkProductId
          productModifierGroupLinkModifierGroupId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      productRestaurantId
      productIgnoredOnRegisterPrinters {
        items {
          id
          registerPrinterProductLinkRegisterPrinterId
          registerPrinterProductLinkProductId
          owner
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
export const updateProduct = /* GraphQL */ `
  mutation UpdateProduct(
    $input: UpdateProductInput!
    $condition: ModelProductConditionInput
  ) {
    updateProduct(input: $input, condition: $condition) {
      id
      name
      description
      image {
        bucket
        region
        key
        identityPoolId
      }
      price
      soldOutDate
      soldOut
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
      categories {
        items {
          id
          displaySequence
          categoryProductLinkCategoryId
          categoryProductLinkProductId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      modifierGroups {
        items {
          id
          displaySequence
          hideForCustomer
          productModifierGroupLinkProductId
          productModifierGroupLinkModifierGroupId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      productRestaurantId
      productIgnoredOnRegisterPrinters {
        items {
          id
          registerPrinterProductLinkRegisterPrinterId
          registerPrinterProductLinkProductId
          owner
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
export const deleteProduct = /* GraphQL */ `
  mutation DeleteProduct(
    $input: DeleteProductInput!
    $condition: ModelProductConditionInput
  ) {
    deleteProduct(input: $input, condition: $condition) {
      id
      name
      description
      image {
        bucket
        region
        key
        identityPoolId
      }
      price
      soldOutDate
      soldOut
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
      categories {
        items {
          id
          displaySequence
          categoryProductLinkCategoryId
          categoryProductLinkProductId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      modifierGroups {
        items {
          id
          displaySequence
          hideForCustomer
          productModifierGroupLinkProductId
          productModifierGroupLinkModifierGroupId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      productRestaurantId
      productIgnoredOnRegisterPrinters {
        items {
          id
          registerPrinterProductLinkRegisterPrinterId
          registerPrinterProductLinkProductId
          owner
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
export const createProductModifierGroupLink = /* GraphQL */ `
  mutation CreateProductModifierGroupLink(
    $input: CreateProductModifierGroupLinkInput!
    $condition: ModelProductModifierGroupLinkConditionInput
  ) {
    createProductModifierGroupLink(input: $input, condition: $condition) {
      id
      displaySequence
      hideForCustomer
      productModifierGroupLinkProductId
      productModifierGroupLinkModifierGroupId
      product {
        id
        name
        description
        image {
          bucket
          region
          key
          identityPoolId
        }
        price
        soldOutDate
        soldOut
        categories {
          nextToken
        }
        modifierGroups {
          nextToken
        }
        productRestaurantId
        productIgnoredOnRegisterPrinters {
          nextToken
        }
        owner
        createdAt
        updatedAt
      }
      modifierGroup {
        id
        name
        choiceDuplicate
        choiceMin
        choiceMax
        products {
          nextToken
        }
        modifiers {
          nextToken
        }
        modifierGroupRestaurantId
        owner
        createdAt
        updatedAt
      }
      owner
      createdAt
      updatedAt
    }
  }
`;
export const updateProductModifierGroupLink = /* GraphQL */ `
  mutation UpdateProductModifierGroupLink(
    $input: UpdateProductModifierGroupLinkInput!
    $condition: ModelProductModifierGroupLinkConditionInput
  ) {
    updateProductModifierGroupLink(input: $input, condition: $condition) {
      id
      displaySequence
      hideForCustomer
      productModifierGroupLinkProductId
      productModifierGroupLinkModifierGroupId
      product {
        id
        name
        description
        image {
          bucket
          region
          key
          identityPoolId
        }
        price
        soldOutDate
        soldOut
        categories {
          nextToken
        }
        modifierGroups {
          nextToken
        }
        productRestaurantId
        productIgnoredOnRegisterPrinters {
          nextToken
        }
        owner
        createdAt
        updatedAt
      }
      modifierGroup {
        id
        name
        choiceDuplicate
        choiceMin
        choiceMax
        products {
          nextToken
        }
        modifiers {
          nextToken
        }
        modifierGroupRestaurantId
        owner
        createdAt
        updatedAt
      }
      owner
      createdAt
      updatedAt
    }
  }
`;
export const deleteProductModifierGroupLink = /* GraphQL */ `
  mutation DeleteProductModifierGroupLink(
    $input: DeleteProductModifierGroupLinkInput!
    $condition: ModelProductModifierGroupLinkConditionInput
  ) {
    deleteProductModifierGroupLink(input: $input, condition: $condition) {
      id
      displaySequence
      hideForCustomer
      productModifierGroupLinkProductId
      productModifierGroupLinkModifierGroupId
      product {
        id
        name
        description
        image {
          bucket
          region
          key
          identityPoolId
        }
        price
        soldOutDate
        soldOut
        categories {
          nextToken
        }
        modifierGroups {
          nextToken
        }
        productRestaurantId
        productIgnoredOnRegisterPrinters {
          nextToken
        }
        owner
        createdAt
        updatedAt
      }
      modifierGroup {
        id
        name
        choiceDuplicate
        choiceMin
        choiceMax
        products {
          nextToken
        }
        modifiers {
          nextToken
        }
        modifierGroupRestaurantId
        owner
        createdAt
        updatedAt
      }
      owner
      createdAt
      updatedAt
    }
  }
`;
export const createModifierGroup = /* GraphQL */ `
  mutation CreateModifierGroup(
    $input: CreateModifierGroupInput!
    $condition: ModelModifierGroupConditionInput
  ) {
    createModifierGroup(input: $input, condition: $condition) {
      id
      name
      choiceDuplicate
      choiceMin
      choiceMax
      products {
        items {
          id
          displaySequence
          hideForCustomer
          productModifierGroupLinkProductId
          productModifierGroupLinkModifierGroupId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      modifiers {
        items {
          id
          displaySequence
          preSelectedQuantity
          modifierGroupModifierLinkModifierGroupId
          modifierGroupModifierLinkModifierId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      modifierGroupRestaurantId
      owner
      createdAt
      updatedAt
    }
  }
`;
export const updateModifierGroup = /* GraphQL */ `
  mutation UpdateModifierGroup(
    $input: UpdateModifierGroupInput!
    $condition: ModelModifierGroupConditionInput
  ) {
    updateModifierGroup(input: $input, condition: $condition) {
      id
      name
      choiceDuplicate
      choiceMin
      choiceMax
      products {
        items {
          id
          displaySequence
          hideForCustomer
          productModifierGroupLinkProductId
          productModifierGroupLinkModifierGroupId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      modifiers {
        items {
          id
          displaySequence
          preSelectedQuantity
          modifierGroupModifierLinkModifierGroupId
          modifierGroupModifierLinkModifierId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      modifierGroupRestaurantId
      owner
      createdAt
      updatedAt
    }
  }
`;
export const deleteModifierGroup = /* GraphQL */ `
  mutation DeleteModifierGroup(
    $input: DeleteModifierGroupInput!
    $condition: ModelModifierGroupConditionInput
  ) {
    deleteModifierGroup(input: $input, condition: $condition) {
      id
      name
      choiceDuplicate
      choiceMin
      choiceMax
      products {
        items {
          id
          displaySequence
          hideForCustomer
          productModifierGroupLinkProductId
          productModifierGroupLinkModifierGroupId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      modifiers {
        items {
          id
          displaySequence
          preSelectedQuantity
          modifierGroupModifierLinkModifierGroupId
          modifierGroupModifierLinkModifierId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      modifierGroupRestaurantId
      owner
      createdAt
      updatedAt
    }
  }
`;
export const createModifierGroupModifierLink = /* GraphQL */ `
  mutation CreateModifierGroupModifierLink(
    $input: CreateModifierGroupModifierLinkInput!
    $condition: ModelModifierGroupModifierLinkConditionInput
  ) {
    createModifierGroupModifierLink(input: $input, condition: $condition) {
      id
      displaySequence
      preSelectedQuantity
      modifierGroupModifierLinkModifierGroupId
      modifierGroupModifierLinkModifierId
      modifierGroup {
        id
        name
        choiceDuplicate
        choiceMin
        choiceMax
        products {
          nextToken
        }
        modifiers {
          nextToken
        }
        modifierGroupRestaurantId
        owner
        createdAt
        updatedAt
      }
      modifier {
        id
        name
        price
        soldOutDate
        soldOut
        modifierGroups {
          nextToken
        }
        modifierRestaurantId
        owner
        createdAt
        updatedAt
      }
      owner
      createdAt
      updatedAt
    }
  }
`;
export const updateModifierGroupModifierLink = /* GraphQL */ `
  mutation UpdateModifierGroupModifierLink(
    $input: UpdateModifierGroupModifierLinkInput!
    $condition: ModelModifierGroupModifierLinkConditionInput
  ) {
    updateModifierGroupModifierLink(input: $input, condition: $condition) {
      id
      displaySequence
      preSelectedQuantity
      modifierGroupModifierLinkModifierGroupId
      modifierGroupModifierLinkModifierId
      modifierGroup {
        id
        name
        choiceDuplicate
        choiceMin
        choiceMax
        products {
          nextToken
        }
        modifiers {
          nextToken
        }
        modifierGroupRestaurantId
        owner
        createdAt
        updatedAt
      }
      modifier {
        id
        name
        price
        soldOutDate
        soldOut
        modifierGroups {
          nextToken
        }
        modifierRestaurantId
        owner
        createdAt
        updatedAt
      }
      owner
      createdAt
      updatedAt
    }
  }
`;
export const deleteModifierGroupModifierLink = /* GraphQL */ `
  mutation DeleteModifierGroupModifierLink(
    $input: DeleteModifierGroupModifierLinkInput!
    $condition: ModelModifierGroupModifierLinkConditionInput
  ) {
    deleteModifierGroupModifierLink(input: $input, condition: $condition) {
      id
      displaySequence
      preSelectedQuantity
      modifierGroupModifierLinkModifierGroupId
      modifierGroupModifierLinkModifierId
      modifierGroup {
        id
        name
        choiceDuplicate
        choiceMin
        choiceMax
        products {
          nextToken
        }
        modifiers {
          nextToken
        }
        modifierGroupRestaurantId
        owner
        createdAt
        updatedAt
      }
      modifier {
        id
        name
        price
        soldOutDate
        soldOut
        modifierGroups {
          nextToken
        }
        modifierRestaurantId
        owner
        createdAt
        updatedAt
      }
      owner
      createdAt
      updatedAt
    }
  }
`;
export const createModifier = /* GraphQL */ `
  mutation CreateModifier(
    $input: CreateModifierInput!
    $condition: ModelModifierConditionInput
  ) {
    createModifier(input: $input, condition: $condition) {
      id
      name
      price
      soldOutDate
      soldOut
      modifierGroups {
        items {
          id
          displaySequence
          preSelectedQuantity
          modifierGroupModifierLinkModifierGroupId
          modifierGroupModifierLinkModifierId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      modifierRestaurantId
      owner
      createdAt
      updatedAt
    }
  }
`;
export const updateModifier = /* GraphQL */ `
  mutation UpdateModifier(
    $input: UpdateModifierInput!
    $condition: ModelModifierConditionInput
  ) {
    updateModifier(input: $input, condition: $condition) {
      id
      name
      price
      soldOutDate
      soldOut
      modifierGroups {
        items {
          id
          displaySequence
          preSelectedQuantity
          modifierGroupModifierLinkModifierGroupId
          modifierGroupModifierLinkModifierId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      modifierRestaurantId
      owner
      createdAt
      updatedAt
    }
  }
`;
export const deleteModifier = /* GraphQL */ `
  mutation DeleteModifier(
    $input: DeleteModifierInput!
    $condition: ModelModifierConditionInput
  ) {
    deleteModifier(input: $input, condition: $condition) {
      id
      name
      price
      soldOutDate
      soldOut
      modifierGroups {
        items {
          id
          displaySequence
          preSelectedQuantity
          modifierGroupModifierLinkModifierGroupId
          modifierGroupModifierLinkModifierId
          owner
          createdAt
          updatedAt
        }
        nextToken
      }
      modifierRestaurantId
      owner
      createdAt
      updatedAt
    }
  }
`;
export const createOrder = /* GraphQL */ `
  mutation CreateOrder(
    $input: CreateOrderInput!
    $condition: ModelOrderConditionInput
  ) {
    createOrder(input: $input, condition: $condition) {
      id
      status
      paid
      type
      number
      table
      notes
      total
      registerId
      products {
        id
        name
        price
        image {
          bucket
          region
          key
          identityPoolId
        }
        quantity
        notes
        category {
          id
          name
        }
        modifierGroups {
          id
          name
        }
      }
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
  }
`;
export const updateOrder = /* GraphQL */ `
  mutation UpdateOrder(
    $input: UpdateOrderInput!
    $condition: ModelOrderConditionInput
  ) {
    updateOrder(input: $input, condition: $condition) {
      id
      status
      paid
      type
      number
      table
      notes
      total
      registerId
      products {
        id
        name
        price
        image {
          bucket
          region
          key
          identityPoolId
        }
        quantity
        notes
        category {
          id
          name
        }
        modifierGroups {
          id
          name
        }
      }
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
  }
`;
export const deleteOrder = /* GraphQL */ `
  mutation DeleteOrder(
    $input: DeleteOrderInput!
    $condition: ModelOrderConditionInput
  ) {
    deleteOrder(input: $input, condition: $condition) {
      id
      status
      paid
      type
      number
      table
      notes
      total
      registerId
      products {
        id
        name
        price
        image {
          bucket
          region
          key
          identityPoolId
        }
        quantity
        notes
        category {
          id
          name
        }
        modifierGroups {
          id
          name
        }
      }
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
  }
`;
export const createVerifoneTransactionLog = /* GraphQL */ `
  mutation CreateVerifoneTransactionLog(
    $input: CreateVerifoneTransactionLogInput!
    $condition: ModelVerifoneTransactionLogConditionInput
  ) {
    createVerifoneTransactionLog(input: $input, condition: $condition) {
      id
      transactionId
      merchantId
      amount
      type
      payload
      restaurantId
      timestampEpoch
      createdAt
      updatedAt
    }
  }
`;
export const updateVerifoneTransactionLog = /* GraphQL */ `
  mutation UpdateVerifoneTransactionLog(
    $input: UpdateVerifoneTransactionLogInput!
    $condition: ModelVerifoneTransactionLogConditionInput
  ) {
    updateVerifoneTransactionLog(input: $input, condition: $condition) {
      id
      transactionId
      merchantId
      amount
      type
      payload
      restaurantId
      timestampEpoch
      createdAt
      updatedAt
    }
  }
`;
export const deleteVerifoneTransactionLog = /* GraphQL */ `
  mutation DeleteVerifoneTransactionLog(
    $input: DeleteVerifoneTransactionLogInput!
    $condition: ModelVerifoneTransactionLogConditionInput
  ) {
    deleteVerifoneTransactionLog(input: $input, condition: $condition) {
      id
      transactionId
      merchantId
      amount
      type
      payload
      restaurantId
      timestampEpoch
      createdAt
      updatedAt
    }
  }
`;
