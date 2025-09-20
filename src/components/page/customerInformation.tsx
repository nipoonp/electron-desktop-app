import { useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
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
import { FaRegStar, FaStar } from "react-icons/fa";
import { convertCentsToDollars, resizeBase64ImageToWidth } from "../../util/util";
import { ECustomCustomerFieldType, ELOYALTY_ACTION, IGET_RESTAURANT_LOYALTY_USER_LINK } from "../../graphql/customQueries";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../../graphql/customFragments";
import { UPDATE_LOYALTY_USER_RESTAURANT_LINK } from "../../graphql/customMutations";

export default () => {
    const [searchView, setSearchView] = useState(true);
    const { customerInformation } = useCart();

    return (
        <div className="p-4">
            {searchView && !customerInformation ? <CustomerSearch onDisableSearchView={() => setSearchView(false)} /> : <UserInformationFields />}
        </div>
    );
};

type LoyaltyUserSearchResult = {
    loyaltyUserId: string;
    linkId: string;
    favourite: boolean;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    points: number;
    onAccountOrders: IGET_RESTAURANT_ORDER_FRAGMENT[];
    onAccountOrdersBalance: number;
};

const sortUsersByFavourite = (users: LoyaltyUserSearchResult[]) => [...users].sort((a, b) => Number(b.favourite) - Number(a.favourite));

const CustomerSearch = (props: { onDisableSearchView: () => void }) => {
    const navigate = useNavigate();
    const { restaurant, setRestaurant } = useRestaurant();
    const { isPOS } = useRegister();
    const { customerInformation, setCustomerInformation, setCustomerLoyaltyPoints, setOnAccountOrders } = useCart();

    const [customerIdentifier, setCustomerIdentifier] = useState("");
    const [loyaltyUserRes, setLoyaltyUserRes] = useState<LoyaltyUserSearchResult[]>([]);
    const [favouriteMutationIds, setFavouriteMutationIds] = useState<string[]>([]);
    const [updateLoyaltyUserFavourite] = useMutation(UPDATE_LOYALTY_USER_RESTAURANT_LINK);

    if (restaurant == null) throw "Restaurant is invalid!";

    const getLoyaltyUserLinks = () =>
        (restaurant.loyaltyUsers?.items || []).filter((link): link is IGET_RESTAURANT_LOYALTY_USER_LINK => Boolean(link && link.loyaltyUser));

    const buildSearchResult = (link: IGET_RESTAURANT_LOYALTY_USER_LINK): LoyaltyUserSearchResult | null => {
        const loyaltyUser = link.loyaltyUser;
        if (!loyaltyUser) return null;

        const histories = loyaltyUser.loyaltyHistories?.items || [];
        // if (histories.length === 0) return null;

        const points = histories.reduce((sum, history) => {
            if (history.action === ELOYALTY_ACTION.EARN) return sum + history.points;
            if (history.action === ELOYALTY_ACTION.REDEEM) return sum - history.points;
            return sum;
        }, 0);

        const onAccountOrders = loyaltyUser.onAccountOrders?.items || [];
        const balance = onAccountOrders.reduce((sum, order) => sum + (order.subTotal || 0), 0);

        return {
            loyaltyUserId: loyaltyUser.id,
            linkId: link.id,
            favourite: Boolean(link.favourite),
            firstName: loyaltyUser.firstName || "",
            lastName: loyaltyUser.lastName || "",
            email: loyaltyUser.email || "",
            phoneNumber: loyaltyUser.phoneNumber || "",
            points,
            onAccountOrders,
            onAccountOrdersBalance: balance,
        };
    };

    const mapLinksToResults = (links: IGET_RESTAURANT_LOYALTY_USER_LINK[]) =>
        links.map(buildSearchResult).filter((user): user is LoyaltyUserSearchResult => Boolean(user));

    useEffect(() => {
        if (!restaurant) return;
        if (customerIdentifier.trim().length > 0) return;

        const favouriteLinks = getLoyaltyUserLinks().filter((link) => Boolean(link.favourite));
        const favouriteResults = mapLinksToResults(favouriteLinks);

        setLoyaltyUserRes(sortUsersByFavourite(favouriteResults));
    }, [restaurant, customerIdentifier]);

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

    const onSearch = () => {
        const identifier = customerIdentifier.trim();
        const links = getLoyaltyUserLinks();

        if (!identifier) {
            const favouriteResults = mapLinksToResults(links.filter((link) => Boolean(link.favourite)));
            setLoyaltyUserRes(sortUsersByFavourite(favouriteResults));
            return;
        }

        const identifierLower = identifier.toLowerCase();
        const identifierDigits = identifier.replace(/\D/g, "");

        const matchPhone =
            identifierDigits.length > 0
                ? links.filter((link) => {
                      const phoneNumber = link.loyaltyUser.phoneNumber;
                      if (!phoneNumber) return false;
                      const userDigits = phoneNumber.replace(/\D/g, "");
                      return userDigits.includes(identifierDigits);
                  })
                : [];

        const matchEmail = identifierLower ? links.filter((link) => link.loyaltyUser.email?.toLowerCase().includes(identifierLower)) : [];

        const matchFirstName = identifierLower ? links.filter((link) => link.loyaltyUser.firstName?.toLowerCase().includes(identifierLower)) : [];

        let matchingLinks: IGET_RESTAURANT_LOYALTY_USER_LINK[] = matchPhone;
        if (matchingLinks.length === 0) matchingLinks = matchEmail;
        if (matchingLinks.length === 0) matchingLinks = matchFirstName;

        const users = sortUsersByFavourite(mapLinksToResults(matchingLinks));
        setLoyaltyUserRes(users);
    };

    const onSelectUser = (loyaltyUser: LoyaltyUserSearchResult) => {
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

    const onToggleFavourite = async (event: React.MouseEvent<HTMLButtonElement>, loyaltyUser: LoyaltyUserSearchResult) => {
        event.stopPropagation();
        const isUpdating = favouriteMutationIds.includes(loyaltyUser.linkId);
        if (isUpdating) return;

        const updatedFavourite = !loyaltyUser.favourite;
        setFavouriteMutationIds((prev) => [...prev, loyaltyUser.linkId]);

        try {
            await updateLoyaltyUserFavourite({
                variables: {
                    id: loyaltyUser.linkId,
                    favourite: updatedFavourite,
                },
            });

            setLoyaltyUserRes((prev) =>
                sortUsersByFavourite(prev.map((user) => (user.linkId === loyaltyUser.linkId ? { ...user, favourite: updatedFavourite } : user)))
            );

            const updatedRestaurant = {
                ...restaurant,
                loyaltyUsers: {
                    ...restaurant.loyaltyUsers,
                    items: (restaurant.loyaltyUsers?.items || []).map((link) =>
                        link && link.id === loyaltyUser.linkId ? { ...link, favourite: updatedFavourite } : link
                    ),
                },
            };

            setRestaurant(updatedRestaurant);
        } catch (error) {
            console.error("Error updating favourite loyalty user", error);
        } finally {
            setFavouriteMutationIds((prev) => prev.filter((id) => id !== loyaltyUser.linkId));
        }
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
                    const isUpdatingFavourite = favouriteMutationIds.includes(loyaltyUser.linkId);

                    return (
                        <div key={loyaltyUser.linkId} className="loyalty-user-wrapper" onClick={() => onSelectUser(loyaltyUser)}>
                            <button
                                type="button"
                                className={`loyalty-user-favourite ${loyaltyUser.favourite ? "active" : ""}`}
                                onClick={(event) => onToggleFavourite(event, loyaltyUser)}
                                disabled={isUpdatingFavourite}
                                aria-label={`${loyaltyUser.favourite ? "Remove" : "Mark"} ${loyaltyUser.firstName || "customer"} as favourite`}
                            >
                                {loyaltyUser.favourite ? <FaStar /> : <FaRegStar />}
                            </button>
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
