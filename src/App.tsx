import Amplify, { Auth } from "aws-amplify";
import awsconfig from "./aws-exports";
import Main from "./components/main";

import { CartProvider } from "./context/cart-context";

import { AuthProvider, useAuth, AuthenticationStatus } from "./context/auth-context";

import { UserProvider } from "./context/user-context";
import { SmartpayProvider } from "./context/smartpay-context";
import { VerifoneProvider } from "./context/verifone-context";
import { ReceiptPrinterProvider } from "./context/receiptPrinter-context";
import { RegisterProvider } from "./context/register-context";
import { ElectronProvider } from "./context/electron-context";
import { RestaurantProvider } from "./context/restaurant-context";
import { WindcaveProvider } from "./context/windcave-context";
import { ErrorLoggingProvider } from "./context/errorLogging-context";

import { ApolloClient, ApolloProvider, defaultDataIdFromObject, from, HttpLink, InMemoryCache, split } from "@apollo/client";
import { AUTH_TYPE, createAuthLink } from "aws-appsync-auth-link";
import { createSubscriptionHandshakeLink } from "aws-appsync-subscription-link";
import { SalesAnalyticsProvider } from "./context/salesAnalytics-context";

Amplify.configure(awsconfig);
Amplify.Logger.LOG_LEVEL = process.env.REACT_APP_LOG_LEVEL;

const httpLink = new HttpLink({
    uri: awsconfig.aws_appsync_graphqlEndpoint,
});

//https://github.com/awslabs/aws-mobile-appsync-sdk-js/pull/561#issuecomment-701696316

const cognitoDetails = {
    url: awsconfig.aws_appsync_graphqlEndpoint,
    auth: {
        type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
        jwtToken: async () => (await Auth.currentSession()).getIdToken().getJwtToken(),
    },
    region: awsconfig.aws_appsync_region,
};

const cognitoClient = new ApolloClient({
    cache: new InMemoryCache({
        dataIdFromObject: (obj) => {
            switch (obj.__typename) {
                case "OrderCategory":
                case "OrderProduct":
                case "OrderModifierGroup":
                case "OrderModifier":
                    let objCpy = JSON.parse(JSON.stringify(obj));
                    delete objCpy.id;
                    return defaultDataIdFromObject(objCpy);
                // return String(Math.random());
                default:
                    return defaultDataIdFromObject(obj); // fall back to default handling
            }
        },
    }),
    link: from([
        //@ts-ignore
        createAuthLink(cognitoDetails),
        split(
            (op) => {
                const { operation } = op.query.definitions[0] as any;

                if (operation === "subscription") {
                    return false;
                }

                return true;
            },
            httpLink,
            //@ts-ignore
            createSubscriptionHandshakeLink(cognitoDetails, httpLink)
        ),
    ]),
});

const iamDetails = {
    url: awsconfig.aws_appsync_graphqlEndpoint,
    auth: {
        type: AUTH_TYPE.AWS_IAM,
        credentials: () => Auth.currentCredentials(),
    },
    region: awsconfig.aws_appsync_region,
};

const iamClient = new ApolloClient({
    cache: new InMemoryCache(),
    link: from([
        //@ts-ignore
        createAuthLink(iamDetails),
        split(
            (op) => {
                const { operation } = op.query.definitions[0] as any;

                if (operation === "subscription") {
                    return false;
                }

                return true;
            },
            httpLink,
            //@ts-ignore
            createSubscriptionHandshakeLink(iamDetails, httpLink)
        ),
    ]),
});

const App = () => {
    const { user, status } = useAuth();

    switch (status) {
        case AuthenticationStatus.Loading:
            return <h1>App: Loading user</h1>;
        case AuthenticationStatus.SignedIn:
            return (
                <ApolloProvider client={cognitoClient}>
                    <ErrorLoggingProvider>
                        <UserProvider userID={user!.username}>
                            <RestaurantProvider>
                                <RegisterProvider>
                                    <ReceiptPrinterProvider>
                                        <CartProvider>
                                            <VerifoneProvider>
                                                <SmartpayProvider>
                                                    <WindcaveProvider>
                                                        <SalesAnalyticsProvider>
                                                            <Main />
                                                        </SalesAnalyticsProvider>
                                                    </WindcaveProvider>
                                                </SmartpayProvider>
                                            </VerifoneProvider>
                                        </CartProvider>
                                    </ReceiptPrinterProvider>
                                </RegisterProvider>
                            </RestaurantProvider>
                        </UserProvider>
                    </ErrorLoggingProvider>
                </ApolloProvider>
            );
        default:
            return (
                <ApolloProvider client={iamClient}>
                    <ErrorLoggingProvider>
                        <UserProvider userID={null}>
                            <CartProvider>
                                <Main />
                            </CartProvider>
                        </UserProvider>
                    </ErrorLoggingProvider>
                </ApolloProvider>
            );
    }
};

export default () => {
    return (
        <ElectronProvider>
            <AuthProvider>
                <App />
            </AuthProvider>
        </ElectronProvider>
    );
};
