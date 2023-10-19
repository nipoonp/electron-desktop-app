import { useEffect, useRef, useState } from "react";

import { useNavigate } from "react-router";
import { useParams } from "react-router-dom";
import { useGetRestaurantQuery } from "../../hooks/useGetRestaurantQuery";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { checkoutPath, beginOrderPath, orderTypePath, tableNumberPath, customerInformationPath } from "../main";
import { convertCentsToDollars, getQuantityRemainingText, isProductQuantityAvailable } from "../../util/util";
import { ProductModal } from "../modals/product";
import { SearchProductModal } from "../modals/searchProductModal";
import { IGET_RESTAURANT_PRODUCT, IGET_RESTAURANT_CATEGORY, IS3Object, EOrderType } from "../../graphql/customQueries";
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
import { CachedImage } from "../../tabin/components/cachedImage";
import { useAlert } from "../../tabin/components/alert";
import { useRegister } from "../../context/register-context";
import { Input } from "../../tabin/components/input";
import { useGetProductsBySKUCodeByRestaurantLazyQuery } from "../../hooks/useGetProductsBySKUCodeByRestaurantLazyQuery";
import { Checkout } from "./checkout";
import { toast } from "../../tabin/components/toast";
import KioskBoard from "kioskboard";

import "./restaurant.scss";

interface IMostPopularProduct {
    category: IGET_RESTAURANT_CATEGORY;
    product: IGET_RESTAURANT_PRODUCT;
}

export interface IMostPopularProductObj {
    [id: string]: boolean;
}

