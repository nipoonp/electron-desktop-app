import React, { useEffect } from "react";
import { ICartProduct } from "../../model/model";
import {
    IGET_DASHBOARD_UP_SELL_CROSS_SELL_CUSTOM_PRODUCT,
    IGET_DASHBOARD_UP_SELL_CROSS_SELL_CUSTOM_PRODUCT_CATEGORY,
    IGET_RESTAURANT,
    IGET_RESTAURANT_CATEGORY,
    IGET_RESTAURANT_PRODUCT,
} from "../../graphql/customQueries";
import { Button } from "../../tabin/components/button";
import { isItemAvailable, isItemSoldOut } from "../../util/util";
import { convertCentsToDollars } from "../../util/util";
import { ModalV2 } from "../../tabin/components/modalv2";
import { getCloudFrontDomainName } from "../../private/aws-custom";

import "./upSellProduct.scss";
import { useRestaurant } from "../../context/restaurant-context";
import { useCart } from "../../context/cart-context";

export const UpSellProductModal = (props: { isOpen: boolean; onAddItem: () => void; onClose: () => void }) => {
    const { restaurant } = useRestaurant();
    const { addItem } = useCart();

    if (!restaurant) throw "Restaurant is invalid";

    const upSellCrossSellProducts = restaurant.upSellCrossSell.custom.items;

    // callbacks
    const onModalClose = () => {
        props.onClose();
    };

    const onAddToOrder = () =>
        // category: IGET_DASHBOARD_UP_SELL_CROSS_SELL_CUSTOM_PRODUCT_CATEGORY,
        // product: IGET_DASHBOARD_UP_SELL_CROSS_SELL_CUSTOM_PRODUCT
        {
            // const productToOrder: ICartProduct = {
            //     id: product.id,
            //     name: product.name,
            //     price: product.price,
            //     quantity: 1,
            //     notes: null,
            //     modifierGroups: [],
            // };
            // props.onAddItem && props.onAddItem(productToOrder);

            addItem({
                id: "31df659c-d3a4-459a-a373-fdddc08c502c",
                name: "Coke",
                image: {
                    bucket: "tabin223725-dev",
                    identityPoolId: "ap-southeast-2:de90f0a4-8492-410c-8720-7a494ad92f91",
                    key: "2021-05-16_13:00:19.370-share-a-coke-its-coming_1200xx1440-811-0-0.jpeg",
                    region: "ap-southeast-2",
                },
                price: 500,
                quantity: 1,
                notes: null,
                category: {
                    id: "1bd955dd-85c3-4541-915e-17073a17bfaf",
                    name: "UpSell",
                    image: null,
                },
                modifierGroups: [],
            });

            props.onAddItem();
        };

    const productDisplay = (
        category: IGET_DASHBOARD_UP_SELL_CROSS_SELL_CUSTOM_PRODUCT_CATEGORY,
        product: IGET_DASHBOARD_UP_SELL_CROSS_SELL_CUSTOM_PRODUCT
    ) => {
        const isSoldOut = isItemSoldOut(product.soldOut, product.soldOutDate);
        const isAvailable = isItemAvailable(product.availability);

        return (
            <>
                {/* <div className={`product ${isSoldOut ? "sold-out" : ""} `} onClick={() => !isSoldOut && isAvailable && addToOrder(category, product)}> */}
                <div className={`product ${isSoldOut ? "sold-out" : ""} `}>
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
            {upSellCrossSellProducts.map((product) => {
                if (product.categories && product.categories.items[0] && product.categories.items[0].category) {
                    return productDisplay(product.categories.items[0].category, product);
                }
            })}
        </div>
    );

    const content = (
        <>
            <div className="content">
                <div className="h1 mb-6 text-center">Feeling Thirsty?</div>
                {/* <img className="image mb-6" src="https://media.bizj.us/view/img/2902221/share-a-coke-its-coming*1200xx1440-811-0-0.jpg" /> */}
                <MainImage upSellCrossSellProducts={upSellCrossSellProducts} onNoThankYou={onModalClose} onAddToOrder={onAddToOrder} />

                <div className="h1 mb-6 text-center">You May Also Like</div>

                {products}
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

const MainImage = (props: {
    upSellCrossSellProducts: IGET_DASHBOARD_UP_SELL_CROSS_SELL_CUSTOM_PRODUCT[];
    onNoThankYou: () => void;
    onAddToOrder: () => void;
}) => {
    const productsWithImages: IGET_DASHBOARD_UP_SELL_CROSS_SELL_CUSTOM_PRODUCT[] = [];

    props.upSellCrossSellProducts.forEach((product) => {
        if (product.image) {
            productsWithImages.push(product);
        }
    });

    var randomProduct = productsWithImages[Math.floor(Math.random() * productsWithImages.length)];

    return (
        <>
            {randomProduct.image && (
                <>
                    {/* <img
                        className="main-image mb-4"
                        src={`${getCloudFrontDomainName()}/protected/${randomProduct.image.identityPoolId}/${randomProduct.image.key}`}
                    /> */}
                    <img
                        className="main-image mb-4"
                        src={`https://d2nmoln0sb0cri.cloudfront.net/protected/ap-southeast-2:de90f0a4-8492-410c-8720-7a494ad92f91/2021-05-16_13:00:19.370-share-a-coke-its-coming_1200xx1440-811-0-0.jpeg`}
                    />
                    <div className="button-container mb-12">
                        <Button className="button large no-thank-you-button mr-3" onClick={props.onNoThankYou}>
                            No Thank You
                        </Button>
                        <Button
                            className="button large add-to-order-button"
                            // onClick={() => addToOrder(randomProduct.categories.items[3].products.items[0].product)}
                            onClick={props.onAddToOrder}
                        >
                            Add To Order
                        </Button>
                    </div>
                </>
            )}
        </>
    );
};
