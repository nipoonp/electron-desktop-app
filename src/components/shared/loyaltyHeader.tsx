import { useCart } from "../../context/cart-context";

export const LoyaltyHeader = () => {
    const { customerInformation, customerLoyaltyPoints } = useCart();

    return (
        <>
            <div className="loyalty-header">
                <div className="h2 mb-1">Hi {customerInformation?.firstName}!</div>
                <div className="h3">You have {customerLoyaltyPoints} points</div>
            </div>
        </>
    );
};
