import { useEffect } from "react";
import { Button } from "../../tabin/components/button";
import { ModalV2 } from "../../tabin/components/modalv2";
import "./itemAddedUpdatedModal.scss";
import { ICartProduct } from "../../model/model";
import { convertCentsToDollars } from "../../util/util";
interface IPromotionCodeModalProps {
  isOpen: boolean;
  soldOutProduct: ICartProduct[];
  onClose: () => void;
  onContinue: () => void;
}

export const ProductSoldOutModal = (props: IPromotionCodeModalProps) => {
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
                Below items in your cart are no longer available. Please review your cart before ordering
            </div>
          {props.soldOutProduct.map((el)=>(
            <>
                <div className="order-item">
                <div className="text-bold" key={el.id}>
                    {el.name}
                </div>
                
                <div className="text-center">
                    <div className="h2 text-primary">${convertCentsToDollars(el.price)}</div>                    
                </div>
            </div>
            </>
          ))}

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
