import React, { useState } from "react";
import { toast } from "../../tabin/components/toast";
import { useRegister } from "../../context/register-context";
import { useHistory } from "react-router-dom";
import { beginOrderPath } from "../main";
import { useRestaurant } from "../../context/restaurant-context";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { Button } from "../../tabin/components/button";

import "./registerList.scss";

export const RegisterList = () => {
    const history = useHistory();
    const { restaurant } = useRestaurant();
    const { register, connectRegister, disconnectRegister } = useRegister();
    const [showFullScreenSpinner, setShowFullScreenSpinner] = useState(false);

    if (!restaurant) return <div>This user has not selected any restaurant.</div>;

    const onConnect = async (key: string) => {
        try {
            setShowFullScreenSpinner(true);

            await connectRegister(key);

            setShowFullScreenSpinner(false);
            history.replace(beginOrderPath);
        } catch (e) {
            setShowFullScreenSpinner(false);
            toast.error(e);
        }
    };

    const onDisconnect = async (key: string) => {
        try {
            setShowFullScreenSpinner(true);

            await disconnectRegister(key);
        } catch (e) {
            toast.error(e);
        } finally {
            setShowFullScreenSpinner(false);
        }
    };

    return (
        <>
            {showFullScreenSpinner && <FullScreenSpinner show={true} />}
            <div className="register-list">
                <div className="h2 mb-6">Select a register to use</div>
                {restaurant.registers.items.map((reg, index) => (
                    <>
                        {index != 0 && <div className="separator-4"></div>}
                        <div className="register-list-item">
                            <div>{reg.name}</div>
                            {register && register.id == reg.id ? (
                                <>
                                    <Button
                                        onClick={() => {
                                            onDisconnect(reg.id);
                                        }}
                                    >
                                        Disconnect
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        disabled={reg.active}
                                        onClick={() => {
                                            onConnect(reg.id);
                                        }}
                                    >
                                        {reg.active ? "Unavailable" : "Use"}
                                    </Button>
                                </>
                            )}
                        </div>
                    </>
                ))}
            </div>
        </>
    );
};
