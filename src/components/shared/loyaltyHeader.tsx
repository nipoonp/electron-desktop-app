import { useNavigate } from "react-router";
import { useCart } from "../../context/cart-context";
import { Button } from "../../tabin/components/button";
import "./loyaltyHeader.scss";
import { useState } from "react";
import { RewardsModal } from "../modals/rewardsModal";

export const LoyaltyHeader = (props: { showRedeemButton: boolean }) => {
    const [showRewardsModal, setShowRewardsModal] = useState(false);

    const { customerInformation, customerLoyaltyPoints, setCustomerLoyaltyPoints } = useCart();

    const onLoyaltyRedeem = () => {
        setShowRewardsModal(true);
    };

    const onCloseRewardsModal = () => {
        setShowRewardsModal(false);
    };

    const onLoyaltyLogout = () => {
        setCustomerLoyaltyPoints(null);
    };

    const rewardsModal = () => {
        return <>{showRewardsModal && <RewardsModal isOpen={showRewardsModal} onClose={onCloseRewardsModal} />}</>;
    };

    const modalsAndSpinners = <>{rewardsModal()}</>;

    return (
        <>
            <div className="loyalty-header">
                <div className="h2">Hi {customerInformation?.firstName}!</div>
                <div className="h3">
                    You have {customerLoyaltyPoints} {customerLoyaltyPoints === 1 ? "point" : "points"}
                </div>
                <div className="loyalty-header-buttons-wrapper">
                    {props.showRedeemButton ? (
                        <Button className="loyalty-header-button-redeem" onClick={onLoyaltyRedeem}>
                            Redeem
                        </Button>
                    ) : (
                        <div>Redeem on checkout page</div>
                    )}
                    <Button className="loyalty-header-button-logout" onClick={onLoyaltyLogout}>
                        Logout
                    </Button>
                </div>
            </div>
            {modalsAndSpinners}
        </>
    );
};
