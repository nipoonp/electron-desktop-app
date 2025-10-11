import { useState, CSSProperties } from "react";

import { Modal } from "../../tabin/components/modal";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import {
    convertCentsToDollars,
    getContrastTextColor,
    getQuantityRemainingText,
    isItemAvailable,
    isItemSoldOut,
    isProductQuantityAvailable,
} from "../../util/util";
import { IGET_RESTAURANT_CATEGORY, IGET_RESTAURANT_PRODUCT } from "../../graphql/customQueries";
import { Button } from "../../tabin/components/button";
import { useRestaurant } from "../../context/restaurant-context";

import "./searchProductModal.scss";
import { Input } from "../../tabin/components/input";
import { CachedImage } from "../../tabin/components/cachedImage";
import { useCart } from "../../context/cart-context";
import { FiX } from "react-icons/fi";
import { useRegister } from "../../context/register-context";

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
    const { register } = useRegister();
    const { cartProductQuantitiesById } = useCart();

    const [searchTerm, setSearchTerm] = useState("");
    const [filteredProducts, setFilteredProducts] = useState<IFilteredProduct[]>([]);

    if (!restaurant) throw "Restaurant is invalid!";
    if (!register) throw "Register is invalid!";

    const onModalClose = () => {
        props.onClose();
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (!value) return;

        const newFilteredProducts: IFilteredProduct[] = [];

        restaurant.categories.items.forEach((category) => {
            category.products &&
                category.products.items.forEach((p) => {
                    if (category.availablePlatforms && !category.availablePlatforms.includes(register.type)) return;
                    if (p.product.availablePlatforms && !p.product.availablePlatforms.includes(register.type)) return;

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
        const isProductAvailable = isItemAvailable(product.availability);
        const isCategoryAvailable = isItemAvailable(category.availability);
        const isQuantityAvailable = isProductQuantityAvailable(product, cartProductQuantitiesById);

        const isValid = !isSoldOut && isProductAvailable && isCategoryAvailable && isQuantityAvailable;

        const onClickProduct = (category: any, product: any) => {
            props.onClickSearchProduct(category, product);
        };

        console.log("xxx...", product.image);

        return (
            <>
                <div
                    key={product.id}
                    className={`product ${isValid ? "" : "sold-out"}`}
                    style={{
                        backgroundColor: product.backgroundColor ? product.backgroundColor : undefined,
                        color: product.backgroundColor ? getContrastTextColor(product.backgroundColor) : undefined,
                        borderColor: product.borderColor ? product.borderColor : product.backgroundColor ? "unset" : undefined,
                        borderWidth: product.borderColor ? "2px" : undefined,
                    }}
                    onClick={() => isValid && onClickProduct(category, product)}
                >
                    {product.totalQuantityAvailable && product.totalQuantityAvailable <= 5 ? (
                        <span className="quantity-remaining ml-2">{getQuantityRemainingText(product.totalQuantityAvailable)}</span>
                    ) : (
                        <></>
                    )}

                    {product.imageUrl ? (
                        <CachedImage url={`${product.imageUrl}`} className="image mb-2" alt="product-image" />
                    ) : product.image ? (
                        <CachedImage
                            url={`${getCloudFrontDomainName()}/protected/${product.image.identityPoolId}/${product.image.key}`}
                            className="image mb-2"
                            alt="product-image"
                        />
                    ) : null}

                    <div className="name text-bold">{isValid ? `${product.name}` : `${product.name} (SOLD OUT)`}</div>

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
                    <FiX className="close-button" size={36} onClick={onModalClose} />
                </div>
                <div className="h1 mb-6">What do you feel like eating today?</div>
                <Input className="product-search-field mb-6" name="name" type="text" placeholder="Search..." onChange={onChange} />
                {searchTerm != "" && filteredProducts.length == 0 ? <div className="text-bold">No results found</div> : <>{menuProducts}</>}
                <div className="mb-12"></div>
            </div>
        </>
    );

    return (
        <>
            <Modal isOpen={props.isOpen} onRequestClose={onModalClose}>
                <div className="search-product-modal">{content}</div>
            </Modal>
        </>
    );
};
