import { IGET_RESTAURANT_CATEGORY, IGET_RESTAURANT_PRODUCT } from "../../graphql/customQueries";
import { Button } from "../../tabin/components/button";
import { isItemAvailable, isProductQuantityAvailable, isItemSoldOut, getQuantityRemainingText } from "../../util/util";
import { convertCentsToDollars } from "../../util/util";
import { ModalV2 } from "../../tabin/components/modalv2";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import { IMatchingUpSellCrossSellProductItem } from "../../model/model";
import { useRef } from "react";
import { CachedImage } from "../../tabin/components/cachedImage";
import { useCart } from "../../context/cart-context";

import "./upSellCrossSell.scss";

interface IUpSellProductModalProps {
    isOpen: boolean;
    onSelectUpSellCrossSellProduct: (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => void;
    onClose: () => void;
    upSellCrossSaleProductItems: IMatchingUpSellCrossSellProductItem[];
}

export const UpSellProductModal = (props: IUpSellProductModalProps) => {
    const { onSelectUpSellCrossSellProduct, upSellCrossSaleProductItems } = { ...props };

    const { cartProductQuantitiesById } = useCart();

    const randomItemIndex = Math.floor(Math.random() * upSellCrossSaleProductItems.length);
    const randomItem = useRef(upSellCrossSaleProductItems[randomItemIndex]);

    // callbacks
    const onModalClose = () => {
        props.onClose();
    };

    const onAddToOrder = (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => {
        onSelectUpSellCrossSellProduct(category, product);
    };

    const productDisplay = (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => {
        const isSoldOut = isItemSoldOut(product.soldOut, product.soldOutDate);
        const isProductAvailable = isItemAvailable(product.availability);
        const isCategoryAvailable = isItemAvailable(category.availability);
        const isQuantityAvailable = isProductQuantityAvailable(product, cartProductQuantitiesById);

        const isValid = !isSoldOut && isProductAvailable && isCategoryAvailable && isQuantityAvailable;

        return (
            <>
                <div key={product.id} className={`product ${isValid ? "" : "sold-out"}`} onClick={() => isValid && onAddToOrder(category, product)}>
                    {product.totalQuantityAvailable && product.totalQuantityAvailable <= 5 ? (
                        <span className="quantity-remaining ml-2">{getQuantityRemainingText(product.totalQuantityAvailable)}</span>
                    ) : (
                        <></>
                    )}

                    {product.image && (
                        <CachedImage
                            className="image mb-2"
                            url={`${getCloudFrontDomainName()}/protected/${product.image.identityPoolId}/${product.image.key}`}
                            alt="product-image"
                        />
                    )}

                    <div className="name text-bold">{product.name}</div>

                    {product.description && <div className="description mt-2">{product.description}</div>}

                    {product.tags && (
                        <div className="tags mt-2">
                            {product.tags.split(";").map((tag) => (
                                <div className="tag">{tag}</div>
                            ))}
                        </div>
                    )}

                    <div className="price mt-4">${convertCentsToDollars(product.price)}</div>
                </div>
            </>
        );
    };

    const products = (
        <div className="products pt-2">
            {upSellCrossSaleProductItems.map((item, index) => {
                if (index == randomItemIndex) return;

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

            {randomItem.current.product.description && <div className="description">{randomItem.current.product.description}</div>}

            {randomItem.current.product.tags && (
                <div className="tags mt-2">
                    {randomItem.current.product.tags.split(";").map((tag) => (
                        <div className="tag">{tag}</div>
                    ))}
                </div>
            )}

            <div className="price mt-4 mb-6">${convertCentsToDollars(randomItem.current.product.price)}</div>
            <div className="button-container">
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
                {mainImage}
                {upSellCrossSaleProductItems.length > 1 && (
                    <div className="mt-12">
                        <div className="h1 mb-4 text-center">You May Also Like</div>
                        {products}
                    </div>
                )}
            </div>
        </>
    );

    return (
        <>
            <ModalV2 padding="0" width="650px" isOpen={props.isOpen} disableClose={true} onRequestClose={onModalClose}>
                <div className="up-sell-cross-sell">{content}</div>
            </ModalV2>
        </>
    );
};
