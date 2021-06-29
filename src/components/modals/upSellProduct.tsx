import { IGET_RESTAURANT_CATEGORY, IGET_RESTAURANT_PRODUCT } from "../../graphql/customQueries";
import { Button } from "../../tabin/components/button";
import { isItemAvailable, isProductQuantityAvailable, isItemSoldOut, getQuantityRemainingText } from "../../util/util";
import { convertCentsToDollars } from "../../util/util";
import { ModalV2 } from "../../tabin/components/modalv2";
import { getCloudFrontDomainName } from "../../private/aws-custom";

import "./upSellProduct.scss";
import { IMatchingUpSellCrossSellItem } from "../../model/model";
import { useRef } from "react";
import { CachedImage } from "../../tabin/components/cachedImage";
import { useCart } from "../../context/cart-context";

interface IUpSellProductModalProps {
    isOpen: boolean;
    onSelectUpSellCrossSellProduct: (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => void;
    onClose: () => void;
    upSellCrossSaleProductItems: IMatchingUpSellCrossSellItem[];
}

export const UpSellProductModal = (props: IUpSellProductModalProps) => {
    const { onSelectUpSellCrossSellProduct, upSellCrossSaleProductItems } = { ...props };

    const { cartProductQuantitiesById } = useCart();

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
        const isQuantityAvailable = isProductQuantityAvailable(product, cartProductQuantitiesById);

        const isValid = !isSoldOut && isAvailable && isQuantityAvailable;

        return (
            <>
                <div
                    key={product.id}
                    className={`product ${isValid ? "" : "sold-out"}`}
                    onClick={() => !isSoldOut && isAvailable && onAddToOrder(category, product)}
                >
                    {product.totalQuantityAvailable && product.totalQuantityAvailable <= 5 && (
                        <span className="quantity-remaining ml-2">{getQuantityRemainingText(product.totalQuantityAvailable)}</span>
                    )}

                    {product.image && (
                        <CachedImage
                            className="image mb-2"
                            url={`${getCloudFrontDomainName()}/protected/${product.image.identityPoolId}/${product.image.key}`}
                            alt="product-image"
                        />
                    )}

                    <div className="name text-bold">
                        {isValid ? `${product.name}` : `${product.name} (SOLD OUT)`}
                    </div>

                    {product.description && <div className="description mt-2">{product.description}</div>}

                    <div className="price mt-4">${convertCentsToDollars(product.price)}</div>
                </div>
            </>
        );
    };

    const products = (
        <div className="products pt-2">
            {upSellCrossSaleProductItems.map((item) => {
                return productDisplay(item.category, item.product);
            })}
        </div>
    );

    const mainImage = (
        <>
            <div className="h1 mb-6 text-center">{randomItem.current.product.name}</div>
            {randomItem.current.product.image && (
                <CachedImage
                    className="main-image mb-4"
                    url={`${getCloudFrontDomainName()}/protected/${randomItem.current.product.image.identityPoolId}/${
                        randomItem.current.product.image.key
                    }`}
                    alt="product-image"
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
                <div className="main-image-container">{mainImage}</div>
                <div className="you-may-also-like-container">
                    <div className="h1 mb-4 text-center">You May Also Like</div>
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
