import React, { useState } from "react";
import { Logger } from "aws-amplify";
import gql from "graphql-tag";
import { useMutation } from "react-apollo-hooks";
import { IOperatingHours } from "../model/model";
import { useUser } from "./user-context";
import { useAuth } from "./auth-context";
import { IS3Image } from "../graphql/customQueries";

const logger = new Logger("CreateRestaurantContext");

// API
const CREATE_RESTAURANT = gql`
  mutation CreateRestaurant(
    $restaurantManagerId: ID!
    $name: String!
    $description: String
    $image: S3ObjectInput
    $operatingHours: OperatingHoursInput!
    $location: LocationInput!
    $address: AddressInput!
    $owner: ID
  ) {
    createRestaurant(
      input: {
        name: $name
        description: $description
        image: $image
        address: $address
        _geoloc: $location
        verified: false
        isAcceptingOrders: false
        operatingHours: $operatingHours
        restaurantManagerId: $restaurantManagerId
        owner: $owner
      }
    ) {
      id
      name
      owner
    }
  }
`;

// CONTEXT
type ContextProps = {
  create: () => Promise<any>;
  saveRestaurantManagerId: (restaurantManagerId: string) => void;
  restaurantManagerId: string;
  saveName: (name: string) => void;
  name: string;
  saveDescription: (description: string | null) => void;
  description: string | null;
  saveOperatingHours: (operatingHours: IOperatingHours) => void;
  operatingHours: IOperatingHours | null;
  saveImage: (image: IS3Image | null) => void;
  image: IS3Image | null;
  saveAddress: (address: {
    formattedAddress: string;
    aptSuite: string | null;
  }) => void;
  address: {
    formattedAddress: string;
    aptSuite: string | null;
  };
  saveLocation: (location: { lat: number; lng: number }) => void;
  location: { lat: number; lng: number } | null;
};

// INITIAL VALUES
const CreateRestaurantContext = React.createContext<ContextProps>({
  create: () => {
    return new Promise(() => { });
  },
  saveRestaurantManagerId: (name: string) => { },
  restaurantManagerId: "",
  saveName: (name: string) => { },
  name: "",
  saveDescription: (description: string | null) => { },
  description: "",
  saveOperatingHours: (operatingHours: IOperatingHours) => { },
  operatingHours: null,
  saveImage: (image: IS3Image | null) => { },
  image: null,
  saveAddress: (address: {
    formattedAddress: string;
    aptSuite: string | null;
  }) => { },
  address: {
    formattedAddress: "",
    aptSuite: null,
  },
  saveLocation: (location: { lat: number; lng: number }) => { },
  location: null
});

