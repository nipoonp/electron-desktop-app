import React, { useEffect, useState } from "react";
import { Space6 } from "../../tabin/components/spaces";
import { Separator4 } from "../../tabin/components/separator";
import { ButtonV2 } from "../../tabin/components/buttonv2";
import { Title2Font } from "../../tabin/components/fonts";
import { useHistory } from "react-router-dom";
import { useRestaurant } from "../../context/restaurant-context";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { beginOrderPath } from "../main";
import { useRegister } from "../../context/register-context";
import { toast } from "../../tabin/components/toast";

export const RestaurantList = () => {
    const history = useHistory();
    const { restaurant, selectRestaurant, userRestaurants } = useRestaurant();
    const { register, disconnectRegister } = useRegister();
    const storedSelectedRestaurantId = localStorage.getItem("selectedRestaurantId");
    const [showFullScreenSpinner, setShowFullScreenSpinner] = useState(false);

    useEffect(() => {
        if (userRestaurants && userRestaurants.length == 1) {
            onConnect(userRestaurants[0].id);
        }
    }, [userRestaurants]);

    const onDisconnect = async () => {
        try {
            setShowFullScreenSpinner(true);

            if (register) {
                await disconnectRegister(register.id);
            }

            selectRestaurant(null);
        } catch (e) {
            toast.error(e);
        } finally {
            setShowFullScreenSpinner(false);
        }
    };

    const onConnect = async (restaurantId: string) => {
        selectRestaurant(restaurantId);
        history.push(beginOrderPath);
    };

    return (
        <>
            {!userRestaurants && <FullScreenSpinner show={true} text={"Loading user"} />}
            {showFullScreenSpinner && <FullScreenSpinner show={true} />}
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
                    {userRestaurants &&
                        userRestaurants.map((userRestaurant, index) => (
                            <>
                                {index != 0 && <Separator4 />}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>{userRestaurant.name}</div>
                                    {storedSelectedRestaurantId == userRestaurant.id ? (
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
                                                    onConnect(userRestaurant.id);
                                                }}
                                                disabled={restaurant ? true : false}
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
