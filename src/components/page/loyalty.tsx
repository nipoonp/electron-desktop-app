import { useNavigate } from "react-router";
import { useState } from "react";
import { Button } from "../../tabin/components/button";
import { Input } from "../../tabin/components/input";
import { useRestaurant } from "../../context/restaurant-context";
import { useCart } from "../../context/cart-context";
import { useGetLoyaltyUsersByPhoneNumberLazyQuery } from "../../hooks/useGetLoyaltyUsersByPhoneNumberLazyQuery";
import { useGetLoyaltyUsersByEmailLazyQuery } from "../../hooks/useGetLoyaltyUsersByEmailLazyQuery";
import { IGET_LOYALTY_USER_BY_PHONE_NUMBER_EMAIL } from "../../graphql/customQueries";
import "./loyalty.scss";
import { restaurantPath } from "../main";

enum LoyaltyPageState {
    Index,
    Login,
    JoinNow,
}

export default function LoyaltyComponent() {
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
                    onSkip={onSkip}
                    onLogin={() => handleStateChange(LoyaltyPageState.Login)}
                    onJoinNow={() => handleStateChange(LoyaltyPageState.JoinNow)}
                />
            )}
            {state === LoyaltyPageState.Login && (
                <LoyaltyLogin onBack={() => handleStateChange(LoyaltyPageState.Index)} restaurantId={restaurant.id} />
            )}
            {state === LoyaltyPageState.JoinNow && <LoyaltyJoinNow onBack={() => handleStateChange(LoyaltyPageState.Index)} />}
        </>
    );
}

const LoyaltyIndex = ({ onSkip, onLogin, onJoinNow }: { onSkip: () => void; onLogin: () => void; onJoinNow: () => void }) => (
    <>
        <div className="h2 mb-2">Earn Delicious Rewards</div>
        <div className="h3 mb-2">Redeem points and earn rewards</div>
        <Button className="mb-2" onClick={onSkip}>
            Skip
        </Button>
        <Button className="mb-2" onClick={onLogin}>
            Login
        </Button>
        <Button className="mb-2" onClick={onJoinNow}>
            Join Now
        </Button>
    </>
);

const LoyaltyLogin = ({ onBack, restaurantId }: { onBack: () => void; restaurantId: string }) => {
    const { setCustomerLoyaltyPoints, setCustomerInformation } = useCart();
    const navigate = useNavigate();
    const [rewardsIdentifier, setRewardsIdentifier] = useState("");

    const { getLoyaltyUsersByPhoneNumberLazyQuery } = useGetLoyaltyUsersByPhoneNumberLazyQuery(rewardsIdentifier, restaurantId);
    const { getLoyaltyUsersByEmailLazyQuery } = useGetLoyaltyUsersByEmailLazyQuery(rewardsIdentifier, restaurantId);

    const onChangeRewardsIdentifier = (event: React.ChangeEvent<HTMLInputElement>) => setRewardsIdentifier(event.target.value);

    const onSearch = async () => {
        try {
            const loyaltyUser = await searchLoyaltyUser();
            if (loyaltyUser) {
                const totalPoints = calculateTotalPoints(loyaltyUser.loyaltyHistories.items);
                setCustomerLoyaltyPoints(totalPoints);
                setCustomerInformation({
                    firstName: loyaltyUser.firstName,
                    email: loyaltyUser.email,
                    phoneNumber: loyaltyUser.phoneNumber,
                    signatureBase64: "",
                    customFields: [],
                });
                navigate(`${restaurantPath}/${restaurantId}`);
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

    const calculateTotalPoints = (histories: { points: number }[]) => histories.reduce((acc, history) => acc + history.points, 0);

    return (
        <>
            <Button className="mb-2" onClick={onBack}>
                Back
            </Button>
            <div className="mb-2">Loyalty Login</div>
            <Input
                label="Phone Number / Email"
                name="Rewards Identifier"
                placeholder="02123456789 or support@tabin.co.nz"
                value={rewardsIdentifier}
                onChange={onChangeRewardsIdentifier}
            />
            <Button onClick={onSearch}>Search</Button>
        </>
    );
};

const LoyaltyJoinNow = ({ onBack }: { onBack: () => void }) => (
    <>
        <Button className="mb-2" onClick={onBack}>
            Back
        </Button>
        <div>Loyalty Join Now</div>
    </>
);
