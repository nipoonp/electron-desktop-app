import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRestaurant } from "../../context/restaurant-context";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { beginOrderPath } from "../main";
import { useRegister } from "../../context/register-context";
import { toast } from "../../tabin/components/toast";
import { Button } from "../../tabin/components/button";

import "./restaurantList.scss";

export default () => {
    const navigate = useNavigate();
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
        navigate(beginOrderPath);
    };

    return (
        <>
            {!userRestaurants && <FullScreenSpinner show={true} text={"Loading user"} />}
            {showFullScreenSpinner && <FullScreenSpinner show={true} />}
            <div className="restaurant-list">
                <div className="h2 mb-6">Select a restaurant to access</div>
                {userRestaurants &&
                    userRestaurants.map((userRestaurant, index) => (
                        <div key={userRestaurant.id}>
                            {index != 0 && <div className="separator-4"></div>}
                            <div className="restaurant-list-item">
                                <div>{userRestaurant.name}</div>
                                {storedSelectedRestaurantId == userRestaurant.id ? (
                                    <>
                                        <Button
                                            onClick={() => {
                                                onDisconnect();
                                            }}
                                        >
                                            Disconnect
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            onClick={() => {
                                                onConnect(userRestaurant.id);
                                            }}
                                            disabled={restaurant ? true : false}
                                        >
                                            Use
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
            </div>
        </>
    );
};
