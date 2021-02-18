import React, { useState } from "react";
import { Space4, Space6 } from "../../tabin/components/spaces";
import { useHistory } from "react-router";
import { Button } from "../../tabin/components/button";
import { toast } from "../../tabin/components/toast";
import Input from "../../tabin/components/input";
import { useUser } from "../../context/user-context";
import { useRegister } from "../../context/register-context";
import { HomeNav } from "../nav/homeNav";
import { isMobile } from "react-device-detect";
import { Separator, Separator4 } from "../../tabin/components/separator";
import { ButtonV2 } from "../../tabin/components/buttonv2";
import { Title2Font, Title3Font } from "../../tabin/components/fonts";

export const RegisterList = () => {
  const history = useHistory();
  const { user } = useUser();
  const { register, connectRegister, disconnectRegister } = useRegister();

  if (!user) {
    throw "User must log in!";
  }

  if (user.restaurants.items.length == 0) {
    return <div>This user is not an owner of any restaurants</div>;
  }

  const onConnect = async (key: string) => {
    try {
      await connectRegister(key);
      toast.success("Register connected successfully set.");
    } catch (e) {
      toast.error(e);
    }
  };

  const onDisconnect = async (key: string) => {
    try {
      await disconnectRegister(key);
      toast.success("Register disconnected successfully set.");
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <>
      <HomeNav />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          marginTop: "152px",
        }}
      >
        <div style={{ width: "500px" }}>
          <Title2Font>Select a register to use</Title2Font>
          <Space6 />
          {user.restaurants.items[0].registers.items.map((reg, index) => (
            <>
              {index != 0 && <Separator4 />}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>{reg.name}</div>
                {register && (register.id == reg.id) ? (
                  <>
                    <ButtonV2 onClick={() => {
                      onDisconnect(reg.id)
                    }}>{"Disconnect"}
                    </ButtonV2>
                  </>
                ) : (
                    <>
                      <ButtonV2 disabled={reg.active} onClick={() => {
                        onConnect(reg.id)
                      }}>{reg.active ? "Unavailable" : "Use"}
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
