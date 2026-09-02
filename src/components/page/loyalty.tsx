import { useNavigate } from "react-router";
import { useState } from "react";
import axios from "axios";
import { Button } from "../../tabin/components/button";
import { Input } from "../../tabin/components/input";
import { useRestaurant } from "../../context/restaurant-context";
import { useCart } from "../../context/cart-context";
import { IGET_RESTAURANT_LOYALTY } from "../../graphql/customQueries";
import "./loyalty.scss";
import { restaurantPath } from "../main";
import { toast } from "../../tabin/components/toast";
import * as yup from "yup";
import { getGetLoyaltyPointsEndpoint } from "../../private/aws-custom";

interface IGetLoyaltyPointsResponse {
    totalPoints: number;
    loyaltyUserId: string | null;
    firstName: string | null;
    email: string | null;
    phoneNumber: string | null;
}

// Centralised loyalty points calculation now lives in the get-loyalty-points lambda. This just calls it.
const fetchLoyaltyPoints = async (params: {
    loyaltyGroupId?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
}): Promise<IGetLoyaltyPointsResponse> => {
    const response = await axios.get(getGetLoyaltyPointsEndpoint(), {
        params: {
            loyaltyGroupId: params.loyaltyGroupId || undefined,
            email: params.email || undefined,
            phoneNumber: params.phoneNumber || undefined,
        },
    });

    return response.data;
};

enum LoyaltyPageState {
    Index,
    Login,
    JoinNow,
}

const nameSchema = yup.string().required("Name is required");
const emailSchema = yup.string().email("Please enter a valid email address").required("Email is required");
const mobileNumberSchema = yup
    .string()
    .matches(/^(0(2\d{7,9}|4\d{8}))$/, "Please enter a valid NZ (e.g., 0212345678) or AU (e.g., 0412345678) mobile number")
    .required("Mobile number is required");

export default () => {
    const { restaurant } = useRestaurant();
    const navigate = useNavigate();
    const [state, setState] = useState<LoyaltyPageState>(LoyaltyPageState.Index);

    if (!restaurant) return <div>This user has not selected any restaurant</div>;

    const handleStateChange = (newState: LoyaltyPageState) => setState(newState);
    const onSkip = () => navigate(`${restaurantPath}/${restaurant.id}`);

    return (
        <>
            {state === LoyaltyPageState.Index && (
                <LoyaltyIndex
                    loyalty={restaurant.loyalties.items[0]}
                    onLogin={() => handleStateChange(LoyaltyPageState.Login)}
                    onJoinNow={() => handleStateChange(LoyaltyPageState.JoinNow)}
                    onSkip={onSkip}
                />
            )}
            {state === LoyaltyPageState.Login && <LoyaltyLogin onBack={() => handleStateChange(LoyaltyPageState.Index)} restaurantId={restaurant.id} />}
            {state === LoyaltyPageState.JoinNow && <LoyaltyJoinNow onBack={() => handleStateChange(LoyaltyPageState.Index)} restaurantId={restaurant.id} />}
        </>
    );
};

const LoyaltyIndex = (props: { loyalty: IGET_RESTAURANT_LOYALTY; onLogin: () => void; onJoinNow: () => void; onSkip: () => void }) => (
    <div className="loyalty-wrapper">
        <div className="h2 mb-6 text-center">Don't miss out our sweet rewards!</div>
        <div className="h2 mb-6">{props.loyalty.name}</div>
        <Button className="loyalty-button mb-2 large" onClick={props.onLogin}>
            Login
        </Button>
        <Button className="loyalty-button mb-2 large" onClick={props.onJoinNow}>
            Join Now
        </Button>
        <Button className="loyalty-button mb-2 large" onClick={props.onSkip}>
            Skip
        </Button>
    </div>
);

