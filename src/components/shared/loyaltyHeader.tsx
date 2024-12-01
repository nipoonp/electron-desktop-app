import { useCart } from "../../context/cart-context";
import { Button } from "../../tabin/components/button";
import "./loyaltyHeader.scss";

export const LoyaltyHeader = () => {
    const { customerInformation, customerLoyaltyPoints, setCustomerLoyaltyPoints } = useCart();

    const onLoyaltyLogout = () => {
        setCustomerLoyaltyPoints(null);
    };

    return (
        <>
            <div className="loyalty-header">
                <div className="h2">Hi {customerInformation?.firstName}!</div>
                <div className="h3">
                    You have {customerLoyaltyPoints} {customerLoyaltyPoints && customerLoyaltyPoints > 2 ? "points" : "point"}
                </div>
                <div className="loyalty-header-buttons-wrapper">
                    <Button className="loyalty-header-button-redeem">Redeem</Button>
                    <Button className="loyalty-header-button-logout" onClick={onLoyaltyLogout}>
                        Logout
                    </Button>
                </div>
            </div>
        </>
    );
};
