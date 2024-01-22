import { useEffect } from "react";
import { Button } from "../../tabin/components/button";
import { ModalV2 } from "../../tabin/components/modalv2";
import "./itemAddedUpdatedModal.scss";
interface IPromotionCodeModalProps {
  isOpen: string;
  message: string;
  onClose: () => void;
  onContinue: () => void;
  paymentOutcomeApprovedRedirectTimeLeft: number;
  incrementRedirectTimer: (time: number) => void;
}

export const R18MessageModal = (props: IPromotionCodeModalProps) => {
  const onContinue = () => {
    props.onContinue();
  };

  useEffect(() => {
    props.incrementRedirectTimer(30);
  }, []);

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
            Before you can shop from our range of {props.message}, We need you
            to confirm you are over 18, Cheers!
          </div>
          <div className="h4 mb-3">
            Redirecting in {props.paymentOutcomeApprovedRedirectTimeLeft}{" "}
            {props.paymentOutcomeApprovedRedirectTimeLeft > 1
              ? " seconds"
              : " second"}{" "}
            ...
          </div>
          <div className="d-flex gap-1 j-content-end">
            <Button onClick={onContinue}>Yes, I am over 18</Button>
            <Button onClick={props.onClose} className="cancel-button">
              No, I am not over 18
            </Button>
          </div>
        </div>
      </ModalV2>
    </>
  );
};
