import React, { useState, useEffect, useRef } from "react";
import {
  Title2Font,
  BoldFont,
  NormalFont,
  Title1Font,
} from "../../tabin/components/fonts";
import {
  Space2,
  Space3,
  Space4,
  Space1,
  Space6,
  Space,
} from "../../tabin/components/spaces";
import { useHistory } from "react-router";
import { useUser } from "../../context/user-context";
import { useCart } from "../../context/cart-context";
import {
  ICartModifier,
  ISelectedProductModifiers,
  ICartProduct,
  ICartModifierGroup,
} from "../../model/model";
import { Logger } from "aws-amplify";
import { toast } from "../../tabin/components/toast";
import { isItemSoldOut } from "../../util/isItemAvailable";
import { convertCentsToDollars } from "../../util/moneyConversion";
import { MessageBox } from "../../tabin/components/messageBox";
import { ErrorColor, GrayColor } from "../../tabin/components/colors";
import { PlusIcon } from "../../tabin/components/plusIcon";
import {
  IGET_RESTAURANT_PRODUCT,
  IGET_RESTAURANT_MODIFIER_GROUP,
  IGET_RESTAURANT_MODIFIER,
  IGET_RESTAURANT_CATEGORY,
} from "../../graphql/customQueries";
import { KeyboardTextArea } from "../../tabin/components/keyboardTextArea";
import { KioskModal } from "../../tabin/components/kioskModal";
import { KioskButton } from "../../tabin/components/kioskButton";
import { SizedBox } from "../../tabin/components/sizedBox";
import { KioskStepper } from "../../tabin/components/kioskStepper";
import { KioskCheckbox } from "../../tabin/components/kioskCheckbox";
import { KioskRadio } from "../../tabin/components/kioskRadio";
import { Separator6 } from "../../tabin/components/separator";

