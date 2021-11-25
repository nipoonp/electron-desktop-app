import { useState, useEffect } from "react";
import { ICartModifier, IPreSelectedModifiers, ICartProduct, ICartModifierGroup } from "../../model/model";
import { Logger } from "aws-amplify";
import { toast } from "../../tabin/components/toast";
import {
    getModifierQuantityAvailable,
    getProductQuantityAvailable,
    getQuantityRemainingText,
    isItemAvailable,
    isItemSoldOut,
    isModifierQuantityAvailable,
    isProductQuantityAvailable,
} from "../../util/util";
import { convertCentsToDollars } from "../../util/util";
import { PlusIcon } from "../../tabin/components/icons/plusIcon";
import {
    IGET_RESTAURANT_PRODUCT,
    IGET_RESTAURANT_MODIFIER_GROUP,
    IGET_RESTAURANT_MODIFIER,
    IGET_RESTAURANT_CATEGORY,
} from "../../graphql/customQueries";
import { Modal } from "../../tabin/components/modal";
import { Button } from "../../tabin/components/button";
import { Stepper } from "../../tabin/components/stepper";
import { Checkbox } from "../../tabin/components/checkbox";
import { Radio } from "../../tabin/components/radio";
import { TextArea } from "../../tabin/components/textArea";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import { CachedImage } from "../../tabin/components/cachedImage";
import { useCart } from "../../context/cart-context";
import { FiChevronRight } from "react-icons/fi";
import { ProductModifier } from "../shared/productModifier";

import "./product.scss";

const logger = new Logger("productModal");

interface ISelectedProductModifier {
    selectedModifier: ICartModifier;
    product: IGET_RESTAURANT_PRODUCT;
    selectedModifierGroupId: string;
    newOrderedModifiers: IPreSelectedModifiers;
    selectedProductModifierOrderedModifiers: IPreSelectedModifiers;
    editSelectionsProductModifierIndex?: number;
}

