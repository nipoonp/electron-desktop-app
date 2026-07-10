import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useNavigate } from "react-router";
import { checkoutPath, restaurantPath } from "../main";
import { useCart } from "../../context/cart-context";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { Button } from "../../tabin/components/button";
import { Input } from "../../tabin/components/input";
import { toast } from "../../tabin/components/toast";
import { useRestaurant } from "../../context/restaurant-context";
import { useRegister } from "../../context/register-context";
import SignatureCanvas from "react-signature-canvas";

import "./customerInformation.scss";
import { FiX } from "react-icons/fi";
import { FaRegStar, FaStar } from "react-icons/fa";
import { calculateLoyaltyPointsForGroup, convertCentsToDollars, resizeBase64ImageToWidth } from "../../util/util";
import {
    ECustomCustomerFieldType,
    GET_LOYALTY_USER_BALANCES,
    GET_LOYALTY_USER_LINKS_BY_RESTAURANT,
    IGET_LOYALTIES_BY_GROUP_ID_ITEM,
    IGET_LOYALTY_USER_BALANCES,
    IGET_LOYALTY_USER_LINK,
    IGET_LOYALTY_USER_LINKS_BY_RESTAURANT,
} from "../../graphql/customQueries";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { UPDATE_LOYALTY_USER_RESTAURANT_LINK } from "../../graphql/customMutations";
import { useGetLoyaltiesByGroupIdLazyQuery } from "../../hooks/useGetLoyaltiesByGroupIdLazyQuery";
import { ICustomerInformation, LoyaltyUserAggregate, LoyaltyUserLinkInfo, LoyaltyUserSearchResult } from "../../model/model";

const MIN_IDENTIFIER_LENGTH = 3;
const MAX_DISPLAYED_USERS = 30;
const SIGNATURE_MIME_TYPE = "image/png";
const EMPTY_CUSTOMER_INFORMATION: ICustomerInformation = {
    firstName: "",
    email: "",
    phoneNumber: "",
    signatureBase64: "",
    customFields: [],
};

const sortUsersByFavourite = (users: LoyaltyUserSearchResult[]) => [...users].sort((a, b) => Number(b.favourite) - Number(a.favourite));

const buildSearchTokens = (user: LoyaltyUserSearchResult) => ({
    name: `${user.firstName} ${user.lastName}`.trim().toLowerCase(),
    email: user.email.toLowerCase(),
    phone: user.phoneNumber.toLowerCase(),
    phoneDigits: user.phoneNumber.replace(/\D/g, ""),
});

const deriveFavouriteUsers = (aggregates: LoyaltyUserAggregate[]) =>
    sortUsersByFavourite(aggregates.map((aggregate) => aggregate.result).filter((user) => user.favourite));

const filterAggregatedUsers = (aggregates: LoyaltyUserAggregate[], identifier: string) => {
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) return sortUsersByFavourite(aggregates.map((aggregate) => aggregate.result));

    const normalizedIdentifier = trimmedIdentifier.toLowerCase();
    const digitsIdentifier = trimmedIdentifier.replace(/\D/g, "");

    const filtered = aggregates.filter(({ searchTokens }) => {
        const nameMatch = searchTokens.name.includes(normalizedIdentifier);
        const emailMatch = searchTokens.email.includes(normalizedIdentifier);

        let phoneMatch = false;
        if (digitsIdentifier) {
            phoneMatch = searchTokens.phoneDigits.includes(digitsIdentifier);
        } else {
            phoneMatch = searchTokens.phone.includes(normalizedIdentifier);
        }

        return nameMatch || emailMatch || phoneMatch;
    });

    return sortUsersByFavourite(filtered.map((aggregate) => aggregate.result));
};

const buildLoyaltyUserAggregates = (loyaltyUserLinks: Record<string, LoyaltyUserLinkInfo>, loyaltyGroupIds: string[]): LoyaltyUserAggregate[] =>
    Object.entries(loyaltyUserLinks).map(([loyaltyUserId, linkInfo]) => {
        const points = calculateLoyaltyPointsForGroup(linkInfo.loyaltyBalances, loyaltyGroupIds);

        const result: LoyaltyUserSearchResult = {
            loyaltyUserId,
            linkId: linkInfo.id,
            favourite: linkInfo.favourite,
            firstName: linkInfo.firstName || "",
            lastName: linkInfo.lastName || "",
            email: linkInfo.email || "",
            phoneNumber: linkInfo.phoneNumber || "",
            points,
            onAccountOrders: [],
            onAccountOrdersBalance: 0,
        };

        return {
            result,
            searchTokens: buildSearchTokens(result),
        };
    });

