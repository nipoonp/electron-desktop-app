import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { checkoutPath, restaurantPath } from "../main";
import { useCart } from "../../context/cart-context";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { Button } from "../../tabin/components/button";
import { Input } from "../../tabin/components/input";
import { useRestaurant } from "../../context/restaurant-context";
import { useRegister } from "../../context/register-context";
import SignatureCanvas from "react-signature-canvas";

import "./customerInformation.scss";
import { FiX } from "react-icons/fi";
import { convertCentsToDollars, resizeBase64ImageToWidth } from "../../util/util";
import { ECustomCustomerFieldType, ELOYALTY_ACTION, IGET_LOYALTY_USER_CONTAINS_PHONE_NUMBER_EMAIL } from "../../graphql/customQueries";
import { useGetLoyaltyUsersContainsPhoneNumberLazyQuery } from "../../hooks/useGetLoyaltyUsersContainsPhoneNumberLazyQuery";
import { useGetLoyaltyUsersContainsEmailLazyQuery } from "../../hooks/useGetLoyaltyUsersContainsEmailLazyQuery";
import { useGetLoyaltyUsersContainsFirstNameLazyQuery } from "../../hooks/useGetLoyaltyUsersContainsFirstNameLazyQuery";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../../graphql/customFragments";

export default () => {
    const [searchView, setSearchView] = useState(true);
    const { customerInformation } = useCart();

    return (
        <div className="p-4">
            {searchView && !customerInformation ? <CustomerSearch onDisableSearchView={() => setSearchView(false)} /> : <UserInformationFields />}
        </div>
    );
};

