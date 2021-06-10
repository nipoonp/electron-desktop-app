import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import { useGetRestaurantQuery } from "../../hooks/useGetRestaurantQuery";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { NormalFont, BoldFont, Title3Font, Title4Font } from "../../tabin/components/fonts";
import { checkoutPath, beginOrderPath, orderTypePath } from "../main";
import { convertCentsToDollars } from "../../util/moneyConversion";
import { ProductModal } from "../modals/product";
import { SearchProductModal } from "../modals/searchProductModal";
import { IGET_RESTAURANT_PRODUCT, IGET_RESTAURANT_CATEGORY, IS3Object } from "../../graphql/customQueries";
import { useCart } from "../../context/cart-context";
import { Space2, Space5 } from "../../tabin/components/spaces";
import { KioskPageWrapper } from "../../tabin/components/kioskPageWrapper";
import { KioskButton } from "../../tabin/components/kioskButton";
import { ItemAddedUpdatedModal } from "../modals/itemAddedUpdatedModal";
import { ICartProduct } from "../../model/model";
import { SizedBox } from "../../tabin/components/sizedBox";
import { isItemAvailable, isItemSoldOut } from "../../util/isItemAvailable";
import { getCloudFrontDomainName, getPublicCloudFrontDomainName } from "../../private/aws-custom";
//@ts-ignore as it does not have the types
import { Shake } from "reshake";
import { useRestaurant } from "../../context/restaurant-context";

const styles = require("./restaurant.module.css");

interface IMostSoldProduct {
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

    const [mostSoldProducts, setMostSoldProducts] = useState<IMostSoldProduct[]>([]);

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

    React.useEffect(() => {
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

    const compareSortFunc = (a: IMostSoldProduct, b: IMostSoldProduct) => {
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

        const newMostSoldProducts: IMostSoldProduct[] = [];

        restaurant.categories.items.forEach((c) => {
            c.products.items.forEach((p) => {
                if (p.product.totalQuantitySold) {
                    newMostSoldProducts.push({
                        category: c,
                        product: p.product,
                    });
                }
            });
        });

        newMostSoldProducts.sort(compareSortFunc);
        setMostSoldProducts(newMostSoldProducts.slice(0, 20));
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
            {selectedCategoryForProductModal && selectedProductForProductModal && restaurant && showProductModal && (
                <ProductModal
                    isOpen={showProductModal}
                    category={selectedCategoryForProductModal}
                    product={selectedProductForProductModal}
                    onAddItem={onAddItem}
                    onClose={onCloseProductModal}
                    restaurantName={restaurant.name}
                    restaurantIsAcceptingOrders={restaurant.isAcceptingOrders}
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
                        {!isAvailable ? `${product.name} (UNAVAILABLE)` : isSoldOut ? `${product.name} (SOLD OUT)` : `${product.name}`}
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

    const menuCategories = (
        <div style={{ overflow: "auto" }}>
            {restaurant.categories.items.map((c, index) => (
                <>
                    {index == 0 && <div style={{ borderBottom: "1px solid #e0e0e0" }}></div>}
                    <Category
                        isSelected={selectedCategory != null && selectedCategory.id == c.id}
                        category={c}
                        onCategorySelected={(category: IGET_RESTAURANT_CATEGORY) => {
                            setSelectedCategory(category);
                        }}
                    />
                </>
            ))}
        </div>
    );

    const menuSearchProduct = (
        <>
            <Shake active={isShakeAnimationActive} h={5} v={5} r={3} dur={300} int={10} max={100} fixed={true} fixedStop={false} freez={false}>
                <div
                    style={{
                        // height: "85px",
                        padding: "30px 24px",
                        backgroundColor: "#e0e0e0",
                        display: "flex",
                        alignItems: "center",
                    }}
                    onClick={() => {
                        setShowSearchProductModal(true);
                    }}
                >
                    <img style={{ height: "24px" }} src={`${getPublicCloudFrontDomainName()}/images/search-icon.png`} />
                    <SizedBox width="10px" />
                    <div>Search</div>
                </div>
            </Shake>
        </>
    );

    const menuMostSoldCategory = (
        <>
            <div
                style={{
                    // height: "85px",
                    padding: "30px 24px",
                    backgroundColor: "#e0e0e0",
                    display: "flex",
                    alignItems: "center",
                    borderLeft: !selectedCategory ? "8px solid var(--primary-color)" : "none",
                }}
                onClick={() => {
                    setSelectedCategory(null);
                }}
            >
                <img style={{ height: "24px" }} src={`${getPublicCloudFrontDomainName()}/images/most-popular.png`} />
                <SizedBox width="10px" />
                <div>Most Popular</div>
            </div>
        </>
    );

    const menuMostSoldProducts = (
        <div style={{ width: "100%" }}>
            {!selectedCategory && (
                <>
                    <Title3Font style={{ fontSize: "36px" }}>Most Popular</Title3Font>
                    <Space5 />
                    <div
                        style={{
                            display: "grid",
                            gridGap: "32px",
                            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                        }}
                    >
                        {mostSoldProducts.map((mostSoldProduct) => {
                            return productDisplay(mostSoldProduct.category, mostSoldProduct.product);
                        })}
                    </div>
                </>
            )}
        </div>
    );

    const menuProducts = (
        <div style={{ width: "100%" }}>
            {selectedCategory &&
                restaurant.categories.items.map((c) => {
                    if (selectedCategory.id !== c.id) {
                        return;
                    }

                    return (
                        <>
                            <Title3Font style={{ fontSize: "36px" }}>{c.name}</Title3Font>
                            <Space5 />
                            <div
                                style={{
                                    display: "grid",
                                    gridGap: "32px",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                                }}
                            >
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
                    <img className="shopping-bag-icon mr-1" src={`${getPublicCloudFrontDomainName()}/images/shopping-bag-icon.jpg`} />
                    <div className="h4 total">Total: ${convertCentsToDollars(total)}</div>
                </div>
                <KioskButton className="view-my-order-button" disabled={!products || products.length == 0} onClick={onClickCart}>
                    View My Order
                </KioskButton>
            </div>
            <KioskButton className="cancel-button" onClick={onCancelOrder}>
                Cancel Order
            </KioskButton>
        </>
    );

    return (
        <>
            <KioskPageWrapper>
                <div className="restaurant">
                    <div className="restaurant-container">
                        <div className="categories-wrapper">
                            {restaurant.logo && <RestaurantLogo image={restaurant.logo} />}
                            {menuSearchProduct}
                            {menuMostSoldCategory}
                            {menuCategories}
                        </div>
                        <div className="products-wrapper">
                            {menuMostSoldProducts}
                            {menuProducts}
                        </div>
                    </div>
                    <div className="footer-wrapper">{restaurantFooter}</div>
                </div>
                {modals}
            </KioskPageWrapper>
        </>
    );
};

const RestaurantLogo = (props: { image: IS3Object }) => {
    return <img src={`${getCloudFrontDomainName()}/protected/${props.image.identityPoolId}/${props.image.key}`} className="restaurant-logo" />;
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
                <div className="bold">{category.name}</div>
            ) : (
                <div className="name">{category.name}</div>
            )}
        </div>
    );
};
