import { createContext, useContext, useEffect, useState } from "react";
import { IGET_RESTAURANT, IGET_USER_RESTAURANT } from "../graphql/customQueries";
import { useGetRestaurantQuery } from "../hooks/useGetRestaurantQuery";
import { getCloudFrontDomainName } from "../private/aws-custom";
import { useUser } from "./user-context";

type ContextProps = {
    selectRestaurant: (id: string | null) => void;
    userRestaurants: IGET_USER_RESTAURANT[] | null;
    restaurant: IGET_RESTAURANT | null;
    setRestaurant: (restaurant: IGET_RESTAURANT) => void;
    restaurantProductImages: any;
    isLoading: boolean;
    isError: boolean;
};

const RestaurantContext = createContext<ContextProps>({
    selectRestaurant: (id: string | null) => {},
    userRestaurants: null,
    restaurant: null,
    setRestaurant: () => {},
    restaurantProductImages: {},
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
    const [restaurantLoading, setRestaurantLoading] = useState<boolean>(false);
    const [restaurantError, setRestaurantError] = useState<boolean>(false);
    const { data: getRestaurantData, error: getRestaurantError, loading: getRestaurantLoading } = useGetRestaurantQuery(props.restaurantId);
    const restaurantProductImages = {};

    useEffect(() => {
        setRestaurant(getRestaurantData);
        setRestaurantLoading(getRestaurantLoading);
        setRestaurantError(getRestaurantError ? true : false);
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
                if (userRestaurant.id === id) {
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
