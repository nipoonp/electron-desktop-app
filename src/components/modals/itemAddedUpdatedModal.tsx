import { useEffect } from "react";
import { useCart } from "../../context/cart-context";
import { convertCentsToDollars } from "../../util/util";
import { Modal } from "../../tabin/components/modal";
import { getPublicCloudFrontDomainName } from "../../private/aws-custom";

import "./itemAddedUpdatedModal.scss";
import { CachedImage } from "../../tabin/components/cachedImage";

export const ItemAddedUpdatedModal = (props: { isOpen: boolean; onClose: () => void; isProductUpdate: boolean }) => {
    const { total } = useCart();

    useEffect(() => {
        setTimeout(() => {
            props.onClose();
        }, 1500);
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
                <div className="h2">${convertCentsToDollars(total)}</div>
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