export default () => {
    // context
    const { restaurantId, selectedCategoryId, selectedProductId } = useParams();
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    const { payments, clearCart, orderType, subTotal, products, cartProductQuantitiesById, addProduct, setOrderType } = useCart();
    const { setRestaurant, menuCategories: restaurantCategories, menuProducts: restaurantProducts } = useRestaurant();
    const { register, isPOS } = useRegister();

    // query
    const { data: restaurant, error: getRestaurantError, loading: getRestaurantLoading } = useGetRestaurantQuery(restaurantId || "");
    const { getProductsBySKUCodeByRestaurant } = useGetProductsBySKUCodeByRestaurantLazyQuery();

    // states
    const [selectedCategory, setSelectedCategory] = useState<IGET_RESTAURANT_CATEGORY | null>(null);
    //selectedCategoryForProductModal is a different one so that when you either search for a product or select a most popular product it does not change the selectedCategory.
    const [selectedCategoryForProductModal, setSelectedCategoryForProductModal] = useState<IGET_RESTAURANT_CATEGORY | null>(null);
    const [selectedProductForProductModal, setSelectedProductForProductModal] = useState<IGET_RESTAURANT_PRODUCT | null>(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showItemAddedModal, setShowItemAddedModal] = useState(false);
    const [showSearchProductModal, setShowSearchProductModal] = useState(false);

    const [searchProductSKUCode, setSearchProductSKUCode] = useState("");
    const [mostPopularProducts, setMostPopularProducts] = useState<IMostPopularProduct[]>([]);
    const [subCategories, setSubCategories] = useState<string[]>([]);

    const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>();

    const [isShakeAnimationActive, setIsShakeAnimationActive] = useState(false);
    const startShakeAfterSeconds = 30;
    const shakeButtonDurationSeconds = 5;
    const userOnPageDuration: React.MutableRefObject<number> = useRef(1);

    const numpadRef = useRef(null);

    // const inputRef = useRef<HTMLInputElement | null>(null);

    // useEffect(() => {
    //     const focusTimer = setInterval(() => {
    //         if (inputRef.current && document.activeElement !== inputRef.current) {
    //             inputRef.current.focus();
    //         }
    //     }, 1000);

    //     return () => {
    //         clearInterval(focusTimer);
    //     };
    // }, []);

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
        if (numpadRef.current) {
            KioskBoard.run(numpadRef.current, {
                theme: "light",
                keysArrayOfObjects: [
                    {
                        "0": "7",
                        "1": "8",
                        "2": "9",
                    },
                    {
                        "0": "4",
                        "1": "5",
                        "2": "6",
                    },
                    {
                        "0": "1",
                        "1": "2",
                        "2": "3",
                    },
                    {
                        "0": "0",
                        "1": ".",
                    },
                ],
            });
        }
    }, [numpadRef]);

    useEffect(() => {
        if (restaurant) {
            setRestaurant(restaurant);

            if (selectedCategoryId) {
                const selectedCategoryItem = restaurantCategories[selectedCategoryId];

                if (selectedCategoryItem) setSelectedCategory(selectedCategoryItem);
            } else if (register && register.defaultCategoryView) {
                const selectedCategoryItem = restaurantCategories[register.defaultCategoryView];

                if (selectedCategoryItem) {
                    setSelectedCategory(selectedCategoryItem);
                    onProcessSubCategories(selectedCategoryItem);
                }
            }

            if (selectedProductId) {
                const selectedProductItem = restaurantProducts[selectedProductId];

                if (selectedProductItem) setSelectedProductForProductModal(selectedProductItem);

                setShowProductModal(true);
            }
        }
    }, [restaurant]);

    const compareSortFunc = (a: IMostPopularProduct, b: IMostPopularProduct) => {
        if (!a.product.totalQuantitySold || !b.product.totalQuantitySold) return 0;
        if (a.product.totalQuantitySold > b.product.totalQuantitySold) return -1;
        if (a.product.totalQuantitySold < b.product.totalQuantitySold) return 1;
        return 0;
    };

    useEffect(() => {
        if (!restaurant || !register) return;

        const newMostPopularProducts: IMostPopularProduct[] = [];
        const newMostPopularProductsObj: IMostPopularProductObj[] = [];

        restaurant.categories.items.forEach((c) => {
            if (c.availablePlatforms && !c.availablePlatforms.includes(register.type)) return;

            c.products &&
                c.products.items.forEach((p) => {
                    if (p.product.availablePlatforms && !p.product.availablePlatforms.includes(register.type)) return;

                    if (p.product.totalQuantitySold) {
                        //Insert item if its not already in there.
                        if (newMostPopularProductsObj[p.product.id] === undefined) {
                            newMostPopularProducts.push({
                                category: c,
                                product: p.product,
                            });
                            newMostPopularProductsObj[p.product.id] = true;
                        }
                    }
                });
        });

        newMostPopularProducts.sort(compareSortFunc);

        setMostPopularProducts(newMostPopularProducts.slice(0, 20));
    }, [restaurant]);

    const onProcessSubCategories = (category: IGET_RESTAURANT_CATEGORY) => {
        const newSubCategories: string[] = [];

        category.products &&
            category.products.items.forEach((p) => {
                p.product.subCategories &&
                    p.product.subCategories.split(";").forEach((subCategory) => {
                        if (!newSubCategories.includes(subCategory)) newSubCategories.push(subCategory);
                    });
            });

        setSubCategories(newSubCategories);

        if (newSubCategories.length > 0) {
            setSelectedSubCategory(newSubCategories[0]);
        } else {
            setSelectedSubCategory(null);
        }
    };

    useEffect(() => {
        if (showProductModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [showProductModal]);

    // callbacks
    const onClickCart = () => {
        if (register && register.availableOrderTypes.length > 1 && orderType == null) {
            navigate(orderTypePath);
        } else if (register && register.availableOrderTypes.length == 1) {
            setOrderType(register.availableOrderTypes[0]);

            if (register.availableOrderTypes[0] === EOrderType.DINEIN && register.enableTableFlags) {
                navigate(tableNumberPath);
            } else {
                navigate(checkoutPath);
            }
        } else {
            navigate(checkoutPath);
        }
    };

    const onCancelOrder = () => {
        const cancelOrder = () => {
            clearCart();
            navigate(beginOrderPath);
        };

        if (payments.length > 0) {
            showAlert(
                "Incomplete Payments",
                "There have been partial payments made on this order. Are you sure you would like to cancel this order?",
                () => {},
                () => {
                    cancelOrder();
                }
            );
        } else {
            cancelOrder();
        }
    };

    const onCloseProductModal = () => {
        setShowProductModal(false);
    };

    const onAddProduct = (product: ICartProduct) => {
        addProduct(product);

        if (!isPOS) setShowItemAddedModal(true);
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

    if (!register) {
        return <>Register not selected</>;
    }

    if (!restaurant.verified) {
        return <div>Restaurant is not verified</div>;
    }

    const onAddProductToCart = (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT, amount?: number) => {
        console.log("xxx...amount", amount);
        if (amount) {
            amount = amount * 100;
        }

        const productToOrder: ICartProduct = {
            id: product.id,
            name: amount ? "Custom Amount" : product.name,
            price: amount ? amount : product.price,
            kitchenName: amount ? "Custom Amount" : product.kitchenName,
            totalPrice: amount ? amount : product.price,
            discount: 0,
            image: product.image
                ? {
                      key: product.image.key,
                      region: product.image.region,
                      bucket: product.image.bucket,
                      identityPoolId: product.image.identityPoolId,
                  }
                : null,
            quantity: 1,
            notes: null,
            category: {
                id: category.id,
                name: category.name,
                kitchenName: category.kitchenName,
                image: category.image
                    ? {
                          key: category.image.key,
                          region: category.image.region,
                          bucket: category.image.bucket,
                          identityPoolId: category.image.identityPoolId,
                      }
                    : null,
            },
            modifierGroups: [],
        };

        onAddProduct(productToOrder);
    };

    const onClickProduct = (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => {
        if (product.modifierGroups && product.modifierGroups.items.length > 0) {
            setSelectedCategoryForProductModal(category);
            setSelectedProductForProductModal(product);
            setShowProductModal(true);
        } else {
            onAddProductToCart(category, product);
        }

        navigate(customerInformationPath);
    };

    const onClickSearchProduct = (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => {
        if (!isPOS && product.modifierGroups && product.modifierGroups.items.length > 0) {
            setSelectedCategoryForProductModal(category);
            setSelectedProductForProductModal(product);
            onCloseSearchProductModal();
            setShowProductModal(true);
        } else {
            onAddProductToCart(category, product);
            onCloseSearchProductModal();
        }
    };

    const productModal = (
        <>
            {selectedCategoryForProductModal && selectedProductForProductModal && showProductModal && (
                <ProductModal
                    isOpen={showProductModal}
                    onClose={onCloseProductModal}
                    category={selectedCategoryForProductModal}
                    product={selectedProductForProductModal}
                    onAddProduct={onAddProduct}
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
        const isProductAvailable = isItemAvailable(product.availability);
        const isCategoryAvailable = isItemAvailable(category.availability);
        const isQuantityAvailable = isProductQuantityAvailable(product, cartProductQuantitiesById);

        const isValid = !isSoldOut && isProductAvailable && isCategoryAvailable && isQuantityAvailable;

        return (
            <>
                <div key={product.id} className={`product ${isValid ? "" : "sold-out"}`} onClick={() => isValid && onClickProduct(category, product)}>
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

                    <div className={`display-price mt-4 ${product.displayPrice ? "" : "display-none"}`}>{product.displayPrice}</div>
                    <div className={`price mt-4 ${product.displayPrice ? "display-none" : ""}`}>${convertCentsToDollars(product.price)}</div>
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

        const isSoldOut = isItemSoldOut(category.soldOut, category.soldOutDate);
        const isAvailable = isItemAvailable(category.availability);

        const isCategoryValid = !isSoldOut && isAvailable;

        if (!isCategoryValid) return <></>;

        return (
            <div
                key={category.id}
                className={`category ${isSelected ? "selected" : ""} ${isAvailable ? "" : "unavailable"}`}
                onClick={() => {
                    isAvailable && onCategorySelected(category);
                }}
            >
                {!isAvailable ? (
                    <div className={`name unavailable`}>{category.name} (UNAVAILABLE)</div>
                ) : isSelected ? (
                    <div className="name text-bold">{category.name}</div>
                ) : (
                    <div className="name">{category.name}</div>
                )}
            </div>
        );
    };

    const menuCategories = (
        <>
            {restaurant.categories.items.map((c, index) => {
                if (c.availablePlatforms && !c.availablePlatforms.includes(register.type)) return;

                return (
                    <Category
                        key={c.id}
                        isSelected={selectedCategory != null && selectedCategory.id == c.id}
                        category={c}
                        onCategorySelected={(category: IGET_RESTAURANT_CATEGORY) => {
                            setSelectedCategory(category);
                            onProcessSubCategories(category);
                        }}
                    />
                );
            })}
        </>
    );

    const menuSearchProduct = (
        <>
            <Shake
                active={isPOS ? false : isShakeAnimationActive}
                h={5}
                v={5}
                r={3}
                dur={300}
                int={10}
                max={100}
                fixed={true}
                fixedStop={false}
                freez={false}
            >
                <div
                    className="category search-product-button background-grey"
                    onClick={() => {
                        setShowSearchProductModal(true);
                    }}
                >
                    <CachedImage className="icon" url={`${getPublicCloudFrontDomainName()}/images/search-icon.png`} alt="search-icon" />
                    <div className="name">Search</div>
                </div>
            </Shake>
        </>
    );

    const onChangeSearchProductSKUCode = async (e) => {
        const value = e.target.value;

        setSearchProductSKUCode(value);
    };

    const onKeyDownSearchProductSKUCode = async (e) => {
        if (e.key === "Enter") {
            const res = await getProductsBySKUCodeByRestaurant({
                variables: {
                    skuCode: searchProductSKUCode,
                    productRestaurantId: restaurant.id,
                },
            });

            const products: IGET_RESTAURANT_PRODUCT[] = res.data.getProductsBySKUCodeByRestaurant.items;

            if (products.length > 0) {
                const skuProduct = products[0];
                const skuCategory = skuProduct.categories.items[0].category;

                if (skuProduct.modifierGroups && skuProduct.modifierGroups.items.length > 0) {
                    setSelectedCategoryForProductModal(skuCategory);
                    setSelectedProductForProductModal(skuProduct);
                    setShowProductModal(true);
                } else {
                    onAddProductToCart(skuCategory, skuProduct);
                }

                setSearchProductSKUCode("");
            } else {
                toast.error("No product found");
            }
        }
    };

    const menuSkuSearchProduct = (
        <>
            {/* Could not use the Tabin Input component here. When we try pass the ref field it does not seem to work */}
            {/* <div className="search-product-sku-code-wrapper">
                <input
                    ref={inputRef}
                    type="text"
                    name="searchProductSKUCode"
                    value={searchProductSKUCode}
                    placeholder="123456789"
                    onChange={onChangeSearchProductSKUCode}
                    onKeyDown={onKeyDownSearchProductSKUCode}
                />
            </div> */}
            <div className="category background-grey">
                <Input
                    name="searchProductSKUCode"
                    value={searchProductSKUCode}
                    autoFocus={true}
                    placeholder="123456789"
                    onChange={onChangeSearchProductSKUCode}
                    onKeyDown={onKeyDownSearchProductSKUCode}
                />
            </div>
        </>
    );

    const menuMostPopularCategory = (
        <div
            className={`category most-popular-category background-grey ${!selectedCategory ? "selected" : ""}`}
            onClick={() => {
                setSelectedCategory(null);
            }}
        >
            <CachedImage className="icon" url={`${getPublicCloudFrontDomainName()}/images/most-popular.png`} alt="most-popular-icon" />
            <div className="name">Most Popular</div>
        </div>
    );

    const menuMostPopularProducts = (
        <div>
            {!selectedCategory && (
                <>
                    <div className="product-category-name h1 text-center mb-6">Most Popular</div>
                    <div className="products">
                        {mostPopularProducts.map((mostPopularProduct) => productDisplay(mostPopularProduct.category, mostPopularProduct.product))}
                    </div>
                </>
            )}
        </div>
    );

    const menuProducts = (
        <div>
            {selectedCategory &&
                restaurant.categories.items.map((c) => {
                    if (selectedCategory.id !== c.id) return;
                    if (c.availablePlatforms && !c.availablePlatforms.includes(register.type)) return;

                    return (
                        <>
                            <div className="product-category-name h1 text-center mb-6">{c.name}</div>
                            {c.description && <div className="product-category-description text-bold text-center mb-6 h3">{c.description}</div>}
                            {subCategories.length > 0 && (
                                <div className="product-sub-category-wrapper mb-6">
                                    {subCategories.map((subCategory) => (
                                        <div
                                            className={`product-sub-category h3 ${selectedSubCategory === subCategory ? "selected" : ""}`}
                                            onClick={() => setSelectedSubCategory(subCategory)}
                                        >
                                            {subCategory}
                                        </div>
                                    ))}
                                    <div
                                        className={`product-sub-category background-grey h3 ${selectedSubCategory === null ? "selected" : ""}`}
                                        onClick={() => setSelectedSubCategory(null)}
                                    >
                                        All
                                    </div>
                                </div>
                            )}
                            {c.image && (
                                <div className="product-category-image-wrapper mb-6">
                                    <CachedImage
                                        url={`${getCloudFrontDomainName()}/protected/${c.image.identityPoolId}/${c.image.key}`}
                                        className="product-category-image"
                                        alt="category-image"
                                    />
                                </div>
                            )}
                            <div className="products">
                                {c.products &&
                                    c.products.items.map((p) => {
                                        if (p.product.availablePlatforms && !p.product.availablePlatforms.includes(register.type)) return;
                                        if (
                                            (selectedSubCategory &&
                                                p.product.subCategories &&
                                                !p.product.subCategories.split(";").includes(selectedSubCategory)) ||
                                            (selectedSubCategory && selectedSubCategory && !p.product.subCategories)
                                        )
                                            return;

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
                    <CachedImage
                        className="shopping-bag-icon mr-2"
                        url={`${getPublicCloudFrontDomainName()}/images/shopping-bag-icon.png`}
                        alt="shopping-bag-icon"
                    />
                    <div className="h2">Total: ${convertCentsToDollars(subTotal)}</div>
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

    const onAddCustomAmount = () => {
        if (!restaurant.categories.items[0] || !restaurant.products.items[0]) return;

        if (numpadRef.current) {
            //@ts-ignore
            onAddProductToCart(restaurant.categories.items[0], restaurant.products.items[0], numpadRef.current.value);
            navigate(customerInformationPath);
        }
    };

    return (
        <>
            <PageWrapper>
                <div className="restaurant-wrapper">
                    <div className="restaurant">
                        <div className="restaurant-container">
                            <div className="categories-wrapper">
                                {restaurant.logo && <RestaurantLogo image={restaurant.logo} />}
                                {menuSearchProduct}
                                {register.enableSkuScanner && menuSkuSearchProduct}
                                {menuMostPopularCategory}
                                {menuCategories}
                            </div>
                            <div className="products-wrapper">
                                {menuMostPopularProducts}
                                {menuProducts}
                                <div style={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
                                    <div className="h2 mt-6 mb-2">Or enter a custom amount...</div>
                                    <div style={{ width: "350px", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                                        <input
                                            className="inputFromKey input"
                                            ref={numpadRef}
                                            data-kioskboard-type="numpad"
                                            type="number"
                                            // autoFocus={true}
                                            // onChange={onChange}
                                            // value={buzzer ? buzzer.slice(0, 2) : ""}
                                        />
                                        <Button onClick={onAddCustomAmount}>Next</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* {!isPOS && <div className="footer-wrapper">{restaurantFooter}</div>} */}
                    </div>
                    {products && products.length > 0 && isPOS && (
                        <div className="restaurant-checkout">
                            <Checkout />
                        </div>
                    )}
                </div>
                {modals}
            </PageWrapper>
        </>
    );
};

const RestaurantLogo = (props: { image: IS3Object }) => {
    return (
        <CachedImage
            url={`${getCloudFrontDomainName()}/protected/${props.image.identityPoolId}/${props.image.key}`}
            className="restaurant-logo"
            alt="restaurant-logo"
        />
    );
};
