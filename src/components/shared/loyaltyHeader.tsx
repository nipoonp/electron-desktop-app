import { useCart } from "../../context/cart-context";
import { Button } from "../../tabin/components/button";
import "./loyaltyHeader.scss";

export const LoyaltyHeader = () => {
    const { customerInformation, customerLoyaltyPoints } = useCart();

    return (
        <>
            <div className="loyalty-header">
                <div className="h2">Hi {customerInformation?.firstName}!</div>
                <div className="h3">You have {customerLoyaltyPoints} points</div>
                <div className="loyalty-header-buttons-wrapper">
                    <Button>Redeem</Button>
                    <Button>Logout</Button>
                </div>
            </div>
        </>
    );
};
