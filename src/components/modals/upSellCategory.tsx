import { Button } from "../../tabin/components/button";
import { isItemAvailable } from "../../util/util";
import { ModalV2 } from "../../tabin/components/modalv2";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import { IMatchingUpSellCrossSellCategoryItem } from "../../model/model";
import { useRef } from "react";
import { CachedImage } from "../../tabin/components/cachedImage";
import { IGET_RESTAURANT_CATEGORY } from "../../graphql/customQueries";

import "./upSellCategory.scss";

interface IUpSellCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    upSellCrossSaleCategoryItems: IMatchingUpSellCrossSellCategoryItem[];
    onSelectUpSellCrossSellCategory: (category: IGET_RESTAURANT_CATEGORY) => void;
}

export const UpSellCategoryModal = (props: IUpSellCategoryModalProps) => {
    const { onSelectUpSellCrossSellCategory, upSellCrossSaleCategoryItems } = { ...props };

    const randomItem = useRef(upSellCrossSaleCategoryItems[Math.floor(Math.random() * upSellCrossSaleCategoryItems.length)]);

    // callbacks
    const onModalClose = () => {
        props.onClose();
    };

    const onAddToOrder = (category: IGET_RESTAURANT_CATEGORY) => {
        onSelectUpSellCrossSellCategory(category);
    };

    const categoryDisplay = (category: IGET_RESTAURANT_CATEGORY) => {
        const isAvailable = isItemAvailable(category.availability);

        const isValid = isAvailable;

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
            {upSellCrossSaleCategoryItems.map((item) => {
                return categoryDisplay(item.category);
            })}
        </div>
    );

    const mainImage = (
        <>
            <div className="h1 mb-6 text-center">{randomItem.current.category.name}</div>
            {randomItem.current.category.image && (
                <CachedImage
                    className="main-image mb-4"
                    url={`${getCloudFrontDomainName()}/protected/${randomItem.current.category.image.identityPoolId}/${
                        randomItem.current.category.image.key
                    }`}
                    alt="category-image"
                />
            )}
            <div className="button-container mb-12">
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
                <div>
                    <div className="h1 mb-4 text-center">You May Also Like</div>
                    {Categories}
                </div>
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
