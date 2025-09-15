import { useNavigate } from "react-router";
import { useState } from "react";
import { Button } from "../../tabin/components/button";
import { Input } from "../../tabin/components/input";
import { useRestaurant } from "../../context/restaurant-context";
import { useCart } from "../../context/cart-context";
import { useGetLoyaltyUsersByPhoneNumberLazyQuery } from "../../hooks/useGetLoyaltyUsersByPhoneNumberLazyQuery";
import { useGetLoyaltyUsersByEmailLazyQuery } from "../../hooks/useGetLoyaltyUsersByEmailLazyQuery";
import { IGET_LOYALTY_USER_BY_PHONE_NUMBER_EMAIL, IGET_RESTAURANT_LOYALTY } from "../../graphql/customQueries";
import "./loyalty.scss";
import { restaurantPath } from "../main";
import { toast } from "../../tabin/components/toast";
import * as yup from "yup";
import { calculateTotalLoyaltyPoints } from "../../util/util";

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
            {state === LoyaltyPageState.Login && (
                <LoyaltyLogin onBack={() => handleStateChange(LoyaltyPageState.Index)} restaurantId={restaurant.id} />
            )}
            {state === LoyaltyPageState.JoinNow && (
                <LoyaltyJoinNow onBack={() => handleStateChange(LoyaltyPageState.Index)} restaurantId={restaurant.id} />
            )}
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
    const navigate = useNavigate();
    const [rewardsIdentifier, setRewardsIdentifier] = useState("");
    const [rewardsIdentifierError, setRewardsIdentifierError] = useState("");

    const { getLoyaltyUsersByPhoneNumberLazyQuery } = useGetLoyaltyUsersByPhoneNumberLazyQuery(rewardsIdentifier, props.restaurantId);
    const { getLoyaltyUsersByEmailLazyQuery } = useGetLoyaltyUsersByEmailLazyQuery(rewardsIdentifier, props.restaurantId);

    const onChangeRewardsIdentifier = (event: React.ChangeEvent<HTMLInputElement>) => setRewardsIdentifier(event.target.value.toLocaleLowerCase());

    const onLogin = async () => {
        try {
            if (!rewardsIdentifier) {
                setRewardsIdentifierError("Required");
                return;
            }

            const loyaltyUser = await searchLoyaltyUser();

            console.log("loyaltyUser", loyaltyUser);

            if (loyaltyUser) {
                const totalPoints = calculateTotalLoyaltyPoints(loyaltyUser.loyaltyHistories.items);

                setCustomerLoyaltyPoints(totalPoints);
                setCustomerInformation({
                    firstName: loyaltyUser.firstName,
                    email: loyaltyUser.email,
                    phoneNumber: loyaltyUser.phoneNumber,
                    signatureBase64: "",
                    customFields: [],
                });
                navigate(`${restaurantPath}/${props.restaurantId}`);
            } else {
                setRewardsIdentifierError("Could not find a loyalty user with that email or mobile number.");
            }
        } catch (error) {
            console.error("Error searching loyalty user:", error);
        }
    };

    const searchLoyaltyUser = async (): Promise<IGET_LOYALTY_USER_BY_PHONE_NUMBER_EMAIL | null> => {
        const resPhoneNumber = await getLoyaltyUsersByPhoneNumberLazyQuery({
            variables: { phoneNumber: rewardsIdentifier },
        });

        if (resPhoneNumber?.data.getLoyaltyUserByPhoneNumber.items.length > 0) {
            return resPhoneNumber.data.getLoyaltyUserByPhoneNumber.items[0];
        }

        const resEmail = await getLoyaltyUsersByEmailLazyQuery({
            variables: { email: rewardsIdentifier },
        });

        return resEmail?.data.getLoyaltyUserByEmail.items.length > 0 ? resEmail.data.getLoyaltyUserByEmail.items[0] : null;
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

    const [firstName, setFirstName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");

    const [firstNameError, setFirstNameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [phoneNumberError, setPhoneNumberError] = useState("");

    const { getLoyaltyUsersByPhoneNumberLazyQuery } = useGetLoyaltyUsersByPhoneNumberLazyQuery(phoneNumber, props.restaurantId);
    const { getLoyaltyUsersByEmailLazyQuery } = useGetLoyaltyUsersByEmailLazyQuery(email, props.restaurantId);

    const onChangeFirstName = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFirstName(e.target.value);
        setFirstNameError("");
    };

    const onChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        setEmailError("");
    };

    const onChangePhoneNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhoneNumber(e.target.value);
        setPhoneNumberError("");
    };

    const searchLoyaltyUser = async (): Promise<IGET_LOYALTY_USER_BY_PHONE_NUMBER_EMAIL | null> => {
        const resPhoneNumber = await getLoyaltyUsersByPhoneNumberLazyQuery({
            variables: { phoneNumber: phoneNumber },
        });

        if (resPhoneNumber?.data.getLoyaltyUserByPhoneNumber.items.length > 0) {
            return resPhoneNumber.data.getLoyaltyUserByPhoneNumber.items[0];
        }

        const resEmail = await getLoyaltyUsersByEmailLazyQuery({
            variables: { email: email },
        });

        return resEmail?.data.getLoyaltyUserByEmail.items.length > 0 ? resEmail.data.getLoyaltyUserByEmail.items[0] : null;
    };

    const onJoinNow = async () => {
        const loyaltyUser = await searchLoyaltyUser();

        console.log("loyaltyUser", loyaltyUser);

        if (loyaltyUser) {
            const totalPoints = calculateTotalLoyaltyPoints(loyaltyUser.loyaltyHistories.items);

            setCustomerLoyaltyPoints(totalPoints);
            setCustomerInformation({
                firstName: loyaltyUser.firstName,
                email: loyaltyUser.email,
                phoneNumber: loyaltyUser.phoneNumber,
                signatureBase64: "",
                customFields: [],
            });
            navigate(`${restaurantPath}/${props.restaurantId}`);

            toast.success("Loyalty user already exists.");
        } else {
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
