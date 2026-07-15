import {
    IGET_RESTAURANT_ORDER_FRAGMENT,
    IGET_RESTAURANT_ORDER_MODIFIER_FRAGMENT,
    IGET_RESTAURANT_ORDER_MODIFIER_GROUP_FRAGMENT,
    IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT,
} from "../../../graphql/customFragments";
import { ICartModifier, ICartModifierGroup, ICartProduct } from "../../../model/model";

// Maps order modifier rows into cart modifiers so an existing running order can be edited in checkout.
const mapOrderModifiersToCartModifiers = (modifiers: IGET_RESTAURANT_ORDER_MODIFIER_FRAGMENT[] | null | undefined): ICartModifier[] =>
    (modifiers || []).map((modifier) => ({
        id: modifier.id,
        name: modifier.name,
        kitchenName: modifier.kitchenName,
        price: modifier.price,
        preSelectedQuantity: modifier.preSelectedQuantity,
        quantity: modifier.quantity,
        productModifiers: mapOrderProductsToCartProducts(modifier.productModifiers),
        image: modifier.image
            ? {
                  key: modifier.image.key,
                  bucket: modifier.image.bucket,
                  region: modifier.image.region,
                  identityPoolId: modifier.image.identityPoolId,
              }
            : null,
    }));

// Maps order modifier groups into cart modifier groups so nested customizations are preserved when resuming.
const mapOrderModifierGroupsToCartModifierGroups = (
    modifierGroups: IGET_RESTAURANT_ORDER_MODIFIER_GROUP_FRAGMENT[] | null | undefined,
): ICartModifierGroup[] =>
    (modifierGroups || []).map((modifierGroup) => ({
        id: modifierGroup.id,
        name: modifierGroup.name,
        kitchenName: modifierGroup.kitchenName,
        choiceDuplicate: modifierGroup.choiceDuplicate,
        choiceMin: modifierGroup.choiceMin,
        choiceMax: modifierGroup.choiceMax,
        hideForCustomer: modifierGroup.hideForCustomer || false,
        modifiers: mapOrderModifiersToCartModifiers(modifierGroup.modifiers),
    }));

// Maps order products into cart products so the user can continue a previously opened table order.
export const mapOrderProductsToCartProducts = (orderProducts: IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT[] | null | undefined): ICartProduct[] =>
    (orderProducts || []).map((product) => ({
        id: product.id,
        name: product.name,
        kitchenName: product.kitchenName,
        price: product.price,
        totalPrice: product.totalPrice,
        discount: product.discount,
        isAgeRescricted: product.isAgeRescricted,
        image: product.image
            ? {
                  key: product.image.key,
                  bucket: product.image.bucket,
                  region: product.image.region,
                  identityPoolId: product.image.identityPoolId,
              }
            : null,
        quantity: product.quantity,
        notes: product.notes,
        category: product.category
            ? {
                  id: product.category.id,
                  name: product.category.name,
                  kitchenName: product.category.kitchenName,
                  image: product.category.image
                      ? {
                            key: product.category.image.key,
                            bucket: product.category.image.bucket,
                            region: product.category.image.region,
                            identityPoolId: product.category.image.identityPoolId,
                        }
                      : null,
              }
            : null,
        modifierGroups: mapOrderModifierGroupsToCartModifierGroups(product.modifierGroups),
    }));

// Normalizes a cart product (and nested modifiers) to match GraphQL mutation input:
// removes UI/derived fields and drops null/empty optional objects that the API rejects.
export const sanitizeCartProductForMutationInput = (product: any) => {
    if (!product) return;

    if (!product.modifierGroups || product.modifierGroups.length === 0) delete product.modifierGroups;
    if (product.image == null) delete product.image;
    if (product.notes == null || product.notes === "") delete product.notes;
    if (product.category && product.category.image == null) delete product.category.image;
    delete product.isAgeRescricted;
    //isPriceEdited is cart-only state (marks a manual price override); not part of OrderProductInput
    delete product.isPriceEdited;

    (product.modifierGroups || []).forEach((modifierGroup: any) => {
        (modifierGroup.modifiers || []).forEach((modifier: any) => {
            if (modifier.image == null) delete modifier.image;
            if (!modifier.productModifiers || modifier.productModifiers.length === 0) {
                delete modifier.productModifiers;
                return;
            }
            modifier.productModifiers.forEach((nestedProductModifier: any) => sanitizeCartProductForMutationInput(nestedProductModifier));
        });
    });
};

// Clones product lines before sanitizing so UI/cart state is not mutated.
export const cloneAndSanitizeCartProducts = (products: ICartProduct[]) => {
    const clonedProducts = JSON.parse(JSON.stringify(products)) as ICartProduct[];
    clonedProducts.forEach((product) => sanitizeCartProductForMutationInput(product));
    return clonedProducts;
};

// Recomputes line totals from products + modifier deltas for order updates.
export const calculateCartProductsTotal = (products: ICartProduct[] | null) => {
    let totalPrice = 0;

    products &&
        products.forEach((product) => {
            let price = product.price - product.discount;

            product.modifierGroups.forEach((modifierGroup) => {
                modifierGroup.modifiers.forEach((modifier) => {
                    const changedQuantity = modifier.quantity - modifier.preSelectedQuantity;
                    if (changedQuantity > 0) price += modifier.price * changedQuantity;

                    if (modifier.productModifiers) {
                        modifier.productModifiers.forEach((productModifier) => {
                            productModifier.modifierGroups.forEach((productModifierGroup) => {
                                productModifierGroup.modifiers.forEach((productModifierModifier) => {
                                    const changedNestedQuantity = productModifierModifier.quantity - productModifierModifier.preSelectedQuantity;
                                    if (changedNestedQuantity > 0) price += productModifierModifier.price * changedNestedQuantity;
                                });
                            });
                        });
                    }
                });
            });

            totalPrice += price * product.quantity;
        });

    return totalPrice;
};

// Strips non-input fields (for example __typename) and unsupported keys before sending to GraphQL mutation input.
export const toOrderPaymentAmountsInput = (paymentAmounts: IGET_RESTAURANT_ORDER_FRAGMENT["paymentAmounts"]) => {
    if (!paymentAmounts) return undefined;

    const sanitized = {
        cash: typeof paymentAmounts.cash === "number" ? paymentAmounts.cash : undefined,
        eftpos: typeof paymentAmounts.eftpos === "number" ? paymentAmounts.eftpos : undefined,
        online: typeof paymentAmounts.online === "number" ? paymentAmounts.online : undefined,
        onAccount: typeof paymentAmounts.onAccount === "number" ? paymentAmounts.onAccount : undefined,
        uberEats: typeof paymentAmounts.uberEats === "number" ? paymentAmounts.uberEats : undefined,
        menulog: typeof paymentAmounts.menulog === "number" ? paymentAmounts.menulog : undefined,
        doordash: typeof paymentAmounts.doordash === "number" ? paymentAmounts.doordash : undefined,
        delivereasy: typeof paymentAmounts.delivereasy === "number" ? paymentAmounts.delivereasy : undefined,
    };

    return Object.values(sanitized).some((value) => typeof value === "number") ? sanitized : undefined;
};
