import React, { useState } from "react";
import { Space6 } from "../../tabin/components/spaces";
import { toast } from "../../tabin/components/toast";
import { useRegister } from "../../context/register-context";
import { Separator4 } from "../../tabin/components/separator";
import { ButtonV2 } from "../../tabin/components/buttonv2";
import { Title2Font } from "../../tabin/components/fonts";
import { useHistory } from "react-router-dom";
import { beginOrderPath } from "../main";
import { useRestaurant } from "../../context/restaurant-context";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";

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
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "column",
                    padding: "48px",
                }}
            >
                <div style={{ width: "500px" }}>
                    <Title2Font>Select a register to use</Title2Font>
                    <Space6 />
                    {restaurant.registers.items.map((reg, index) => (
                        <>
                            {index != 0 && <Separator4 />}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>{reg.name}</div>
                                {register && register.id == reg.id ? (
                                    <>
                                        <ButtonV2
                                            onClick={() => {
                                                onDisconnect(reg.id);
                                            }}
                                        >
                                            {"Disconnect"}
                                        </ButtonV2>
                                    </>
                                ) : (
                                    <>
                                        <ButtonV2
                                            disabled={reg.active}
                                            onClick={() => {
                                                onConnect(reg.id);
                                            }}
                                        >
                                            {reg.active ? "Unavailable" : "Use"}
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
