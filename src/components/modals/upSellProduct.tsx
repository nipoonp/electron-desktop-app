import { IGET_RESTAURANT_CATEGORY, IGET_RESTAURANT_PRODUCT } from "../../graphql/customQueries";
import { Button } from "../../tabin/components/button";
import { isItemAvailable, isItemSoldOut } from "../../util/util";
import { convertCentsToDollars } from "../../util/util";
import { ModalV2 } from "../../tabin/components/modalv2";
import { getCloudFrontDomainName } from "../../private/aws-custom";

import "./upSellProduct.css";
import { IMatchingUpSellCrossSellItem } from "../../model/model";
import { useRef } from "react";

interface IUpSellProductModalProps {
    isOpen: boolean;
    onSelectUpSellCrossSellProduct: (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => void;
    onClose: () => void;
    upSellCrossSaleProductItems: IMatchingUpSellCrossSellItem[];
}

export const UpSellProductModal = (props: IUpSellProductModalProps) => {
    const { onSelectUpSellCrossSellProduct, upSellCrossSaleProductItems } = { ...props };

    const randomItem = useRef(upSellCrossSaleProductItems[Math.floor(Math.random() * upSellCrossSaleProductItems.length)]);

    // callbacks
    const onModalClose = () => {
        props.onClose();
    };

    const onAddToOrder = (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => {
        onSelectUpSellCrossSellProduct(category, product);
    };

    const productDisplay = (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => {
        const isSoldOut = isItemSoldOut(product.soldOut, product.soldOutDate);
        const isAvailable = isItemAvailable(product.availability);

        return (
            <>
                <div
                    className={`product ${isSoldOut ? "sold-out" : ""} `}
                    onClick={() => !isSoldOut && isAvailable && onAddToOrder(category, product)}
                >
                    {product.image && (
                        <img
                            className="image mb-2"
                            src={`${getCloudFrontDomainName()}/protected/${product.image.identityPoolId}/${product.image.key}`}
                        />
                    )}

                    <div className="name text-bold">
                        {!isAvailable ? `${product.name} (UNAVAILABLE)` : isSoldOut ? `${product.name} (SOLD OUT)` : `${product.name}`}
                    </div>

                    {product.description && <div className="description mt-2">{product.description}</div>}

                    <div className="price mt-4">${convertCentsToDollars(product.price)}</div>
                </div>
            </>
        );
    };

    const products = (
        <div className="products">
            {upSellCrossSaleProductItems.map((item) => {
                return productDisplay(item.category, item.product);
            })}
        </div>
    );

    const mainImage = (
        <>
            <div className="h1 mb-6 text-center">{randomItem.current.product.name}</div>
            {randomItem.current.product.image && (
                <img
                    className="main-image mb-4"
                    src={`${getCloudFrontDomainName()}/protected/${randomItem.current.product.image.identityPoolId}/${
                        randomItem.current.product.image.key
                    }`}
                />
            )}
            <div className="button-container mb-12">
                <Button className="button large no-thank-you-button mr-3" onClick={onModalClose}>
                    No Thank You
                </Button>
                <Button
                    className="button large add-to-order-button"
                    onClick={() => onAddToOrder(randomItem.current.category, randomItem.current.product)}
                >
                    Add To Order
                </Button>
            </div>
        </>
    );

    const content = (
        <>
            <div className="content">
                {/* <img className="image mb-6" src="https://media.bizj.us/view/img/2902221/share-a-coke-its-coming*1200xx1440-811-0-0.jpg" /> */}
                <div className="main-image-container">{mainImage}</div>

                <div className="you-may-also-like-container">
                    <div className="h1 mb-6 text-center">You May Also Like</div>
                    {products}
                </div>
            </div>
        </>
    );

    return (
        <>
            <ModalV2 isOpen={props.isOpen} disableClose={true} onRequestClose={onModalClose}>
                <div className="up-sell-cross-sell">{content}</div>
            </ModalV2>
        </>
    );
};
