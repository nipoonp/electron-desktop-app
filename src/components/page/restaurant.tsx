import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { useGetRestaurantQuery } from "../../hooks/useGetRestaurantQuery";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import {
  NormalFont,
  BoldFont,
  Title3Font,
  Title4Font,
} from "../../tabin/components/fonts";
import { GrayColor } from "../../tabin/components/colors";
import { checkoutPath, beginOrderPath, orderTypePath } from "../main";
import { convertCentsToDollars } from "../../util/moneyConversion";
import { ProductModal } from "../modals/product";
import {
  IGET_RESTAURANT_PRODUCT,
  IGET_RESTAURANT_CATEGORY,
  IS3Image,
} from "../../graphql/customQueries";
import { useCart } from "../../context/cart-context";
import {
  Space2,
  Space,
  Space4,
  Space6,
  Space5,
} from "../../tabin/components/spaces";
import { KioskPageWrapper } from "../../tabin/components/kioskPageWrapper";
import { ButtonV2 } from "../../tabin/components/buttonv2";
import { S3Image } from "aws-amplify-react";
import { KioskButton } from "../../tabin/components/kioskButton";
import { ItemAddedUpdatedModal } from "../modals/itemAddedUpdatedModal";
import { ICartProduct } from "../../model/model";
import { SizedBox } from "../../tabin/components/sizedBox";
import { isItemAvailable, isItemSoldOut } from "../../util/isItemAvailable";

const styles = require("./restaurant.module.css");

