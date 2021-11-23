import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useRestaurant } from "../../context/restaurant-context";
import { UPDATE_ORDER_STATUS } from "../../graphql/customMutations";
import { EOrderStatus, GET_ORDERS_BY_RESTAURANT_BY_BEGIN_WITH_PLACEDAT } from "../../graphql/customQueries";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { Input } from "../../tabin/components/input";

import "./orders.scss";
import { useGetRestaurantOrdersByBeginWithPlacedAt } from "../../hooks/useGetRestaurantOrdersByBeginWithPlacedAt";
import { convertCentsToDollars, convertProductTypesForPrint, toLocalISOString } from "../../util/util";
import { format } from "date-fns";
import { Button } from "../../tabin/components/button";
import { toast } from "../../tabin/components/toast";
import { IGET_RESTAURANT_ORDER_FRAGMENT, IGET_RESTAURANT_ORDER_MODIFIER_GROUP_FRAGMENT } from "../../graphql/customFragments";
import { useRegister } from "../../context/register-context";
import { useReceiptPrinter } from "../../context/receiptPrinter-context";
import { ProductModifier } from "../shared/productModifier";

export const Orders = (props: { date?: string }) => {
    const dateParam = props.date;
    const { restaurant } = useRestaurant();
    const { register } = useRegister();
    const { printReceipt } = useReceiptPrinter();
    const [eOrderStatus, setEOrderStatus] = useState(EOrderStatus.NEW);

    const [showSpinner, setShowSpinner] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [date, setDate] = useState(dateParam ? dateParam : format(new Date(), "yyyy-MM-dd"));

    const { data: orders, error, loading } = useGetRestaurantOrdersByBeginWithPlacedAt(restaurant ? restaurant.id : "", date);

    const refetchOrders = [
        {
            query: GET_ORDERS_BY_RESTAURANT_BY_BEGIN_WITH_PLACEDAT,
            variables: { orderRestaurantId: restaurant ? restaurant.id : "", placedAt: date },
        },
    ];

    const [updateOrderStatusMutation] = useMutation(UPDATE_ORDER_STATUS, {
        update: (proxy, mutationResult: any) => {},
        refetchQueries: refetchOrders,
    });

    if (!restaurant) return <div>Please select a restaurant.</div>;

    if (loading) {
        return <FullScreenSpinner show={true} text="Loading restaurant" />;
    }

    if (error) {
        return <h1>Couldn't fetch orders. Try Refreshing</h1>;
    }

    if (!orders) {
        return <>Couldn't fetch orders.</>;
    }

    const onOrderComplete = async (order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
        const now = new Date();

        setShowSpinner(true);

        try {
            await updateOrderStatusMutation({
                variables: {
                    orderId: order.id,
                    status: EOrderStatus.COMPLETED,
                    placedAt: order.placedAt,
                    completedAt: toLocalISOString(now),
                    completedAtUtc: now.toISOString(),
                },
            });
        } catch (error) {
            toast.error("Could not update order status. Please contact a Tabin representative.");
        } finally {
            setShowSpinner(false);
        }
    };

    const onOrderRefund = async (order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
        const now = new Date();

        setShowSpinner(true);

        try {
            await updateOrderStatusMutation({
                variables: {
                    orderId: order.id,
                    status: EOrderStatus.REFUNDED,
                    placedAt: order.placedAt,
                    refundedAt: toLocalISOString(now),
                    refundedAtUtc: now.toISOString(),
                },
            });
        } catch (error) {
            toast.error("Could not update order status. Please contact a Tabin representative.");
        } finally {
            setShowSpinner(false);
        }
    };

    const onOrderCancel = async (order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
        const now = new Date();

        setShowSpinner(true);

        try {
            await updateOrderStatusMutation({
                variables: {
                    orderId: order.id,
                    status: EOrderStatus.CANCELLED,
                    placedAt: order.placedAt,
                    cancelledAt: toLocalISOString(now),
                    cancelledAtUtc: now.toISOString(),
                },
            });
        } catch (error) {
            toast.error("Could not update order status. Please contact a Tabin representative.");
        } finally {
            setShowSpinner(false);
        }
    };

    const onOrderReprint = async (order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
        setShowSpinner(true);

        try {
            register &&
                register.printers &&
                register.printers.items.forEach(async (printer) => {
                    await printReceipt({
                        orderId: order.id,
                        printerType: printer.type,
                        printerAddress: printer.address,
                        customerPrinter: printer.customerPrinter,
                        kitchenPrinter: printer.kitchenPrinter,
                        hideModifierGroupsForCustomer: false,
                        restaurant: {
                            name: restaurant.name,
                            address: `${restaurant.address.aptSuite || ""} ${restaurant.address.formattedAddress || ""}`,
                            gstNumber: restaurant.gstNumber,
                        },
                        customerInformation: null,
                        notes: order.notes,
                        products: convertProductTypesForPrint(order.products),
                        eftposReceipt: order.eftposReceipt,
                        total: order.total,
                        discount: order.promotionId && order.discount ? order.discount : null,
                        subTotal: order.subTotal,
                        paid: order.paid,
                        type: order.type,
                        number: order.number,
                        table: order.table,
                        placedAt: order.placedAt,
                        orderScheduledAt: order.orderScheduledAt,
                    });
                });
        } catch (error) {
            toast.error("Could not update order status. Please contact a Tabin representative.");
        } finally {
            setShowSpinner(false);
        }
    };

    const onClickTab = (tab: EOrderStatus) => {
        setEOrderStatus(tab);
    };

    const onChangeDate = (event: React.ChangeEvent<HTMLInputElement>) => {
        setDate(event.target.value);
    };

    return (
        <>
            <FullScreenSpinner show={showSpinner} />
            <div className="order-container">
                <div className="h2 mb-6">Orders</div>
                <Input label="Date" type="date" name="date" placeholder="Enter a date" value={date} onChange={onChangeDate} className="mb-4" />
                <div className="order-tabs-wrapper mb-6">
                    <div className={`tab ${eOrderStatus == EOrderStatus.NEW ? "selected" : ""}`} onClick={() => onClickTab(EOrderStatus.NEW)}>
                        NEW
                    </div>
                    <div
                        className={`tab ${eOrderStatus == EOrderStatus.COMPLETED ? "selected" : ""}`}
                        onClick={() => onClickTab(EOrderStatus.COMPLETED)}
                    >
                        Completed
                    </div>
                    <div
                        className={`tab ${eOrderStatus == EOrderStatus.CANCELLED ? "selected" : ""}`}
                        onClick={() => onClickTab(EOrderStatus.CANCELLED)}
                    >
                        Cancelled
                    </div>
                    <div
                        className={`tab ${eOrderStatus == EOrderStatus.REFUNDED ? "selected" : ""}`}
                        onClick={() => onClickTab(EOrderStatus.REFUNDED)}
                    >
                        Refunded
                    </div>
                </div>

                <Input
                    className="mb-4"
                    type="text"
                    label="Search Order Number"
                    name="search"
                    value={searchTerm}
                    placeholder="18..."
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
                />

                <div className="orders-wrapper">
                    {orders.map(
                        (order) =>
                            order.status == eOrderStatus && (
                                <Order
                                    key={order.id}
                                    searchTerm={searchTerm}
                                    order={order}
                                    onOrderComplete={onOrderComplete}
                                    onOrderRefund={onOrderRefund}
                                    onOrderCancel={onOrderCancel}
                                    onOrderReprint={onOrderReprint}
                                />
                            )
                    )}
                </div>
            </div>
        </>
    );
};

