import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { calculateTotalLoyaltyPoints, convertCentsToDollars, resizeBase64ImageToWidth } from "../../util/util";
import {
    ECustomCustomerFieldType,
    ELOYALTY_ACTION,
    GET_LOYALTY_USER_LINKS_BY_RESTAURANT,
    IGET_LOYALTIES_BY_GROUP_ID_ITEM,
    IGET_LOYALTY_USER_LINK,
    IGET_LOYALTY_USER_LINKS_BY_RESTAURANT,
    IGET_RESTAURANT_LOYALTY_HISTORY,
} from "../../graphql/customQueries";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../../graphql/customFragments";
import { UPDATE_LOYALTY_USER_RESTAURANT_LINK } from "../../graphql/customMutations";
import { useGetLoyaltiesByGroupIdLazyQuery } from "../../hooks/useGetLoyaltiesByGroupIdLazyQuery";
import { useGetLoyaltyHistoryByLoyaltyIdLazyQuery } from "../../hooks/useGetLoyaltyHistoryByLoyaltyIdLazyQuery";
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

type LoyaltyHistoryMap = Record<string, IGET_RESTAURANT_LOYALTY_HISTORY[]>;

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

const buildLoyaltyUserAggregates = (
    loyaltyHistoriesByLoyaltyId: LoyaltyHistoryMap,
    loyaltyGroupIds: string[],
    loyaltyUserLinks: Record<string, LoyaltyUserLinkInfo>
): LoyaltyUserAggregate[] => {
    type AggregatedUser = {
        histories: IGET_RESTAURANT_LOYALTY_HISTORY[];
        user: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phoneNumber: string;
        };
    };

    const loyaltyUserMap: Record<string, AggregatedUser> = {};

    Object.entries(loyaltyUserLinks).forEach(([userId, linkInfo]) => {
        if (!userId) return;

        loyaltyUserMap[userId] = {
            histories: [],
            user: {
                id: userId,
                firstName: linkInfo.firstName || "",
                lastName: linkInfo.lastName || "",
                email: linkInfo.email || "",
                phoneNumber: linkInfo.phoneNumber || "",
            },
        };
    });

    Object.values(loyaltyHistoriesByLoyaltyId).forEach((histories) => {
        histories.forEach((history) => {
            const userId = history.loyaltyHistoryLoyaltyUserId;
            const user = history.loyaltyUser;
            if (!userId || !user) return;

            if (!loyaltyUserMap[userId]) {
                loyaltyUserMap[userId] = {
                    histories: [],
                    user: {
                        id: user.id || userId,
                        firstName: user.firstName || "",
                        lastName: user.lastName || "",
                        email: user.email || "",
                        phoneNumber: user.phoneNumber || "",
                    },
                };
            }

            loyaltyUserMap[userId].histories.push(history);
            loyaltyUserMap[userId].user = {
                id: user.id || userId,
                firstName: user.firstName || loyaltyUserMap[userId].user.firstName,
                lastName: user.lastName || loyaltyUserMap[userId].user.lastName,
                email: user.email || loyaltyUserMap[userId].user.email,
                phoneNumber: user.phoneNumber || loyaltyUserMap[userId].user.phoneNumber,
            };
        });
    });

    return Object.entries(loyaltyUserMap).map(([userId, { histories, user }]) => {
        const points = calculateTotalLoyaltyPoints(
            histories.map((history) => ({
                action: history.action as ELOYALTY_ACTION,
                points: history.points,
                loyaltyHistoryLoyaltyId: history.loyaltyHistoryLoyaltyId,
            })),
            loyaltyGroupIds
        );

        const loyaltyUserId = user.id || userId;
        const linkInfo = loyaltyUserLinks[loyaltyUserId];

        const result: LoyaltyUserSearchResult = {
            loyaltyUserId,
            linkId: linkInfo?.id ?? "",
            favourite: linkInfo?.favourite ?? false,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phoneNumber: user.phoneNumber || "",
            points,
            onAccountOrders: [],
            onAccountOrdersBalance: 0,
        };

        return {
            result,
            searchTokens: buildSearchTokens(result),
        };
    });
};

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
    const { restaurant } = useRestaurant();
    const { isPOS } = useRegister();
    const {
        customerInformation,
        setCustomerInformation,
        setCustomerLoyaltyPoints,
        setOnAccountOrders,
        loyaltyUserAggregates,
        setLoyaltyUserAggregates,
    } = useCart();

    const [customerIdentifier, setCustomerIdentifier] = useState("");
    const [favouriteMutationIds, setFavouriteMutationIds] = useState<string[]>([]);
    const [updateLoyaltyUserFavourite] = useMutation(UPDATE_LOYALTY_USER_RESTAURANT_LINK);

    const { getLoyaltiesByGroupIdLazyQuery } = useGetLoyaltiesByGroupIdLazyQuery();
    const { getLoyaltyHistoryByLoyaltyIdLazyQuery } = useGetLoyaltyHistoryByLoyaltyIdLazyQuery();
    const [getLoyaltyUserLinksByRestaurantLazyQuery] = useLazyQuery<IGET_LOYALTY_USER_LINKS_BY_RESTAURANT>(GET_LOYALTY_USER_LINKS_BY_RESTAURANT, {
        fetchPolicy: "network-only",
    });

    const fetchLoyaltyGroupIds = useCallback(
        async (loyaltyGroupId: string) => {
            const response = await getLoyaltiesByGroupIdLazyQuery({ variables: { loyaltyGroupId } });
            const items = response?.data?.getLoyaltiesByGroupId?.items ?? [];
            return items
                .filter(Boolean)
                .map((item: IGET_LOYALTIES_BY_GROUP_ID_ITEM) => item.id)
                .filter(Boolean) as string[];
        },
        [getLoyaltiesByGroupIdLazyQuery]
    );

    const fetchLoyaltyHistoriesForLoyaltyId = useCallback(
        async (loyaltyId: string) => {
            const histories: IGET_RESTAURANT_LOYALTY_HISTORY[] = [];
            let nextToken: string | null | undefined = null;

            do {
                const response = await getLoyaltyHistoryByLoyaltyIdLazyQuery({
                    variables: { id: loyaltyId, nextToken },
                });

                const connection = response?.data?.getLoyalty?.loyaltyHistories;
                if (!connection) break;

                const items = (connection.items ?? []).filter((item): item is IGET_RESTAURANT_LOYALTY_HISTORY => Boolean(item));
                histories.push(...items);

                nextToken = connection.nextToken ?? null;
            } while (nextToken);

            return histories;
        },
        [getLoyaltyHistoryByLoyaltyIdLazyQuery]
    );

    const fetchLoyaltyHistoriesByGroup = useCallback(
        async (loyaltyIds: string[]) => {
            const sanitizedIds = loyaltyIds.filter(Boolean);
            const entries = await Promise.all(
                sanitizedIds.map(async (loyaltyId) => {
                    const histories = await fetchLoyaltyHistoriesForLoyaltyId(loyaltyId);
                    return [loyaltyId, histories] as const;
                })
            );

            return Object.fromEntries(entries) as LoyaltyHistoryMap;
        },
        [fetchLoyaltyHistoriesForLoyaltyId]
    );

    const fetchLoyaltyUserLinks = useCallback(async () => {
        if (!restaurant?.id) return {};

        const linkMap: Record<string, LoyaltyUserLinkInfo> = {};
        let nextToken: string | null | undefined = null;

        do {
            const response = await getLoyaltyUserLinksByRestaurantLazyQuery({
                variables: {
                    restaurantId: restaurant.id,
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
                };
            });

            nextToken = connection?.nextToken ?? null;
        } while (nextToken);

        return linkMap;
    }, [getLoyaltyUserLinksByRestaurantLazyQuery, restaurant?.id]);

    useEffect(() => {
        if (!restaurant) return;
        if (loyaltyUserAggregates.length > 0) return;

        let cancelled = false;

        const load = async () => {
            const loyaltyItems = restaurant.loyalties?.items ?? [];
            const loyaltyGroupId = loyaltyItems[0]?.loyaltyGroupId;

            const loyaltyUserLinksPromise = fetchLoyaltyUserLinks();
            const loyaltyGroupIds = loyaltyGroupId ? await fetchLoyaltyGroupIds(loyaltyGroupId) : [];
            const loyaltyHistoriesPromise = loyaltyGroupIds.length
                ? fetchLoyaltyHistoriesByGroup(loyaltyGroupIds)
                : Promise.resolve({} as LoyaltyHistoryMap);

            const [loyaltyUserLinks, loyaltyHistoriesByLoyaltyId] = await Promise.all([loyaltyUserLinksPromise, loyaltyHistoriesPromise]);

            if (cancelled) return;

            const aggregates = buildLoyaltyUserAggregates(loyaltyHistoriesByLoyaltyId, loyaltyGroupIds, loyaltyUserLinks);
            setLoyaltyUserAggregates(aggregates);
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [
        fetchLoyaltyGroupIds,
        fetchLoyaltyHistoriesByGroup,
        fetchLoyaltyUserLinks,
        loyaltyUserAggregates.length,
        restaurant,
        setLoyaltyUserAggregates,
    ]);

    if (!restaurant) {
        throw new Error("Restaurant is invalid!");
    }

    const favouriteUsers = useMemo(() => deriveFavouriteUsers(loyaltyUserAggregates), [loyaltyUserAggregates]);
    const trimmedCustomerIdentifier = customerIdentifier.trim();
    const hasMinimumIdentifier = trimmedCustomerIdentifier.length >= MIN_IDENTIFIER_LENGTH;

    const displayedUsers = useMemo(() => {
        if (!hasMinimumIdentifier) {
            return favouriteUsers.slice(0, MAX_DISPLAYED_USERS);
        }

        return filterAggregatedUsers(loyaltyUserAggregates, trimmedCustomerIdentifier).slice(0, MAX_DISPLAYED_USERS);
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

    const handleSelectUser = (loyaltyUser: LoyaltyUserSearchResult) => {
        const baseInformation = customerInformation ? { ...customerInformation } : { ...EMPTY_CUSTOMER_INFORMATION };

        setCustomerInformation({
            ...baseInformation,
            firstName: loyaltyUser.firstName,
            email: loyaltyUser.email,
            phoneNumber: loyaltyUser.phoneNumber,
        });

        setCustomerLoyaltyPoints(loyaltyUser.points);
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

            setLoyaltyUserAggregates((previous) =>
                previous.map((aggregate) =>
                    aggregate.result.loyaltyUserId === loyaltyUser.loyaltyUserId
                        ? { ...aggregate, result: { ...aggregate.result, linkId: linkInfo.id, favourite: linkInfo.favourite } }
                        : aggregate
                )
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

            setLoyaltyUserAggregates((previous) =>
                previous.map((aggregate) =>
                    aggregate.result.linkId === linkId ? { ...aggregate, result: { ...aggregate.result, favourite: updatedFavourite } } : aggregate
                )
            );
        } catch (error) {
            console.error("Error updating favourite loyalty user", error);
        } finally {
            setFavouriteMutationIds((prev) => prev.filter((id) => id !== resolvedLinkId));
        }
    };

    return (
        <div className="customer-information">
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
                                        aria-label={`${loyaltyUser.favourite ? "Remove" : "Mark"} ${
                                            loyaltyUser.firstName || "customer"
                                        } as favourite`}
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
