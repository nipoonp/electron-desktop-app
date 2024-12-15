import { useRegister } from "../../../context/register-context";
import { ICartModifierGroup, ICartProduct } from "../../../model/model";
import { Button } from "../../../tabin/components/button";
import { Stepper } from "../../../tabin/components/stepper";
import { convertCentsToDollars, convertDollarsToCents, convertDollarsToCentsReturnInt } from "../../../util/util";
import { ProductModifier } from "../../shared/productModifier";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { useEffect, useState } from "react";
import { Input } from "../../../tabin/components/input";
import { TiDelete } from "react-icons/ti";
import { CachedImage } from "../../../tabin/components/cachedImage";
import { getCloudFrontDomainName } from "../../../private/aws-custom";
import { Link } from "../../../tabin/components/link";
import "./orderSummary.scss";

export const OrderSummary = (props: {
    products: ICartProduct[];
    onEditProduct: (product: ICartProduct, displayOrder: number) => void;
    onRemoveProduct: (displayOrder: number) => void;
    onUpdateProductQuantity: (displayOrder: number, productQuantity: number) => void;
    onApplyProductDiscount: (displayOrder: number, discount: number) => void;
}) => {
    const { products, onEditProduct, onRemoveProduct, onUpdateProductQuantity, onApplyProductDiscount } = props;

    if (!products || products.length === 0) return <h1>No items in cart!</h1>;

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
                                    onApplyProductDiscount={onApplyProductDiscount}
                                    onRemoveProduct={onRemoveProduct}
                                />
                                <div className="separator-2"></div>
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
    onApplyProductDiscount: (displayOrder: number, discount: number) => void;
    onRemoveProduct: (displayOrder: number) => void;
}) => {
    const { product, displayOrder, onEditProduct, onUpdateProductQuantity, onApplyProductDiscount, onRemoveProduct } = props;
    const { isPOS } = useRegister();

    const [displayPrice, setDisplayPrice] = useState(convertCentsToDollars(product.totalPrice * product.quantity - product.discount));
    const [originalPrice, setOriginalPrice] = useState(convertCentsToDollars(product.totalPrice * product.quantity));
    const [price, setPrice] = useState(displayPrice); //For pos price edit input
    const [quantity, setQuantity] = useState(product.quantity.toString());
    const [isOptionsExpanded, setIsOptionsExpanded] = useState(false);

    useEffect(() => {
        let originalPrice = product.totalPrice * product.quantity;
        let productPrice = originalPrice - product.discount;

        setPrice(convertCentsToDollars(productPrice));
        setDisplayPrice(convertCentsToDollars(productPrice));
        setOriginalPrice(convertCentsToDollars(originalPrice));
        setQuantity(product.quantity.toString());
    }, [product]);

    const onChangeStepperQuantity = (newQuantity: number) => {
        setQuantity(newQuantity.toString());
        onUpdateProductQuantity(displayOrder, newQuantity);
    };

    const onChangeQuantity = (newQuantity: string) => {
        setQuantity(newQuantity);
    };

    const onBlurQuantity = (newQuantity: string) => {
        let newQuantityInt = parseInt(newQuantity);

        if (newQuantity === "") {
            setQuantity("1");
            onUpdateProductQuantity(displayOrder, 1);
        } else if (newQuantityInt < 1) {
            setQuantity("1");
            onUpdateProductQuantity(displayOrder, 1);
        } else {
            setQuantity(newQuantityInt.toString());
            onUpdateProductQuantity(displayOrder, newQuantityInt);
        }
    };

    const onChangePrice = (newPrice: string) => {
        setPrice(newPrice);
    };

    const onBlurPrice = (newPrice: string) => {
        let newPriceFloat = parseFloat(newPrice) / product.quantity;

        if (newPrice === "") {
            setPrice("0.00");
            onApplyProductDiscount(displayOrder, 0);
        } else {
            const rounded = Math.round(newPriceFloat * 100) / 100; //To 2 dp

            setPrice(rounded.toFixed(2));
            onApplyProductDiscount(displayOrder, product.totalPrice - convertDollarsToCentsReturnInt(rounded));
        }

        // setIsOptionsExpanded(false);
    };

    const expandOptionsArrow = (
        <>
            {isOptionsExpanded ? (
                <FiChevronDown size="26" onClick={() => setIsOptionsExpanded(false)} className="cursor-pointer" />
            ) : (
                <FiChevronRight size="26" onClick={() => setIsOptionsExpanded(true)} className="cursor-pointer" />
            )}
        </>
    );

    const expandOptions = (
        <div className="expand-options-container pt-3">
            <div>
                <Input
                    key={`quantity-${product.id}`}
                    type="number"
                    label="Quantity"
                    name="quantity"
                    value={quantity}
                    onChange={(event) => onChangeQuantity(event.target.value)}
                    onBlur={(event) => onBlurQuantity(event.target.value)}
                />
            </div>
            {/* <div>
                <Input
                    key={`price-${product.id}`}
                    type="number"
                    label="Price (each)"
                    name="price"
                    value={price}
                    onChange={(event) => onChangePrice(event.target.value)}
                    onBlur={(event) => onBlurPrice(event.target.value)}
                />
            </div> */}
        </div>
    );

    const quantityStepper = !product.isPreSelectedProduct ? (
        <Stepper count={parseInt(quantity, 10)} min={1} onUpdate={(count: number) => onChangeStepperQuantity(count)} size={32} />
    ) : (
        <div></div>
    );

    return (
        <>
            <div className="order-item">
                {!isPOS && (
                    <div className="image-wrapper">
                        {/* {product.imageUrl ? (
                            <CachedImage url={`${product.imageUrl}`} className="image" alt="product-image" />
                        ) : product.image ? ( */}
                        {/* {product.image ? (
                            <>
                                <CachedImage
                                    className="image"
                                    url={`${getCloudFrontDomainName()}/protected/${product.image.identityPoolId}/${product.image.key}`}
                                    alt="product-image"
                                />
                            </>
                        ) : null} */}
                    </div>
                )}
                {/* {isPOS ? expandOptionsArrow : quantityStepper} */}
                <OrderItemDetails
                    name={product.name}
                    quantity={product.quantity}
                    notes={product.notes}
                    isPreSelectedProduct={product.isPreSelectedProduct}
                    modifierGroups={product.modifierGroups}
                    onEditProduct={() => onEditProduct(product, displayOrder)}
                />
                <div className="text-center">
                    {isOptionsExpanded ? (
                        <Input
                            key={`price-${product.id}`}
                            type="number"
                            // label="Price (each)"
                            name="price"
                            value={price}
                            onChange={(event) => onChangePrice(event.target.value)}
                            onBlur={(event) => onBlurPrice(event.target.value)}
                        />
                    ) : (
                        <div
                            className="text-bold"
                            onClick={() => {
                                setIsOptionsExpanded(true);
                            }}
                        >
                            ${displayPrice}
                        </div>
                    )}
                    {!isOptionsExpanded && product.discount ? <div className="h3 text-primary mb-2 original-price">${originalPrice}</div> : <></>}
                </div>
                {!props.product.isPreSelectedProduct && <TiDelete size="24px" onClick={() => onRemoveProduct(displayOrder)} />}
            </div>
            {/* {isPOS && isOptionsExpanded && expandOptions} */}
        </>
    );
};

