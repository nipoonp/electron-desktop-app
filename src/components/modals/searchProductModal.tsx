import React, { useState } from "react";
import { KioskModal } from "../../tabin/components/kioskModal";
import { InputV3 } from "../../tabin/components/inputv3";
import { useCart } from "../../context/cart-context";
import { BoldFont, NormalFont, Title2Font, Title3Font } from "../../tabin/components/fonts";
import { Space, Space2, Space4, Space5, Space6 } from "../../tabin/components/spaces";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import { isItemAvailable, isItemSoldOut } from "../../util/isItemAvailable";
import { convertCentsToDollars } from "../../util/moneyConversion";
import { IGET_RESTAURANT_CATEGORY, IGET_RESTAURANT_PRODUCT } from "../../graphql/customQueries";
import { SizedBox } from "../../tabin/components/sizedBox";
import { KioskProductSearchField } from "../../tabin/components/kioskProductSearchField";
import { CloseIcon } from "../../tabin/components/closeIcon";
import { KioskButton } from "../../tabin/components/kioskButton";

const styles = require("./searchProductModal.module.css");

interface IFilteredProduct {
    category: IGET_RESTAURANT_CATEGORY;
    product: IGET_RESTAURANT_PRODUCT;
}

interface ISearchProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    isProductUpdate: boolean;
    onClickSearchProduct: (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => void;
}

export const SearchProductModal = (props: ISearchProductModalProps) => {
    const { restaurant } = useCart();

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
                    style={{
                        border: "1px solid #e0e0e0",
                        padding: "16px",
                        borderRadius: "10px",
                        opacity: !isSoldOut && isAvailable ? "1" : "0.5",
                    }}
                    onClick={() => !isSoldOut && isAvailable && onClickProduct(category, product)}
                >
                    <div style={{ margin: "0 auto" }}>
                        {product.image && (
                            <>
                                <img
                                    src={`${getCloudFrontDomainName()}/protected/${product.image.identityPoolId}/${product.image.key}`}
                                    style={{
                                        width: "100%",
                                        height: "200px",
                                        borderRadius: "10px",
                                        objectFit: "cover",
                                    }}
                                />
                                <Space2 />
                            </>
                        )}
                    </div>

                    <BoldFont style={{ fontSize: "18px", textAlign: "center" }}>
                        {formatProductName(product.name)}
                        {!isAvailable ? `(UNAVAILABLE)` : isSoldOut ? ` (SOLD OUT)` : ""}
                    </BoldFont>

                    {product.description && (
                        <>
                            <Space2 />
                            <NormalFont style={{ fontWeight: 300, textAlign: "center" }} className={styles.description}>
                                {product.description}
                            </NormalFont>
                        </>
                    )}

                    <Space2 />
                    <NormalFont style={{ textAlign: "center", fontSize: "18px" }}>${convertCentsToDollars(product.price)}</NormalFont>
                </div>
            </>
        );
    };

    const menuProducts = (
        <div style={{ width: "100%" }}>
            <div
                style={{
                    display: "grid",
                    gridGap: "32px",
                    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                }}
            >
                {filteredProducts.map((filteredProduct) => {
                    return <>{productDisplay(filteredProduct.category, filteredProduct.product)}</>;
                })}
            </div>
        </div>
    );

    const content = (
        <>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "column",
                    width: "100%",
                }}
            >
                <div style={{ position: "absolute", top: "32px", right: "32px" }}>
                    <KioskButton
                        style={{
                            backgroundColor: "#ffffff",
                            color: "#484848",
                            border: "1px solid #e0e0e0",
                            padding: "12px 24px",
                        }}
                        onClick={onModalClose}
                    >
                        <NormalFont style={{ fontWeight: 300 }}>Close</NormalFont>
                    </KioskButton>
                </div>
                <Title2Font>What do you feel like eating today?</Title2Font>
                <Space6 />
                <KioskProductSearchField name="name" type="text" placeholder="Search..." onChange={onChange} />
                <Space6 />
                {searchTerm != "" && filteredProducts.length == 0 ? <BoldFont>No results found</BoldFont> : <>{menuProducts}</>}
                <Space size={84} />
            </div>
        </>
    );

    return (
        <>
            <KioskModal isOpen={props.isOpen} onRequestClose={onModalClose}>
                <div
                    style={{
                        padding: "84px",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        position: "relative",
                    }}
                >
                    {content}
                </div>
            </KioskModal>
        </>
    );
};
