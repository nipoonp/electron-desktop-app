import React, { useState, useEffect } from "react";
import { useUser } from "../../context/user-context";
import { ICartModifier, ISelectedProductModifiers, ICartProduct, ICartModifierGroup } from "../../model/model";
import { Logger } from "aws-amplify";
import { toast } from "../../tabin/components/toast";
import { isItemSoldOut } from "../../util/util";
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

import "./product.css";
import { TextArea } from "../../tabin/components/textArea";

const logger = new Logger("productModal");

export const ProductModal = (props: {
    //
    category: IGET_RESTAURANT_CATEGORY;
    product: IGET_RESTAURANT_PRODUCT;
    isOpen: boolean;
    onAddItem?: (product: ICartProduct) => void;
    onUpdateItem?: (index: number, product: ICartProduct) => void;
    onClose: () => void;
    // restaurantIsOpen: boolean;
    restaurantIsAcceptingOrders: boolean;
    restaurantName: string;

    // edit product
    editProduct?: {
        orderedModifiers: ISelectedProductModifiers;
        quantity: number;
        notes: string | null;
        productCartIndex: number;
    };
}) => {
    // context
    const { user } = useUser();

    // states
    const [orderedModifiers, setOrderedModifiers] = useState<ISelectedProductModifiers>(props.editProduct ? props.editProduct.orderedModifiers : {});
    const [quantity, setQuantity] = useState(props.editProduct ? props.editProduct.quantity : 1);
    const [notes, setNotes] = useState(props.editProduct ? props.editProduct.notes : "");
    const [error, setError] = useState<{ [modifierGroupId: string]: string }>({});

    const [totalDisplayPrice, setTotalDisplayPrice] = useState(props.product.price);

    useEffect(() => {
        console.log(orderedModifiers);
    }, [orderedModifiers]);

    useEffect(() => {
        if (props.editProduct) return;

        let newOrderedModifiers: ISelectedProductModifiers = {};

        props.product.modifierGroups.items.forEach((modifierGroupLink) => {
            modifierGroupLink.modifierGroup.modifiers.items.map((modifierLink) => {
                if (modifierLink.preSelectedQuantity) {
                    if (newOrderedModifiers[modifierGroupLink.modifierGroup.id] === undefined) {
                        newOrderedModifiers[modifierGroupLink.modifierGroup.id] = [];
                    }

                    newOrderedModifiers = Object.assign({}, newOrderedModifiers, {
                        [modifierGroupLink.modifierGroup.id]: newOrderedModifiers[modifierGroupLink.modifierGroup.id].concat({
                            id: modifierLink.modifier.id,
                            name: modifierLink.modifier.name,
                            price: modifierLink.modifier.price,
                            preSelectedQuantity: modifierLink.preSelectedQuantity,
                            quantity: modifierLink.preSelectedQuantity,
                        }),
                    });
                }
            });

            setOrderedModifiers(newOrderedModifiers);
        });
    }, []);

    useEffect(() => {
        let price = props.product.price;

        for (let key in orderedModifiers) {
            let currElement: ICartModifier[] = orderedModifiers[key];
            currElement.forEach((m) => {
                const changedQuantity = m.quantity - m.preSelectedQuantity;

                if (changedQuantity > 0) {
                    price += m.price * changedQuantity;
                }
            });
        }

        price = price * quantity;
        setTotalDisplayPrice(price);
    }, [orderedModifiers, quantity]);

    // callbacks
    const onModalClose = () => {
        props.onClose();
    };

    const onCheckingModifier = (selectedModifierGroupId: string, preSelectedModifierQuantity: number, selectedModifier: IGET_RESTAURANT_MODIFIER) => {
        setError({});

        if (orderedModifiers[selectedModifierGroupId] === undefined) {
            orderedModifiers[selectedModifierGroupId] = [];
        }

        let newOrderedModifiers = Object.assign({}, orderedModifiers, {
            [selectedModifierGroupId]: orderedModifiers[selectedModifierGroupId].filter((m) => m.id !== selectedModifier.id),
        });

        let newOrderedModifiers2 = Object.assign({}, newOrderedModifiers, {
            [selectedModifierGroupId]: newOrderedModifiers[selectedModifierGroupId].concat({
                id: selectedModifier.id,
                name: selectedModifier.name,
                price: selectedModifier.price,
                preSelectedQuantity: preSelectedModifierQuantity,
                quantity: 1,
            }),
        });

        setOrderedModifiers(newOrderedModifiers2);
    };

    const onUnCheckingModifier = (
        selectedModifierGroupId: string,
        preSelectedModifierQuantity: number,
        selectedModifier: IGET_RESTAURANT_MODIFIER
    ) => {
        setError({});

        let newOrderedModifiers = Object.assign({}, orderedModifiers, {
            [selectedModifierGroupId]: orderedModifiers[selectedModifierGroupId].filter((m) => m.id !== selectedModifier.id),
        });

        if (preSelectedModifierQuantity == 0) {
            // If no selected modifies inside a modifier group. Delete the group.
            if (newOrderedModifiers[selectedModifierGroupId].length == 0) {
                delete newOrderedModifiers[selectedModifierGroupId];
            }

            setOrderedModifiers(newOrderedModifiers);
        } else {
            let newOrderedModifiers2 = Object.assign({}, newOrderedModifiers, {
                [selectedModifierGroupId]: newOrderedModifiers[selectedModifierGroupId].concat({
                    id: selectedModifier.id,
                    name: selectedModifier.name,
                    price: selectedModifier.price,
                    preSelectedQuantity: preSelectedModifierQuantity,
                    quantity: 0,
                }),
            });

            setOrderedModifiers(newOrderedModifiers2);
        }
    };

    const onChangeModifierQuantity = (
        selectedModifierGroupId: string,
        preSelectedModifierQuantity: number,
        selectedModifier: IGET_RESTAURANT_MODIFIER,
        quantity: number
    ) => {
        setError({});

        if (orderedModifiers[selectedModifierGroupId] === undefined) {
            orderedModifiers[selectedModifierGroupId] = [];
        }

        let newOrderedModifiers = Object.assign({}, orderedModifiers, {
            [selectedModifierGroupId]: orderedModifiers[selectedModifierGroupId].filter((m) => m.id !== selectedModifier.id),
        });

        // If quantity is 0, don't add a 0 quantity modifier.
        if (quantity == 0 && preSelectedModifierQuantity == 0) {
            // If no selected modifies inside a modifier group. Delete the group.
            if (newOrderedModifiers[selectedModifierGroupId].length == 0) {
                delete newOrderedModifiers[selectedModifierGroupId];
            }

            setOrderedModifiers(newOrderedModifiers);
        } else {
            let newOrderedModifiers2 = Object.assign({}, newOrderedModifiers, {
                [selectedModifierGroupId]: newOrderedModifiers[selectedModifierGroupId].concat({
                    id: selectedModifier.id,
                    name: selectedModifier.name,
                    price: selectedModifier.price,
                    preSelectedQuantity: preSelectedModifierQuantity,
                    quantity: quantity,
                }),
            });

            setOrderedModifiers(newOrderedModifiers2);
        }
    };

    const onSelectRadioModifier = (
        selectedModifierGroupId: string,
        preSelectedModifierQuantity: number,
        selectedModifier: IGET_RESTAURANT_MODIFIER
    ) => {
        setError({});

        let newOrderedModifiers = Object.assign({}, orderedModifiers, {
            [selectedModifierGroupId]: [
                {
                    id: selectedModifier.id,
                    name: selectedModifier.name,
                    price: selectedModifier.price,
                    preSelectedQuantity: preSelectedModifierQuantity,
                    quantity: 1,
                },
            ],
        });

        setOrderedModifiers(newOrderedModifiers);
    };

    // TODO refactor
    const onSubmit = () => {
        logger.debug("onSubmit", [props.product, orderedModifiers]);
        console.log("onSubmit", [props.product, orderedModifiers]);

        let error: { [modifierGroupId: string]: string } = {};

        // TODO: Refactor into functions
        props.product.modifierGroups.items.map((mg) => {
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

        props.product.modifierGroups.items.forEach((mg) => {
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
            id: props.product.id,
            name: props.product.name,
            price: props.product.price,
            image: props.product.image
                ? {
                      key: props.product.image.key,
                      region: props.product.image.region,
                      bucket: props.product.image.bucket,
                      identityPoolId: props.product.image.identityPoolId,
                  }
                : null,
            quantity: quantity,
            notes: notes,
            category: {
                id: props.category.id,
                name: props.category.name,
                image: props.category.image
                    ? {
                          key: props.category.image.key,
                          region: props.category.image.region,
                          bucket: props.category.image.bucket,
                          identityPoolId: props.category.image.identityPoolId,
                      }
                    : null,
            },
            modifierGroups: selectedModifierGroups,
        };

        if (props.editProduct) {
            props.onUpdateItem && props.onUpdateItem(props.editProduct.productCartIndex, productToOrder);
        } else {
            console.log("adding item", productToOrder);
            props.onAddItem && props.onAddItem(productToOrder);
            console.log("added!");
        }

        props.onClose();
    };

    const onUpdateQuantity = (count: number) => {
        setQuantity(count);
    };

    const onNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
    };

    const modifierGroups = (
        <>
            {props.product.modifierGroups.items.map((mg) => (
                <>
                    {!mg.hideForCustomer && (
                        <>
                            <ModifierGroup
                                modifierGroup={mg.modifierGroup}
                                onCheckingModifier={(selectedModifier: IGET_RESTAURANT_MODIFIER, preSelectedModifierQuantity: number) =>
                                    onCheckingModifier(mg.modifierGroup.id, preSelectedModifierQuantity, selectedModifier)
                                }
                                onUnCheckingModifier={(selectedModifier: IGET_RESTAURANT_MODIFIER, preSelectedModifierQuantity: number) =>
                                    onUnCheckingModifier(mg.modifierGroup.id, preSelectedModifierQuantity, selectedModifier)
                                }
                                onChangeModifierQuantity={(
                                    selectedModifier: IGET_RESTAURANT_MODIFIER,
                                    preSelectedModifierQuantity: number,
                                    quantity: number
                                ) => onChangeModifierQuantity(mg.modifierGroup.id, preSelectedModifierQuantity, selectedModifier, quantity)}
                                onSelectRadioModifier={(selectedModifier: IGET_RESTAURANT_MODIFIER, preSelectedModifierQuantity: number) =>
                                    onSelectRadioModifier(mg.modifierGroup.id, preSelectedModifierQuantity, selectedModifier)
                                }
                                selectedModifiers={orderedModifiers[mg.modifierGroup.id] || []}
                                error={error[mg.modifierGroup.id]}
                                disabled={!user || !props.restaurantIsAcceptingOrders}
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
            <div className="h2 mb-3">Special instructions</div>
            <TextArea placeholder={"Leave a note for the kitchen"} onChange={onNotesChange} value={notes || ""} />
        </>
    );

    const footer = (
        <>
            <div className="stepper mb-4">
                <Stepper count={quantity} min={1} onUpdate={onUpdateQuantity} size={48} />
            </div>
            <div className="footer-buttons-container">
                <Button className="button large mr-3 cancel-button" onClick={onModalClose}>
                    Cancel
                </Button>
                <Button className="button large add-update-order-button" onClick={onSubmit}>
                    {props.editProduct ? "Update Item " : "Add To Order "} ${convertCentsToDollars(totalDisplayPrice)}
                </Button>
            </div>
        </>
    );

    const content = (
        <>
            <div className="product">
                <div className="mt-11" />
                <div className="h1 mb-4">{props.product.name}</div>
                {props.product.description && <div className="description">{props.product.description}</div>}
                <div className="separator-6"></div>
                {modifierGroups}
                {user && productNotes}
            </div>
            <div className="footer">{footer}</div>
        </>
    );

    return (
        <>
            <Modal isOpen={props.isOpen} onRequestClose={onModalClose}>
                <div className="product-modal">{content}</div>
            </Modal>
        </>
    );
};

// helpers
const isMaxReached = (max: number, selectedModifiers?: ICartModifier[]): boolean => {
    if (selectedModifiers === undefined) {
        return false;
    }

    let count = 0;

    selectedModifiers.forEach((selectedModifier) => (count += selectedModifier.quantity));

    return count >= max;
};

// components
export const ModifierGroup = (props: {
    modifierGroup: IGET_RESTAURANT_MODIFIER_GROUP;
    onCheckingModifier: (selectedModifier: IGET_RESTAURANT_MODIFIER, preSelectedModifierQuantity: number) => void;
    onUnCheckingModifier: (selectedModifier: IGET_RESTAURANT_MODIFIER, preSelectedModifierQuantity: number) => void;
    onChangeModifierQuantity: (selectedModifier: IGET_RESTAURANT_MODIFIER, preSelectedModifierQuantity: number, quantity: number) => void;
    onSelectRadioModifier: (selectedModifier: IGET_RESTAURANT_MODIFIER, preSelectedModifierQuantity: number) => void;
    selectedModifiers: ICartModifier[];
    error?: string;
    disabled: boolean;
}) => {
    const modifierQuantity = (modifier: IGET_RESTAURANT_MODIFIER) => {
        let m = props.selectedModifiers.find((selectedModifier) => selectedModifier.id === modifier.id);
        return m ? m.quantity : 0;
    };

    const isModifierSelected = (modifier: IGET_RESTAURANT_MODIFIER) => {
        let m = props.selectedModifiers.find((selectedModifier) => selectedModifier.id === modifier.id && selectedModifier.quantity > 0);
        return m ? true : false;
    };

    const isModifierDisabled = (modifier: IGET_RESTAURANT_MODIFIER) => {
        return (
            isItemSoldOut(modifier.soldOut, modifier.soldOutDate) ||
            (!(props.modifierGroup.choiceMin === 1 && props.modifierGroup.choiceMax === 1) &&
                isMaxReached(props.modifierGroup.choiceMax, props.selectedModifiers) &&
                props.selectedModifiers.find((selectedModifier) => {
                    return selectedModifier.id === modifier.id;
                }) === undefined)
        );
    };

    // display
    const getSelectInstructions = () => {
        return props.modifierGroup.choiceMin === props.modifierGroup.choiceMax
            ? "Select " + props.modifierGroup.choiceMin
            : props.modifierGroup.choiceMin === 0
            ? "Select up to " + props.modifierGroup.choiceMax
            : "Make between " + props.modifierGroup.choiceMin + " and " + props.modifierGroup.choiceMax + " selections";
    };

    return (
        <>
            <div className="h2 mb-2">{props.modifierGroup.name}</div>
            {props.error && <div className="text-error mb-2">{props.error}</div>}
            <div className="mb-2">({getSelectInstructions()})</div>
            {props.modifierGroup.modifiers.items.map((m) => (
                <>
                    <Modifier
                        modifierGroupName={props.modifierGroup.name}
                        radio={props.modifierGroup.choiceMin !== 0 && props.modifierGroup.choiceMax === 1}
                        modifier={m.modifier}
                        choiceDuplicate={props.modifierGroup.choiceDuplicate}
                        onCheckingModifier={(selectedModifier: IGET_RESTAURANT_MODIFIER) => {
                            props.onCheckingModifier(selectedModifier, m.preSelectedQuantity);
                        }}
                        onUnCheckingModifier={(selectedModifier: IGET_RESTAURANT_MODIFIER) => {
                            props.onUnCheckingModifier(selectedModifier, m.preSelectedQuantity);
                        }}
                        onChangeModifierQuantity={(selectedModifier: IGET_RESTAURANT_MODIFIER, quantity: number) => {
                            props.onChangeModifierQuantity(selectedModifier, m.preSelectedQuantity, quantity);
                        }}
                        onSelectRadioModifier={(selectedModifier: IGET_RESTAURANT_MODIFIER) => {
                            props.onSelectRadioModifier(selectedModifier, m.preSelectedQuantity);
                        }}
                        modifierQuantity={modifierQuantity(m.modifier)}
                        checked={isModifierSelected(m.modifier)}
                        maxReached={isMaxReached(props.modifierGroup.choiceMax, props.selectedModifiers)}
                        soldOut={isItemSoldOut(m.modifier.soldOut, m.modifier.soldOutDate)}
                        disabled={props.disabled || isModifierDisabled(m.modifier)}
                    />
                </>
            ))}
        </>
    );
};

const Modifier = (props: {
    modifier: IGET_RESTAURANT_MODIFIER;
    choiceDuplicate: number;
    maxReached: boolean;
    soldOut: boolean;
    disabled: boolean;

    modifierQuantity: number;
    // If checkboxes are used, this must be given
    checked: boolean;

    // Called when checkboxes are used
    onCheckingModifier: (selectedModifier: IGET_RESTAURANT_MODIFIER) => void;
    onUnCheckingModifier: (selectedModifier: IGET_RESTAURANT_MODIFIER) => void;

    onChangeModifierQuantity: (selectedModifier: IGET_RESTAURANT_MODIFIER, quantity: number) => void;

    onSelectRadioModifier: (selectedModifier: IGET_RESTAURANT_MODIFIER) => void;

    modifierGroupName: string;

    // settings
    radio: boolean;
}) => {
    // states
    const [stepperCount, setStepperCount] = useState(props.modifierQuantity);
    const [displayModifierStepper, setDisplayModifierStepper] = useState(false);

    // callbacks
    const onCheckingModifier = () => {
        props.onCheckingModifier(props.modifier);
    };

    const onUnCheckingModifier = () => {
        props.onUnCheckingModifier(props.modifier);
    };

    const onChangeModifierQuantity = (quantity: number) => {
        if (props.modifierQuantity === 1) {
            setDisplayModifierStepper(false);
        }

        props.onChangeModifierQuantity(props.modifier, quantity);
    };

    const onSelectRadioModifier = () => {
        props.onSelectRadioModifier(props.modifier);
    };

    const onDisplayModifierStepper = () => {
        setDisplayModifierStepper(!props.disabled && !props.maxReached);
    };

    // constants
    const stepperHeight = 28;

    const showRadio = props.radio;
    const showStepper = props.choiceDuplicate > 1 && (displayModifierStepper || props.modifierQuantity > 0);
    const showCollapsedStepper = props.choiceDuplicate > 1 && !displayModifierStepper && props.modifierQuantity == 0;
    const showCheckbox = !showRadio && !showStepper && !showCollapsedStepper;

    // displays

    const modifierChildren = (
        <>
            {props.soldOut ? (
                <>
                    <div className="text-bold text-grey">{props.modifier.name} (SOLD OUT)</div>
                    {props.modifier.price > 0 && <div className="text-bold text-grey">{"$" + convertCentsToDollars(props.modifier.price)}</div>}
                </>
            ) : (
                <div>
                    {props.modifier.name} {props.modifier.price > 0 && `($${convertCentsToDollars(props.modifier.price)})`}
                </div>
            )}
        </>
    );

    const stepper = (
        <Stepper
            className="pt-2 pb-2"
            count={stepperCount}
            setCount={setStepperCount}
            min={0}
            max={props.maxReached ? stepperCount : props.choiceDuplicate}
            onUpdate={onChangeModifierQuantity}
            disabled={props.disabled}
            size={stepperHeight}
        >
            {modifierChildren}
        </Stepper>
    );

    const collapsedStepper = (
        <div className="collapsed-stepper-container pt-2 pb-2" onClick={onDisplayModifierStepper}>
            <div
                className="collapsed-stepper"
                style={{
                    height: String(stepperHeight) + "px",
                    width: String(stepperHeight) + "px",
                }}
            >
                <PlusIcon height={String(stepperHeight / 1.8) + "px"} />
            </div>
            <div className="collapsed-stepper-children">{modifierChildren}</div>
        </div>
    );

    const checkbox = (
        <Checkbox
            className="pt-2 pb-2"
            onCheck={onCheckingModifier}
            onUnCheck={onUnCheckingModifier}
            checked={props.checked}
            disabled={props.disabled}
        >
            {modifierChildren}
        </Checkbox>
    );

    const radio = (
        <Radio className="pt-2 pb-2" selected={props.checked} onSelect={onSelectRadioModifier} disabled={props.disabled}>
            {modifierChildren}
        </Radio>
    );

    return (
        <>
            <div className="modifier">
                {showRadio && radio}

                {showStepper && stepper}

                {showCollapsedStepper && collapsedStepper}

                {showCheckbox && checkbox}
            </div>
        </>
    );
};