export const ProductModal = (props: {
    category: IGET_RESTAURANT_CATEGORY;
    product: IGET_RESTAURANT_PRODUCT;
    isProductModifier?: boolean;
    isOpen: boolean;
    onAddItem?: (product: ICartProduct) => void;
    onUpdateItem?: (index: number, product: ICartProduct) => void;
    onClose: () => void;
    editProduct?: {
        orderedModifiers: IPreSelectedModifiers;
        quantity: number;
        notes: string | null;
        productCartIndex: number;
    };
}) => {
    const { category, product, isProductModifier, isOpen, onAddItem, onUpdateItem, onClose, editProduct } = props;
    const { cartProductQuantitiesById } = useCart();

    const [orderedModifiers, setOrderedModifiers] = useState<IPreSelectedModifiers>(editProduct ? editProduct.orderedModifiers : {});
    const [quantity, setQuantity] = useState(editProduct ? editProduct.quantity : 1);
    const [totalDisplayPrice, setTotalDisplayPrice] = useState(product.price);
    const [notes, setNotes] = useState(editProduct ? editProduct.notes : "");
    const [error, setError] = useState<{ [modifierGroupId: string]: string }>({});

    const [selectedProductModifier, setSelectedProductModifier] = useState<ISelectedProductModifier | null>(null);

    // useEffect(() => {
    //     console.log("xxx...", orderedModifiers);
    // }, [orderedModifiers]);

    useEffect(() => {
        //Set preselected modifiers logic
        if (editProduct) return;

        let newOrderedModifiers: IPreSelectedModifiers = {};

        product.modifierGroups &&
            product.modifierGroups.items.forEach((modifierGroupLink) => {
                modifierGroupLink.modifierGroup.modifiers &&
                    modifierGroupLink.modifierGroup.modifiers.items.map((modifierLink) => {
                        if (modifierLink.preSelectedQuantity) {
                            if (newOrderedModifiers[modifierGroupLink.modifierGroup.id] === undefined) {
                                newOrderedModifiers[modifierGroupLink.modifierGroup.id] = [];
                            }

                            newOrderedModifiers = {
                                ...newOrderedModifiers,
                                [modifierGroupLink.modifierGroup.id]: [
                                    ...newOrderedModifiers[modifierGroupLink.modifierGroup.id],
                                    {
                                        id: modifierLink.modifier.id,
                                        name: modifierLink.modifier.name,
                                        price: modifierLink.modifier.price,
                                        preSelectedQuantity: modifierLink.preSelectedQuantity,
                                        quantity: modifierLink.preSelectedQuantity,
                                        productModifiers: null,
                                        image: modifierLink.modifier.image
                                            ? {
                                                  key: modifierLink.modifier.image.key,
                                                  region: modifierLink.modifier.image.region,
                                                  bucket: modifierLink.modifier.image.bucket,
                                                  identityPoolId: modifierLink.modifier.image.identityPoolId,
                                              }
                                            : null,
                                    },
                                ],
                            };
                        }
                    });

                setOrderedModifiers(newOrderedModifiers);
            });
    }, []);

    useEffect(() => {
        let price = product.price;

        Object.values(orderedModifiers).forEach((orderedModifier) => {
            orderedModifier.forEach((m) => {
                const changedQuantity = m.quantity - m.preSelectedQuantity;

                if (changedQuantity > 0) {
                    price += m.price * changedQuantity;
                }

                if (m.productModifiers) {
                    m.productModifiers.forEach((productModifier) => {
                        productModifier.modifierGroups.forEach((orderedProductModifierModifierGroup) => {
                            orderedProductModifierModifierGroup.modifiers.forEach((orderedProductModifierModifier) => {
                                const changedQuantity = orderedProductModifierModifier.quantity - orderedProductModifierModifier.preSelectedQuantity;

                                if (changedQuantity > 0) {
                                    price += orderedProductModifierModifier.price * changedQuantity;
                                }
                            });
                        });
                    });
                }
            });
        });

        price = price * quantity;
        setTotalDisplayPrice(price);
    }, [orderedModifiers, quantity]);

    const onModalClose = () => {
        onClose();
    };

    const onProcessProductModifier = (
        selectedModifier: ICartModifier,
        selectedModifierGroupId: string,
        selectedProductModifierProduct: IGET_RESTAURANT_PRODUCT,
        newOrderedModifiers: IPreSelectedModifiers,
        editSelectionsProductModifierIndex?: number //If editing selections
    ) => {
        //Add productModifier directly as modifier, if productModifier has no modifier groups
        if (selectedProductModifierProduct.modifierGroups && selectedProductModifierProduct.modifierGroups.items.length === 0) return;

        let selectedProductModifierOrderedModifiers = {};

        if (editSelectionsProductModifierIndex !== undefined) {
            //Check for undefined here specifically
            selectedModifier.productModifiers &&
                selectedModifier.productModifiers[editSelectionsProductModifierIndex].modifierGroups.forEach((modifierGroup) => {
                    modifierGroup.modifiers.forEach((modifier) => {
                        if (selectedProductModifierOrderedModifiers[modifierGroup.id] === undefined) {
                            selectedProductModifierOrderedModifiers[modifierGroup.id] = [];
                        }

                        const newOrderedProductModifierItem: ICartModifier = {
                            id: modifier.id,
                            name: modifier.name,
                            price: modifier.price,
                            preSelectedQuantity: modifier.preSelectedQuantity,
                            quantity: modifier.quantity,
                            productModifiers: null,
                            image: modifier.image
                                ? {
                                      key: modifier.image.key,
                                      region: modifier.image.region,
                                      bucket: modifier.image.bucket,
                                      identityPoolId: modifier.image.identityPoolId,
                                  }
                                : null,
                        };

                        selectedProductModifierOrderedModifiers[modifierGroup.id] = [
                            ...selectedProductModifierOrderedModifiers[modifierGroup.id],
                            newOrderedProductModifierItem,
                        ];
                    });
                });
        }

        setSelectedProductModifier({
            selectedModifier: selectedModifier,
            product: selectedProductModifierProduct,
            selectedModifierGroupId: selectedModifierGroupId,
            newOrderedModifiers: newOrderedModifiers,
            selectedProductModifierOrderedModifiers: selectedProductModifierOrderedModifiers,
            editSelectionsProductModifierIndex: editSelectionsProductModifierIndex,
        });
    };

    const onCheckingModifier = (selectedModifierGroupId: string, preSelectedModifierQuantity: number, selectedModifier: IGET_RESTAURANT_MODIFIER) => {
        setError({});

        if (orderedModifiers[selectedModifierGroupId] === undefined) {
            orderedModifiers[selectedModifierGroupId] = [];
        }

        const newOrderedModifierItem: ICartModifier = {
            id: selectedModifier.id,
            name: selectedModifier.name,
            price: selectedModifier.price,
            preSelectedQuantity: preSelectedModifierQuantity,
            quantity: 1,
            productModifiers: null,
            image: selectedModifier.image
                ? {
                      key: selectedModifier.image.key,
                      region: selectedModifier.image.region,
                      bucket: selectedModifier.image.bucket,
                      identityPoolId: selectedModifier.image.identityPoolId,
                  }
                : null,
        };

        //Deselect modifier if you clicked on it again
        let newOrderedModifiers = {
            ...orderedModifiers,
            [selectedModifierGroupId]: orderedModifiers[selectedModifierGroupId].filter((m) => m.id !== selectedModifier.id),
        };

        let newOrderedModifiers2 = {
            ...newOrderedModifiers,
            [selectedModifierGroupId]: [...newOrderedModifiers[selectedModifierGroupId], newOrderedModifierItem],
        };

        if (
            selectedModifier.productModifier &&
            selectedModifier.productModifier.modifierGroups &&
            selectedModifier.productModifier.modifierGroups.items.length > 0
        ) {
            onProcessProductModifier(newOrderedModifierItem, selectedModifierGroupId, selectedModifier.productModifier, newOrderedModifiers2);
        } else {
            setOrderedModifiers(newOrderedModifiers2);
        }
    };

    const onUnCheckingModifier = (
        selectedModifierGroupId: string,
        preSelectedModifierQuantity: number,
        selectedModifier: IGET_RESTAURANT_MODIFIER
    ) => {
        setError({});

        const newOrderedModifierItem: ICartModifier = {
            id: selectedModifier.id,
            name: selectedModifier.name,
            price: selectedModifier.price,
            preSelectedQuantity: preSelectedModifierQuantity,
            quantity: 0,
            productModifiers: null,
            image: selectedModifier.image
                ? {
                      key: selectedModifier.image.key,
                      region: selectedModifier.image.region,
                      bucket: selectedModifier.image.bucket,
                      identityPoolId: selectedModifier.image.identityPoolId,
                  }
                : null,
        };

        let newOrderedModifiers = {
            ...orderedModifiers,
            [selectedModifierGroupId]: orderedModifiers[selectedModifierGroupId].filter((m) => m.id !== selectedModifier.id),
        };

        if (!preSelectedModifierQuantity || preSelectedModifierQuantity == 0) {
            // If no selected modifies inside a modifier group. Delete the group.
            if (newOrderedModifiers[selectedModifierGroupId].length == 0) {
                delete newOrderedModifiers[selectedModifierGroupId];
            }
        } else {
            newOrderedModifiers = {
                ...newOrderedModifiers,
                [selectedModifierGroupId]: [...newOrderedModifiers[selectedModifierGroupId], newOrderedModifierItem],
            };
        }

        setOrderedModifiers(newOrderedModifiers);
    };

    const onChangeModifierQuantity = (
        selectedModifierGroupId: string,
        preSelectedModifierQuantity: number,
        selectedModifier: IGET_RESTAURANT_MODIFIER,
        isIncremented: boolean,
        quantity: number
    ) => {
        setError({});

        if (orderedModifiers[selectedModifierGroupId] === undefined) {
            orderedModifiers[selectedModifierGroupId] = [];
        }

        const newOrderedModifierItem: ICartModifier = {
            id: selectedModifier.id,
            name: selectedModifier.name,
            price: selectedModifier.price,
            preSelectedQuantity: preSelectedModifierQuantity,
            quantity: quantity,
            productModifiers: null,
            image: selectedModifier.image
                ? {
                      key: selectedModifier.image.key,
                      region: selectedModifier.image.region,
                      bucket: selectedModifier.image.bucket,
                      identityPoolId: selectedModifier.image.identityPoolId,
                  }
                : null,
        };

        //Remove the modifier group and then add it back in with updated quantity later
        let newOrderedModifiers = {
            ...orderedModifiers,
            [selectedModifierGroupId]: orderedModifiers[selectedModifierGroupId].filter((m) => m.id !== selectedModifier.id),
        };

        // If quantity is 0, don't add a 0 quantity modifier.
        if (quantity == 0 && (!preSelectedModifierQuantity || preSelectedModifierQuantity == 0)) {
            // If no selected modifies inside a modifier group. Delete the group.
            if (newOrderedModifiers[selectedModifierGroupId].length == 0) {
                delete newOrderedModifiers[selectedModifierGroupId];
            }
        } else {
            //Extract the productModifiers array from the removed modifier and add it back later. We should only have 1 matching modifier. So take 0th index
            const removedSelectedModifier = orderedModifiers[selectedModifierGroupId].filter((m) => m.id === selectedModifier.id);
            let removedSelectedModifierProductModifiers =
                removedSelectedModifier && removedSelectedModifier.length > 0 ? removedSelectedModifier[0].productModifiers : null;

            //If user pressed decrement in the modifier quantity. Make sure our productModifiers array is not longer than quantity selected.
            if (!isIncremented && removedSelectedModifierProductModifiers) {
                removedSelectedModifierProductModifiers = removedSelectedModifierProductModifiers.slice(0, quantity);
            }

            const newOrderedModifierItemWithProductModifiers = {
                ...newOrderedModifierItem,
                productModifiers: removedSelectedModifierProductModifiers,
            };

            newOrderedModifiers = {
                ...newOrderedModifiers,
                [selectedModifierGroupId]: [...newOrderedModifiers[selectedModifierGroupId], newOrderedModifierItemWithProductModifiers],
            };
        }

        if (
            selectedModifier.productModifier &&
            selectedModifier.productModifier.modifierGroups &&
            selectedModifier.productModifier.modifierGroups.items.length > 0 &&
            isIncremented
        ) {
            onProcessProductModifier(newOrderedModifierItem, selectedModifierGroupId, selectedModifier.productModifier, newOrderedModifiers);
        } else {
            setOrderedModifiers(newOrderedModifiers);
        }
    };

    const onSelectRadioModifier = (
        selectedModifierGroupId: string,
        preSelectedModifierQuantity: number,
        selectedModifier: IGET_RESTAURANT_MODIFIER
    ) => {
        setError({});

        const newOrderedModifierItem: ICartModifier = {
            id: selectedModifier.id,
            name: selectedModifier.name,
            price: selectedModifier.price,
            preSelectedQuantity: preSelectedModifierQuantity,
            quantity: 1,
            productModifiers: null,
            image: selectedModifier.image
                ? {
                      key: selectedModifier.image.key,
                      region: selectedModifier.image.region,
                      bucket: selectedModifier.image.bucket,
                      identityPoolId: selectedModifier.image.identityPoolId,
                  }
                : null,
        };

        let newOrderedModifiers: IPreSelectedModifiers = { ...orderedModifiers, [selectedModifierGroupId]: [newOrderedModifierItem] };

        if (
            selectedModifier.productModifier &&
            selectedModifier.productModifier.modifierGroups &&
            selectedModifier.productModifier.modifierGroups.items.length > 0
        ) {
            onProcessProductModifier(newOrderedModifierItem, selectedModifierGroupId, selectedModifier.productModifier, newOrderedModifiers);
        } else {
            setOrderedModifiers(newOrderedModifiers);
        }
    };

    const onSubmit = () => {
        // logger.debug("onSubmit", [product, orderedModifiers]);
        console.log("onSubmit", [product, orderedModifiers]);

        let error: { [modifierGroupId: string]: string } = {};

        // TODO: Refactor into functions
        product.modifierGroups &&
            product.modifierGroups.items.map((mg) => {
                const choiceMin = mg.modifierGroup.choiceMin;
                const choiceMax = mg.modifierGroup.choiceMax;
                const choiceDuplicate = mg.modifierGroup.choiceDuplicate;

                let orderedModifiersLength = 0;

                // Check if selected modifier quantity is less than choiceDuplicate
                // If logic in other places is all correct, the code should never really reach inside this condition. This check is just for backup.
                if (orderedModifiers[mg.modifierGroup.id]) {
                    orderedModifiers[mg.modifierGroup.id].forEach((m) => {
                        orderedModifiersLength += m.quantity;

                        if (m.quantity > choiceDuplicate) {
                            Object.assign(error, {
                                [mg.modifierGroup.id]:
                                    "Please select at most " +
                                    choiceDuplicate +
                                    " of the same " +
                                    (choiceDuplicate === 1 ? "modifier" : "modifiers") +
                                    " for " +
                                    mg.modifierGroup.name,
                            });
                            return;
                        }
                    });
                }

                // Check if number of selected modifiers is more than choiceMin
                if (choiceMin > 0) {
                    if (orderedModifiers[mg.modifierGroup.id] === undefined || orderedModifiersLength < choiceMin) {
                        if (choiceMin === 1 && choiceMax === 1) {
                            Object.assign(error, {
                                [mg.modifierGroup.id]: "Please select an option for " + mg.modifierGroup.name,
                            });
                        } else if (choiceMin === choiceMax) {
                            Object.assign(error, {
                                [mg.modifierGroup.id]: "Please make " + choiceMin + " selections for " + mg.modifierGroup.name,
                            });
                        } else {
                            Object.assign(error, {
                                [mg.modifierGroup.id]:
                                    "Please make at least " +
                                    choiceMin +
                                    (choiceMin === 1 ? " selection" : " selections") +
                                    " for " +
                                    mg.modifierGroup.name,
                            });
                        }
                        return;
                    }
                }

                // Check if number of selected modifiers is less than choiceMax
                // If logic in other places is all correct, the code should never really reach inside this condition. This check is just for backup.
                if (orderedModifiers[mg.modifierGroup.id] !== undefined && orderedModifiersLength > choiceMax) {
                    Object.assign(error, {
                        [mg.modifierGroup.id]:
                            "Please make at most " + choiceMax + (choiceMin === 1 ? " selection" : " selections") + " for " + mg.modifierGroup.name,
                    });
                    return;
                }
            });

        if (Object.keys(error).length > 0) {
            toast.error(error[Object.keys(error)[0]]);
            setError(error);
            return;
        }

        // setLoadingMessage("Updating cart");
        const selectedModifierGroups: ICartModifierGroup[] = [];

        product.modifierGroups &&
            product.modifierGroups.items.forEach((mg) => {
                if (orderedModifiers[mg.modifierGroup.id]) {
                    selectedModifierGroups.push({
                        id: mg.modifierGroup.id,
                        name: mg.modifierGroup.name,
                        choiceDuplicate: mg.modifierGroup.choiceDuplicate,
                        choiceMin: mg.modifierGroup.choiceMin,
                        choiceMax: mg.modifierGroup.choiceMax,
                        hideForCustomer: mg.hideForCustomer,
                        modifiers: orderedModifiers[mg.modifierGroup.id],
                    });
                }
            });

        const productToOrder: ICartProduct = {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image
                ? {
                      key: product.image.key,
                      region: product.image.region,
                      bucket: product.image.bucket,
                      identityPoolId: product.image.identityPoolId,
                  }
                : null,
            quantity: quantity,
            notes: notes || null,
            category: {
                id: category.id,
                name: category.name,
                image: category.image
                    ? {
                          key: category.image.key,
                          region: category.image.region,
                          bucket: category.image.bucket,
                          identityPoolId: category.image.identityPoolId,
                      }
                    : null,
            },
            modifierGroups: selectedModifierGroups,
        };

        if (editProduct) {
            onUpdateItem && onUpdateItem(editProduct.productCartIndex, productToOrder);
        } else {
            onAddItem && onAddItem(productToOrder);
        }

        onClose();
    };

    const onUpdateQuantity = (count: number) => {
        setQuantity(count);
    };

    const onNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
    };

    const modifierGroups = (
        <>
            {product.modifierGroups &&
                product.modifierGroups.items.map((mg) => (
                    <>
                        {!mg.hideForCustomer && (
                            <>
                                <ModifierGroup
                                    modifierGroup={mg.modifierGroup}
                                    onEditSelectionsProductModifier={(
                                        index: number,
                                        selectedModifier: ICartModifier,
                                        productModifier: IGET_RESTAURANT_PRODUCT
                                    ) => {
                                        onProcessProductModifier(selectedModifier, mg.modifierGroup.id, productModifier, orderedModifiers, index);
                                    }}
                                    onCheckingModifier={(selectedModifier: IGET_RESTAURANT_MODIFIER, preSelectedModifierQuantity: number) =>
                                        onCheckingModifier(mg.modifierGroup.id, preSelectedModifierQuantity, selectedModifier)
                                    }
                                    onUnCheckingModifier={(selectedModifier: IGET_RESTAURANT_MODIFIER, preSelectedModifierQuantity: number) =>
                                        onUnCheckingModifier(mg.modifierGroup.id, preSelectedModifierQuantity, selectedModifier)
                                    }
                                    onChangeModifierQuantity={(
                                        selectedModifier: IGET_RESTAURANT_MODIFIER,
                                        preSelectedModifierQuantity: number,
                                        isIncremented: boolean,
                                        quantity: number
                                    ) =>
                                        onChangeModifierQuantity(
                                            mg.modifierGroup.id,
                                            preSelectedModifierQuantity,
                                            selectedModifier,
                                            isIncremented,
                                            quantity
                                        )
                                    }
                                    onSelectRadioModifier={(selectedModifier: IGET_RESTAURANT_MODIFIER, preSelectedModifierQuantity: number) =>
                                        onSelectRadioModifier(mg.modifierGroup.id, preSelectedModifierQuantity, selectedModifier)
                                    }
                                    selectedModifiers={orderedModifiers[mg.modifierGroup.id] || []}
                                    productQuantity={quantity}
                                    error={error[mg.modifierGroup.id]}
                                    disabled={false}
                                />
                                <div className="separator-6"></div>
                            </>
                        )}
                    </>
                ))}
        </>
    );

    const productNotes = (
        <>
            <div className="h2 mb-3">Special Instructions</div>
            <TextArea placeholder={"Leave a note for the kitchen"} onChange={onNotesChange} value={notes || ""} />
        </>
    );

    const getProductFooterMaxQuantity = () => {
        if (!product.totalQuantityAvailable) return;

        return getProductQuantityAvailable(
            {
                id: product.id,
                totalQuantityAvailable: product.totalQuantityAvailable,
            },
            cartProductQuantitiesById
        );
    };

    const footer = (
        <>
            {!isProductModifier && (
                <div className="stepper mb-4">
                    <Stepper count={quantity} min={1} max={getProductFooterMaxQuantity()} onUpdate={onUpdateQuantity} size={48} />
                </div>
            )}
            <div className="footer-buttons-container">
                <Button className="button large mr-3 cancel-button" onClick={onModalClose}>
                    Cancel
                </Button>
                <Button className="button large add-update-order-button" onClick={onSubmit}>
                    {isProductModifier
                        ? "Save"
                        : editProduct
                        ? `Update Item ${convertCentsToDollars(totalDisplayPrice)}`
                        : `Add To Order ${convertCentsToDollars(totalDisplayPrice)}`}
                </Button>
            </div>
        </>
    );

    const content = (
        <>
            <div className="product">
                <div className="mt-11" />
                <div className="h1 mb-4 name">{product.name}</div>
                {product.description && <div className="description">{product.description}</div>}
                <div className="separator-6"></div>
                {modifierGroups}
                {!isProductModifier && productNotes}
            </div>
            <div className="footer">{footer}</div>
        </>
    );

    const onCloseProductModifierModifier = () => {
        setSelectedProductModifier(null);
    };

    const onAddProductModifierProduct = (product: ICartProduct) => {
        if (!selectedProductModifier) return;

        const newOrderedModifiers = { ...selectedProductModifier.newOrderedModifiers };
        const lastIndex = newOrderedModifiers[selectedProductModifier.selectedModifierGroupId].length - 1;
        const newProductModifiers = newOrderedModifiers[selectedProductModifier.selectedModifierGroupId][lastIndex].productModifiers || [];

        newOrderedModifiers[selectedProductModifier.selectedModifierGroupId][lastIndex].productModifiers = [...newProductModifiers, product];
        setOrderedModifiers(newOrderedModifiers);
    };

    const onUpdateProductModifierProduct = (index: number, productModifier: ICartProduct) => {
        if (!selectedProductModifier || selectedProductModifier.editSelectionsProductModifierIndex === undefined) return; //Check for undefined specifically

        const newOrderedModifiers = { ...selectedProductModifier.newOrderedModifiers };

        const modifierId = selectedProductModifier.selectedModifier.id;
        const productModifierIndex = selectedProductModifier.editSelectionsProductModifierIndex;

        const modifier = newOrderedModifiers[selectedProductModifier.selectedModifierGroupId].find((m) => m.id === modifierId);

        if (!modifier || !modifier.productModifiers) return;

        modifier.productModifiers[productModifierIndex] = productModifier;
        setOrderedModifiers(newOrderedModifiers);
    };

    return (
        <>
            <Modal isOpen={isOpen} onRequestClose={onModalClose}>
                <div className="product-modal">{content}</div>
            </Modal>

            {selectedProductModifier && (
                <ProductModal
                    isOpen={selectedProductModifier ? true : false}
                    onClose={onCloseProductModifierModifier}
                    category={category}
                    product={selectedProductModifier.product}
                    isProductModifier={true}
                    onAddItem={onAddProductModifierProduct}
                    onUpdateItem={onUpdateProductModifierProduct}
                    editProduct={
                        selectedProductModifier.editSelectionsProductModifierIndex !== undefined
                            ? {
                                  orderedModifiers: selectedProductModifier.selectedProductModifierOrderedModifiers,
                                  quantity: 1,
                                  notes: null,
                                  productCartIndex: 0,
                              }
                            : undefined
                    }
                />
            )}
        </>
    );
};

