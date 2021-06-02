import React, { useEffect, useState } from "react";
import { useUser } from "./user-context";
import { IGET_RESTAURANT, IGET_USER_RESTAURANT } from "../graphql/customQueries";
import { useGetRestaurantQuery } from "../hooks/useGetRestaurantQuery";

type ContextProps = {
    selectRestaurant: (id: string | null) => void;
    userRestaurants: IGET_USER_RESTAURANT[] | null;
    restaurant: IGET_RESTAURANT | null;
    setRestaurant: (restaurant: IGET_RESTAURANT) => void;
    isLoading: boolean;
    isError: boolean;
};

const RestaurantContext = React.createContext<ContextProps>({
    selectRestaurant: (id: string | null) => {},
    userRestaurants: null,
    restaurant: null,
    setRestaurant: () => {},
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
                            href={
                                "https://d2nmoln0sb0cri.cloudfront.net/protected/ap-southeast-2:c487e089-90ac-44dc-b07e-15913b161eae/2021-05-02_00:01:27.858-test.css"
                            }
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
                    isLoading: false,
                    isError: false,
                }}
                children={props.children}
            />
        );
    }
};

const useRestaurant = () => {
    const context = React.useContext(RestaurantContext);
    if (context === undefined) {
        throw new Error(`useRestaurant must be used within a RestaurantProvider`);
    }
    return context;
};

export { RestaurantProvider, useRestaurant };
