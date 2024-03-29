import { Button } from "../../tabin/components/button";
import { isItemAvailable } from "../../util/util";
import { ModalV2 } from "../../tabin/components/modalv2";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import { IMatchingUpSellCrossSellCategoryItem } from "../../model/model";
import { useRef } from "react";
import { CachedImage } from "../../tabin/components/cachedImage";
import { IGET_RESTAURANT_CATEGORY } from "../../graphql/customQueries";

import "./upSellCrossSell.scss";

interface IUpSellCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    upSellCrossSaleCategoryItems: IMatchingUpSellCrossSellCategoryItem[];
    onSelectUpSellCrossSellCategory: (category: IGET_RESTAURANT_CATEGORY) => void;
}

export const UpSellCategoryModal = (props: IUpSellCategoryModalProps) => {
    const { onSelectUpSellCrossSellCategory, upSellCrossSaleCategoryItems } = { ...props };

    const randomItemIndex = Math.floor(Math.random() * upSellCrossSaleCategoryItems.length);
    const randomItem = useRef(upSellCrossSaleCategoryItems[randomItemIndex]);

    // callbacks
    const onModalClose = () => {
        props.onClose();
    };

    const onAddToOrder = (category: IGET_RESTAURANT_CATEGORY) => {
        onSelectUpSellCrossSellCategory(category);
    };

    const categoryDisplay = (category: IGET_RESTAURANT_CATEGORY) => {
        const isCategoryAvailable = isItemAvailable(category.availability);

        const isValid = isCategoryAvailable;

        return (
            <>
                <div key={category.id} className={`category ${isValid ? "" : "unavailable"}`} onClick={() => isValid && onAddToOrder(category)}>
                    {category.image && (
                        <CachedImage
                            className="image mb-2"
                            url={`${getCloudFrontDomainName()}/protected/${category.image.identityPoolId}/${category.image.key}`}
                            alt="category-image"
                        />
                    )}

                    <div className="name text-bold">{isValid ? `${category.name}` : `${category.name} (UNAVAILABLE)`}</div>
                </div>
            </>
        );
    };

    const Categories = (
        <div className="categories pt-2">
            {upSellCrossSaleCategoryItems.map((item, index) => {
                if (randomItem.current.category.id == item.category.id) return;

                return categoryDisplay(item.category);
            })}
        </div>
    );

    const mainImage = (
        <>
            <div className="h1 mb-6 text-center">Would you like some {randomItem.current.category.name}?</div>
            {randomItem.current.category.image && (
                <CachedImage
                    className="main-image mb-4"
                    url={`${getCloudFrontDomainName()}/protected/${randomItem.current.category.image.identityPoolId}/${
                        randomItem.current.category.image.key
                    }`}
                    alt="category-image"
                />
            )}
            <div className="button-container">
                <Button className="button large no-thank-you-button mr-3" onClick={onModalClose}>
                    No Thank You
                </Button>
                <Button className="button large add-to-order-button" onClick={() => onAddToOrder(randomItem.current.category)}>
                    Add To Order
                </Button>
            </div>
        </>
    );

    const content = (
        <>
            <div className="content">
                {mainImage}
                {upSellCrossSaleCategoryItems.length > 1 && (
                    <div className="mt-12">
                        <div className="h1 mb-4 text-center">You May Also Like</div>
                        {Categories}
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