// components
export const ModifierGroup = (props: {
    modifierGroup: IGET_RESTAURANT_MODIFIER_GROUP;
    onEditSelectionsProductModifier: (index: number, selectedModifier: ICartModifier, productModifier: IGET_RESTAURANT_PRODUCT) => void;
    onCheckingModifier: (selectedModifier: IGET_RESTAURANT_MODIFIER, preSelectedModifierQuantity: number) => void;
    onUnCheckingModifier: (selectedModifier: IGET_RESTAURANT_MODIFIER, preSelectedModifierQuantity: number) => void;
    onChangeModifierQuantity: (
        selectedModifier: IGET_RESTAURANT_MODIFIER,
        preSelectedModifierQuantity: number,
        isIncremented: boolean,
        quantity: number
    ) => void;
    onSelectRadioModifier: (selectedModifier: IGET_RESTAURANT_MODIFIER, preSelectedModifierQuantity: number) => void;
    selectedModifiers: ICartModifier[];
    productQuantity: number;
    error?: string;
    disabled: boolean;
}) => {
    const {
        modifierGroup,
        onCheckingModifier,
        onUnCheckingModifier,
        onChangeModifierQuantity,
        onSelectRadioModifier,
        selectedModifiers,
        productQuantity,
        error,
        disabled,
    } = props;

    const { cartProductQuantitiesById, cartModifierQuantitiesById } = useCart();

    const modifierQuantity = (modifier: IGET_RESTAURANT_MODIFIER) => {
        let m = selectedModifiers.find((selectedModifier) => selectedModifier.id === modifier.id);
        return m ? m.quantity : 0;
    };

    const checkModifierSelected = (modifier: IGET_RESTAURANT_MODIFIER) => {
        let m = selectedModifiers.find((selectedModifier) => selectedModifier.id === modifier.id && selectedModifier.quantity > 0);
        return m ? true : false;
    };

    const checkModifierIsValid = (modifier: IGET_RESTAURANT_MODIFIER) => {
        if (modifier.productModifier) {
            const isSoldOut = isItemSoldOut(modifier.productModifier.soldOut, modifier.productModifier.soldOutDate);
            const isAvailable = isItemAvailable(modifier.productModifier.availability);
            const isQuantityAvailable = isProductQuantityAvailable(modifier.productModifier, cartProductQuantitiesById);

            return !isSoldOut && isAvailable && isQuantityAvailable;
        } else {
            const isSoldOut = isItemSoldOut(modifier.soldOut, modifier.soldOutDate);
            const isQuantityAvailable = isModifierQuantityAvailable(modifier, cartModifierQuantitiesById);

            return !isSoldOut && isQuantityAvailable;
        }
    };

    const getModifiersSelectedCount = (selectedModifiers?: ICartModifier[]): number => {
        if (selectedModifiers === undefined) {
            return 0;
        }

        let count = 0;

        selectedModifiers.forEach((selectedModifier) => (count += selectedModifier.quantity));

        return count;
    };

    const isMaxReached = (max: number, selectedModifiers?: ICartModifier[]): boolean => {
        if (selectedModifiers === undefined) {
            return false;
        }

        let count = 0;

        selectedModifiers.forEach((selectedModifier) => (count += selectedModifier.quantity));

        return count >= max;
    };

    const checkMaxReached = (modifier: IGET_RESTAURANT_MODIFIER) => {
        return (
            !(modifierGroup.choiceMin === 1 && modifierGroup.choiceMax === 1) &&
            isMaxReached(modifierGroup.choiceMax, selectedModifiers) &&
            selectedModifiers.find((selectedModifier) => {
                return selectedModifier.id === modifier.id;
            }) === undefined
        );
    };

    // display
    const getSelectInstructions = () => {
        return modifierGroup.choiceMin === modifierGroup.choiceMax
            ? "Select " + modifierGroup.choiceMin
            : modifierGroup.choiceMin === 0
            ? "Select up to " + modifierGroup.choiceMax
            : "Make between " + modifierGroup.choiceMin + " and " + modifierGroup.choiceMax + " selections";
    };

    return (
        <>
            <div className="h2 mb-2">{modifierGroup.name}</div>
            {error && <div className="text-error mb-2">{error}</div>}
            <div className="mb-2">({getSelectInstructions()})</div>

            <div className="modifiers">
                {modifierGroup.modifiers &&
                    modifierGroup.modifiers.items.map((m) => {
                        const isValid = checkModifierIsValid(m.modifier);
                        const selectedModifier = selectedModifiers.find((modifier) => modifier.id == m.modifier.id);

                        return (
                            <Modifier
                                radio={modifierGroup.choiceMin !== 0 && modifierGroup.choiceMax === 1}
                                modifier={m.modifier}
                                selectedModifier={selectedModifier}
                                choiceDuplicate={modifierGroup.choiceDuplicate}
                                onEditSelectionsProductModifier={(
                                    index: number,
                                    selectedModifier: ICartModifier,
                                    productModifier: IGET_RESTAURANT_PRODUCT
                                ) => props.onEditSelectionsProductModifier(index, selectedModifier, productModifier)}
                                onCheckingModifier={(selectedModifier: IGET_RESTAURANT_MODIFIER) => {
                                    onCheckingModifier(selectedModifier, m.preSelectedQuantity);
                                }}
                                onUnCheckingModifier={(selectedModifier: IGET_RESTAURANT_MODIFIER) => {
                                    onUnCheckingModifier(selectedModifier, m.preSelectedQuantity);
                                }}
                                onChangeModifierQuantity={(selectedModifier: IGET_RESTAURANT_MODIFIER, isIncremented: boolean, quantity: number) => {
                                    onChangeModifierQuantity(selectedModifier, m.preSelectedQuantity, isIncremented, quantity);
                                }}
                                onSelectRadioModifier={(selectedModifier: IGET_RESTAURANT_MODIFIER) => {
                                    onSelectRadioModifier(selectedModifier, m.preSelectedQuantity);
                                }}
                                modifierQuantity={modifierQuantity(m.modifier)}
                                productQuantity={productQuantity}
                                checked={checkModifierSelected(m.modifier)}
                                maxReached={isMaxReached(modifierGroup.choiceMax, selectedModifiers)}
                                modifiersSelectedCount={getModifiersSelectedCount(selectedModifiers)}
                                isValid={isValid}
                                disabled={disabled || !isValid || checkMaxReached(m.modifier)}
                            />
                        );
                    })}
            </div>
        </>
    );
};

