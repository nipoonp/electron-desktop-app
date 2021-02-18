import React, { useState, useEffect } from "react";
import { useMutation } from "react-apollo-hooks";
import { UPDATE_REGISTER_KEY } from "../graphql/customMutations";
import { useUser } from "./user-context";
import { IGET_USER_RESTAURANT_REGISTER } from "../graphql/customQueries";

type ContextProps = {
  register: IGET_USER_RESTAURANT_REGISTER | null;
  connectRegister: (key: string) => Promise<any>;
  disconnectRegister: (key: string) => Promise<any>;
};

const RegisterContext = React.createContext<ContextProps>({
  register: null,
  connectRegister: (key: string) => {
    return new Promise(() => { });
  },
  disconnectRegister: (key: string) => {
    return new Promise(() => { });
  },
});

const RegisterProvider = (props: { children: React.ReactNode }) => {
  const [registerKey, _setRegisterKey] = useState<string | null>(null);
  const [
    register,
    setRegister,
  ] = useState<IGET_USER_RESTAURANT_REGISTER | null>(null);

  const { user } = useUser();

  useEffect(() => {
    const storedRegisterKey = localStorage.getItem("registerKey");

    let matchingRegister: IGET_USER_RESTAURANT_REGISTER | null = null;

    user &&
      user.restaurants.items.length > 0 &&
      user.restaurants.items[0].registers.items.forEach((r) => {
        if (storedRegisterKey == r.id && r.active == true) {
          matchingRegister = r;

          console.log(r);
        }
      });

    setRegister(matchingRegister);
  }, [user, registerKey]);

  const updateRegisterKeyMutation = useMutation(UPDATE_REGISTER_KEY, {
    update: (proxy, mutationResult) => { },
  });

  const connectRegister = (key: string) => {
    if (!user) throw "User is not valid";

    let keyValid = false;

    user.restaurants.items[0].registers.items.forEach((register) => {
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
        connectRegister: connectRegister,
        disconnectRegister: disconnectRegister,
      }}
      children={props.children}
    />
  );
};

const useRegister = () => {
  const context = React.useContext(RegisterContext);
  if (context === undefined) {
    throw new Error(`useRegister must be used within a RegisterProvider`);
  }
  return context;
};

export { RegisterProvider, useRegister };
