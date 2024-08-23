import { useState, useEffect, useRef } from "react";
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
import { FiArrowDownCircle } from "react-icons/fi";
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
import { FiChevronDown, FiChevronRight, FiPlusCircle } from "react-icons/fi";
import { ProductModifier } from "../shared/productModifier";

import "./product.scss";
import { useRegister } from "../../context/register-context";

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
    currentSelectedProductModifier?: ISelectedProductModifier;
    isOpen: boolean;
    onAddProduct?: (product: ICartProduct) => void;
    onUpdateProduct?: (index: number, product: ICartProduct) => void;
    onClose: () => void;
    editProduct?: {
        orderedModifiers: IPreSelectedModifiers;
        quantity: number;
        notes: string | null;
        productCartIndex: number;
    };
}) => {
    const { register } = useRegister();
    const { category, product, currentSelectedProductModifier, isOpen, onAddProduct, onUpdateProduct, onClose, editProduct } = props;
    const { cartProductQuantitiesById } = useCart();

    const getPreSelectedModifiers = () => {
        //Set preselected modifiers logic
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
                                        kitchenName: modifierLink.modifier.kitchenName,
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
            });

        return newOrderedModifiers;
    };

    const [orderedModifiers, setOrderedModifiers] = useState<IPreSelectedModifiers>(
        editProduct ? editProduct.orderedModifiers : getPreSelectedModifiers()
    );
    const [quantity, setQuantity] = useState(editProduct ? editProduct.quantity : 1);
    const [totalDisplayPrice, setTotalDisplayPrice] = useState(product.price);
    const [notes, setNotes] = useState(editProduct ? editProduct.notes : "");
    const [error, setError] = useState<{ [modifierGroupId: string]: string }>({});

    const [selectedProductModifier, setSelectedProductModifier] = useState<ISelectedProductModifier | null>(null);
    const [isScrollable, setIsScrollable] = useState(false);
    const [tryToCheckModel, setTryToCheckModel] = useState(0);

    useEffect(() => {
        const checkDivScrollable = () => {
            const scrollableDiv = document.getElementById("productsWrapperScrollModel");
            const arrowContainer = document.querySelector(".arrow-containerModel");

            if (scrollableDiv) {
                const isDivScrollable = scrollableDiv.scrollHeight > scrollableDiv.clientHeight;
                setIsScrollable(isDivScrollable);
                if (isDivScrollable) {
                    arrowContainer?.classList.remove("fade-out");
                    arrowContainer?.classList.add("fade-in");
                } else {
                    arrowContainer?.classList.remove("fade-in");
                    arrowContainer?.classList.add("fade-out");
                }
            } else {
                setTimeout(() => {
                    if (tryToCheckModel < 10) {
                        checkDivScrollable();
                        setTryToCheckModel(tryToCheckModel + 1);
                    }
                }, 100);
            }
        };

        window.addEventListener("resize", checkDivScrollable);

        checkDivScrollable();

        return () => {
            window.removeEventListener("resize", checkDivScrollable);
        };
    }, [product.modifierGroups]);

    const [productsWrapperElement, setProductsWrapperElement] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            const scrollableDiv = document.getElementById("productsWrapperScrollModel");
            const arrowContainer = document.querySelector(".arrow-containerModel");

            if (scrollableDiv) {
                const isAtBottom = scrollableDiv.scrollTop + scrollableDiv.clientHeight === scrollableDiv.scrollHeight;
                if (!isAtBottom) {
                    arrowContainer?.classList.remove("fade-out");
                    arrowContainer?.classList.add("fade-in");
                } else {
                    arrowContainer?.classList.remove("fade-in");
                    arrowContainer?.classList.add("fade-out");
                }
            }
        };

        const productsWrapperScroll = document.getElementById("productsWrapperScrollModel");
        if (productsWrapperScroll) {
            productsWrapperScroll.addEventListener("scroll", handleScroll);
            return () => {
                productsWrapperScroll.removeEventListener("scroll", handleScroll);
            };
        }
    }, [productsWrapperElement]);

    // useEffect(() => {
    //     console.log("xxx...orderedModifiers", orderedModifiers);
    // }, [orderedModifiers]);

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
                            kitchenName: modifier.kitchenName,
                            price: modifier.price,
                            preSelectedQuantity: modifier.preSelectedQuantity,
                            quantity: modifier.quantity,
                            productModifiers: modifier.productModifiers,
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

        const requiresProcessProductModifier =
            selectedModifier.productModifier &&
            selectedModifier.productModifier.modifierGroups &&
            selectedModifier.productModifier.modifierGroups.items.length > 0;

        //We only want to add pms only if we are not going to open another product modal for productModifier with modifier groups
        const pms =
            !requiresProcessProductModifier && selectedModifier.productModifier
                ? [
                      {
                          id: selectedModifier.productModifier.id,
                          name: selectedModifier.productModifier.name,
                          kitchenName: selectedModifier.productModifier.kitchenName,
                          price: selectedModifier.productModifier.price,
                          totalPrice: selectedModifier.productModifier.price,
                          discount: 0,
                          isAgeRescricted: selectedModifier.isAgeRescricted,
                          image: selectedModifier.productModifier.image
                              ? {
                                    key: selectedModifier.productModifier.image.key,
                                    region: selectedModifier.productModifier.image.region,
                                    bucket: selectedModifier.productModifier.image.bucket,
                                    identityPoolId: selectedModifier.productModifier.image.identityPoolId,
                                }
                              : null,
                          quantity: 1,
                          notes: null,
                          category:
                              selectedModifier.productModifier.categories && selectedModifier.productModifier.categories.items.length > 0
                                  ? {
                                        id: selectedModifier.productModifier.categories.items[0].category.id,
                                        name: selectedModifier.productModifier.categories.items[0].category.name,
                                        kitchenName: selectedModifier.productModifier.categories.items[0].category.kitchenName,
                                        image: selectedModifier.productModifier.categories.items[0].category.image
                                            ? {
                                                  key: selectedModifier.productModifier.categories.items[0].category.image.key,
                                                  region: selectedModifier.productModifier.categories.items[0].category.image.region,
                                                  bucket: selectedModifier.productModifier.categories.items[0].category.image.bucket,
                                                  identityPoolId: selectedModifier.productModifier.categories.items[0].category.image.identityPoolId,
                                              }
                                            : null,
                                    }
                                  : null,
                          modifierGroups: [],
                      },
                  ]
                : null;

        const newOrderedModifierItem: ICartModifier = {
            id: selectedModifier.id,
            name: selectedModifier.name,
            kitchenName: selectedModifier.kitchenName,
            price: selectedModifier.price,
            preSelectedQuantity: preSelectedModifierQuantity,
            quantity: 1,
            productModifiers: pms,
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

        if (requiresProcessProductModifier && selectedModifier.productModifier) {
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
            kitchenName: selectedModifier.kitchenName,
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

        const requiresProcessProductModifier =
            selectedModifier.productModifier &&
            selectedModifier.productModifier.modifierGroups &&
            selectedModifier.productModifier.modifierGroups.items.length > 0;

        //We only want to add pms only if we are not going to open another product modal for productModifier with modifier groups
        const pms =
            !requiresProcessProductModifier && selectedModifier.productModifier
                ? [
                      {
                          id: selectedModifier.productModifier.id,
                          name: selectedModifier.productModifier.name,
                          kitchenName: selectedModifier.productModifier.kitchenName,
                          price: selectedModifier.productModifier.price,
                          totalPrice: selectedModifier.productModifier.price,
                          discount: 0,
                          isAgeRescricted: selectedModifier.isAgeRescricted,
                          image: selectedModifier.productModifier.image
                              ? {
                                    key: selectedModifier.productModifier.image.key,
                                    region: selectedModifier.productModifier.image.region,
                                    bucket: selectedModifier.productModifier.image.bucket,
                                    identityPoolId: selectedModifier.productModifier.image.identityPoolId,
                                }
                              : null,
                          quantity: 1,
                          notes: null,
                          category:
                              selectedModifier.productModifier.categories && selectedModifier.productModifier.categories.items.length > 0
                                  ? {
                                        id: selectedModifier.productModifier.categories.items[0].category.id,
                                        name: selectedModifier.productModifier.categories.items[0].category.name,
                                        kitchenName: selectedModifier.productModifier.categories.items[0].category.kitchenName,
                                        image: selectedModifier.productModifier.categories.items[0].category.image
                                            ? {
                                                  key: selectedModifier.productModifier.categories.items[0].category.image.key,
                                                  region: selectedModifier.productModifier.categories.items[0].category.image.region,
                                                  bucket: selectedModifier.productModifier.categories.items[0].category.image.bucket,
                                                  identityPoolId: selectedModifier.productModifier.categories.items[0].category.image.identityPoolId,
                                              }
                                            : null,
                                    }
                                  : null,
                          modifierGroups: [],
                      },
                  ]
                : null;

        const newOrderedModifierItem: ICartModifier = {
            id: selectedModifier.id,
            name: selectedModifier.name,
            kitchenName: selectedModifier.kitchenName,
            price: selectedModifier.price,
            preSelectedQuantity: preSelectedModifierQuantity,
            quantity: quantity,
            productModifiers: pms,
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

        if (requiresProcessProductModifier && selectedModifier.productModifier && isIncremented) {
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

        const requiresProcessProductModifier =
            selectedModifier.productModifier &&
            selectedModifier.productModifier.modifierGroups &&
            selectedModifier.productModifier.modifierGroups.items.length > 0;

        //We only want to add pms only if we are not going to open another product modal for productModifier with modifier groups
        const pms =
            !requiresProcessProductModifier && selectedModifier.productModifier
                ? [
                      {
                          id: selectedModifier.productModifier.id,
                          name: selectedModifier.productModifier.name,
                          kitchenName: selectedModifier.productModifier.kitchenName,
                          price: selectedModifier.productModifier.price,
                          totalPrice: selectedModifier.productModifier.price,
                          discount: 0,
                          isAgeRescricted: selectedModifier.isAgeRescricted,
                          image: selectedModifier.productModifier.image
                              ? {
                                    key: selectedModifier.productModifier.image.key,
                                    region: selectedModifier.productModifier.image.region,
                                    bucket: selectedModifier.productModifier.image.bucket,
                                    identityPoolId: selectedModifier.productModifier.image.identityPoolId,
                                }
                              : null,
                          quantity: 1,
                          notes: null,
                          category:
                              selectedModifier.productModifier.categories && selectedModifier.productModifier.categories.items.length > 0
                                  ? {
                                        id: selectedModifier.productModifier.categories.items[0].category.id,
                                        name: selectedModifier.productModifier.categories.items[0].category.name,
                                        kitchenName: selectedModifier.productModifier.categories.items[0].category.kitchenName,
                                        image: selectedModifier.productModifier.categories.items[0].category.image
                                            ? {
                                                  key: selectedModifier.productModifier.categories.items[0].category.image.key,
                                                  region: selectedModifier.productModifier.categories.items[0].category.image.region,
                                                  bucket: selectedModifier.productModifier.categories.items[0].category.image.bucket,
                                                  identityPoolId: selectedModifier.productModifier.categories.items[0].category.image.identityPoolId,
                                              }
                                            : null,
                                    }
                                  : null,
                          modifierGroups: [],
                      },
                  ]
                : null;

        const newOrderedModifierItem: ICartModifier = {
            id: selectedModifier.id,
            name: selectedModifier.name,
            kitchenName: selectedModifier.kitchenName,
            price: selectedModifier.price,
            preSelectedQuantity: preSelectedModifierQuantity,
            quantity: 1,
            productModifiers: pms,
            image: selectedModifier.image
                ? {
                      key: selectedModifier.image.key,
                      region: selectedModifier.image.region,
                      bucket: selectedModifier.image.bucket,
                      identityPoolId: selectedModifier.image.identityPoolId,
                  }
                : null,
        };

        let newOrderedModifiers: IPreSelectedModifiers = {
            ...orderedModifiers,
            [selectedModifierGroupId]: [newOrderedModifierItem],
        };

        if (requiresProcessProductModifier && selectedModifier.productModifier) {
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

                //Unlimited choice
                if (choiceMin === 0 && choiceMax === 0) return;

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
            scrollToDiv();
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
                        kitchenName: mg.modifierGroup.kitchenName,
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
            kitchenName: product.kitchenName,
            price: product.price,
            totalPrice: totalDisplayPrice / quantity,
            discount: 0,
            isAgeRescricted: product.isAgeRescricted,
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
            modifierGroups: selectedModifierGroups,
        };

        if (editProduct) {
            onUpdateProduct && onUpdateProduct(editProduct.productCartIndex, productToOrder);
        } else {
            onAddProduct && onAddProduct(productToOrder);
        }

        onClose();
    };

    const onUpdateQuantity = (count: number) => {
        setQuantity(count);
    };

    const onNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
    };

    const scrollToDiv = () => {
        const targetElement = document.getElementById("scroll-here");
        if (targetElement) {
            // Scroll to the element if it exists
            targetElement.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    const modifierGroups = (
        <>
            <div className="separator-6"></div>
            {product.modifierGroups &&
                product.modifierGroups.items.map((mg) => {
                    if (mg.hideForCustomer) return;
                    if (register && mg.modifierGroup.availablePlatforms && !mg.modifierGroup.availablePlatforms.includes(register.type)) return;

                    return (
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
                                currentSelectedProductModifier={currentSelectedProductModifier}
                                productQuantity={quantity}
                                error={error[mg.modifierGroup.id]}
                                disabled={false}
                                scrollToDiv={scrollToDiv}
                            />
                            <div className="separator-6"></div>
                        </>
                    );
                })}
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
            {!currentSelectedProductModifier && (
                <div className="stepper mb-4">
                    <Stepper count={quantity} min={1} max={getProductFooterMaxQuantity()} onUpdate={onUpdateQuantity} size={48} />
                </div>
            )}
            <div className="footer-buttons-container">
                <Button className="button large mr-3 cancel-button" onClick={onModalClose}>
                    Cancel
                </Button>
                <Button className="button large add-update-order-button" onClick={onSubmit}>
                    {currentSelectedProductModifier
                        ? "Save"
                        : editProduct
                        ? `Update Item ${convertCentsToDollars(totalDisplayPrice)}`
                        : `Add To Order ${convertCentsToDollars(totalDisplayPrice)}`}
                </Button>
            </div>
        </>
    );

    const scrollDown = () => {
        const scrollableDiv = document.getElementById("productsWrapperScrollModel");
        if (scrollableDiv) {
            scrollableDiv.scrollTop += 100;
        }
    };

    const content = (
        <>
            <div ref={(ref) => setProductsWrapperElement(ref)} className="product" id="productsWrapperScrollModel">
                <div className="mt-11" />
                <div className="product-header">
                    <div className="image-wrapper">
                        {product.imageUrl ? (
                            <CachedImage url={`${product.imageUrl}`} className="image" alt="product-image" />
                        ) : product.image ? (
                            <>
                                <CachedImage
                                    className="image"
                                    url={`${getCloudFrontDomainName()}/protected/${product.image.identityPoolId}/${product.image.key}`}
                                    alt="product-image"
                                />
                            </>
                        ) : null}
                    </div>
                    <div>
                        <div className="h1 mb-4 name">
                            {currentSelectedProductModifier ? currentSelectedProductModifier.selectedModifier.name : product.name}
                        </div>
                        {product.description && <div className="description">{product.description}</div>}
                    </div>
                </div>
                {modifierGroups}
                <div className="product-notes-wrapper">{!currentSelectedProductModifier && productNotes}</div>
                {isScrollable ? (
                    <div className={register?.type === "POS" ? "mr-btm fixed-button" : "fixed-button"} onClick={scrollDown}>
                        <div className={`arrow-containerModel ${isScrollable ? "fade-in" : "fade-out"}`}>
                            <FiArrowDownCircle size="46" />
                        </div>
                    </div>
                ) : null}
            </div>
            <div className="footer">{footer}</div>
        </>
    );

    const onModalCloseProductModifier = () => {
        setSelectedProductModifier(null);
    };

    const onAddProductModifierProduct = (product: ICartProduct) => {
        if (!selectedProductModifier) return;

        const newOrderedModifiers = {
            ...selectedProductModifier.newOrderedModifiers,
        };
        const lastIndex = newOrderedModifiers[selectedProductModifier.selectedModifierGroupId].length - 1;
        const newProductModifiers = newOrderedModifiers[selectedProductModifier.selectedModifierGroupId][lastIndex].productModifiers || [];

        newOrderedModifiers[selectedProductModifier.selectedModifierGroupId][lastIndex].productModifiers = [...newProductModifiers, product];
        setOrderedModifiers(newOrderedModifiers);
    };

    const onUpdateProductModifierProduct = (index: number, productModifier: ICartProduct) => {
        if (!selectedProductModifier || selectedProductModifier.editSelectionsProductModifierIndex === undefined) return; //Check for undefined specifically

        const newOrderedModifiers = {
            ...selectedProductModifier.newOrderedModifiers,
        };

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
                    onClose={onModalCloseProductModifier}
                    category={category}
                    product={selectedProductModifier.product}
                    currentSelectedProductModifier={selectedProductModifier}
                    onAddProduct={onAddProductModifierProduct}
                    onUpdateProduct={onUpdateProductModifierProduct}
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
    currentSelectedProductModifier?: ISelectedProductModifier;
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
    scrollToDiv;
}) => {
    const {
        modifierGroup,
        currentSelectedProductModifier,
        onCheckingModifier,
        onUnCheckingModifier,
        onChangeModifierQuantity,
        onSelectRadioModifier,
        selectedModifiers,
        productQuantity,
        error,
        disabled,
        scrollToDiv,
    } = props;
    const { register } = useRegister();
    const { cartProductQuantitiesById, cartModifierQuantitiesById } = useCart();

    const [collapsed, setCollapsed] = useState<boolean>(modifierGroup.collapsedByDefault ? modifierGroup.collapsedByDefault : false);
    const [subModifierGroups, setSubModifierGroups] = useState<string[]>([]);

    const [selectedSubModifierGroup, setSelectedSubModifierGroup] = useState<string | null>();

    useEffect(() => {
        const newSubModifierGroups: string[] = [];

        modifierGroup.modifiers &&
            modifierGroup.modifiers.items.forEach((m) => {
                m.modifier.subModifierGroups &&
                    m.modifier.subModifierGroups.split(";").forEach((subModifierGroup) => {
                        if (!newSubModifierGroups.includes(subModifierGroup)) newSubModifierGroups.push(subModifierGroup);
                    });
            });

        setSubModifierGroups(newSubModifierGroups);

        if (newSubModifierGroups.length > 0) {
            setSelectedSubModifierGroup(newSubModifierGroups[0]);
        } else {
            setSelectedSubModifierGroup(null);
        }
    }, []);

    useEffect(() => {
        scrollToDiv();
    }, [error]);

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

    const isMaxReached = (max: number, min: number, selectedModifiers?: ICartModifier[]): boolean => {
        if (selectedModifiers === undefined) {
            return false;
        }

        let count = 0;

        selectedModifiers.forEach((selectedModifier) => (count += selectedModifier.quantity));
        if (min === 0 && max === 0) {
            return false;
        }
        return count >= max;
    };

    const checkMaxReached = (modifier: IGET_RESTAURANT_MODIFIER) => {
        const isUnlimitedChoice = modifierGroup.choiceMin === 0 && modifierGroup.choiceMax === 0;
        const isSingleChoice = modifierGroup.choiceMin === 1 && modifierGroup.choiceMax === 1;
        const isModifierSelected = selectedModifiers.some((selectedModifier) => selectedModifier.id === modifier.id);
        const isMaxChoiceReached = !isSingleChoice && isMaxReached(modifierGroup.choiceMax, modifierGroup.choiceMin, selectedModifiers);

        if (isUnlimitedChoice) return false;

        return !isSingleChoice && isMaxChoiceReached && !isModifierSelected;
    };

    // display
    const getSelectInstructions = () => {
        return modifierGroup.choiceMin === modifierGroup.choiceMax
            ? "Select " + modifierGroup.choiceMin
            : modifierGroup.choiceMin === 0
            ? "Select up to " + modifierGroup.choiceMax
            : "Make between " + modifierGroup.choiceMin + " and " + modifierGroup.choiceMax + " selections";
    };

    // console.log("xxx...subModifierGroups", subModifierGroups);

    const onToggleCollapsed = () => {
        setCollapsed(!collapsed);
    };
    return (
        <>
            <div className="modifier-group-header-wrapper" onClick={onToggleCollapsed} id={error ? "scroll-here" : ""}>
                <div className="modifier-group-header">
                    <div className="h2 mb-2">{modifierGroup.name}</div>
                    {error && <div className="text-error mb-2">{error}</div>}
                    {/* //Dont show select instructoins for unlmited choice */}
                    {modifierGroup.choiceMin !== 0 && modifierGroup.choiceMax !== 0 && <div className="mb-2">({getSelectInstructions()})</div>}
                </div>
                {collapsed ? (
                    <div>
                        <FiPlusCircle size="36px" />
                    </div>
                ) : modifierGroup.collapsedByDefault ? (
                    <div>
                        <FiChevronDown size="36px" />
                    </div>
                ) : (
                    <div></div>
                )}
            </div>

            {!collapsed && (
                <>
                    {subModifierGroups.length > 0 && (
                        <div className="modifier-sub-modifier-group-wrapper mt-4 mb-4">
                            {subModifierGroups.map((subModifierGroup) => (
                                <div
                                    className={`modifier-sub-modifier-group h3 ${selectedSubModifierGroup === subModifierGroup ? "selected" : ""}`}
                                    onClick={() => setSelectedSubModifierGroup(subModifierGroup)}
                                >
                                    {subModifierGroup}
                                </div>
                            ))}
                            <div
                                className={`modifier-sub-modifier-group background-grey h3 ${selectedSubModifierGroup === null ? "selected" : ""}`}
                                onClick={() => setSelectedSubModifierGroup(null)}
                            >
                                All
                            </div>
                        </div>
                    )}
                    <div className="modifiers">
                        {modifierGroup.modifiers &&
                            modifierGroup.modifiers.items
                                .slice()
                                .sort((a, b) => (modifierGroup.alphabeticalSorting ? a.modifier.name.localeCompare(b.modifier.name) : 0))
                                .map((m) => {
                                    if (register && m.modifier.availablePlatforms && !m.modifier.availablePlatforms.includes(register.type)) return;
                                    if (
                                        (selectedSubModifierGroup &&
                                            m.modifier.subModifierGroups &&
                                            !m.modifier.subModifierGroups.split(";").includes(selectedSubModifierGroup)) ||
                                        (selectedSubModifierGroup && selectedSubModifierGroup && !m.modifier.subModifierGroups)
                                    )
                                        return;

                                    const isValid = checkModifierIsValid(m.modifier);
                                    const selectedModifier = selectedModifiers.find((modifier) => modifier.id == m.modifier.id);

                                    return (
                                        <Modifier
                                            modifier={m.modifier}
                                            selectedModifier={selectedModifier}
                                            currentSelectedProductModifier={currentSelectedProductModifier}
                                            choiceMin={modifierGroup.choiceMin}
                                            choiceMax={modifierGroup.choiceMax}
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
                                            onChangeModifierQuantity={(
                                                selectedModifier: IGET_RESTAURANT_MODIFIER,
                                                isIncremented: boolean,
                                                quantity: number
                                            ) => {
                                                onChangeModifierQuantity(selectedModifier, m.preSelectedQuantity, isIncremented, quantity);
                                            }}
                                            onSelectRadioModifier={(selectedModifier: IGET_RESTAURANT_MODIFIER) => {
                                                onSelectRadioModifier(selectedModifier, m.preSelectedQuantity);
                                            }}
                                            modifierQuantity={modifierQuantity(m.modifier)}
                                            productQuantity={productQuantity}
                                            checked={checkModifierSelected(m.modifier)}
                                            maxReached={isMaxReached(modifierGroup.choiceMax, modifierGroup.choiceMin, selectedModifiers)}
                                            modifiersSelectedCount={getModifiersSelectedCount(selectedModifiers)}
                                            isValid={isValid}
                                            disabled={disabled || !isValid || checkMaxReached(m.modifier)}
                                        />
                                    );
                                })}
                    </div>
                </>
            )}
        </>
    );
};

const Modifier = (props: {
    modifier: IGET_RESTAURANT_MODIFIER;
    selectedModifier?: ICartModifier;
    currentSelectedProductModifier?: ISelectedProductModifier;
    choiceMin: number;
    choiceMax: number;
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
}) => {
    const {
        modifier,
        selectedModifier,
        currentSelectedProductModifier,
        choiceMin,
        choiceMax,
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
    } = props;

    const { cartModifierQuantitiesById, cartProductQuantitiesById } = useCart();
    const [stepperCount, setStepperCount] = useState(modifierQuantity);
    const [displayModifierStepper, setDisplayModifierStepper] = useState(false);

    const stepperHeight = 28;
    const showRadio = choiceMin !== 0 && choiceMax === 1;
    const showStepper = showRadio ? false : choiceDuplicate > 1 && (displayModifierStepper || modifierQuantity > 0);
    const showCollapsedStepper = showRadio ? false : choiceDuplicate > 1 && !displayModifierStepper && modifierQuantity == 0;
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
                        <div>
                            {modifier.name}
                            {modifier.price > 0
                                ? ` (+$${convertCentsToDollars(modifier.price)})`
                                : modifier.price < 0
                                ? ` (-$${convertCentsToDollars(Math.abs(modifier.price))})`
                                : ""}
                            {modifierQuantityAvailable && modifierQuantityAvailable <= 5 ? (
                                <span className="quantity-remaining ml-2">{getQuantityRemainingText(modifierQuantityAvailable)}</span>
                            ) : (
                                <></>
                            )}
                        </div>
                        <div className="description text-grey">{modifier.description}</div>
                    </div>
                ) : (
                    <div>
                        {modifier.name} {modifier.price > 0 && `(+$${convertCentsToDollars(modifier.price)})`} (SOLD OUT)
                        <div className="description text-grey">{modifier.description}</div>
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
                    minHeight: String(stepperHeight) + "px",
                    minWidth: String(stepperHeight) + "px",
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

                {selectedModifier && selectedModifier.productModifiers && !currentSelectedProductModifier && productModifiers}
            </div>
        </>
    );
};
