import { useRestaurant } from "../../context/restaurant-context";
import { Button } from "../../tabin/components/button";
import { ModalV2 } from "../../tabin/components/modalv2";

interface IPromotionCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: () => void;
}

export const OrderThresholdMessageModal = (props: IPromotionCodeModalProps) => {
    const { restaurant } = useRestaurant();

    const onContinue = () => {
        props.onContinue();
        props.onClose();
    };

    return (
        <>
            <ModalV2 padding="24px" isOpen={props.isOpen} disableClose={false} onRequestClose={props.onClose}>
                <div className="promo-code-modal">
                    <div className="h3 mb-3">{restaurant?.orderThresholdMessage}</div>
                    <Button onClick={onContinue}>Continue</Button>
                </div>
            </ModalV2>
        </>
    );
};
