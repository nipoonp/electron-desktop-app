import { useState } from "react";
import { FiX } from "react-icons/fi";
import { useCart } from "../../context/cart-context";
import { useRegister } from "../../context/register-context";
import { useRestaurant } from "../../context/restaurant-context";
import { IGET_RESTAURANT_CATEGORY, IGET_RESTAURANT_PRODUCT } from "../../graphql/customQueries";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import { CachedImage } from "../../tabin/components/cachedImage";
import { Input } from "../../tabin/components/input";
import { Modal } from "../../tabin/components/modal";
import { convertCentsToDollars, getQuantityRemainingText, isItemAvailable, isItemSoldOut, isProductQuantityAvailable } from "../../util/util";
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
                    if (!category.availablePlatforms.includes(register.type)) return;
                    if (!p.product.availablePlatforms.includes(register.type)) return;

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

    const productDisplay = (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT, key = product.id) => {
        const isSoldOut = isItemSoldOut(product.soldOut, product.soldOutDate);
        const isAvailable = isItemAvailable(product.availability);
        const isQuantityAvailable = isProductQuantityAvailable(product, cartProductQuantitiesById);

        const isValid = !isSoldOut && isAvailable && isQuantityAvailable;

        const onClickProduct = (category: any, product: any) => {
            props.onClickSearchProduct(category, product);
        };

        return (
                <div key={key} className={`product ${isValid ? "" : "sold-out"}`} onClick={() => isValid && onClickProduct(category, product)}>
                    {product.totalQuantityAvailable && product.totalQuantityAvailable <= 5 && (
                        <span className="quantity-remaining ml-2">{getQuantityRemainingText(product.totalQuantityAvailable)}</span>
                    )}

                    <div style={{ margin: "0 auto" }}>
                        {product.image && (
                            <CachedImage
                                className="image mb-2"
                                url={`${getCloudFrontDomainName()}/protected/${product.image.identityPoolId}/${product.image.key}`}
                                alt="product-image"
                            />
                        )}
                    </div>

                    <div className="name text-bold">{isValid ? `${product.name}` : `${product.name} (SOLD OUT)`}</div>

                    {product.description && <div className="description mt-2">{product.description}</div>}

                    {product.tags && (
                        <div className="tags mt-2">
                            {product.tags.split(";").map((tag) => (
                                <div className="tag" key={tag}>{tag}</div>
                            ))}
                        </div>
                    )}

                    <div className="price mt-4">${convertCentsToDollars(product.price)}</div>
                </div>
        );
    };

    const menuProducts = (
        <div className="products-wrapper">
            <div className="products">
                {filteredProducts.map((filteredProduct,index) => {
                    return productDisplay(filteredProduct.category, filteredProduct.product, `m-${index}-${filteredProduct.product.id}`);
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
                {searchTerm !== "" && filteredProducts.length === 0 ? <div className="text-bold">No results found</div> : <>{menuProducts}</>}
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