export const Restaurant = (props: { restaurantID: string }) => {
  // context
  const history = useHistory();
  const {
    setRestaurant,
    clearCart,
    orderType,
    total,
    products,
    addItem,
  } = useCart();

  // query
  const {
    data: restaurant,
    error: getRestaurantError,
    loading: getRestaurantLoading,
  } = useGetRestaurantQuery(props.restaurantID);

  // states
  const [selectedCategory, setSelectedCategory] = useState<IGET_RESTAURANT_CATEGORY | null>(
    null
  );
  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState<IGET_RESTAURANT_PRODUCT | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showItemAddedModal, setShowItemAddedModal] = useState(false);

  React.useEffect(() => {
    if (restaurant) {
      setRestaurant(restaurant);

      restaurant.categories.items.every(c => {
        if (isItemAvailable(c.availability)) {
          setSelectedCategory(c);
          return false;
        }
        return true;
      })
    }
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

  if (selectedCategory == null) {
    return <div>No available category</div>
  }

  const productModal = (
    <>
      {selectedCategory && selectedProduct && restaurant && showProductModal && (
        <ProductModal
          isOpen={showProductModal}
          category={selectedCategory}
          product={selectedProduct}
          onAddItem={onAddItem}
          onClose={onCloseProductModal}
          restaurantName={restaurant.name}
          restaurantIsAcceptingOrders={restaurant.isAcceptingOrders}
        />
      )}
    </>
  );

  const itemAddedModal = (
    <>
      {showItemAddedModal && (
        <ItemAddedUpdatedModal
          isOpen={showItemAddedModal}
          onClose={onCloseItemAddedModal}
          isProductUpdate={false}
        />
      )}
    </>
  );

  const modals = (
    <>
      {productModal}
      {itemAddedModal}
    </>
  );

  const onClickProduct = (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => {
    setSelectedCategory(category);
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  // const restaurantImage = () => {
  //   console.log("xxx....", restaurant.image);
  //   if (!restaurant.image) {
  //     return <></>;
  //   }

  //   return (
  //     <S3Image
  //       imgKey={restaurant.image.key}
  //       level="protected"
  //       theme={{
  //         photoImg: { width: "100%", height: "100%" },
  //       }}
  //     />
  //   );
  // };

  const productDisplay = (category: IGET_RESTAURANT_CATEGORY, product: IGET_RESTAURANT_PRODUCT) => {
    const isSoldOut = isItemSoldOut(
      product.soldOut,
      product.soldOutDate
    );
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
                <S3Image
                  imgKey={product.image.key}
                  identityId={product.image.identityPoolId}
                  level="protected"
                  theme={{
                    photoImg: {
                      width: "100%",
                      height: "200px",
                      borderRadius: "10px",
                      objectFit: "cover",
                    },
                  }}
                />
                <Space2 />
              </>
            )}
          </div>

          <BoldFont style={{ fontSize: "18px", textAlign: "center" }}>
            {!isAvailable ? `${product.name} (UNAVAILABLE)` : isSoldOut
              ? `${product.name} (SOLD OUT)`
              : `${product.name}`}
          </BoldFont>

          {product.description && (
            <>
              <Space2 />
              <NormalFont
                style={{ fontWeight: 300, textAlign: "center" }}
                className={styles.description}
              >
                {product.description}
              </NormalFont>
            </>
          )}

          <Space2 />
          <NormalFont style={{ textAlign: "center", fontSize: "18px" }}>
            ${convertCentsToDollars(product.price)}
          </NormalFont>
        </div>
      </>
    );
  };

  const menuCategories = (
    <div style={{ overflow: "auto" }}>
      {restaurant.categories.items.map((c, index) => (
        <>
          {index == 0 && (
            <div style={{ borderBottom: "1px solid #e0e0e0" }}></div>
          )}
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

  const menuProducts = (
    <div style={{ width: "100%" }}>
      {restaurant.categories.items.map((c) => {
        if (selectedCategory != null && selectedCategory.id !== c.id) {
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
    <div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flex: "1",
            fontWeight: 400,
          }}
        >
          <img
            style={{ height: "52px" }}
            src="https://tabin-public.s3-ap-southeast-2.amazonaws.com/images/shopping-bag-icon.jpg"
          />
          <SizedBox width="12px" />
          <Title4Font style={{ fontWeight: 400 }}>
            Total: ${convertCentsToDollars(total)}
          </Title4Font>
        </div>
        <KioskButton
          disabled={!products || products.length == 0}
          onClick={onClickCart}
        >
          <NormalFont style={{ fontSize: "22px" }}>View My Order</NormalFont>
        </KioskButton>
      </div>
      <Space2 />
      <KioskButton
        style={{
          backgroundColor: "#ffffff",
          color: "#484848",
          border: "1px solid #e0e0e0",
          padding: "12px 24px",
        }}
        onClick={onCancelOrder}
      >
        <NormalFont style={{ fontWeight: 300 }}>Cancel Order</NormalFont>
      </KioskButton>
    </div>
  );

  return (
    <>
      <KioskPageWrapper>
        <div
          style={{ height: "100vh", display: "flex", flexDirection: "column" }}
        >
          <div style={{ display: "flex", flex: "1", overflow: "scroll" }}>
            <div
              style={{
                width: "300px",
                overflow: "scroll",
                borderRight: "1px solid #e0e0e0",
              }}
              className={styles.categoriesWrapper}
            >
              {restaurant.image && <RestaurantImage image={restaurant.image} />}
              {menuCategories}
            </div>
            <div
              style={{
                overflow: "scroll",
                padding: "48px 32px 32px 32px",
                width: "100%",
              }}
              className={styles.productsWrapper}
            >
              {menuProducts}
            </div>
          </div>
          <div style={{ padding: "24px", borderTop: "1px solid #e0e0e0" }}>
            {restaurantFooter}
          </div>
        </div>
        {modals}
      </KioskPageWrapper>
    </>
  );
};

const RestaurantImage = (props: { image: IS3Image }) => {
  return (
    <S3Image
      imgKey={props.image.key}
      identityId={props.image.identityPoolId}
      level="protected"
      theme={{
        photoImg: {
          width: "100%",
          height: "100%",
          padding: "42px",
        },
      }}
    />
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
      style={{
        // height: "85px",
        padding: "30px 24px",
        borderBottom: "1px solid #e0e0e0",
        borderLeft: isSelected ? "8px solid var(--primary-color)" : "none",
      }}
      onClick={() => {
        isAvailable && onCategorySelected(category);
      }}
    >
      {!isAvailable ?
        <NormalFont style={{ fontWeight: 300, opacity: isAvailable ? "1" : "0.5", }}>{category.name} (UNAVAILABLE)</NormalFont>
        : isSelected ? (
          <BoldFont>{category.name}</BoldFont>
        ) : (
            <NormalFont style={{ fontWeight: 300 }}>{category.name}</NormalFont>
          )}
    </div>
  );
};
