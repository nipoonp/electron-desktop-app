import { ICartModifierGroup, ICartProduct } from "../../../model/model";
import { Button } from "../../../tabin/components/button";
import { Stepper } from "../../../tabin/components/stepper";
import { convertCentsToDollars } from "../../../util/util";
import { ProductModifier } from "../../shared/productModifier";
import "./orderSummary.scss";


export const OrderSummary = (props: {
    products: ICartProduct[];
    onEditProduct: (product: ICartProduct, displayOrder: number) => void;
    onRemoveProduct: (displayOrder: number) => void;
    onUpdateProductQuantity: (displayOrder: number, productQuantity: number) => void;
}) => {
    const { products, onEditProduct, onRemoveProduct, onUpdateProductQuantity } = props;
    if (!products || products === []) {
        return (
            <>
                <h1>No items in cart!</h1>
            </>
        );
    }

    const orderItems = (
        <>
            {products &&
                products.map((product, index) => {
                    // using index as key because products can be duplicated
                    if (product) {
                        return (
                            <div key={index}>
                                <OrderItem
                                    product={product}
                                    displayOrder={index}
                                    onEditProduct={onEditProduct}
                                    onUpdateProductQuantity={onUpdateProductQuantity}
                                    onRemoveProduct={onRemoveProduct}
                                />
                                <div className="separator-6"></div>
                            </div>
                        );
                    }
                })}
        </>
    );

    return <>{orderItems}</>;
};

const OrderItem = (props: {
    product: ICartProduct;
    displayOrder: number;
    onEditProduct: (product: ICartProduct, displayOrder: number) => void;
    onUpdateProductQuantity: (displayOrder: number, productQuantity: number) => void;
    onRemoveProduct: (displayOrder: number) => void;
}) => {
    const { product, displayOrder, onEditProduct, onUpdateProductQuantity, onRemoveProduct } = props;

    let price = product.price;

    product.modifierGroups.forEach((mg) => {
        mg.modifiers.forEach((m) => {
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

    price = price * product.quantity;

    const quantity = (
        <Stepper count={product.quantity} min={1} onUpdate={(count: number) => onUpdateProductQuantity(displayOrder, count)} size={32} />
    );

    return (
        <>
            <div className="order-item">
                {quantity}
                <OrderItemDetails
                    name={product.name}
                    notes={product.notes}
                    modifierGroups={product.modifierGroups}
                    onEditProduct={() => onEditProduct(product, displayOrder)}
                />
                <div className="text-center">
                    <div className="h2 text-primary mb-2">${convertCentsToDollars(price)}</div>
                    {
                        <Button className="remove-button" onClick={() => onRemoveProduct(displayOrder)}>
                            Remove
                        </Button>
                    }
                </div>
            </div>
        </>
    );
};

const OrderItemDetails = (props: { name: string; notes: string | null; modifierGroups: ICartModifierGroup[]; onEditProduct: () => void }) => {
    const { name, notes, modifierGroups, onEditProduct } = props;

    const modifierString = (preSelectedQuantity: number, quantity: number, name: string, price: number) => {
        const changedQuantity = quantity - preSelectedQuantity;
        let mStr = "";

        if (changedQuantity < 0 && Math.abs(changedQuantity) === preSelectedQuantity) {
            mStr = `(REMOVE) ${changedQuantity > 1 ? `${Math.abs(changedQuantity)} x ` : ""}${name}`;
        } else {
            mStr = `${quantity > 1 ? `${Math.abs(quantity)} x ` : ""}${name}`;
        }

        if (price > 0 && changedQuantity > 0) {
            mStr += ` ($${convertCentsToDollars(price)})`;
        }

        return mStr;
    };

    const editButton = (
        <>
            <Button className="edit-button" onClick={() => onEditProduct()}>
                Edit
            </Button>
        </>
    );

    const nameDisplay = (
        <div className="name-edit-button">
            <div className="h2 mr-2">{name}</div> {editButton}
        </div>
    );

    const modifiersDisplay = (
        <>
            {modifierGroups.map((mg, index) => (
                <>
                    {!mg.hideForCustomer && (
                        <>
                            <div className="text-bold mt-3" key={mg.id}>
                                {mg.name}
                            </div>
                            {mg.modifiers.map((m) => (
                                <>
                                    <div key={m.id} className="mt-1">
                                        {modifierString(m.preSelectedQuantity, m.quantity, m.name, m.price)}
                                    </div>
                                    {m.productModifiers && (
                                        <div className="mb-2">
                                            {m.productModifiers.map((productModifier, index) => (
                                                <div>
                                                    <div className="mt-2"></div>
                                                    <ProductModifier
                                                        selectionIndex={m.productModifiers && m.productModifiers.length > 1 ? index + 1 : undefined}
                                                        product={productModifier}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ))}
                        </>
                    )}
                </>
            ))}
        </>
    );

    const notesDisplay = <>{notes && <div className="text-grey">Notes: {notes}</div>}</>;

    return (
        <div className="detail">
            {nameDisplay}
            {modifiersDisplay}
            {notesDisplay}
        </div>
    );
};
