import { useEffect, useRef, useState } from "react";

import { useHistory } from "react-router";
import { useGetRestaurantQuery } from "../../hooks/useGetRestaurantQuery";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { checkoutPath, beginOrderPath, orderTypePath } from "../main";
import { convertCentsToDollars } from "../../util/util";
import { ProductModal } from "../modals/product";
import { SearchProductModal } from "../modals/searchProductModal";
import { IGET_RESTAURANT_PRODUCT, IGET_RESTAURANT_CATEGORY, IS3Object } from "../../graphql/customQueries";
import { useCart } from "../../context/cart-context";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { Button } from "../../tabin/components/button";
import { ItemAddedUpdatedModal } from "../modals/itemAddedUpdatedModal";
import { ICartProduct } from "../../model/model";
import { isItemAvailable, isItemSoldOut } from "../../util/util";
import { getCloudFrontDomainName, getPublicCloudFrontDomainName } from "../../private/aws-custom";
//@ts-ignore as it does not have the types
import { Shake } from "reshake";
import { useRestaurant } from "../../context/restaurant-context";

import "./restaurant.scss";

interface IMostPopularProduct {
    category: IGET_RESTAURANT_CATEGORY;
    product: IGET_RESTAURANT_PRODUCT;
}

export const Restaurant = (props: { restaurantID: string }) => {
    // context
    const history = useHistory();
    const { clearCart, orderType, total, products, addItem } = useCart();
    const { setRestaurant } = useRestaurant();

    // query
    const { data: restaurant, error: getRestaurantError, loading: getRestaurantLoading } = useGetRestaurantQuery(props.restaurantID);

    // states
    const [selectedCategory, setSelectedCategory] = useState<IGET_RESTAURANT_CATEGORY | null>(null);
    //selectedCategoryForProductModal is a different one so that when you either search for a product or select a most popular product it does not change the selectedCategory.
    const [selectedCategoryForProductModal, setSelectedCategoryForProductModal] = useState<IGET_RESTAURANT_CATEGORY | null>(null);
    const [selectedProductForProductModal, setSelectedProductForProductModal] = useState<IGET_RESTAURANT_PRODUCT | null>(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showItemAddedModal, setShowItemAddedModal] = useState(false);
    const [showSearchProductModal, setShowSearchProductModal] = useState(false);

    const [mostPopularProducts, setMostPopularProducts] = useState<IMostPopularProduct[]>([]);

    const [isShakeAnimationActive, setIsShakeAnimationActive] = useState(false);
    const startShakeAfterSeconds = 30;
    const shakeButtonDurationSeconds = 5;
    const userOnPageDuration: React.MutableRefObject<number> = useRef(1);

    useEffect(() => {
        const ticker = setInterval(() => {
            if (userOnPageDuration.current % startShakeAfterSeconds == 0) {
                setIsShakeAnimationActive(true);
            }

            if (userOnPageDuration.current % startShakeAfterSeconds == shakeButtonDurationSeconds) {
                setIsShakeAnimationActive(false);
            }

            userOnPageDuration.current++;
        }, 1000);

        return () => clearTimeout(ticker);
    }, []);

    useEffect(() => {
        if (restaurant) {
            setRestaurant(restaurant);

            // restaurant.categories.items.every((c) => {
            //     if (isItemAvailable(c.availability)) {
            //         setSelectedCategory(c);
            //         return false;
            //     }
            //     return true;
            // });
        }
    }, [restaurant]);

    const compareSortFunc = (a: IMostPopularProduct, b: IMostPopularProduct) => {
        if (a.product.totalQuantitySold > b.product.totalQuantitySold) {
            return -1;
        }
        if (a.product.totalQuantitySold < b.product.totalQuantitySold) {
            return 1;
        }
        return 0;
    };

    useEffect(() => {
        if (!restaurant) return;

        const newMostPopularProducts: IMostPopularProduct[] = [];

        restaurant.categories.items.forEach((c) => {
            c.products.items.forEach((p) => {
                if (p.product.totalQuantitySold) {
                    newMostPopularProducts.push({
                        category: c,
                        product: p.product,
                    });
                }
            });
        });

        newMostPopularProducts.sort(compareSortFunc);
        setMostPopularProducts(newMostPopularProducts.slice(0, 20));
    }, [restaurant]);

    useEffect(() => {
        if (showProductModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [showProductModal]);

    // callbacks
    const onClickCart = () => {
        if (orderType == null) {
            history.push(orderTypePath);
        } else {
            history.push(checkoutPath);
        }
    };

    const onCancelOrder = () => {
        clearCart();
        history.push(beginOrderPath);
    };

    const onCloseProductModal = () => {
        setShowProductModal(false);
    };

    const onAddItem = (product: ICartProduct) => {
        addItem(product);
        setShowItemAddedModal(true);
    };

    const onCloseItemAddedModal = () => {
        setShowItemAddedModal(false);
    };

    const onCloseSearchProductModal = () => {
        setShowSearchProductModal(false);
    };

    // displays THAT SHOULD BE IN CONTEXT
    if (getRestaurantLoading) {
        return <FullScreenSpinner show={true} text="Loading restaurant" />;
    }

    if (getRestaurantError) {
        return <h1>Couldn't get restaurant. Try Refreshing</h1>;
    }

    if (!restaurant) {
        return <>Restaurant does not exist</>;
    }

    if (!restaurant.verified) {
        return <div>Restaurant is not verified</div>;
    }

    const onClickProduct = (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => {
        setSelectedCategoryForProductModal(category);
        setSelectedProductForProductModal(product);
        setShowProductModal(true);
    };

    const onClickSearchProduct = (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => {
        setSelectedCategoryForProductModal(category);
        setSelectedProductForProductModal(product);
        onCloseSearchProductModal();
        setShowProductModal(true);
    };

    const productModal = (
        <>
            {selectedCategoryForProductModal && selectedProductForProductModal && showProductModal && (
                <ProductModal
                    isOpen={showProductModal}
                    category={selectedCategoryForProductModal}
                    product={selectedProductForProductModal}
                    onAddItem={onAddItem}
                    onClose={onCloseProductModal}
                />
            )}
        </>
    );

    const itemAddedModal = (
        <>{showItemAddedModal && <ItemAddedUpdatedModal isOpen={showItemAddedModal} onClose={onCloseItemAddedModal} isProductUpdate={false} />}</>
    );

    const searchProductModal = (
        <>
            {showSearchProductModal && (
                <SearchProductModal isOpen={showSearchProductModal} onClose={onCloseSearchProductModal} onClickSearchProduct={onClickSearchProduct} />
            )}
        </>
    );

    const modals = (
        <>
            {productModal}
            {itemAddedModal}
            {searchProductModal}
        </>
    );

    const productDisplay = (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => {
        const isSoldOut = isItemSoldOut(product.soldOut, product.soldOutDate);
        const isAvailable = isItemAvailable(product.availability);

        return (
            <>
                <div
                    className={`product ${isSoldOut ? "sold-out" : ""} `}
                    onClick={() => !isSoldOut && isAvailable && onClickProduct(category, product)}
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

    const Category = (props: {
        isSelected: boolean;
        category: IGET_RESTAURANT_CATEGORY;
        onCategorySelected: (category: IGET_RESTAURANT_CATEGORY) => void;
    }) => {
        const { isSelected, category, onCategorySelected } = props;

        const isAvailable = isItemAvailable(category.availability);

        return (
            <div
                key={category.id}
                className={`category ${isSelected ? "selected" : ""}`}
                onClick={() => {
                    isAvailable && onCategorySelected(category);
                }}
            >
                {!isAvailable ? (
                    <div className={`name ${isAvailable ? "available" : "unavailable"}`}>{category.name} (UNAVAILABLE)</div>
                ) : isSelected ? (
                    <div className="text-bold">{category.name}</div>
                ) : (
                    <div className="name">{category.name}</div>
                )}
            </div>
        );
    };

    const menuCategories = (
        <>
            {restaurant.categories.items.map((c, index) => (
                <Category
                    isSelected={selectedCategory != null && selectedCategory.id == c.id}
                    category={c}
                    onCategorySelected={(category: IGET_RESTAURANT_CATEGORY) => {
                        setSelectedCategory(category);
                    }}
                />
            ))}
        </>
    );

    const menuSearchProduct = (
        <>
            <Shake active={isShakeAnimationActive} h={5} v={5} r={3} dur={300} int={10} max={100} fixed={true} fixedStop={false} freez={false}>
                <div
                    className="category background-grey"
                    onClick={() => {
                        setShowSearchProductModal(true);
                    }}
                >
                    <img className="icon" src={`${getPublicCloudFrontDomainName()}/images/search-icon.png`} />
                    <div className="name">Search</div>
                </div>
            </Shake>
        </>
    );

    const menuMostPopularCategory = (
        <div
            className={`category background-grey ${!selectedCategory ? "selected" : ""}`}
            onClick={() => {
                setSelectedCategory(null);
            }}
        >
            <img className="icon" src={`${getPublicCloudFrontDomainName()}/images/most-popular.png`} />
            <div className="name">Most Popular</div>
        </div>
    );

    const menuMostPopularProducts = (
        <div>
            {!selectedCategory && (
                <>
                    <div className="h1 mb-6">Most Popular</div>
                    <div className="products">
                        {mostPopularProducts.map((mostPopularProduct) => {
                            return productDisplay(mostPopularProduct.category, mostPopularProduct.product);
                        })}
                    </div>
                </>
            )}
        </div>
    );

    const menuProducts = (
        <div>
            {selectedCategory &&
                restaurant.categories.items.map((c) => {
                    if (selectedCategory.id !== c.id) {
                        return;
                    }

                    return (
                        <>
                            <div className="h1 mb-6">{c.name}</div>
                            <div className="products">
                                {c.products.items.map((p) => {
                                    return productDisplay(c, p.product);
                                })}
                            </div>
                        </>
                    );
                })}
        </div>
    );

    const restaurantFooter = (
        <>
            <div className="total-container">
                <div className="total-wrapper mb-2">
                    <img className="shopping-bag-icon mr-2" src={`${getPublicCloudFrontDomainName()}/images/shopping-bag-icon.png`} />
                    <div className="h4 total">Total: ${convertCentsToDollars(total)}</div>
                </div>
                <Button className="large" disabled={!products || products.length == 0} onClick={onClickCart}>
                    View My Order
                </Button>
            </div>
            <Button className="cancel-button" onClick={onCancelOrder}>
                Cancel Order
            </Button>
        </>
    );

    return (
        <>
            <PageWrapper>
                <div className="restaurant">
                    <div className="restaurant-container">
                        <div className="categories-wrapper">
                            {restaurant.logo && <RestaurantLogo image={restaurant.logo} />}
                            {menuSearchProduct}
                            {menuMostPopularCategory}
                            {menuCategories}
                        </div>
                        <div className="products-wrapper">
                            {menuMostPopularProducts}
                            {menuProducts}
                        </div>
                    </div>
                    <div className="footer-wrapper">{restaurantFooter}</div>
                </div>
                {modals}
            </PageWrapper>
        </>
    );
};

const RestaurantLogo = (props: { image: IS3Object }) => {
    return <img src={`${getCloudFrontDomainName()}/protected/${props.image.identityPoolId}/${props.image.key}`} className="restaurant-logo" />;
};