const CustomerSearch = (props: { onDisableSearchView: () => void }) => {
    const navigate = useNavigate();
    const { restaurant } = useRestaurant();
    const { isPOS } = useRegister();
    const { customerInformation, setCustomerInformation, setCustomerLoyaltyPoints, setOnAccountOrders } = useCart();

    const [customerIdentifier, setCustomerIdentifier] = useState("");
    const [loyaltyUserRes, setLoyaltyUserRes] = useState<
        {
            firstName: string;
            lastName: string;
            email: string;
            phoneNumber: string;
            points: number;
            onAccountOrders: IGET_RESTAURANT_ORDER_FRAGMENT[];
            onAccountOrdersBalance: number;
        }[]
    >([]);

    const { getLoyaltyUsersContainsPhoneNumberLazyQuery } = useGetLoyaltyUsersContainsPhoneNumberLazyQuery(
        customerIdentifier,
        restaurant ? restaurant.id : ""
    );
    const { getLoyaltyUsersContainsEmailLazyQuery } = useGetLoyaltyUsersContainsEmailLazyQuery(customerIdentifier, restaurant ? restaurant.id : "");
    const { getLoyaltyUsersContainsFirstNameLazyQuery } = useGetLoyaltyUsersContainsFirstNameLazyQuery(
        customerIdentifier,
        restaurant ? restaurant.id : ""
    );

    if (restaurant == null) throw "Restaurant is invalid!";

    const onChangeCustomerIdentifier = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCustomerIdentifier(event.target.value);
    };

    const onClose = () => {
        if (isPOS) {
            navigate(`${restaurantPath}/${restaurant.id}`);
        } else {
            navigate(`${checkoutPath}`);
        }
    };

    const onSearch = async () => {
        let loyaltyUsers: IGET_LOYALTY_USER_CONTAINS_PHONE_NUMBER_EMAIL[] = [];

        // Helper to page through results until nextToken is null
        const fetchAllUsers = async (queryFn: Function, variables: Record<string, any>): Promise<IGET_LOYALTY_USER_CONTAINS_PHONE_NUMBER_EMAIL[]> => {
            const all: IGET_LOYALTY_USER_CONTAINS_PHONE_NUMBER_EMAIL[] = [];
            let nextToken: string | null | undefined = undefined;
            do {
                const res = await queryFn({
                    variables: {
                        ...variables,
                        nextToken,
                    },
                });
                const list = res?.data?.listLoyaltyUser;
                const items = list?.items || [];
                if (items.length) all.push(...items);
                nextToken = list?.nextToken;
            } while (nextToken);

            return all;
        };

        // Search by phone first across all pages
        const phoneResults = await fetchAllUsers(getLoyaltyUsersContainsPhoneNumberLazyQuery, {
            phoneNumber: customerIdentifier,
            loyaltyHistoryRestaurantId: restaurant.id,
        });
        if (phoneResults.length > 0) {
            loyaltyUsers = phoneResults;
        }

        // If no phone matches, search by email across all pages
        if (!loyaltyUsers || loyaltyUsers.length === 0) {
            const emailResults = await fetchAllUsers(getLoyaltyUsersContainsEmailLazyQuery, {
                email: customerIdentifier,
                loyaltyHistoryRestaurantId: restaurant.id,
            });
            if (emailResults.length > 0) loyaltyUsers = emailResults;
        }

        // If still nothing, search by first name across all pages
        if (!loyaltyUsers || loyaltyUsers.length === 0) {
            const firstNameResults = await fetchAllUsers(getLoyaltyUsersContainsFirstNameLazyQuery, {
                firstName: customerIdentifier,
                loyaltyHistoryRestaurantId: restaurant.id,
            });
            if (firstNameResults.length > 0) loyaltyUsers = firstNameResults;
        }

        let users: {
            firstName: string;
            lastName: string;
            email: string;
            phoneNumber: string;
            points: number;
            onAccountOrders: IGET_RESTAURANT_ORDER_FRAGMENT[];
            onAccountOrdersBalance: number;
        }[] = [];

        if (loyaltyUsers) {
            loyaltyUsers
                .filter((u) => u.loyaltyHistories.items.length > 0)
                .forEach((loyaltyUser) => {
                    let userPoints = 0;

                    loyaltyUser.loyaltyHistories.items.forEach((loyaltyUserHistory) => {
                        if (loyaltyUserHistory.action === ELOYALTY_ACTION.EARN) {
                            userPoints += loyaltyUserHistory.points;
                        } else if (loyaltyUserHistory.action === ELOYALTY_ACTION.REDEEM) {
                            userPoints -= loyaltyUserHistory.points;
                        }
                    });

                    const onAccountOrders = loyaltyUser.onAccountOrders?.items || [];

                    const balance = onAccountOrders.reduce((sum, order) => sum + order.subTotal, 0);

                    users.push({
                        firstName: loyaltyUser.firstName,
                        lastName: loyaltyUser.lastName,
                        email: loyaltyUser.email,
                        phoneNumber: loyaltyUser.phoneNumber,
                        points: userPoints,
                        onAccountOrders,
                        onAccountOrdersBalance: balance,
                    });
                });
        }

        setLoyaltyUserRes(users);
    };

    const onSelectUser = (loyaltyUser: {
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        points: number;
        onAccountOrders: IGET_RESTAURANT_ORDER_FRAGMENT[];
    }) => {
        if (customerInformation) {
            setCustomerInformation({
                ...customerInformation,
                firstName: loyaltyUser.firstName,
                email: loyaltyUser.email,
                phoneNumber: loyaltyUser.phoneNumber,
            });
        } else {
            setCustomerInformation({
                firstName: loyaltyUser.firstName,
                email: loyaltyUser.email,
                phoneNumber: loyaltyUser.phoneNumber,
                signatureBase64: "",
                customFields: [],
            });
        }

        setCustomerLoyaltyPoints(loyaltyUser.points);
        setOnAccountOrders(loyaltyUser.onAccountOrders);
        onClose();
    };

    return (
        <div className="customer-information">
            <div className="close-button-wrapper">
                <FiX className="close-button" size={36} onClick={onClose} />
            </div>
            <div className="customer-search-wrapper">
                <Input
                    name="Customer Identifier"
                    placeholder="Search and connect customer to this order (02123456789, support@tabin.co.nz, or name)"
                    value={customerIdentifier}
                    onChange={onChangeCustomerIdentifier}
                />
                <Button onClick={onSearch} disabled={customerIdentifier.length < 5}>
                    Search
                </Button>
                <Button className="customer-search-new-customer" onClick={() => props.onDisableSearchView()}>
                    New Customer
                </Button>
            </div>
            <div className="loyalty-users-wrapper">
                {loyaltyUserRes.map((loyaltyUser) => {
                    const unpaidOrders = (loyaltyUser.onAccountOrders || []).filter((order) => order.paid === false);
                    const unpaidBalance = unpaidOrders.reduce((sum, order) => sum + order.subTotal, 0);

                    return (
                        <div key={loyaltyUser.email} className="loyalty-user-wrapper" onClick={() => onSelectUser(loyaltyUser)}>
                            <div className="text-bold">
                                {loyaltyUser.firstName} {loyaltyUser.lastName}
                            </div>
                            <div className="mt-1">{loyaltyUser.phoneNumber}</div>
                            <div className="mt-1">{loyaltyUser.email}</div>
                            <div className="mt-1">
                                {loyaltyUser.points} {loyaltyUser.points > 1 ? "points" : "point"}
                            </div>
                            {unpaidBalance > 0 && <div className="mt-1 text-bold">Balance: -${convertCentsToDollars(unpaidBalance)}</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const UserInformationFields = () => {
    const navigate = useNavigate();
    const { register } = useRegister();
    const { restaurant } = useRestaurant();
    const { isPOS } = useRegister();

    const {
        customerInformation,
        setCustomerInformation,
        setCustomerLoyaltyPoints,
        setUserAppliedLoyaltyId,
        removeUserAppliedPromotion,
        setOnAccountOrders,
    } = useCart();

    const [firstName, setFirstName] = useState(customerInformation ? customerInformation.firstName : "");
    const [email, setEmail] = useState(customerInformation ? customerInformation.email : "");
    const [phoneNumber, setPhoneNumber] = useState(customerInformation ? customerInformation.phoneNumber : "");
    const [customFields, setCustomFields] = useState(customerInformation ? customerInformation.customFields : []);

    const [firstNameError, setFirstNameError] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [phoneNumberError, setPhoneNumberError] = useState(false);
    const [signatureError, setSignatureError] = useState(false);

    const signatureCanvasRef = useRef();
    const signatureMimeType = "image/png";

    useEffect(() => {
        if (!customerInformation || !customerInformation.signatureBase64) return;
        //@ts-ignore
        signatureCanvasRef.current.fromDataURL(customerInformation.signatureBase64, signatureMimeType);
    }, []);

    if (!register) throw "Register is not valid";
    if (restaurant == null) throw "Restaurant is invalid!";

    const onClose = () => {
        if (isPOS) {
            navigate(`${restaurantPath}/${restaurant.id}`);
        } else {
            navigate(`${checkoutPath}`);
        }
    };

    const onNext = async () => {
        if (!register.requestCustomerInformation) return;

        let invalid = false;

        if (register.requestCustomerInformation.firstName && !firstName) {
            setFirstNameError(true);
            invalid = true;
        }
        if (register.requestCustomerInformation.email && !email) {
            setEmailError(true);
            invalid = true;
        }
        if (register.requestCustomerInformation.phoneNumber && !phoneNumber) {
            setPhoneNumberError(true);
            invalid = true;
        }
        //@ts-ignore
        if (register.requestCustomerInformation.signature && signatureCanvasRef.current.isEmpty()) {
            setSignatureError(true);
            invalid = true;
        }

        if (!invalid) {
            let resizedSignatureBase64: string = "";

            if (signatureCanvasRef.current) {
                //@ts-ignore
                const signatureBase64 = signatureCanvasRef.current.getTrimmedCanvas().toDataURL(signatureMimeType);
                resizedSignatureBase64 = await resizeBase64ImageToWidth(signatureBase64, 200, signatureMimeType);
            }

            setCustomerInformation({
                firstName: firstName,
                email: email,
                phoneNumber: phoneNumber,
                signatureBase64: resizedSignatureBase64,
                customFields: customFields,
            });

            setOnAccountOrders([]); //For a new customer there would be no onAccount orders. They have to select from the search bar.

            navigate(`${restaurantPath}/${restaurant.id}`);

            // navigate(`${checkoutPath}/true`);
        }
    };

    const onUnlink = () => {
        setCustomerInformation(null);
        setOnAccountOrders([]);
        setCustomerLoyaltyPoints(null);
        setUserAppliedLoyaltyId(null);
        removeUserAppliedPromotion();
    };

    const onChangeFirstName = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFirstName(e.target.value);
        setFirstNameError(false);
    };

    const onChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value.toLowerCase());
        setEmailError(false);
    };

    const onChangePhoneNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhoneNumber(e.target.value);
        setPhoneNumberError(false);
    };

    const onChangeCustomField = (e: React.ChangeEvent<HTMLInputElement>, field, index: number) => {
        const customFieldsCpy = [...customFields];

        if (customFieldsCpy[index]) {
            customFieldsCpy[index].value = e.target.value;
        } else {
            customFieldsCpy[index] = { ...field, value: e.target.value };
        }
        setCustomFields(customFieldsCpy);
    };

    const onClearSignature = () => {
        //@ts-ignore
        signatureCanvasRef.current.clear();
    };

    return (
        <>
            <PageWrapper>
                <div className="customer-information">
                    <div className="close-button-wrapper">
                        <FiX className="close-button" size={36} onClick={onClose} />
                    </div>
                    <div className="h2 mb-2">Enter customer details</div>
                    {restaurant.enableLoyalty && (
                        <div className="mb-2">To reigster a customer to your loyalty program you must enter name, email and phone number.</div>
                    )}
                    <div className="mb-10" style={{ width: "400px" }}>
                        {/* {register.requestCustomerInformation && register.requestCustomerInformation.firstName && (
                            <> */}
                        <div className="h2 mt-2 mb-2">Name</div>
                        <Input
                            type="firstName"
                            autoFocus={true}
                            onChange={onChangeFirstName}
                            value={firstName}
                            error={firstNameError ? "Required" : ""}
                            disabled={customerInformation ? true : false}
                        />
                        {/* </>
                        )} */}
                        {/* {register.requestCustomerInformation && register.requestCustomerInformation.email && (
                            <> */}
                        <div className="h2 mt-2 mb-2">Email</div>
                        <Input
                            type="email"
                            onChange={onChangeEmail}
                            value={email}
                            error={emailError ? "Required" : ""}
                            disabled={customerInformation ? true : false}
                        />
                        {/* </>
                        )} */}
                        {/* {register.requestCustomerInformation && register.requestCustomerInformation.phoneNumber && (
                            <> */}
                        <div className="h2 mt-2 mb-2">Phone Number</div>
                        <Input
                            type="number"
                            onChange={onChangePhoneNumber}
                            value={phoneNumber}
                            error={phoneNumberError ? "Required" : ""}
                            disabled={customerInformation ? true : false}
                        />
                        {/* </>
                        )} */}
                        {register.requestCustomerInformation && register.requestCustomerInformation.signature && (
                            <>
                                <div className="h2 mt-2 mb-2">Signature</div>
                                <SignatureCanvas
                                    ref={signatureCanvasRef}
                                    canvasProps={{ className: `customer-signature-canvas ${signatureError ? "error" : ""}` }}
                                />
                                {signatureError && <div className="text-error mt-2 mb-2">{signatureError ? "Required" : ""}</div>}
                                <Button className="customer-signature-clear-button" onClick={onClearSignature}>
                                    Clear
                                </Button>
                            </>
                        )}
                        {register.requestCustomerInformation &&
                            register.requestCustomerInformation.customFields?.map((field, index) => (
                                <>
                                    {field.type === ECustomCustomerFieldType.STRING && (
                                        <>
                                            <div className="h2 mt-2 mb-2">{field.label}</div>
                                            <Input
                                                name={field.label}
                                                onChange={(e) => onChangeCustomField(e, field, index)}
                                                value={customFields[index]?.value}
                                            />
                                        </>
                                    )}
                                    {field.type === ECustomCustomerFieldType.NUMBER && (
                                        <>
                                            <div className="h2 mt-2 mb-2">{field.label}</div>
                                            <Input
                                                type="number"
                                                name={field.label}
                                                onChange={(e) => onChangeCustomField(e, field, index)}
                                                value={customFields[index]?.value}
                                            />
                                        </>
                                    )}
                                </>
                            ))}
                    </div>
                    <div className="customer-information-buttons">
                        {customerInformation && <Button onClick={onUnlink}>Unlink</Button>}
                        <Button onClick={onNext}>Next</Button>
                    </div>
                </div>
            </PageWrapper>
        </>
    );
};
