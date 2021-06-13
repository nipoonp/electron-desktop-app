import React, { useState } from "react";
import { KioskModal } from "../../tabin/components/kioskModal";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import { isItemAvailable, isItemSoldOut } from "../../util/isItemAvailable";
import { convertCentsToDollars } from "../../util/moneyConversion";
import { IGET_RESTAURANT_CATEGORY, IGET_RESTAURANT_PRODUCT } from "../../graphql/customQueries";
import { KioskProductSearchField } from "../../tabin/components/kioskProductSearchField";
import { KioskButton } from "../../tabin/components/kioskButton";
import { useRestaurant } from "../../context/restaurant-context";

import "./searchProductModal.scss";

interface IFilteredProduct {
    category: IGET_RESTAURANT_CATEGORY;
    product: IGET_RESTAURANT_PRODUCT;
}

interface ISearchProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClickSearchProduct: (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => void;
}

export const SearchProductModal = (props: ISearchProductModalProps) => {
    const { restaurant } = useRestaurant();

    const [searchTerm, setSearchTerm] = useState("");
    const [filteredProducts, setFilteredProducts] = useState<IFilteredProduct[]>([]);

    if (!restaurant) throw "Restaurant is invalid!";

    const onModalClose = () => {
        props.onClose();
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (!value) return;

        const newFilteredProducts: IFilteredProduct[] = [];

        restaurant.categories.items.forEach((category) => {
            category.products.items.forEach((p) => {
                if (p.product.name.toLowerCase().includes(value.toLowerCase())) {
                    newFilteredProducts.push({
                        category: category,
                        product: p.product,
                    });
                }
            });
        });

        setFilteredProducts(newFilteredProducts);
    };

    const formatProductName = (name: string) => {
        const regex = new RegExp(searchTerm, "i");
        const nameArray = name.split(regex);

        if (nameArray.length == 1) {
            return <span>{nameArray[0]}</span>;
        } else {
            return nameArray.map((item, index) => {
                if (index != 0) {
                    return (
                        <>
                            <span style={{ color: "orange" }}>{searchTerm.toUpperCase()}</span>
                            <span>{item}</span>
                        </>
                    );
                } else {
                    return <span>{item}</span>;
                }
            });
        }
    };

    const productDisplay = (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => {
        const isSoldOut = isItemSoldOut(product.soldOut, product.soldOutDate);
        const isAvailable = isItemAvailable(product.availability);

        function onClickProduct(category: any, product: any) {
            props.onClickSearchProduct(category, product);
        }

        return (
            <>
                <div
                    className={`product ${isSoldOut ? "sold-out" : ""} `}
                    onClick={() => !isSoldOut && isAvailable && onClickProduct(category, product)}
                >
                    <div style={{ margin: "0 auto" }}>
                        {product.image && (
                            <img
                                className="image mb-2"
                                src={`${getCloudFrontDomainName()}/protected/${product.image.identityPoolId}/${product.image.key}`}
                            />
                        )}
                    </div>

                    <div className="name text-bold">
                        {formatProductName(product.name)}
                        {!isAvailable ? `(UNAVAILABLE)` : isSoldOut ? ` (SOLD OUT)` : ""}
                    </div>

                    {product.description && <div className="description mt-2">{product.description}</div>}

                    <div className="price mt-4">${convertCentsToDollars(product.price)}</div>
                </div>
            </>
        );
    };

    const menuProducts = (
        <div className="products-wrapper">
            <div className="products">
                {filteredProducts.map((filteredProduct) => {
                    return <>{productDisplay(filteredProduct.category, filteredProduct.product)}</>;
                })}
            </div>
        </div>
    );

    const content = (
        <>
            <div className="content">
                <div className="close-button-wrapper">
                    <KioskButton className="close-button" onClick={onModalClose}>
                        Close
                    </KioskButton>
                </div>
                <div className="h2 mb-6">What do you feel like eating today?</div>
                {/* <KioskProductSearchField name="name" type="text" placeholder="Search..." onChange={onChange} />
                <Space6 /> */}
                {searchTerm != "" && filteredProducts.length == 0 ? <div className="text-bold">No results found</div> : <>{menuProducts}</>}
                <div className="mb-12"></div>
            </div>
        </>
    );

    return (
        <>
            <KioskModal isOpen={props.isOpen} onRequestClose={onModalClose}>
                <div className="search-product-modal">{content}</div>
            </KioskModal>
        </>
    );
};
