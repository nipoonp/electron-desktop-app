import React from "react";
import Amplify, { Auth } from "aws-amplify";
import awsconfig from "./aws-exports";
import Main from "./components/main";
// import { Elements } from "@stripe/react-stripe-js";
// import { loadStripe } from "@stripe/stripe-js";

import { CartProvider } from "./context/cart-context";
import { defaultDataIdFromObject } from "apollo-cache-inmemory";

import {
  AuthProvider,
  useAuth,
  AuthenticationStatus,
} from "./context/auth-context";

import AWSAppSyncClient, { AUTH_TYPE } from "aws-appsync";
import { ApolloProvider as A } from "react-apollo-hooks"; // TO REMOVE
// import { ApolloProvider } from "@apollo/react-hooks";
import { UserProvider } from "./context/user-context";
import { SmartpayProvider } from "./context/smartpay-context";
import { VerifoneProvider } from "./context/verifone-context";
import { ReceiptPrinterProvider } from "./context/receiptPrinter-context";
import { RegisterProvider } from "./context/register-context";
// import { GoogleMapsProvider } from "./context/google-maps-context";
// import { AlgoliaProvider } from "./context/algolia-context";
// import { LocationProvider } from "./context/location-context";

// Configure redirect url based on the environment
// awsconfig.oauth.redirectSignIn = process.env.REACT_APP_AUTH_REDIRECT_URL!;
// awsconfig.oauth.redirectSignOut = process.env.REACT_APP_AUTH_REDIRECT_URL!;

Amplify.configure(awsconfig);
Amplify.Logger.LOG_LEVEL = process.env.REACT_APP_LOG_LEVEL; // DEV

// https://aws-amplify.github.io/docs/js/api#client-initialization
// const cognitoClient = new AWSAppSyncClient({
//   url: awsconfig.aws_appsync_graphqlEndpoint,
//   region: awsconfig.aws_appsync_region,
//   auth: {
//     // cognito auth
//     // type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
//     type: awsconfig.aws_appsync_authenticationType,
//     jwtToken: async () =>
//       (await Auth.currentSession()).getIdToken().getJwtToken()

//     // apikey auth
//     // type: AUTH_TYPE.API_KEY,
//     // apiKey: awsconfig.aws_appsync_apiKey,

//     // iam auth
//     // type: AUTH_TYPE.AWS_IAM,
//     // credentials: () => Auth.currentCredentials(),
//   },
//   // https://aws-amplify.github.io/docs/js/api#complex-objects
//   complexObjectsCredentials: () => Auth.currentCredentials(),
//   // https://aws-amplify.github.io/docs/js/api#aws-appsync-multi-auth-1
//   offlineConfig: {
//     keyPrefix: "private"
//   }
// });

const cognitoClient = new AWSAppSyncClient({
  url: awsconfig.aws_appsync_graphqlEndpoint,
  region: awsconfig.aws_appsync_region,
  auth: {
    type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
    jwtToken: async () =>
      (await Auth.currentSession()).getIdToken().getJwtToken(),
  },
  complexObjectsCredentials: () => Auth.currentCredentials(),
  offlineConfig: {
    keyPrefix: "private",
  },
  disableOffline: true,
  // https://github.com/apollographql/apollo-client/issues/3234
  // https://www.apollographql.com/docs/react/api/react-apollo/
  // https://medium.com/@galen.corey/understanding-apollo-fetch-policies-705b5ad71980
  cacheOptions: {
    dataIdFromObject: (obj) => {
      switch (obj.__typename) {
        case "OrderedProduct":
        case "OrderedModifier":
          let objCpy = JSON.parse(JSON.stringify(obj));
          delete objCpy.id;
          return defaultDataIdFromObject(objCpy);
        // return String(Math.random());
        default:
          return defaultDataIdFromObject(obj); // fall back to default handling
      }
    },
  },
});

const iamClient = new AWSAppSyncClient({
  url: awsconfig.aws_appsync_graphqlEndpoint,
  region: awsconfig.aws_appsync_region,
  auth: {
    // iam auth
    type: AUTH_TYPE.AWS_IAM,
    credentials: () => Auth.currentCredentials(),
  },
  offlineConfig: {
    keyPrefix: "public",
  },
  disableOffline: true,
  cacheOptions: {
    dataIdFromObject: (obj) => {
      switch (obj.__typename) {
        case "OrderedProduct":
        case "OrderedModifier":
          let objCpy = JSON.parse(JSON.stringify(obj));
          delete objCpy.id;
          return defaultDataIdFromObject(objCpy);
        // return String(Math.random());
        default:
          return defaultDataIdFromObject(obj); // fall back to default handling
      }
    },
  },
});

const App = () => {
  const { user, status } = useAuth();

  switch (status) {
    case AuthenticationStatus.Loading:
      return <h1>App: Loading user</h1>;
    case AuthenticationStatus.SignedIn:
      return (
        <A client={cognitoClient}>
          {/* <ApolloProvider client={cognitoClient}> */}
          {/* Needs to be inside apollo */}
          {/* Needs to be in both logged in and not logged in */}
          {/* Otherwise other things will get complicated */}
          <UserProvider userID={user!.username}>
            {/* <UserModel /> */}
            {/* <Main /> */}
            <RegisterProvider>
              <CartProvider>
                <ReceiptPrinterProvider>
                  <VerifoneProvider>
                    <SmartpayProvider>
                      <Main />
                    </SmartpayProvider>
                  </VerifoneProvider>
                </ReceiptPrinterProvider>
              </CartProvider>
            </RegisterProvider>
          </UserProvider>
          {/* </ApolloProvider> */}
        </A>
      );
    default:
      return (
        <A client={iamClient}>
          {/* <ApolloProvider client={iamClient}> */}
          <UserProvider userID={null}>
            <CartProvider>
              <Main />
            </CartProvider>
          </UserProvider>
          {/* </ApolloProvider> */}
        </A>
      );
  }
};

// To best leverage Stripe’s advanced fraud functionality, include Stripe.js on every page on your site,
// not just the checkout page. Including the script on every page allows Stripe to detect anomalous behavior
// that may be indicative of fraud as users browse your website.

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
// const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_KEY!);

export default () => {
  return (
    <AuthProvider>
      {/* <Elements stripe={stripePromise}> */}
      {/* <LocationProvider> */}
      {/* <GoogleMapsProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_KEY!}> */}
      {/* <AlgoliaProvider
              appID={process.env.REACT_APP_ALGOLIA_APP_ID!}
              publicKey={process.env.REACT_APP_ALGOLIA_PUBLIC_KEY!}
              restaurantIndexName={
                process.env.REACT_APP_ALGOLIA_RESTAURANT_INDEX!
              }
            > */}
      <App />
      {/* </AlgoliaProvider> */}
      {/* </GoogleMapsProvider> */}
      {/* </LocationProvider> */}
      {/* </Elements> */}
    </AuthProvider>
  );
};
