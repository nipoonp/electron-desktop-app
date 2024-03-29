import { useState, useEffect, createContext, useContext } from "react";

import { useMutation } from "@apollo/client";
import { UPDATE_REGISTER_KEY } from "../graphql/customMutations";
import { ERegisterType, IGET_RESTAURANT_REGISTER } from "../graphql/customQueries";
import { getCloudFrontDomainName } from "../private/aws-custom";
import { useRestaurant } from "./restaurant-context";

type ContextProps = {
    register: IGET_RESTAURANT_REGISTER | null;
    isPOS: boolean | null;
    connectRegister: (key: string) => Promise<any>;
    disconnectRegister: (key: string) => Promise<any>;
};

const RegisterContext = createContext<ContextProps>({
    register: null,
    isPOS: false,
    connectRegister: (key: string) => {
        return new Promise(() => {});
    },
    disconnectRegister: (key: string) => {
        return new Promise(() => {});
    },
});

const RegisterProvider = (props: { children: React.ReactNode }) => {
    const [registerKey, _setRegisterKey] = useState<string | null>(null);
    const [register, setRegister] = useState<IGET_RESTAURANT_REGISTER | null>(null);
    const { restaurant } = useRestaurant();

    useEffect(() => {
        const storedRegisterKey = localStorage.getItem("registerKey");

        let matchingRegister: IGET_RESTAURANT_REGISTER | null = null;

        restaurant &&
            restaurant.registers.items.forEach((r) => {
                if (storedRegisterKey == r.id && r.active == true) {
                    matchingRegister = r;
                }
            });

        setRegister(matchingRegister);
    }, [restaurant, registerKey]);

    const [updateRegisterKeyMutation, { data, loading, error }] = useMutation(UPDATE_REGISTER_KEY, {
        update: (proxy, mutationResult) => {},
    });

    const connectRegister = (key: string) => {
        let keyValid = false;

        restaurant &&
            restaurant.registers.items.forEach((register) => {
                if (key == register.id && register.active == false) {
                    keyValid = true;
                }
            });

        if (keyValid) {
            localStorage.setItem("registerKey", key);
            _setRegisterKey(key);

            return updateRegisterKeyMutation({
                variables: {
                    id: key,
                    active: true,
                },
            });
        } else {
            throw "This register key is invalid or already in use. Please contact a Tabin representative.";
        }
    };

    const disconnectRegister = (key: string) => {
        localStorage.removeItem("registerKey");
        _setRegisterKey(null);

        return updateRegisterKeyMutation({
            variables: {
                id: key,
                active: false,
            },
        });
    };

    return (
        <RegisterContext.Provider
            value={{
                register: register,
                isPOS: register ? register.type == ERegisterType.POS : null,
                connectRegister: connectRegister,
                disconnectRegister: disconnectRegister,
            }}
            children={
                <>
                    {props.children}
                    {register && register.customStyleSheet && (
                        <link
                            rel="stylesheet"
                            type="text/css"
                            href={`${getCloudFrontDomainName()}/protected/${register.customStyleSheet.identityPoolId}/${
                                register.customStyleSheet.key
                            }`}
                        />
                    )}
                </>
            }
        />
    );
};

const useRegister = () => {
    const context = useContext(RegisterContext);
    if (context === undefined) {
        throw new Error(`useRegister must be used within a RegisterProvider`);
    }
    return context;
};

export { RegisterProvider, useRegister };
