import React from "react";
import { Space6 } from "../../tabin/components/spaces";
import { Separator4 } from "../../tabin/components/separator";
import { ButtonV2 } from "../../tabin/components/buttonv2";
import { Title2Font } from "../../tabin/components/fonts";
import { useHistory } from "react-router-dom";
import { useRestaurant } from "../../context/restaurant-context";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { beginOrderPath } from "../main";

export const RestaurantList = () => {
    const history = useHistory();
    const { selectRestaurant, userRestaurants } = useRestaurant();
    const storedSelectedRestaurantId = localStorage.getItem("selectedRestaurantId");

    if (!userRestaurants) return <FullScreenSpinner show={true} text={"Loading user"} />;

    const onDisconnect = () => {
        selectRestaurant(null);
    };

    const onConnect = async (restaurantId: string) => {
        selectRestaurant(restaurantId);
        history.push(beginOrderPath);
    };

    if (userRestaurants.length == 1) {
        onConnect(userRestaurants[0].id);
    }
    return (
        <>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "column",
                    padding: "48px",
                }}
            >
                <div style={{ width: "500px" }}>
                    <Title2Font>Select a restaurant to access</Title2Font>
                    <Space6 />
                    {userRestaurants.map((restaurant, index) => (
                        <>
                            {index != 0 && <Separator4 />}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>{restaurant.name}</div>
                                {storedSelectedRestaurantId == restaurant.id ? (
                                    <>
                                        <ButtonV2
                                            onClick={() => {
                                                onDisconnect();
                                            }}
                                        >
                                            {"Disconnect"}
                                        </ButtonV2>
                                    </>
                                ) : (
                                    <>
                                        <ButtonV2
                                            onClick={() => {
                                                onConnect(restaurant.id);
                                            }}
                                        >
                                            {"Use"}
                                        </ButtonV2>
                                    </>
                                )}
                            </div>
                        </>
                    ))}
                </div>
            </div>
        </>
    );
};