const LoyaltyLogin = (props: { onBack: () => void; restaurantId: string }) => {
    const { setCustomerLoyaltyPoints, setCustomerInformation } = useCart();
    const { restaurant } = useRestaurant();
    const navigate = useNavigate();
    const [rewardsIdentifier, setRewardsIdentifier] = useState("");
    const [rewardsIdentifierError, setRewardsIdentifierError] = useState("");

    if (!restaurant) return <div>Restaurant not found</div>;

    const onChangeRewardsIdentifier = (event: React.ChangeEvent<HTMLInputElement>) => setRewardsIdentifier(event.target.value.toLocaleLowerCase());

    const onLogin = async () => {
        try {
            if (!rewardsIdentifier) {
                setRewardsIdentifierError("Required");
                return;
            }

            const loyaltyGroupId = restaurant.loyalties.items.length > 0 ? restaurant.loyalties.items[0].loyaltyGroupId : null;

            // The identifier can be either an email or a mobile number; the endpoint searches both.
            const result = await fetchLoyaltyPoints({
                loyaltyGroupId,
                email: rewardsIdentifier,
                phoneNumber: rewardsIdentifier,
            });

            console.log("loyaltyPoints", result);

            if (result.loyaltyUserId) {
                setCustomerLoyaltyPoints(result.totalPoints);
                setCustomerInformation({
                    firstName: result.firstName || "",
                    email: result.email || "",
                    phoneNumber: result.phoneNumber || "",
                    signatureBase64: "",
                    customFields: [],
                });
                navigate(`${restaurantPath}/${props.restaurantId}`);
            } else {
                setRewardsIdentifierError("Could not find a loyalty user with that email or mobile number.");
            }
        } catch (error) {
            console.error("Error fetching loyalty points:", error);
            setRewardsIdentifierError("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="loyalty-wrapper">
            {/* <div className="h2 mb-6">Loyalty Login</div> */}
            <div className="h2 mb-6">Enter your mobile number or email</div>
            <div className="mb-6">
                <Input
                    className="loyalty-input"
                    name="Rewards Identifier"
                    placeholder="02123456789 or support@tabin.co.nz"
                    value={rewardsIdentifier}
                    onChange={onChangeRewardsIdentifier}
                    error={rewardsIdentifierError}
                />
            </div>
            <Button className="loyalty-button mb-2 large" onClick={onLogin}>
                Login
            </Button>
            <Button className="loyalty-button mb-2 large" onClick={props.onBack}>
                Back
            </Button>
        </div>
    );
};

const LoyaltyJoinNow = (props: { onBack: () => void; restaurantId: string }) => {
    const { setCustomerLoyaltyPoints, setCustomerInformation } = useCart();
    const navigate = useNavigate();
    const { restaurant } = useRestaurant();

    const [firstName, setFirstName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");

    const [firstNameError, setFirstNameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [phoneNumberError, setPhoneNumberError] = useState("");

    if (!restaurant) return <div>Restaurant not found</div>;

    const onChangeFirstName = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFirstName(e.target.value);
        setFirstNameError("");
    };

    const onChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value.toLowerCase());
        setEmailError("");
    };

    const onChangePhoneNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhoneNumber(e.target.value);
        setPhoneNumberError("");
    };

    const onJoinNow = async () => {
        try {
            const loyaltyGroupId = restaurant.loyalties.items.length > 0 ? restaurant.loyalties.items[0].loyaltyGroupId : null;

            // Only look the customer up if they've entered something to search by.
            if (email || phoneNumber) {
                const result = await fetchLoyaltyPoints({
                    loyaltyGroupId,
                    email: email || null,
                    phoneNumber: phoneNumber || null,
                });

                console.log("loyaltyPoints", result);

                if (result.loyaltyUserId) {
                    setCustomerLoyaltyPoints(result.totalPoints);
                    setCustomerInformation({
                        firstName: result.firstName || "",
                        email: result.email || "",
                        phoneNumber: result.phoneNumber || "",
                        signatureBase64: "",
                        customFields: [],
                    });
                    navigate(`${restaurantPath}/${props.restaurantId}`);

                    toast.success("Loyalty user already exists.");
                    return;
                }
            }

            // No existing loyalty user — validate the form and continue as a new customer.
            let invalid = false;

            try {
                await nameSchema.validate(firstName);
                setFirstNameError("");
            } catch (e) {
                setFirstNameError(e.errors[0]);
                invalid = true;
            }

            try {
                await emailSchema.validate(email);
                setEmailError("");
            } catch (e) {
                setEmailError(e.errors[0]);
                invalid = true;
            }

            try {
                await mobileNumberSchema.validate(phoneNumber);
                setPhoneNumberError("");
            } catch (e) {
                setPhoneNumberError(e.errors[0]);
                invalid = true;
            }

            if (!invalid) {
                setCustomerLoyaltyPoints(0);

                setCustomerInformation({
                    firstName: firstName,
                    email: email,
                    phoneNumber: phoneNumber,
                    signatureBase64: "",
                    customFields: [],
                });
                navigate(`${restaurantPath}/${props.restaurantId}`);
            }
        } catch (error) {
            console.error("Error fetching loyalty points:", error);
        }
    };

    return (
        <div className="loyalty-wrapper">
            <div className="h2 mb-6">Enter customer details</div>
            {/* <div className="h2 mt-2 mb-2">Name</div> */}
            <div className="loyalty-input mb-2">
                <Input
                    type="firstName"
                    placeholder="Name"
                    autoFocus={true}
                    onChange={onChangeFirstName}
                    value={firstName}
                    error={firstNameError ? "Required" : ""}
                />
            </div>
            {/* <div className="h2 mt-2 mb-2">Email</div> */}
            <div className="loyalty-input mb-2">
                <Input type="email" placeholder="Email" onChange={onChangeEmail} value={email} error={emailError} />
            </div>
            {/* <div className="h2 mt-2 mb-2">Phone Number</div> */}
            <div className="loyalty-input mb-6">
                <Input type="number" placeholder="Mobile Number" onChange={onChangePhoneNumber} value={phoneNumber} error={phoneNumberError} />
            </div>
            <Button className="loyalty-button mb-2 large" onClick={onJoinNow}>
                Join Now
            </Button>
            <Button className="loyalty-button mb-2 large" onClick={props.onBack}>
                Back
            </Button>
        </div>
    );
};