const logger = new Logger("productModal");
const styles = require("./product.module.css");

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
  const [orderedModifiers, setOrderedModifiers] = useState<
    ISelectedProductModifiers
  >(props.editProduct ? props.editProduct.orderedModifiers : {});
  const [quantity, setQuantity] = useState(
    props.editProduct ? props.editProduct.quantity : 1
  );
  const [notes, setNotes] = useState(
    props.editProduct ? props.editProduct.notes : ""
  );
  const [error, setError] = useState<{ [modifierGroupId: string]: string }>({});

  const [totalDisplayPrice, setTotalDisplayPrice] = useState(
    props.product.price
  );

  useEffect(() => {
    console.log(orderedModifiers);
  }, [orderedModifiers]);

  useEffect(() => {
    if (props.editProduct) return;

    let newOrderedModifiers: ISelectedProductModifiers = {};

    props.product.modifierGroups.items.forEach((modifierGroupLink) => {
      modifierGroupLink.modifierGroup.modifiers.items.map((modifierLink) => {
        if (modifierLink.preSelectedQuantity) {
          if (
            newOrderedModifiers[modifierGroupLink.modifierGroup.id] ===
            undefined
          ) {
            newOrderedModifiers[modifierGroupLink.modifierGroup.id] = [];
          }

          newOrderedModifiers = Object.assign({}, newOrderedModifiers, {
            [modifierGroupLink.modifierGroup.id]: newOrderedModifiers[
              modifierGroupLink.modifierGroup.id
            ].concat({
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

  const onCheckingModifier = (
    selectedModifierGroupId: string,
    preSelectedModifierQuantity: number,
    selectedModifier: IGET_RESTAURANT_MODIFIER
  ) => {
    setError({});

    if (orderedModifiers[selectedModifierGroupId] === undefined) {
      orderedModifiers[selectedModifierGroupId] = [];
    }

    let newOrderedModifiers = Object.assign({}, orderedModifiers, {
      [selectedModifierGroupId]: orderedModifiers[
        selectedModifierGroupId
      ].filter((m) => m.id !== selectedModifier.id),
    });

    let newOrderedModifiers2 = Object.assign({}, newOrderedModifiers, {
      [selectedModifierGroupId]: newOrderedModifiers[
        selectedModifierGroupId
      ].concat({
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
      [selectedModifierGroupId]: orderedModifiers[
        selectedModifierGroupId
      ].filter((m) => m.id !== selectedModifier.id),
    });

    if (preSelectedModifierQuantity == 0) {
      // If no selected modifies inside a modifier group. Delete the group.
      if (newOrderedModifiers[selectedModifierGroupId].length == 0) {
        delete newOrderedModifiers[selectedModifierGroupId];
      }

      setOrderedModifiers(newOrderedModifiers);
    } else {
      let newOrderedModifiers2 = Object.assign({}, newOrderedModifiers, {
        [selectedModifierGroupId]: newOrderedModifiers[
          selectedModifierGroupId
        ].concat({
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
      [selectedModifierGroupId]: orderedModifiers[
        selectedModifierGroupId
      ].filter((m) => m.id !== selectedModifier.id),
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
        [selectedModifierGroupId]: newOrderedModifiers[
          selectedModifierGroupId
        ].concat({
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
        if (
          orderedModifiers[mg.modifierGroup.id] === undefined ||
          orderedModifiersLength < choiceMin
        ) {
          if (choiceMin === 1 && choiceMax === 1) {
            Object.assign(error, {
              [mg.modifierGroup.id]:
                "Please select an option for " + mg.modifierGroup.name,
            });
          } else if (choiceMin === choiceMax) {
            Object.assign(error, {
              [mg.modifierGroup.id]:
                "Please make " +
                choiceMin +
                " selections for " +
                mg.modifierGroup.name,
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
      if (
        orderedModifiers[mg.modifierGroup.id] !== undefined &&
        orderedModifiersLength > choiceMax
      ) {
        Object.assign(error, {
          [mg.modifierGroup.id]:
            "Please make at most " +
            choiceMax +
            (choiceMin === 1 ? " selection" : " selections") +
            " for " +
            mg.modifierGroup.name,
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
          hideForCustomer: mg.hideForCustomer,
          modifiers: orderedModifiers[mg.modifierGroup.id],
        });
      }
    });

    const productToOrder: ICartProduct = {
      id: props.product.id,
      name: props.product.name,
      price: props.product.price,
      image: props.product.image ? { key: props.product.image.key, region: props.product.image.region, bucket: props.product.image.bucket, identityPoolId: props.product.image.identityPoolId } : null,
      quantity: quantity,
      notes: notes,
      category: {
        id: props.category.id,
        name: props.category.name,
        image: props.category.image ? { key: props.category.image.key, region: props.category.image.region, bucket: props.category.image.bucket, identityPoolId: props.category.image.identityPoolId } : null,
      },
      modifierGroups: selectedModifierGroups,
    };

    if (props.editProduct) {
      props.onUpdateItem &&
        props.onUpdateItem(props.editProduct.productCartIndex, productToOrder);
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

  const onNotesChange = (value: string) => {
    setNotes(value);
  };

  const modifierGroups = (
    <>
      {props.product.modifierGroups.items.map((mg) => (
        <>
          {!mg.hideForCustomer && (
            <>
              <ModifierGroup
                modifierGroup={mg.modifierGroup}
                onCheckingModifier={(
                  selectedModifier: IGET_RESTAURANT_MODIFIER,
                  preSelectedModifierQuantity: number
                ) =>
                  onCheckingModifier(
                    mg.modifierGroup.id,
                    preSelectedModifierQuantity,
                    selectedModifier
                  )
                }
                onUnCheckingModifier={(
                  selectedModifier: IGET_RESTAURANT_MODIFIER,
                  preSelectedModifierQuantity: number
                ) =>
                  onUnCheckingModifier(
                    mg.modifierGroup.id,
                    preSelectedModifierQuantity,
                    selectedModifier
                  )
                }
                onChangeModifierQuantity={(
                  selectedModifier: IGET_RESTAURANT_MODIFIER,
                  preSelectedModifierQuantity: number,
                  quantity: number
                ) =>
                  onChangeModifierQuantity(
                    mg.modifierGroup.id,
                    preSelectedModifierQuantity,
                    selectedModifier,
                    quantity
                  )
                }
                onSelectRadioModifier={(
                  selectedModifier: IGET_RESTAURANT_MODIFIER,
                  preSelectedModifierQuantity: number
                ) =>
                  onSelectRadioModifier(
                    mg.modifierGroup.id,
                    preSelectedModifierQuantity,
                    selectedModifier
                  )
                }
                selectedModifiers={orderedModifiers[mg.modifierGroup.id] || []}
                error={error[mg.modifierGroup.id]}
                disabled={!user || !props.restaurantIsAcceptingOrders}
              />
              <Separator6 />
            </>
          )}
        </>
      ))}
    </>
  );

  const productNotes = (
    <>
      <Title2Font>Special instructions</Title2Font>
      <Space3 />
      <KeyboardTextArea
        placeholder={"Leave a note for the kitchen"}
        onChangeKeyboard={onNotesChange}
        value={notes}
      />
    </>
  );

  const quantityAndAddToCartButton = (
    <>
      <div style={{ width: "140px", margin: "0 auto" }}>
        <KioskStepper
          count={quantity}
          min={1}
          onUpdate={onUpdateQuantity}
          size={48}
        />
      </div>
      <Space4 />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <KioskButton
          onClick={onModalClose}
          style={{
            backgroundColor: "#ffffff",
            color: "#484848",
            border: "1px solid #e0e0e0",
            width: "350px",
          }}
        >
          <NormalFont style={{ fontSize: "22px" }}>Cancel</NormalFont>
        </KioskButton>
        <SizedBox width="24px" />
        <KioskButton
          onClick={onSubmit}
          cy-data="add-to-order"
          style={{
            width: "350px",
          }}
        >
          <NormalFont style={{ fontSize: "22px" }}>
            {props.editProduct ? "Update Item " : "Add To Order "} $
            {convertCentsToDollars(totalDisplayPrice)}
          </NormalFont>
        </KioskButton>
      </div>
    </>
  );

  const content = (
    <>
      <div
        style={{ flex: "1", padding: "0 84px 84px 84px", overflow: "scroll" }}
        className={styles.container}
      >
        <Space size={84} />
        <Title1Font>{props.product.name}</Title1Font>
        <Space4 />
        {props.product.description && (
          <>
            <NormalFont
              style={{
                whiteSpace: "pre-line",
                fontWeight: 300,
                fontSize: "18px",
              }}
            >
              {props.product.description}
            </NormalFont>
          </>
        )}
        <Separator6 />
        {modifierGroups}
        {user && productNotes}
      </div>
      <div
        style={{
          padding: "24px",
          borderTop: "1px solid rgb(224, 224, 224)",
        }}
      >
        {quantityAndAddToCartButton}
      </div>
    </>
  );

  return (
    <>
      <KioskModal isOpen={props.isOpen} onRequestClose={onModalClose}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {content}
        </div>
      </KioskModal>
    </>
  );
};

// helpers
const isMaxReached = (
  max: number,
  selectedModifiers?: ICartModifier[]
): boolean => {
  if (selectedModifiers === undefined) {
    return false;
  }

  let count = 0;

  selectedModifiers.forEach(
    (selectedModifier) => (count += selectedModifier.quantity)
  );

  return count >= max;
};

// components
export const ModifierGroup = (props: {
  modifierGroup: IGET_RESTAURANT_MODIFIER_GROUP;
  onCheckingModifier: (
    selectedModifier: IGET_RESTAURANT_MODIFIER,
    preSelectedModifierQuantity: number
  ) => void;
  onUnCheckingModifier: (
    selectedModifier: IGET_RESTAURANT_MODIFIER,
    preSelectedModifierQuantity: number
  ) => void;
  onChangeModifierQuantity: (
    selectedModifier: IGET_RESTAURANT_MODIFIER,
    preSelectedModifierQuantity: number,
    quantity: number
  ) => void;
  onSelectRadioModifier: (
    selectedModifier: IGET_RESTAURANT_MODIFIER,
    preSelectedModifierQuantity: number
  ) => void;
  selectedModifiers: ICartModifier[];
  error?: string;
  disabled: boolean;
}) => {
  const modifierQuantity = (modifier: IGET_RESTAURANT_MODIFIER) => {
    let m = props.selectedModifiers.find(
      (selectedModifier) => selectedModifier.id === modifier.id
    );
    return m ? m.quantity : 0;
  };

  const isModifierSelected = (modifier: IGET_RESTAURANT_MODIFIER) => {
    let m = props.selectedModifiers.find(
      (selectedModifier) =>
        selectedModifier.id === modifier.id && selectedModifier.quantity > 0
    );
    return m ? true : false;
  };

  const isModifierDisabled = (modifier: IGET_RESTAURANT_MODIFIER) => {
    return (
      isItemSoldOut(modifier.soldOut, modifier.soldOutDate) ||
      (!(
        props.modifierGroup.choiceMin === 1 &&
        props.modifierGroup.choiceMax === 1
      ) &&
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
        : "Make between " +
        props.modifierGroup.choiceMin +
        " and " +
        props.modifierGroup.choiceMax +
        " selections";
  };

  return (
    <>
      <Title2Font>{props.modifierGroup.name}</Title2Font>
      {props.error && (
        <>
          <Space2 />
          <NormalFont>
            <ErrorColor>{props.error}</ErrorColor>
          </NormalFont>
          <Space1 />
        </>
      )}
      <Space2 />
      <NormalFont>({getSelectInstructions()})</NormalFont>
      <Space2 />
      <div cy-data="modifier-group">
        {props.modifierGroup.modifiers.items.map((m) => (
          <>
            <Modifier
              modifierGroupName={props.modifierGroup.name}
              radio={
                props.modifierGroup.choiceMin !== 0 &&
                props.modifierGroup.choiceMax === 1
              }
              modifier={m.modifier}
              choiceDuplicate={props.modifierGroup.choiceDuplicate}
              onCheckingModifier={(
                selectedModifier: IGET_RESTAURANT_MODIFIER
              ) => {
                props.onCheckingModifier(
                  selectedModifier,
                  m.preSelectedQuantity
                );
              }}
              onUnCheckingModifier={(
                selectedModifier: IGET_RESTAURANT_MODIFIER
              ) => {
                props.onUnCheckingModifier(
                  selectedModifier,
                  m.preSelectedQuantity
                );
              }}
              onChangeModifierQuantity={(
                selectedModifier: IGET_RESTAURANT_MODIFIER,
                quantity: number
              ) => {
                props.onChangeModifierQuantity(
                  selectedModifier,
                  m.preSelectedQuantity,
                  quantity
                );
              }}
              onSelectRadioModifier={(
                selectedModifier: IGET_RESTAURANT_MODIFIER
              ) => {
                props.onSelectRadioModifier(
                  selectedModifier,
                  m.preSelectedQuantity
                );
              }}
              modifierQuantity={modifierQuantity(m.modifier)}
              checked={isModifierSelected(m.modifier)}
              maxReached={isMaxReached(
                props.modifierGroup.choiceMax,
                props.selectedModifiers
              )}
              soldOut={
                isItemSoldOut(m.modifier.soldOut, m.modifier.soldOutDate)
              }
              disabled={props.disabled || isModifierDisabled(m.modifier)}
            />
          </>
        ))}
      </div>
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

  onChangeModifierQuantity: (
    selectedModifier: IGET_RESTAURANT_MODIFIER,
    quantity: number
  ) => void;

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
  const showStepper =
    props.choiceDuplicate > 1 &&
    (displayModifierStepper || props.modifierQuantity > 0);
  const showCollapsedStepper =
    props.choiceDuplicate > 1 &&
    !displayModifierStepper &&
    props.modifierQuantity == 0;
  const showCheckbox = !showRadio && !showStepper && !showCollapsedStepper;

  // displays
  const radio = (
    <div cy-data="modifier">
      <KioskRadio
        selected={props.checked}
        onSelect={onSelectRadioModifier}
        disabled={props.disabled}
      />
    </div>
  );

  const stepper = (
    <div cy-data="modifier">
      <KioskStepper
        count={stepperCount}
        setCount={setStepperCount}
        min={0}
        max={props.maxReached ? stepperCount : props.choiceDuplicate}
        onUpdate={onChangeModifierQuantity}
        disabled={props.disabled}
        size={stepperHeight}
      />
    </div>
  );

  const collapsedStepper = (
    <div
      onClick={onDisplayModifierStepper}
      style={{
        // cursor: "pointer",
        border: "1px solid #c8c8c8",
        borderRadius: "50%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: String(stepperHeight) + "px",
        width: String(stepperHeight) + "px",
      }}
    >
      <PlusIcon height={String(stepperHeight / 1.8) + "px"} />
    </div>
  );

  const checkbox = (
    <div cy-data="modifier">
      <KioskCheckbox
        onCheck={onCheckingModifier}
        onUnCheck={onUnCheckingModifier}
        checked={props.checked}
        disabled={props.disabled}
      />
    </div>
  );

  return (
    <>
      <div
        style={{
          color: props.disabled ? "hsl(0,0%,50%)" : "inherit",
        }}
      >
        <Space3 />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            gridColumnGap: "16px",
            alignItems: "center",
          }}
        >
          {showRadio && radio}

          {showStepper && stepper}

          {showCollapsedStepper && collapsedStepper}

          {showCheckbox && checkbox}

          {props.soldOut ? (
            <>
              <GrayColor>
                <NormalFont>{props.modifier.name} (SOLD OUT)</NormalFont>
              </GrayColor>
              {props.modifier.price > 0 && (
                <>
                  <GrayColor>
                    <BoldFont>
                      {"$" + convertCentsToDollars(props.modifier.price)}
                    </BoldFont>
                  </GrayColor>
                </>
              )}
            </>
          ) : (
              <>
                <NormalFont>
                  {props.modifier.name}{" "}
                  {props.modifier.price > 0 &&
                    `($${convertCentsToDollars(props.modifier.price)})`}
                </NormalFont>
              </>
            )}
        </div>
        <Space3 />
      </div>
    </>
  );
};