export default function CustomerInformation() {
    const [searchView, setSearchView] = useState(true);
    const { customerInformation } = useCart();

    return (
        <div className="p-4">
            {searchView && !customerInformation ? <CustomerSearch onDisableSearchView={() => setSearchView(false)} /> : <UserInformationFields />}
        </div>
    );
}

const CustomerSearch = ({ onDisableSearchView }: { onDisableSearchView: () => void }) => {
    const navigate = useNavigate();
    const { restaurant, loyaltyUserAggregates, setLoyaltyUserAggregates, loyaltyUserAggregatesFetchedDate, setLoyaltyUserAggregatesFetchedDate } =
        useRestaurant();
    const { isPOS } = useRegister();
    const { customerInformation, setCustomerInformation, setCustomerLoyaltyPoints, setOnAccountOrders } = useCart();

    const [customerIdentifier, setCustomerIdentifier] = useState("");
    const [favouriteMutationIds, setFavouriteMutationIds] = useState<string[]>([]);
    const [updateLoyaltyUserFavourite] = useMutation(UPDATE_LOYALTY_USER_RESTAURANT_LINK);

    const { getLoyaltiesByGroupIdLazyQuery } = useGetLoyaltiesByGroupIdLazyQuery();
    const [getLoyaltyUserLinksByRestaurantLazyQuery] = useLazyQuery<IGET_LOYALTY_USER_LINKS_BY_RESTAURANT>(GET_LOYALTY_USER_LINKS_BY_RESTAURANT, {
        fetchPolicy: "network-only",
    });
    const [getLoyaltyUserBalancesLazyQuery] = useLazyQuery<IGET_LOYALTY_USER_BALANCES>(GET_LOYALTY_USER_BALANCES, {
        fetchPolicy: "network-only",
    });
    const [isFetchingSelectedUserPoints, setIsFetchingSelectedUserPoints] = useState(false);

    const fetchGroupLoyalties = useCallback(
        async (loyaltyGroupId: string) => {
            const response = await getLoyaltiesByGroupIdLazyQuery({ variables: { loyaltyGroupId } });
            const items = response?.data?.getLoyaltiesByGroupId?.items ?? [];
            return items.filter(Boolean) as IGET_LOYALTIES_BY_GROUP_ID_ITEM[];
        },
        [getLoyaltiesByGroupIdLazyQuery],
    );

    const fetchAllGroupLoyalties = useCallback(async () => {
        const loyaltyItems = restaurant?.loyalties?.items ?? [];

        const loyaltyGroupIds = loyaltyItems
            .map((loyalty) => loyalty.loyaltyGroupId)
            .filter((id, index, ids): id is string => Boolean(id) && ids.indexOf(id) === index);

        return (await Promise.all(loyaltyGroupIds.map((id) => fetchGroupLoyalties(id)))).flat();
    }, [fetchGroupLoyalties, restaurant]);

    const fetchLoyaltyUserLinks = useCallback(
        async (restaurantId?: string) => {
            const targetRestaurantId = restaurantId ?? restaurant?.id;
            if (!targetRestaurantId) return {};

            const linkMap: Record<string, LoyaltyUserLinkInfo> = {};
            let nextToken: string | null | undefined = null;

            do {
                const response = await getLoyaltyUserLinksByRestaurantLazyQuery({
                    variables: {
                        restaurantId: targetRestaurantId,
                        nextToken,
                    },
                });

                const connection = response.data?.getRestaurant?.loyaltyUsers;
                const items = connection?.items ?? [];

                items.forEach((item) => {
                    const link = item as IGET_LOYALTY_USER_LINK | null;
                    const loyaltyUser = link?.loyaltyUser;
                    const loyaltyUserId = loyaltyUser?.id;
                    if (!link?.id || !loyaltyUserId) return;

                    linkMap[loyaltyUserId] = {
                        id: link.id,
                        favourite: Boolean(link.favourite),
                        firstName: loyaltyUser.firstName,
                        lastName: loyaltyUser.lastName,
                        email: loyaltyUser.email,
                        phoneNumber: loyaltyUser.phoneNumber,
                        loyaltyBalances: (loyaltyUser.loyaltyBalances ?? []).filter((balance): balance is { loyaltyId: string | null; points: number } =>
                            Boolean(balance),
                        ),
                    };
                });

                nextToken = connection?.nextToken ?? null;
            } while (nextToken);

            return linkMap;
        },
        [getLoyaltyUserLinksByRestaurantLazyQuery, restaurant?.id],
    );

    const loadedForRestaurantId = useRef<string | null>(null);

    useEffect(() => {
        if (!restaurant) return;
        // Fetched on the first customer search of each day, cached in restaurant-context.
        if (loyaltyUserAggregates !== null && loyaltyUserAggregatesFetchedDate === format(new Date(), "yyyy-MM-dd")) return;
        // Guard against a duplicate fetch while the first is still in flight.
        if (loadedForRestaurantId.current === restaurant.id) return;
        loadedForRestaurantId.current = restaurant.id;

        let cancelled = false;

        const load = async () => {
            try {
                // Customers are linked to the restaurant they registered at, so gather users from every restaurant in every group.
                const groupLoyalties = await fetchAllGroupLoyalties();
                if (cancelled) return;

                // The group loyalty ids scope which of a user's materialised balances count towards points.
                const loyaltyGroupIds = groupLoyalties.map((loyalty) => loyalty.id).filter(Boolean);

                // Fetch loyalty users for every restaurant in the group (plus the current one).
                const otherRestaurantIds = groupLoyalties
                    .map((loyalty) => loyalty.loyaltyRestaurantId)
                    .filter((id, index, ids) => id && id !== restaurant.id && ids.indexOf(id) === index);
                const linkMapsByRestaurant = await Promise.all(otherRestaurantIds.map((id) => fetchLoyaltyUserLinks(id)));
                const currentRestaurantLinkMap = await fetchLoyaltyUserLinks(restaurant.id);
                if (cancelled) return;

                // Favourites (and the link used to toggle them) are per restaurant: only the current
                // restaurant's link counts. Users from other restaurants are searchable but not favourites.
                const loyaltyUserLinks: Record<string, LoyaltyUserLinkInfo> = {};
                linkMapsByRestaurant.forEach((linkMap) =>
                    Object.entries(linkMap).forEach(([loyaltyUserId, linkInfo]) => {
                        loyaltyUserLinks[loyaltyUserId] = { ...linkInfo, id: "", favourite: false };
                    }),
                );
                Object.assign(loyaltyUserLinks, currentRestaurantLinkMap);

                const aggregates = buildLoyaltyUserAggregates(loyaltyUserLinks, loyaltyGroupIds);
                setLoyaltyUserAggregates(aggregates);
                setLoyaltyUserAggregatesFetchedDate(format(new Date(), "yyyy-MM-dd"));
            } catch (error) {
                console.error("Error loading loyalty users", error);
                // Allow a retry on the next render since this attempt did not populate.
                if (loadedForRestaurantId.current === restaurant.id) {
                    loadedForRestaurantId.current = null;
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [
        fetchAllGroupLoyalties,
        fetchLoyaltyUserLinks,
        restaurant,
        loyaltyUserAggregates,
        setLoyaltyUserAggregates,
        loyaltyUserAggregatesFetchedDate,
        setLoyaltyUserAggregatesFetchedDate,
    ]);

    if (!restaurant) {
        throw new Error("Restaurant is invalid!");
    }

    const favouriteUsers = useMemo(() => deriveFavouriteUsers(loyaltyUserAggregates ?? []), [loyaltyUserAggregates]);
    const trimmedCustomerIdentifier = customerIdentifier.trim();
    const hasMinimumIdentifier = trimmedCustomerIdentifier.length >= MIN_IDENTIFIER_LENGTH;

    const displayedUsers = useMemo(() => {
        if (!hasMinimumIdentifier) {
            return favouriteUsers.slice(0, MAX_DISPLAYED_USERS);
        }

        return filterAggregatedUsers(loyaltyUserAggregates ?? [], trimmedCustomerIdentifier).slice(0, MAX_DISPLAYED_USERS);
    }, [favouriteUsers, hasMinimumIdentifier, loyaltyUserAggregates, trimmedCustomerIdentifier]);

    const handleCustomerIdentifierChange = (event: ChangeEvent<HTMLInputElement>) => {
        setCustomerIdentifier(event.target.value);
    };

    const handleClose = () => {
        if (isPOS) {
            navigate(`${restaurantPath}/${restaurant.id}`);
        } else {
            navigate(`${checkoutPath}`);
        }
    };

    const handleSelectUser = async (loyaltyUser: LoyaltyUserSearchResult) => {
        if (isFetchingSelectedUserPoints) return;

        const baseInformation = customerInformation ? { ...customerInformation } : { ...EMPTY_CUSTOMER_INFORMATION };

        setCustomerInformation({
            ...baseInformation,
            firstName: loyaltyUser.firstName,
            email: loyaltyUser.email,
            phoneNumber: loyaltyUser.phoneNumber,
        });

        // Refetch the latest balances so redemption never uses stale cached points.
        let points = loyaltyUser.points;

        setIsFetchingSelectedUserPoints(true);

        try {
            const [groupLoyalties, balancesResponse] = await Promise.all([
                fetchAllGroupLoyalties(),
                getLoyaltyUserBalancesLazyQuery({ variables: { loyaltyUserId: loyaltyUser.loyaltyUserId } }),
            ]);

            const loyaltyGroupIds = groupLoyalties.map((loyalty) => loyalty.id).filter(Boolean);
            const balances = (balancesResponse.data?.getLoyaltyUser?.loyaltyBalances ?? []).filter(
                (balance): balance is { loyaltyId: string | null; points: number } => Boolean(balance),
            );

            points = calculateLoyaltyPointsForGroup(balances, loyaltyGroupIds);

            setLoyaltyUserAggregates(
                (previous) =>
                    previous &&
                    previous.map((aggregate) =>
                        aggregate.result.loyaltyUserId === loyaltyUser.loyaltyUserId ? { ...aggregate, result: { ...aggregate.result, points } } : aggregate,
                    ),
            );
        } catch (error) {
            console.error("Error refetching loyalty points", error);
            toast.error("Could not refresh loyalty points, using last known balance.");
        } finally {
            setIsFetchingSelectedUserPoints(false);
        }

        setCustomerLoyaltyPoints(points);
        setOnAccountOrders(loyaltyUser.onAccountOrders);
        handleClose();
    };

    const handleToggleFavourite = async (event: React.MouseEvent<HTMLButtonElement>, loyaltyUser: LoyaltyUserSearchResult) => {
        event.stopPropagation();
        event.preventDefault();

        const isUpdating = favouriteMutationIds.includes(loyaltyUser.linkId);
        if (isUpdating) return;

        let linkId = loyaltyUser.linkId;

        if (!linkId) {
            const linkMap = await fetchLoyaltyUserLinks();
            const linkInfo = linkMap[loyaltyUser.loyaltyUserId];

            if (!linkInfo) {
                toast.error("Unable to update favourite for this customer.");
                return;
            }

            linkId = linkInfo.id;

            setLoyaltyUserAggregates(
                (previous) =>
                    previous &&
                    previous.map((aggregate) =>
                        aggregate.result.loyaltyUserId === loyaltyUser.loyaltyUserId
                            ? { ...aggregate, result: { ...aggregate.result, linkId: linkInfo.id, favourite: linkInfo.favourite } }
                            : aggregate,
                    ),
            );
        }

        if (!linkId) return;

        const updatedFavourite = !loyaltyUser.favourite;
        const resolvedLinkId = linkId;
        setFavouriteMutationIds((prev) => [...prev, resolvedLinkId]);

        try {
            await updateLoyaltyUserFavourite({
                variables: {
                    id: linkId,
                    favourite: updatedFavourite,
                },
            });

            setLoyaltyUserAggregates(
                (previous) =>
                    previous &&
                    previous.map((aggregate) =>
                        aggregate.result.linkId === linkId ? { ...aggregate, result: { ...aggregate.result, favourite: updatedFavourite } } : aggregate,
                    ),
            );
        } catch (error) {
            console.error("Error updating favourite loyalty user", error);
        } finally {
            setFavouriteMutationIds((prev) => prev.filter((id) => id !== resolvedLinkId));
        }
    };

    return (
        <div className="customer-information">
            <FullScreenSpinner show={isFetchingSelectedUserPoints} text="Fetching latest loyalty points..." />
            <div className="close-button-wrapper">
                <FiX className="close-button" size={36} onClick={handleClose} />
            </div>
            <div className="customer-search-wrapper">
                <Input
                    name="Customer Identifier"
                    placeholder="Search and connect customer to this order (02123456789, support@tabin.co.nz, or name)"
                    value={customerIdentifier}
                    onChange={handleCustomerIdentifierChange}
                />
                <Button className="customer-search-new-customer" onClick={onDisableSearchView}>
                    New Customer
                </Button>
            </div>
            {displayedUsers.length > 0 ? (
                <div className="loyalty-users-wrapper">
                    {displayedUsers.map((loyaltyUser) => {
                        const loyaltyUserKey = loyaltyUser.linkId || loyaltyUser.loyaltyUserId;
                        const unpaidOrders = (loyaltyUser.onAccountOrders || []).filter((order) => order.paid === false);
                        const unpaidBalance = unpaidOrders.reduce((sum, order) => sum + order.subTotal, 0);
                        const isUpdatingFavourite = loyaltyUser.linkId ? favouriteMutationIds.includes(loyaltyUser.linkId) : false;

                        return (
                            <div key={loyaltyUserKey} className="loyalty-user-wrapper" onClick={() => handleSelectUser(loyaltyUser)}>
                                {loyaltyUser.linkId && (
                                    <button
                                        type="button"
                                        className={`loyalty-user-favourite ${loyaltyUser.favourite ? "active" : ""}`}
                                        onClick={(event) => handleToggleFavourite(event, loyaltyUser)}
                                        disabled={isUpdatingFavourite}
                                        aria-label={`${loyaltyUser.favourite ? "Remove" : "Mark"} ${loyaltyUser.firstName || "customer"} as favourite`}
                                    >
                                        {loyaltyUser.favourite ? <FaStar /> : <FaRegStar />}
                                    </button>
                                )}
                                <div className="text-bold">
                                    {loyaltyUser.firstName} {loyaltyUser.lastName}
                                </div>
                                <div className="mt-1">{loyaltyUser.phoneNumber}</div>
                                <div className="mt-1">{loyaltyUser.email}</div>
                                {loyaltyUser.points > 0 && (
                                    <div className="mt-1">
                                        {loyaltyUser.points} {loyaltyUser.points > 1 ? "points" : "point"}
                                    </div>
                                )}
                                {unpaidBalance > 0 && <div className="mt-1 text-bold">Balance: -${convertCentsToDollars(unpaidBalance)}</div>}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="mt-4">No customers to show. Search or add a customer above.</div>
            )}
        </div>
    );
};

const UserInformationFields = () => {
    const navigate = useNavigate();
    const { register, isPOS } = useRegister();
    const { restaurant } = useRestaurant();

    const { customerInformation, setCustomerInformation, setCustomerLoyaltyPoints, setUserAppliedLoyaltyId, removeUserAppliedPromotion, setOnAccountOrders } =
        useCart();

    const [firstName, setFirstName] = useState(customerInformation ? customerInformation.firstName : "");
    const [email, setEmail] = useState(customerInformation ? customerInformation.email : "");
    const [phoneNumber, setPhoneNumber] = useState(customerInformation ? customerInformation.phoneNumber : "");
    const [customFields, setCustomFields] = useState(customerInformation ? customerInformation.customFields : []);

    const [firstNameError, setFirstNameError] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [phoneNumberError, setPhoneNumberError] = useState(false);
    const [signatureError, setSignatureError] = useState(false);

    const signatureCanvasRef = useRef<SignatureCanvas | null>(null);
    useEffect(() => {
        if (!customerInformation?.signatureBase64) return;
        signatureCanvasRef.current?.fromDataURL(customerInformation.signatureBase64, SIGNATURE_MIME_TYPE);
    }, [customerInformation]);

    if (!register) throw new Error("Register is not valid");
    if (!restaurant) throw new Error("Restaurant is invalid!");

    const requestCustomerInformation = register.requestCustomerInformation;
    const requiresFirstName = Boolean(requestCustomerInformation?.firstName);
    const requiresEmail = Boolean(requestCustomerInformation?.email);
    const requiresPhoneNumber = Boolean(requestCustomerInformation?.phoneNumber);
    const requiresSignature = Boolean(requestCustomerInformation?.signature);

    type RegisterCustomField = NonNullable<NonNullable<typeof register.requestCustomerInformation>["customFields"]>[number];

    const handleClose = () => {
        if (isPOS) {
            navigate(`${restaurantPath}/${restaurant.id}`);
        } else {
            navigate(`${checkoutPath}`);
        }
    };

    const handleNext = async () => {
        if (!requestCustomerInformation) return;

        let invalid = false;

        if (requiresFirstName && !firstName) {
            setFirstNameError(true);
            invalid = true;
        }
        if (requiresEmail && !email) {
            setEmailError(true);
            invalid = true;
        }
        if (requiresPhoneNumber && !phoneNumber) {
            setPhoneNumberError(true);
            invalid = true;
        }
        if (requiresSignature && signatureCanvasRef.current?.isEmpty()) {
            setSignatureError(true);
            invalid = true;
        }

        if (invalid) return;

        let resizedSignatureBase64 = "";

        if (signatureCanvasRef.current) {
            const signatureBase64 = signatureCanvasRef.current.getTrimmedCanvas().toDataURL(SIGNATURE_MIME_TYPE);
            resizedSignatureBase64 = await resizeBase64ImageToWidth(signatureBase64, 200, SIGNATURE_MIME_TYPE);
        }

        setCustomerInformation({
            firstName,
            email,
            phoneNumber,
            signatureBase64: resizedSignatureBase64,
            customFields,
        });

        setOnAccountOrders([]);

        navigate(`${restaurantPath}/${restaurant.id}`);
    };

    const handleUnlink = () => {
        setCustomerInformation(null);
        setOnAccountOrders([]);
        setCustomerLoyaltyPoints(null);
        setUserAppliedLoyaltyId(null);
        removeUserAppliedPromotion();
    };

    const handleFirstNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        setFirstName(event.target.value);
        setFirstNameError(false);
    };

    const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
        setEmail(event.target.value.toLowerCase());
        setEmailError(false);
    };

    const handlePhoneNumberChange = (event: ChangeEvent<HTMLInputElement>) => {
        setPhoneNumber(event.target.value);
        setPhoneNumberError(false);
    };

    const handleCustomFieldChange = (event: ChangeEvent<HTMLInputElement>, field: RegisterCustomField, index: number) => {
        const updatedFields = [...customFields];

        if (updatedFields[index]) {
            updatedFields[index].value = event.target.value;
        } else {
            updatedFields[index] = { ...field, value: event.target.value };
        }

        setCustomFields(updatedFields);
    };

    const handleClearSignature = () => {
        signatureCanvasRef.current?.clear();
    };

    return (
        <PageWrapper>
            <div className="customer-information">
                <div className="close-button-wrapper">
                    <FiX className="close-button" size={36} onClick={handleClose} />
                </div>
                <div className="h2 mb-2">Enter customer details</div>
                {restaurant.enableLoyalty && (
                    <div className="mb-2">To register a customer to your loyalty program you must enter name, email and phone number.</div>
                )}
                <div className="mb-10" style={{ width: "400px" }}>
                    <div className="h2 mt-2 mb-2">Name</div>
                    <Input
                        type="text"
                        autoFocus
                        onChange={handleFirstNameChange}
                        value={firstName}
                        error={firstNameError ? "Required" : ""}
                        disabled={Boolean(customerInformation)}
                    />

                    <div className="h2 mt-2 mb-2">Email</div>
                    <Input
                        type="email"
                        onChange={handleEmailChange}
                        value={email}
                        error={emailError ? "Required" : ""}
                        disabled={Boolean(customerInformation)}
                    />

                    <div className="h2 mt-2 mb-2">Phone Number</div>
                    <Input
                        type="tel"
                        onChange={handlePhoneNumberChange}
                        value={phoneNumber}
                        error={phoneNumberError ? "Required" : ""}
                        disabled={Boolean(customerInformation)}
                    />

                    {requiresSignature && (
                        <>
                            <div className="h2 mt-2 mb-2">Signature</div>
                            <SignatureCanvas
                                ref={signatureCanvasRef}
                                canvasProps={{ className: `customer-signature-canvas ${signatureError ? "error" : ""}` }}
                            />
                            {signatureError && <div className="text-error mt-2 mb-2">Required</div>}
                            <Button className="customer-signature-clear-button" onClick={handleClearSignature}>
                                Clear
                            </Button>
                        </>
                    )}

                    {requestCustomerInformation?.customFields?.map((field, index) => (
                        <div key={`${field.label}-${index}`}>
                            <div className="h2 mt-2 mb-2">{field.label}</div>
                            <Input
                                type={field.type === ECustomCustomerFieldType.NUMBER ? "number" : "text"}
                                name={field.label}
                                onChange={(event) => handleCustomFieldChange(event, field, index)}
                                value={customFields[index]?.value}
                            />
                        </div>
                    ))}
                </div>
                <div className="customer-information-buttons">
                    {customerInformation && <Button onClick={handleUnlink}>Unlink</Button>}
                    <Button onClick={handleNext}>Next</Button>
                </div>
            </div>
        </PageWrapper>
    );
};