const OrderItemDetails = (props: {
    name: string;
    quantity: number;
    notes: string | null;
    isPreSelectedProduct?: boolean;
    modifierGroups: ICartModifierGroup[];
    onEditProduct: () => void;
}) => {
    const { name, quantity, notes, modifierGroups, onEditProduct } = props;
    const { isPOS } = useRegister();

    const modifierString = (preSelectedQuantity: number, quantity: number, name: string, price: number) => {
        const changedQuantity = quantity - preSelectedQuantity;
        let mStr = "";

        if (changedQuantity < 0 && Math.abs(changedQuantity) == preSelectedQuantity) {
            mStr = `(REMOVE) ${changedQuantity > 1 ? `${Math.abs(changedQuantity)} x ` : ""}${name}`;
        } else {
            mStr = `${quantity > 1 ? `${Math.abs(quantity)} x ` : ""}${name}`;
        }

        if (price > 0 && changedQuantity > 0) {
            mStr += ` (+$${convertCentsToDollars(price)})`;
        }

        return mStr;
    };

    const editButton = (
        <>
            {!props.isPreSelectedProduct && (
                <Button className="edit-button" onClick={() => onEditProduct()}>
                    Edit
                </Button>
            )}
        </>
    );

    const nameDisplayString = isPOS ? `${quantity > 1 ? `${quantity} x ` : ""}${name}` : `${name}`;

    const nameDisplay = (
        <div className="name-edit-button">
            {/* <div className="h4 mr-2">{nameDisplayString}</div> {editButton} */}
            <div className="text-bold">{nameDisplayString}</div>
        </div>
    );

    const modifiersDisplay = (
        <>
            {modifierGroups.map((mg, index) => (
                <>
                    {!mg.hideForCustomer && (
                        <>
                            {/* <div className="text-bold mt-3" key={mg.id}>
                                {mg.name}
                            </div> */}
                            {mg.modifiers.map((m) => (
                                <>
                                    <div key={m.id} className="mt-1">
                                        {modifierString(m.preSelectedQuantity, m.quantity, m.name, m.price)}
                                    </div>
                                    {/* {m.productModifiers && (
                                        <div className="mb-2">
                                            {m.productModifiers.map((productModifier, index) => (
                                                <div>
                                                    <div className="mt-2"></div>
                                                    <ProductModifier
                                                        selectionIndex={m.productModifiers && m.productModifiers.length > 1 ? index + 1 : undefined}
                                                        showNoExtraSelectionsMade={
                                                            m.productModifiers?.some((pm) => pm.modifierGroups?.length) || false
                                                        }
                                                        product={productModifier}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )} */}
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
        <div className="detail" onClick={() => onEditProduct()}>
            {nameDisplay}
            {modifiersDisplay}
            {notesDisplay}
        </div>
    );
};
