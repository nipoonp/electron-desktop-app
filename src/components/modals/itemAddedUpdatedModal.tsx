import { useEffect } from "react";
import { useCart } from "../../context/cart-context";
import { convertCentsToDollars } from "../../util/util";
import { Modal } from "../../tabin/components/modal";
import { getPublicCloudFrontDomainName } from "../../private/aws-custom";
import { CachedImage } from "../../tabin/components/cachedImage";

import "./itemAddedUpdatedModal.scss";

export const ItemAddedUpdatedModal = (props: { isOpen: boolean; onClose: () => void; isProductUpdate: boolean }) => {
    const { subTotal } = useCart();

    const timeoutDelay = 1500;

    useEffect(() => {
        setTimeout(() => {
            props.onClose();
        }, timeoutDelay);
    }, []);

    const onModalClose = () => {
        props.onClose();
    };

    const content = (
        <>
            <div className="content">
                <CachedImage
                    className="image mb-3"
                    url={`${getPublicCloudFrontDomainName()}/images/shopping-bag-success-icon.png`}
                    alt="shopping-bag-icon"
                />
                <div className="h2 mb-3 item-added-updated-text">Item {props.isProductUpdate ? "Updated" : "Added"}</div>
                <div className="mb-3">Your total has been updated</div>
                <div className="h2">${convertCentsToDollars(subTotal)}</div>
            </div>
        </>
    );

    return (
        <>
            <Modal isOpen={props.isOpen} onRequestClose={onModalClose}>
                <div className="item-added-updated-modal">{content}</div>
            </Modal>
        </>
    );
};
