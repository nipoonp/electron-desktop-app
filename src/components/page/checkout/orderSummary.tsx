import { useCart } from "../../../context/cart-context";
import { ICartModifierGroup, ICartProduct } from "../../../model/model";
import { Button } from "../../../tabin/components/button";
import { Stepper } from "../../../tabin/components/stepper";
import { convertCentsToDollars } from "../../../util/util";

export const OrderSummary = (props: {
    onEditProduct: (product: ICartProduct, displayOrder: number) => void;
    onRemoveProduct: (displayOrder: number) => void;
    onUpdateProductQuantity: (displayOrder: number, productQuantity: number) => void;
    onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) => {
    // context
    const { products } = useCart();

    // displays
    if (!products || products == []) {
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
                                    onEditProduct={props.onEditProduct}
                                    onUpdateProductQuantity={props.onUpdateProductQuantity}
                                    onRemoveProduct={props.onRemoveProduct}
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
    // constants
    let itemPrice = props.product.price * props.product.quantity;

    props.product.modifierGroups.forEach((mg) => {
        mg.modifiers.forEach((m) => {
            const changedQuantity = m.quantity - m.preSelectedQuantity;

            if (changedQuantity > 0) {
                itemPrice += m.price * changedQuantity * props.product.quantity;
            }
        });
    });

    // displays
    const quantity = (
        <Stepper
            count={props.product.quantity}
            min={1}
            onUpdate={(count: number) => props.onUpdateProductQuantity(props.displayOrder, count)}
            size={32}
        />
    );

    return (
        <>
            <div className="order-item">
                {quantity}
                <OrderItemDetails
                    name={props.product.name}
                    notes={props.product.notes}
                    modifierGroups={props.product.modifierGroups}
                    onEditProduct={() => props.onEditProduct(props.product, props.displayOrder)}
                />
                <div className="text-center">
                    <div className="h2 text-primary mb-2">${convertCentsToDollars(itemPrice)}</div>
                    <Button className="remove-button" onClick={() => props.onRemoveProduct(props.displayOrder)}>
                        Remove
                    </Button>
                </div>
            </div>
        </>
    );
};

const OrderItemDetails = (props: { name: string; notes: string | null; modifierGroups: ICartModifierGroup[]; onEditProduct: () => void }) => {
    // functions
    const modifierString = (preSelectedQuantity: number, quantity: number, name: string, price: number) => {
        const changedQuantity = quantity - preSelectedQuantity;
        let mStr = "";

        if (changedQuantity < 0 && Math.abs(changedQuantity) == preSelectedQuantity) {
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
            <Button className="edit-button" onClick={() => props.onEditProduct()}>
                Edit
            </Button>
        </>
    );

    const nameDisplay = (
        <div className="name-edit-button">
            <div className="h2 mr-2">{props.name}</div> {editButton}
        </div>
    );

    const modifiersDisplay = (
        <>
            {props.modifierGroups.map((mg, index) => (
                <>
                    {!mg.hideForCustomer && (
                        <>
                            <div className="text-bold mt-3" key={mg.id}>
                                {mg.name}
                            </div>
                            {mg.modifiers.map((m) => (
                                <div key={m.id} className="mt-1">
                                    {modifierString(m.preSelectedQuantity, m.quantity, m.name, m.price)}
                                </div>
                            ))}
                        </>
                    )}
                </>
            ))}
        </>
    );

    const notesDisplay = <>{props.notes && <div className="text-grey">Notes: {props.notes}</div>}</>;

    return (
        <div className="detail">
            {nameDisplay}
            {modifiersDisplay}
            {notesDisplay}
        </div>
    );
};