// EXPORTS
const CreateRestaurantProvider = (props: ICreateRestaurantProviderProps) => {
  const [name, setName] = useState("");
  const [restaurantManagerId, setRestaurantManagerId] = useState("");
  const [description, setDescription] = useState<string | null>(null);
  const [operatingHours, setOperatingHours] = useState<IOperatingHours | null>(
    null
  );
  const [image, setImage] = useState<IS3Image | null>(null);
  const [formattedAddress, setFormattedAddress] = useState("");
  const [aptSuite, setAptSuite] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const { user } = useUser();
  const { isAdmin } = useAuth();

  if (user === null) {
    throw "Create Restaurant Provider must be used only when user is logged in";
  }

  // Private
  const createRestaurant = useMutation(CREATE_RESTAURANT, {
    update: (proxy, mutationResult) => {
      logger.debug("mutation result: ", mutationResult);
    },
  });

  // Public

  // TODO: save all these to cache
  const saveRestaurantManagerId = (restaurantManagerId: string) => {
    logger.debug("Saving restaurantManagerId");
    setRestaurantManagerId(restaurantManagerId);
  };

  const saveName = (name: string) => {
    logger.debug("Saving name");
    setName(name);
  };

  const saveDescription = (description: string | null) => {
    logger.debug("Saving description");
    setDescription(description);
  };

  const saveOperatingHours = (operatingHours: IOperatingHours) => {
    logger.debug("Saving operating hours");
    setOperatingHours(operatingHours);
  };

  const saveImage = (image: IS3Image | null) => {
    logger.debug("Saving image");
    setImage(image);
  };

  const saveAddress = (address: {
    formattedAddress: string;
    aptSuite: string | null;
  }) => {
    logger.debug("Saving address", address);
    setFormattedAddress(address.formattedAddress);
    setAptSuite(address.aptSuite);
  };

  const saveLocation = (location: { lat: number; lng: number }) => {
    logger.debug("Saving location: ", location);
    setLocation(location);
  };

  const create = () => {
    logger.debug("Creating restaurant..");
    if (name === "") {
      throw "Name cannot be empty";
    }

    if (operatingHours === null) {
      throw "OperatingHours cannot be empty";
    }

    if (formattedAddress === "") {
      throw "Address cannot be empty";
    }

    if (!location) {
      throw "Location cannot be empty";
    }

    let variables = {
      restaurantManagerId: isAdmin && restaurantManagerId ? restaurantManagerId : user.id,
      name: name,
      description: description,
      image: image,
      operatingHours: operatingHours,
      location: location,
      address: {
        formattedAddress: formattedAddress,
        aptSuite: aptSuite,
      },
      owner: isAdmin && restaurantManagerId ? restaurantManagerId : "",
    };

    if (!variables.owner) {
      delete variables.owner;
    }

    return createRestaurant({
      variables: variables,
    });
  };

  return (
    <CreateRestaurantContext.Provider
      value={{
        create,
        restaurantManagerId,
        saveRestaurantManagerId,
        saveName,
        name,
        saveDescription,
        description,
        saveOperatingHours,
        operatingHours,
        saveImage,
        image,
        saveAddress,
        address: {
          formattedAddress: formattedAddress,
          aptSuite: aptSuite,
        },
        saveLocation,
        location,
      }}
      children={props.children}
    />
  );
};

interface ICreateRestaurantProviderProps {
  children: React.ReactNode;
}

const useCreateRestaurant = () => {
  const context = React.useContext(CreateRestaurantContext);

  if (context === undefined) {
    throw new Error(
      `useCreateRestaurant must be used within a CreateRestaurantProvider`
    );
  }

  return context;
};

export { CreateRestaurantProvider, useCreateRestaurant };

// Usage example

// import React from "react";
// import { Logger } from "aws-amplify";
// import {
//   CreateRestaurantProvider,
//   useCreateRestaurant
// } from "../../../context/createRestaurant-context";
// import { IOperatingHours } from "../../../model/model";

// const logger = new Logger("Test");

// const C = () => {
//   const {
//     saveName,
//     saveDescription,
//     saveAddress,
//     saveLocation,
//     saveOperatingHours,
//     saveImage,
//     create
//   } = useCreateRestaurant();

//   const onClick = () => {
//     logger.debug("Clicked");
//     saveName("Hi");
//     saveDescription("Created from button");
//     saveAddress("test address", "test app");
//     saveLocation({ lat: 12, lng: 24 });
//     let operatingHours: any = {
//       sunday: [
//         {
//           openingTime: "09:00",
//           closingTime: "17:00"
//         }
//       ],
//       monday: [
//         {
//           openingTime: "09:00",
//           closingTime: "17:00"
//         }
//       ],
//       tuesday: [
//         {
//           openingTime: "09:00",
//           closingTime: "17:00"
//         }
//       ],
//       wednesday: [
//         {
//           openingTime: "09:00",
//           closingTime: "17:00"
//         }
//       ],
//       thursday: [
//         {
//           openingTime: "09:00",
//           closingTime: "17:00"
//         }
//       ],
//       friday: [
//         {
//           openingTime: "09:00",
//           closingTime: "17:00"
//         }
//       ],
//       saturday: [
//         {
//           openingTime: "09:00",
//           closingTime: "17:00"
//         }
//       ]
//     };

//     saveOperatingHours(operatingHours);
//     try {
//       create()
//         .then(() => {
//           alert("Test New Restaurant created");
//         })
//         .catch(e => {
//           logger.error("Test Error: ", e);
//         });
//     } catch (e) {
//       logger.error("Test Error: ", e);
//     }
//   };

//   return (
//     <button
//       onClick={onClick}
//       style={{ padding: "10px", border: "1px solid black" }}
//     >
//       Hi
//     </button>
//   );
// };

// export default () => {
//   return (
//     <CreateRestaurantProvider>
//       <C />
//     </CreateRestaurantProvider>
//   );
// };
