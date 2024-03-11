import { Button } from "../../tabin/components/button";
import { ModalV2 } from "../../tabin/components/modalv2";
import "./itemAddedUpdatedModal.scss";

interface IPromotionCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreNotAvailableModal = (props: IPromotionCodeModalProps) => {
  return (
    <>
      <ModalV2
        padding="24px"
        isOpen={props.isOpen}
        disableClose={true}
        onRequestClose={props.onClose}
      >
        <div className="promo-code-modal">
            <div className="h3 mb-3">
                Store is not open for this time.
            </div>
          

          <div className="d-flex gap-1 j-content-end">
            <Button onClick={props.onClose} className="cancel-button">
              Close
            </Button>
          </div>
        </div>
      </ModalV2>
    </>
  );
};