const Order = (props: {
    searchTerm: string;
    order: IGET_RESTAURANT_ORDER_FRAGMENT;
    onOrderComplete: (order: IGET_RESTAURANT_ORDER_FRAGMENT) => void;
    onOrderRefund: (order: IGET_RESTAURANT_ORDER_FRAGMENT) => void;
    onOrderCancel: (order: IGET_RESTAURANT_ORDER_FRAGMENT) => void;
    onOrderReprint: (order: IGET_RESTAURANT_ORDER_FRAGMENT) => void;
}) => {
    const { searchTerm, order, onOrderComplete, onOrderRefund, onOrderCancel, onOrderReprint } = props;

    if (searchTerm && searchTerm !== order.number) return <div></div>;

    return (
        <div className="order-wrapper">
            <div className="order-number-type-wrapper mb-2">
                <div className="order-number-type-number">{order.number}</div>
                <div className="h4">{order.type}</div>
            </div>
            <div className="mb-1">Order placed: {format(new Date(order.placedAt), "dd MMM HH:mm:ss aa")}</div>
            {order.completedAt && <div className="mb-1">Order completed: {format(new Date(order.completedAt), "dd MMM HH:mm:ss aa")}</div>}
            {order.cancelledAt && <div className="mb-1">Order cancelled: {format(new Date(order.cancelledAt), "dd MMM HH:mm:ss aa")}</div>}
            {order.refundedAt && <div className="mb-1">Order refundedAt: {format(new Date(order.refundedAt), "dd MMM HH:mm:ss aa")}</div>}

            {order.customerInformation && (
                <div>
                    Customer: {order.customerInformation.firstName} ({order.customerInformation.phoneNumber})
                </div>
            )}

            {order.products.map((product) => (
                <div key={product.id}>
                    <div className="separator-2"></div>
                    <OrderItemDetails name={product.name} quantity={product.quantity} notes={product.notes} modifierGroups={product.modifierGroups} />
                </div>
            ))}

            <div className="separator-2"></div>
            {order.discount && <div className="mb-1">Discount: -${convertCentsToDollars(order.discount)}</div>}
            <div className="h4">Total: ${convertCentsToDollars(order.subTotal || 0)}</div>

            <div className="order-action-buttons-container mt-2">
                {order.status !== EOrderStatus.COMPLETED && <Button onClick={() => onOrderComplete(order)}>Complete</Button>}
                {order.status !== EOrderStatus.REFUNDED && <Button onClick={() => onOrderRefund(order)}>Refund</Button>}
                {order.status !== EOrderStatus.CANCELLED && <Button onClick={() => onOrderCancel(order)}>Cancel</Button>}
                <Button onClick={() => onOrderReprint(order)}>Reprint</Button>
            </div>
        </div>
    );
};

const OrderItemDetails = (props: {
    name: string;
    quantity: number;
    notes: string | null;
    modifierGroups: IGET_RESTAURANT_ORDER_MODIFIER_GROUP_FRAGMENT[] | null;
}) => {
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

    const nameDisplay = <div className="h4">{`${props.quantity > 1 ? `${props.quantity} x ` : ""}${props.name}`}</div>;

    const modifiersDisplay = (
        <>
            {props.modifierGroups &&
                props.modifierGroups.map((mg) => (
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
                                                            selectionIndex={
                                                                m.productModifiers && m.productModifiers.length > 1 ? index + 1 : undefined
                                                            }
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

    const notesDisplay = <>{props.notes && <div className="text-grey">Notes: {props.notes}</div>}</>;

    return (
        <div className="detail">
            {nameDisplay}
            {modifiersDisplay}
            {notesDisplay}
        </div>
    );
};
