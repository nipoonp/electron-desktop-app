import { ICartModifierGroup, ICartProduct } from "../../model/model";
import { Link } from "../../tabin/components/link";
import { convertCentsToDollars } from "../../util/util";

import "./productModifier.scss";

export const ProductModifier = (props: { product: ICartProduct; onEditSelections?: () => void }) => {
    const { product, onEditSelections } = props;

    return (
        <div className="modifier-product-modifier-wrapper">
            <OrderItemDetails modifierGroups={product.modifierGroups} />
            {onEditSelections && (
                <>
                    <div className="separator-2"></div>
                    <Link className="product-modifier-edit-selections-link">Edit Selections</Link>
                </>
            )}
        </div>
    );
};

const OrderItemDetails = (props: { modifierGroups: ICartModifierGroup[] }) => {
    const { modifierGroups } = props;

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

    const modifiersDisplay = (
        <>
            {modifierGroups.map((mg, index) => (
                <>
                    {!mg.hideForCustomer && (
                        <>
                            {index !== 0 && <div className="mt-3"></div>}
                            <div className="text-bold" key={mg.id}>
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

    return <div className="detail">{modifiersDisplay}</div>;
};
