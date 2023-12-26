import { Button } from "../../tabin/components/button";
import { ModalV2 } from "../../tabin/components/modalv2";

interface IPromotionCodeModalProps {
  isOpen: string;
  message: string;
  onClose: () => void;
  onContinue: () => void;
}

export const R18MessageModal = (props: IPromotionCodeModalProps) => {
  const onContinue = () => {
    props.onContinue();
    props.onClose();
  };

  return (
    <>
      <ModalV2
        padding="24px"
        isOpen={props.isOpen !== ""}
        disableClose={true}
        onRequestClose={props.onClose}
      >
        <div className="promo-code-modal">
          <div className="h3 mb-3">
            Before you can shop from our range of Wine or Beer, We need you to
            confirm you are over 18, Cheers!
          </div>
          <Button onClick={onContinue} className="mb-1">
            Yes, I am over 18
          </Button>
          <Button onClick={props.onClose}>No, I am not over 18</Button>
        </div>
      </ModalV2>
    </>
  );
};
