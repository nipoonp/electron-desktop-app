import { useLazyQuery } from "@apollo/client";
import { GET_RESTAURANT_AVAILABILITY } from "../graphql/customQueries";
import { ICartProduct } from "../model/model";

type AvailabilityCheckResult = {
    soldOutItems: string[];
    productsToRemove: number[];
    productsToUpdate: { index: number; product: ICartProduct }[];
};

export const useCheckConditionsBeforeCreateOrder = () => {
    const [getRestaurantLatest] = useLazyQuery(GET_RESTAURANT_AVAILABILITY, {
        fetchPolicy: "network-only",
    });

    const checkConditionsBeforeCreateOrder = async (
        restaurantId: string,
        products: ICartProduct[] | null,
    ): Promise<AvailabilityCheckResult> => {
        const { data: restaurantData } = await getRestaurantLatest({
            variables: { restaurantId: restaurantId },
        });
        if (!restaurantData || !restaurantData.getRestaurant || !products) {
            return { soldOutItems: [], productsToRemove: [], productsToUpdate: [] };
        }

        const latestRestaurant = restaurantData.getRestaurant;
        const soldOutItems: string[] = [];
        const productsToRemove: number[] = [];
        const productsToUpdate: { index: number; product: ICartProduct }[] = [];

        for (let index = 0; index < products.length; index++) {
            const cartProduct = products[index];
            let updatedProduct: ICartProduct | null = null;

            const addSoldOutItem = (name: string) => {
                if (!soldOutItems.includes(name)) soldOutItems.push(name);
            };

            const markProductForRemoval = () => {
                if (!productsToRemove.includes(index)) productsToRemove.push(index);
            };

            const ensureUpdatedProduct = () => {
                if (!updatedProduct) {
                    updatedProduct = JSON.parse(JSON.stringify(cartProduct)) as ICartProduct;
                }
                return updatedProduct;
            };

            if (!cartProduct.category) {
                addSoldOutItem(cartProduct.name);
                markProductForRemoval();
                continue;
            }

            const category = latestRestaurant.categories.items.find((c) => c.id === cartProduct.category!.id);
            if (!category) {
                addSoldOutItem(cartProduct.name);
                markProductForRemoval();
                continue;
            }

            const productItem = category.products.items.find((p) => p.product.id === cartProduct.id);
            if (!productItem) {
                addSoldOutItem(cartProduct.name);
                markProductForRemoval();
                continue;
            }

            const product = productItem.product;
            const productAvailableQuantity = product.soldOut ? 0 : product.totalQuantityAvailable;
            if (product.soldOut || (productAvailableQuantity !== null && productAvailableQuantity < cartProduct.quantity)) {
                addSoldOutItem(product.name);
                if (productAvailableQuantity !== null && productAvailableQuantity > 0) {
                    const productCopy = ensureUpdatedProduct();
                    productCopy.quantity = productAvailableQuantity;
                } else {
                    markProductForRemoval();
                    continue;
                }
            }

            for (const mg of cartProduct.modifierGroups) {
                for (const m of mg.modifiers) {
                    const modifierGroupItem = product.modifierGroups.items.find((mgItem) => mgItem.modifierGroup.id === mg.id);
                    if (!modifierGroupItem) {
                        addSoldOutItem(m.name);
                        markProductForRemoval();
                        continue;
                    }

                    const modifierItem = modifierGroupItem.modifierGroup.modifiers.items.find((modItem) => modItem.modifier.id === m.id);
                    if (!modifierItem) {
                        addSoldOutItem(m.name);
                        markProductForRemoval();
                        continue;
                    }

                    const modifier = modifierItem.modifier;
                    const modifierAvailableQuantity = modifier.soldOut ? 0 : modifier.totalQuantityAvailable;
                    if (modifier.soldOut || (modifierAvailableQuantity !== null && modifierAvailableQuantity < m.quantity)) {
                        addSoldOutItem(modifier.name);
                        const productCopy = ensureUpdatedProduct();
                        const updatedGroup = productCopy.modifierGroups.find((g) => g.id === mg.id);
                        if (!updatedGroup) {
                            markProductForRemoval();
                            continue;
                        }
                        updatedGroup.modifiers = updatedGroup.modifiers.filter((mod) => mod.id !== m.id);
                        const remainingQuantity = updatedGroup.modifiers.reduce((sum, mod) => sum + mod.quantity, 0);
                        const choiceMin = modifierGroupItem.modifierGroup.choiceMin;
                        if (choiceMin && remainingQuantity < choiceMin) {
                            markProductForRemoval();
                        }
                    }
                }
            }

            if (updatedProduct && !productsToRemove.includes(index)) {
                productsToUpdate.push({ index, product: updatedProduct });
            }
        }

        return { soldOutItems, productsToRemove, productsToUpdate };
    };

    return { checkConditionsBeforeCreateOrder };
};
