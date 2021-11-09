import { IGET_RESTAURANT_ORDER_MODIFIER_GROUP_FRAGMENT, IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT } from "../../graphql/customFragments";
import { ICartModifierGroup, ICartProduct } from "../../model/model";
import { Link } from "../../tabin/components/link";
import { convertCentsToDollars } from "../../util/util";

import "./productModifier.scss";

export const ProductModifier = (props: {
    selectionIndex?: number;
    product: ICartProduct | IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT;
    onEditSelections?: () => void;
}) => {
    const { product, selectionIndex, onEditSelections } = props;

    return (
        <div className="modifier-product-modifier-wrapper">
            {selectionIndex && <div className="mb-2 text-underline">Selection {selectionIndex}</div>}
            {product.modifierGroups && product.modifierGroups.length > 0 ? (
                <OrderItemDetails modifierGroups={product.modifierGroups} />
            ) : (
                <div>No extra selections made</div>
            )}
            {onEditSelections && (
                <>
                    <div className="separator-2"></div>
                    <Link className="product-modifier-edit-selections-link" onClick={onEditSelections}>
                        Edit Selections
                    </Link>
                </>
            )}
        </div>
    );
};

const OrderItemDetails = (props: { modifierGroups: ICartModifierGroup[] | IGET_RESTAURANT_ORDER_MODIFIER_GROUP_FRAGMENT[] }) => {
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
