import { useState, useEffect, createContext, useContext } from "react";

import { useUser } from "./user-context";
import {
    IGET_RESTAURANT,
    IGET_RESTAURANT_CATEGORY,
    IGET_RESTAURANT_MODIFIER,
    IGET_RESTAURANT_MODIFIER_GROUP,
    IGET_RESTAURANT_PRODUCT,
    IGET_USER_RESTAURANT,
} from "../graphql/customQueries";
import { useGetRestaurantQuery } from "../hooks/useGetRestaurantQuery";
import { getCloudFrontDomainName } from "../private/aws-custom";

interface IMENU_CATEGORIES {
    [index: string]: IGET_RESTAURANT_CATEGORY;
}

interface IMENU_PRODUCTS {
    [index: string]: IGET_RESTAURANT_PRODUCT;
}

interface IMENU_MODIFIER_GROUPS {
    [index: string]: IGET_RESTAURANT_MODIFIER_GROUP;
}

interface IMENU_MODIFIERS {
    [index: string]: IGET_RESTAURANT_MODIFIER;
}

type ContextProps = {
    selectRestaurant: (id: string | null) => void;
    userRestaurants: IGET_USER_RESTAURANT[] | null;
    restaurant: IGET_RESTAURANT | null;
    setRestaurant: (restaurant: IGET_RESTAURANT) => void;
    restaurantProductImages: any;
    menuCategories: IMENU_CATEGORIES;
    menuProducts: IMENU_PRODUCTS;
    menuModifierGroups: IMENU_MODIFIER_GROUPS;
    menuModifiers: IMENU_MODIFIERS;
    isLoading: boolean;
    isError: boolean;
};

const RestaurantContext = createContext<ContextProps>({
    selectRestaurant: (id: string | null) => {},
    userRestaurants: null,
    restaurant: null,
    setRestaurant: () => {},
    restaurantProductImages: {},
    menuCategories: {},
    menuProducts: {},
    menuModifierGroups: {},
    menuModifiers: {},
    isLoading: true,
    isError: false,
});

const C = (props: {
    restaurantId: string;
    userRestaurants: IGET_USER_RESTAURANT[] | null;
    selectRestaurant: (id: string | null) => void;
    children: React.ReactNode;
}) => {
    const [restaurant, setRestaurant] = useState<IGET_RESTAURANT | null>(null);
    const [menuCategories, setMenuCategories] = useState<IMENU_CATEGORIES>({});
    const [menuProducts, setMenuProducts] = useState<IMENU_PRODUCTS>({});
    const [menuModifierGroups, setMenuModifierGroups] = useState<IMENU_MODIFIER_GROUPS>({});
    const [menuModifiers, setMenuModifiers] = useState<IMENU_MODIFIERS>({});
    const [restaurantLoading, setRestaurantLoading] = useState<boolean>(false);
    const [restaurantError, setRestaurantError] = useState<boolean>(false);
    const { data: getRestaurantData, error: getRestaurantError, loading: getRestaurantLoading } = useGetRestaurantQuery(props.restaurantId);
    const restaurantProductImages = {};

    useEffect(() => {
        setRestaurant(getRestaurantData);
        setRestaurantLoading(getRestaurantLoading);
        setRestaurantError(getRestaurantError ? true : false);

        const categories: IMENU_CATEGORIES = {};
        const products: IMENU_PRODUCTS = {};
        const modifierGroups: IMENU_MODIFIER_GROUPS = {};
        const modifiers: IMENU_MODIFIERS = {};

        const processProduct = (product) => {
            if (!products[product.id]) products[product.id] = product;

            if (!product.modifierGroups) return;
            product.modifierGroups.items.forEach((pmgLink) => {
                const modifierGroup = pmgLink.modifierGroup;

                if (!modifierGroups[modifierGroup.id]) modifierGroups[modifierGroup.id] = modifierGroup;

                if (!modifierGroup.modifiers) return;
                modifierGroup.modifiers.items.forEach((mgmLink) => {
                    const modifier = mgmLink.modifier;

                    if (!modifiers[modifier.id]) modifiers[modifier.id] = modifier;

                    if (modifier.productModifier) processProduct(modifier.productModifier);
                });
            });
        };

        if (getRestaurantData) {
            getRestaurantData.categories.items.forEach((category) => {
                if (!categories[category.id]) categories[category.id] = category;

                if (!category.products) return;
                category.products.items.forEach((cpLink) => {
                    processProduct(cpLink.product);
                });
            });

            setMenuCategories(categories);
            setMenuProducts(products);
            setMenuModifierGroups(modifierGroups);
            setMenuModifiers(modifiers);
        }
    }, [getRestaurantData, getRestaurantLoading, getRestaurantError]);

    const _setRestaurant = (newRestaurant: IGET_RESTAURANT | null) => {
        setRestaurant(newRestaurant);
    };

    return (
        <RestaurantContext.Provider
            value={{
                selectRestaurant: props.selectRestaurant,
                userRestaurants: props.userRestaurants,
                restaurant: restaurant,
                setRestaurant: _setRestaurant,
                restaurantProductImages: restaurantProductImages,
                menuCategories: menuCategories,
                menuProducts: menuProducts,
                menuModifierGroups: menuModifierGroups,
                menuModifiers: menuModifiers,
                isLoading: restaurantLoading,
                isError: restaurantError,
            }}
            children={
                <>
                    {props.children}
                    {restaurant && restaurant.customStyleSheet && (
                        <link
                            rel="stylesheet"
                            type="text/css"
                            href={`${getCloudFrontDomainName()}/protected/${restaurant.customStyleSheet.identityPoolId}/${
                                restaurant.customStyleSheet.key
                            }`}
                        />
                    )}
                </>
            }
        />
    );
};

const RestaurantProvider = (props: { children: React.ReactNode }) => {
    const [userRestaurants, setUserRestaurants] = useState<IGET_USER_RESTAURANT[] | null>(null);
    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

    const { user } = useUser();

    useEffect(() => {
        if (user) {
            setUserRestaurants(user.restaurants.items);
        } else {
            setUserRestaurants(null);
        }
    }, [user]);

    useEffect(() => {
        const storedSelectedRestaurantId = localStorage.getItem("selectedRestaurantId");
        selectRestaurant(storedSelectedRestaurantId);
    }, [userRestaurants]);

    const selectRestaurant = (id: string | null) => {
        if (!id) {
            setSelectedRestaurantId(null);
            localStorage.removeItem("selectedRestaurantId");
        }

        userRestaurants &&
            userRestaurants.forEach((userRestaurant) => {
                if (userRestaurant.id == id) {
                    setSelectedRestaurantId(id);
                    localStorage.setItem("selectedRestaurantId", id);
                }
            });
    };

    if (selectedRestaurantId) {
        return <C restaurantId={selectedRestaurantId} userRestaurants={userRestaurants} selectRestaurant={selectRestaurant} {...props} />;
    } else {
        return (
            <RestaurantContext.Provider
                value={{
                    selectRestaurant: selectRestaurant,
                    userRestaurants: userRestaurants,
                    restaurant: null,
                    setRestaurant: () => {},
                    restaurantProductImages: [],
                    menuCategories: {},
                    menuProducts: {},
                    menuModifierGroups: {},
                    menuModifiers: {},
                    isLoading: false,
                    isError: false,
                }}
                children={props.children}
            />
        );
    }
};

const useRestaurant = () => {
    const context = useContext(RestaurantContext);
    if (context === undefined) {
        throw new Error(`useRestaurant must be used within a RestaurantProvider`);
    }
    return context;
};

export { RestaurantProvider, useRestaurant };