const Modifier = (props: {
    modifier: IGET_RESTAURANT_MODIFIER;
    selectedModifier?: ICartModifier;
    choiceDuplicate: number;
    maxReached: boolean;
    modifiersSelectedCount: number;
    isValid: boolean;
    disabled: boolean;

    modifierQuantity: number;
    productQuantity: number;
    // If checkboxes are used, this must be given
    checked: boolean;

    onEditSelectionsProductModifier: (index: number, selectedModifier: ICartModifier, productModifier: IGET_RESTAURANT_PRODUCT) => void;
    // Called when checkboxes are used
    onCheckingModifier: (selectedModifier: IGET_RESTAURANT_MODIFIER) => void;
    onUnCheckingModifier: (selectedModifier: IGET_RESTAURANT_MODIFIER) => void;

    onChangeModifierQuantity: (selectedModifier: IGET_RESTAURANT_MODIFIER, isIncremented: boolean, quantity: number) => void;

    onSelectRadioModifier: (selectedModifier: IGET_RESTAURANT_MODIFIER) => void;

    // settings
    radio: boolean;
}) => {
    const {
        modifier,
        selectedModifier,
        choiceDuplicate,
        maxReached,
        modifiersSelectedCount,
        isValid,
        disabled,
        modifierQuantity,
        productQuantity,
        checked,
        onCheckingModifier,
        onUnCheckingModifier,
        onChangeModifierQuantity,
        onSelectRadioModifier,
        radio,
    } = props;

    const { cartModifierQuantitiesById, cartProductQuantitiesById } = useCart();
    const [stepperCount, setStepperCount] = useState(modifierQuantity);
    const [displayModifierStepper, setDisplayModifierStepper] = useState(false);

    const stepperHeight = 28;

    const showRadio = radio;
    const showStepper = choiceDuplicate > 1 && (displayModifierStepper || modifierQuantity > 0);
    const showCollapsedStepper = choiceDuplicate > 1 && !displayModifierStepper && modifierQuantity == 0;
    const showCheckbox = !showRadio && !showStepper && !showCollapsedStepper;

    const getModifierOrProductModifierQuantityAvailable = () => {
        if (modifier.productModifier) {
            if (!modifier.productModifier.totalQuantityAvailable) return null;

            return getProductQuantityAvailable(
                {
                    id: modifier.productModifier.id,
                    totalQuantityAvailable: modifier.productModifier.totalQuantityAvailable,
                },
                cartProductQuantitiesById
            );
        } else {
            if (!modifier.totalQuantityAvailable) return null;

            return getModifierQuantityAvailable(
                {
                    id: modifier.id,
                    totalQuantityAvailable: modifier.totalQuantityAvailable,
                },
                cartModifierQuantitiesById
            );
        }
    };

    const modifierQuantityAvailable = getModifierOrProductModifierQuantityAvailable();

    useEffect(() => {
        if (modifierQuantityAvailable) {
            const count = getStepperCount();

            setStepperCount(count);
            _onChangeModifierQuantity(count, false); //Set isIncremented=false because if count was to be changed by getStepperCount would return a lower or same value as now.
        }
    }, [productQuantity]);

    useEffect(() => {
        if (!selectedModifier) return;

        setStepperCount(selectedModifier.quantity);

        if (selectedModifier.quantity > 0) {
            setDisplayModifierStepper(true);
        }
    }, [selectedModifier]);

    const _onCheckingModifier = () => {
        onCheckingModifier(modifier);
    };

    const _onUnCheckingModifier = () => {
        onUnCheckingModifier(modifier);
    };

    const _onChangeModifierQuantity = (quantity: number, isIncremented: boolean) => {
        if (quantity === 0) {
            setDisplayModifierStepper(false);
        }

        onChangeModifierQuantity(modifier, isIncremented, quantity);
    };

    const _onSelectRadioModifier = () => {
        if (selectedModifier) return;

        onSelectRadioModifier(modifier);
    };

    const _onDisplayModifierStepper = () => {
        if (disabled || maxReached) return;

        onChangeModifierQuantity(modifier, true, 1);
    };

    const modifierChildren = (
        <>
            <div className="modifier-item">
                {modifier.image && (
                    <CachedImage
                        url={`${getCloudFrontDomainName()}/protected/${modifier.image.identityPoolId}/${modifier.image.key}`}
                        className="image mr-3"
                        alt="product-image"
                    />
                )}

                {isValid ? (
                    <div>
                        {modifier.name} {modifier.price > 0 && `($${convertCentsToDollars(modifier.price)})`}
                        {modifierQuantityAvailable && modifierQuantityAvailable <= 5 && (
                            <span className="quantity-remaining ml-2">{getQuantityRemainingText(modifierQuantityAvailable)}</span>
                        )}
                    </div>
                ) : (
                    <div>
                        {modifier.name} {modifier.price > 0 && `($${convertCentsToDollars(modifier.price)})`} (SOLD OUT)
                    </div>
                )}

                {modifier.productModifier && modifier.productModifier.modifierGroups && modifier.productModifier.modifierGroups.items.length > 0 && (
                    <FiChevronRight className="product-modifier-chevron-right" size={24} />
                )}
            </div>
        </>
    );

    const getModifierStepperMax = () => {
        if (modifierQuantityAvailable) {
            let maxSelectable = Math.min(choiceDuplicate - modifiersSelectedCount, modifierQuantityAvailable);

            if (maxSelectable < modifierQuantityAvailable) {
                maxSelectable = modifierQuantityAvailable;
            }

            return Math.floor(maxSelectable / productQuantity);
        } else {
            return maxReached ? stepperCount : choiceDuplicate;
        }
    };

    const getStepperCount = () => {
        const maxAllowed = getModifierStepperMax();

        if (stepperCount > maxAllowed) {
            return maxAllowed;
        } else {
            return stepperCount;
        }
    };

    const stepper = (
        <Stepper
            className="modifier-item-wrapper pt-2 pb-2"
            count={getStepperCount()}
            min={0}
            max={getModifierStepperMax()}
            onIncrement={(count: number) => _onChangeModifierQuantity(count, true)}
            onDecrement={(count: number) => _onChangeModifierQuantity(count, false)}
            disabled={disabled}
            size={stepperHeight}
        >
            {modifierChildren}
        </Stepper>
    );

    const collapsedStepper = (
        <div className="modifier-item-wrapper collapsed-stepper-container pt-2 pb-2" onClick={_onDisplayModifierStepper}>
            <div
                className={`collapsed-stepper ${disabled ? "disabled" : ""}  `}
                style={{
                    height: String(stepperHeight) + "px",
                    width: String(stepperHeight) + "px",
                }}
            >
                <PlusIcon height={String(stepperHeight / 1.8) + "px"} />
            </div>
            <div className="collapsed-stepper-children ml-3">{modifierChildren}</div>
        </div>
    );

    const checkbox = (
        <Checkbox
            className="modifier-item-wrapper pt-2 pb-2"
            onCheck={_onCheckingModifier}
            onUnCheck={_onUnCheckingModifier}
            checked={checked}
            disabled={disabled}
        >
            {modifierChildren}
        </Checkbox>
    );

    const _radio = (
        <Radio className="modifier-item-wrapper pt-2 pb-2" selected={checked} onSelect={_onSelectRadioModifier} disabled={disabled}>
            {modifierChildren}
        </Radio>
    );

    const onEditSelectionsProductModifier = (index: number) => {
        if (!selectedModifier || !modifier.productModifier) return;

        props.onEditSelectionsProductModifier(index, selectedModifier, modifier.productModifier);
    };

    const productModifiers = (
        <div>
            {selectedModifier && selectedModifier.productModifiers && (
                <div className="mb-2">
                    {selectedModifier.productModifiers.map((productModifier, index) => (
                        <>
                            <div className="mt-2"></div>
                            <ProductModifier
                                key={productModifier.id}
                                product={productModifier}
                                onEditSelections={() => onEditSelectionsProductModifier(index)}
                            />
                        </>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <>
            <div className={`modifier ${isValid ? "" : "sold-out"}`}>
                {showRadio && _radio}

                {showStepper && stepper}

                {showCollapsedStepper && collapsedStepper}

                {showCheckbox && checkbox}

                {selectedModifier && selectedModifier.productModifiers && productModifiers}
            </div>
        </>
    );
};
