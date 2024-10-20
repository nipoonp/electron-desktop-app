import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_ORDER_STATUS } from "../../graphql/customMutations";
import {
    EOrderStatus,
    ERegisterPrinterType,
    GET_ORDERS_BY_RESTAURANT_BY_BEGIN_WITH_PLACEDAT,
    UPDATE_RESTAURANT_PREPARATION_TIME,
} from "../../graphql/customQueries";
import { FullScreenSpinner } from "../../tabin/components/fullScreenSpinner";
import { Input } from "../../tabin/components/input";
import { useGetRestaurantOrdersByBeginWithPlacedAt } from "../../hooks/useGetRestaurantOrdersByBeginWithPlacedAt";
import { format } from "date-fns";
import { Button } from "../../tabin/components/button";
import { toast } from "../../tabin/components/toast";
import { ModalV2 } from "../../tabin/components/modalv2";
import { IGET_RESTAURANT_ORDER_FRAGMENT, IGET_RESTAURANT_ORDER_MODIFIER_GROUP_FRAGMENT } from "../../graphql/customFragments";
// import { useRegister } from "../../context/register-context";
// import { useReceiptPrinter } from "../../context/receiptPrinter-context";
import { ProductModifier } from "../shared/productModifier";
import { useNavigate, useParams } from "react-router-dom";

import { toLocalISOString } from "../../util/util";
import { convertCentsToDollars } from "../../util/util";
import { StepperWithQuantityInput } from "../../tabin/components/stepperWithQuantityInput";
import { BsFillCheckCircleFill, BsFillExclamationCircleFill } from "react-icons/bs";
import { FiMail } from "react-icons/fi";
import { CachedImage } from "../../tabin/components/cachedImage";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import { useAuth } from "../../context/auth-context";
import { Link } from "../../tabin/components/link";
import { useRestaurant } from "../../context/restaurant-context";

import "./orders.scss";
import { useGetRestaurantLazyQuery } from "../../hooks/useGetRestaurantLazyQuery";
import { useRegister } from "../../context/register-context";
import { IoIosArrowBack } from "react-icons/io";
import { beginOrderPath } from "../main";

const Orders = () => {
    const navigate = useNavigate();
    const { date: queryDate } = useParams();
    const { restaurant, setRestaurant } = useRestaurant();
    const [eOrderStatus, setEOrderStatus] = useState(restaurant?.autoCompleteOrders ? EOrderStatus.COMPLETED : EOrderStatus.NEW);

    const [showFullScreenSpinner, setShowFullScreenSpinner] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [date, setDate] = useState(queryDate ? queryDate : format(new Date(), "yyyy-MM-dd"));
    const [preparationTimeInMinutes, setPreparationTimeInMinutes] = useState(
        restaurant && restaurant.preparationTimeInMinutes ? restaurant.preparationTimeInMinutes.toString() : ""
    );

    const { data: orders, error, loading } = useGetRestaurantOrdersByBeginWithPlacedAt(restaurant ? restaurant.id : "", date);

    const { getRestaurant } = useGetRestaurantLazyQuery();

    const [updateRestaurantPreparationTime] = useMutation(UPDATE_RESTAURANT_PREPARATION_TIME, {
        update: (proxy, mutationResult) => {
            toast.success("Wait time successfully updated");
        },
    });

    const refetchOrders = [
        {
            query: GET_ORDERS_BY_RESTAURANT_BY_BEGIN_WITH_PLACEDAT,
            variables: { orderRestaurantId: restaurant ? restaurant.id : "", placedAt: date },
        },
    ];

    useEffect(() => {
        if (!restaurant) return;

        setPreparationTimeInMinutes(restaurant && restaurant.preparationTimeInMinutes ? restaurant.preparationTimeInMinutes.toString() : "");
    }, [restaurant]);

    const [updateOrderStatusMutation] = useMutation(UPDATE_ORDER_STATUS, {
        refetchQueries: refetchOrders,
    });

    if (!restaurant) return <div>Please select a restaurant.</div>;
    if (loading) return <FullScreenSpinner show={true} text="Loading restaurant" />;
    if (error) return <h1>Couldn't fetch orders. Try Refreshing</h1>;
    if (!orders) return <>Couldn't fetch orders.</>;

    const onOrderComplete = async (order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
        const now = new Date();

        setShowFullScreenSpinner(true);

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
            setShowFullScreenSpinner(false);
        }
    };

    const onOrderRefund = async (order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
        const now = new Date();

        setShowFullScreenSpinner(true);

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
            setShowFullScreenSpinner(false);
        }
    };

    const onOrderCancel = async (order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
        const now = new Date();

        setShowFullScreenSpinner(true);

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
            setShowFullScreenSpinner(false);
        }
    };

    const onOpenParkedOrder = async (order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
        try {
            window.top &&
                window.top.postMessage(
                    {
                        action: "orderOpenParked",
                        order: {
                            id: order.id,
                            notes: order.notes,
                            products: order.products,
                            total: order.total,
                            subTotal: order.subTotal,
                            type: order.type,
                            number: order.number,
                            table: order.table,
                            buzzer: order.buzzer,
                            covers: order.covers,
                        },
                    },
                    "*"
                );
        } catch (e) {
            console.error(e);
            toast.error("There was an error processing your request.");
        }
    };

    const onOrderReprint = async (order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
        try {
            window.top &&
                window.top.postMessage(
                    {
                        action: "orderReprint",
                        order: {
                            orderId: order.id,
                            status: order.status,
                            printerType: ERegisterPrinterType.WIFI, //Will replace this in app side
                            printerAddress: "", //Will replace this in app side
                            customerPrinter: null, //Will replace this in app side
                            kitchenPrinter: null, //Will replace this in app side
                            kitchenPrinterSmall: null, //Will replace this in app side
                            kitchenPrinterLarge: null, //Will replace this in app side
                            hidePreparationTime: null, //Will replace this in app side
                            hideModifierGroupName: null, //Will replace this in app side
                            hideModifierGroupsForCustomer: false,
                            restaurant: {
                                name: restaurant.name,
                                address: `${restaurant.address.aptSuite || ""} ${restaurant.address.formattedAddress || ""}`,
                                gstNumber: restaurant.gstNumber,
                            },
                            customerInformation: order.customerInformation
                                ? {
                                      firstName: order.customerInformation.firstName,
                                      email: order.customerInformation.email,
                                      phoneNumber: order.customerInformation.phoneNumber,
                                      signature: order.customerInformation.signature,
                                  }
                                : null,
                            notes: order.notes,
                            products: order.products,
                            eftposReceipt: order.eftposReceipt,
                            paymentAmounts: order.paymentAmounts,
                            total: order.total,
                            surcharge: order.surcharge || null,
                            orderTypeSurcharge: order.orderTypeSurcharge || null,
                            eftposSurcharge: order.eftposSurcharge || null,
                            eftposTip: order.eftposTip || null,
                            discount: order.promotionId && order.discount ? order.discount : null,
                            subTotal: order.subTotal,
                            paid: order.paid,
                            type: order.type,
                            number: order.number,
                            table: order.table,
                            buzzer: order.buzzer,
                            covers: order.covers,
                            placedAt: order.placedAt,
                            orderScheduledAt: order.orderScheduledAt,
                        },
                    },
                    "*"
                );
        } catch (e) {
            console.error(e);
            toast.error("There was an error processing your request.");
        }
    };

    const onClickTab = (tab: EOrderStatus) => {
        setEOrderStatus(tab);
    };

    const onChangeDate = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.value) {
            setDate(event.target.value);
        }
    };

    const onChangePreparationTime = async (newPreparationTime: number) => {
        setPreparationTimeInMinutes(newPreparationTime.toString());

        setShowFullScreenSpinner(true);

        try {
            const variables = {
                id: restaurant.id,
                preparationTimeInMinutes: newPreparationTime || null,
            };

            await updateRestaurantPreparationTime({
                variables: variables,
            });

            const res = await getRestaurant({
                variables: {
                    restaurantId: restaurant.id,
                },
            });

            setRestaurant(res.data.getRestaurant);

            setShowFullScreenSpinner(false);
        } catch (e) {
            toast.error("There was an error processing your request");
            setShowFullScreenSpinner(false);
        }
    };

    const onBackToSale = () => {
        navigate(beginOrderPath);
    };

    return (
        <>
            <FullScreenSpinner show={showFullScreenSpinner} />
            <div className="orders-container">
                <div className="orders-header-wrapper mb-2">
                    <div className="orders-header-wrapper-title">
                        <div className="orders-header-back" onClick={onBackToSale}>
                            <IoIosArrowBack size="24px" />
                            <div>Back To Sale</div>
                        </div>
                        <div className="h2">Orders</div>
                    </div>
                    <div>
                        <Input type="date" name="date" placeholder="Enter a date" value={date} onChange={onChangeDate} />
                    </div>
                    <div>
                        <Input
                            type="text"
                            // label="Search Order Number"
                            name="search"
                            value={searchTerm}
                            placeholder="Search Order Number"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
                        />
                    </div>

                    {restaurant && restaurant.preparationTimeInMinutes && (
                        <div className="average-preparation-time-wrapper">
                            <div>Average Wait Time</div>
                            <StepperWithQuantityInput
                                count={parseInt(preparationTimeInMinutes)}
                                stepAmount={5}
                                min={1}
                                onUpdate={(count: number) => onChangePreparationTime(count)}
                                size={28}
                            />
                        </div>
                    )}
                </div>

                {/* <div className="text-bold mb-2">Status</div> */}

                <div className="order-tabs-wrapper mt-4 mb-4">
                    <div className={`tab ${eOrderStatus == EOrderStatus.NEW ? "selected" : ""}`} onClick={() => onClickTab(EOrderStatus.NEW)}>
                        New
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
                    <div className={`tab ${eOrderStatus == EOrderStatus.PARKED ? "selected" : ""}`} onClick={() => onClickTab(EOrderStatus.PARKED)}>
                        Parked
                    </div>
                </div>

                <div className="orders-wrapper">
                    {orders.map(
                        (order) =>
                            order.status == eOrderStatus && (
                                <Order
                                    key={order.id}
                                    searchTerm={searchTerm}
                                    order={order}
                                    restaurant={restaurant}
                                    onOrderComplete={onOrderComplete}
                                    onOrderRefund={onOrderRefund}
                                    onOrderCancel={onOrderCancel}
                                    onOrderReprint={onOrderReprint}
                                    onOpenParkedOrder={onOpenParkedOrder}
                                />
                            )
                    )}
                </div>
            </div>
        </>
    );
};

export default Orders;

const Order = (props: {
    searchTerm: string;
    order: IGET_RESTAURANT_ORDER_FRAGMENT;
    restaurant;
    onOrderComplete: (order: IGET_RESTAURANT_ORDER_FRAGMENT) => void;
    onOrderRefund: (order: IGET_RESTAURANT_ORDER_FRAGMENT) => void;
    onOrderCancel: (order: IGET_RESTAURANT_ORDER_FRAGMENT) => void;
    onOrderReprint: (order: IGET_RESTAURANT_ORDER_FRAGMENT) => void;
    onOpenParkedOrder: (order: IGET_RESTAURANT_ORDER_FRAGMENT) => void;
}) => {
    const { isAdmin } = useAuth();
    const { searchTerm, order, restaurant, onOrderComplete, onOrderRefund, onOrderCancel, onOrderReprint, onOpenParkedOrder } = props;
    const [mailPopup, setMailPopup] = useState(false);
    const [emails, setEmails] = useState("");
    const [viewReceipt, setViewReceipt] = useState(false);

    const [showOrderDetail, setShowOrderDetail] = useState(false);

    if (searchTerm && searchTerm !== order.number) return <div></div>;

    const sendEmail = async () => {
        console.log("order", order);
        console.log("emails", emails);
        // sendFailureNotification({ order, restaurant, mailingList: emails }, {}, { isSuccess: true, errorMessage: false });
        setMailPopup(false);
        setEmails("");
        toast.success("Email send successfully.");
    };

    const onOpenMailPopup = () => {
        setMailPopup(true);
    };

    const onCloseMailPopup = () => {
        setMailPopup(false);
    };

    const onToggleReceipt = () => {
        setViewReceipt(!viewReceipt);
    };

    const onClickShowOrderDetail = () => {
        setShowOrderDetail(!showOrderDetail);
    };

    return (
        <div className="order-wrapper">
            <div onClick={onClickShowOrderDetail}>
                {isAdmin && <div className="text-small mb-2">ID: {order.id}</div>}
                {/* {isAdmin && order.thirdPartyIntegrationResult && (
                <div className="d-flex d-flex-align-center text-small mb-1">
                    Third Party Integration:
                    <span className="ml-1">
                        {order.thirdPartyIntegrationResult?.isSuccess ? (
                            <BsFillCheckCircleFill className="arrow" size="24px" color="green" />
                        ) : (
                            <BsFillExclamationCircleFill className="arrow" size="24px" color="red" />
                        )}
                    </span>
                    <span className="ml-1">{order.thirdPartyIntegrationResult?.errorMessage}</span>
                </div>
            )} */}
                {order.status === EOrderStatus.PARKED && order.notes && (
                    <>
                        <div className="h4">{order.notes && <div>{order.notes}</div>}</div>
                        <div className="separator-2"></div>
                    </>
                )}

                <div className="mb-2 d-flex j-space-beteen d-flex-align-center">
                    <div className="order-number-type-wrapper ">
                        <div className="order-number-type-number">{order.number}</div>
                        <div className="h4">{order.type}</div>
                    </div>
                    <div className="link" onClick={() => onOpenMailPopup()}>
                        <FiMail color="black" />
                    </div>
                </div>
                {order.status === EOrderStatus.PARKED ? (
                    <div className="mb-1">Order parked: {format(new Date(order.placedAt), "dd MMM h:mm:ss aa")}</div>
                ) : (
                    <div className="mb-1">Order placed: {format(new Date(order.placedAt), "dd MMM h:mm:ss aa")}</div>
                )}
                {order.orderScheduledAt && (
                    <div className="mb-1">Order scheduled: {format(new Date(order.orderScheduledAt), "dd MMM h:mm:ss aa")}</div>
                )}
                {order.completedAt && <div className="mb-1">Order completed: {format(new Date(order.completedAt), "dd MMM h:mm:ss aa")}</div>}
                {order.cancelledAt && <div className="mb-1">Order cancelled: {format(new Date(order.cancelledAt), "dd MMM h:mm:ss aa")}</div>}
                {order.refundedAt && <div className="mb-1">Order refundedAt: {format(new Date(order.refundedAt), "dd MMM h:mm:ss aa")}</div>}

                {order.table && <div className="mb-1 text-bold">Table: {order.table}</div>}
                {order.covers && <div className="mb-1 text-bold">Covers: {order.covers}</div>}
                {order.buzzer && <div className="mb-1 text-bold">Buzzer: {order.buzzer}</div>}

                {order.customerInformation && (
                    <>
                        <div className="mb-1">
                            Customer:{" "}
                            {`${order.customerInformation.firstName} ${
                                order.customerInformation.phoneNumber ? `(${order.customerInformation.phoneNumber})` : ""
                            }`}
                        </div>
                        <div>
                            {order.customerInformation?.customFields?.map((field) => (
                                <div className="mb-1">
                                    {field.label}: {field.value}
                                </div>
                            ))}
                        </div>
                        {order.customerInformation.signature && (
                            <CachedImage
                                url={`${getCloudFrontDomainName()}/protected/${order.customerInformation.signature.identityPoolId}/${
                                    order.customerInformation.signature.key
                                }`}
                                className="order-customer-signature"
                                alt="customer-signature"
                            />
                        )}
                    </>
                )}
            </div>

            {showOrderDetail && (
                <div>
                    {order.products.map((product) => (
                        <div key={product.id}>
                            <div className="separator-2"></div>
                            <OrderItemDetails
                                name={product.name}
                                quantity={product.quantity}
                                notes={product.notes}
                                price={product.price}
                                totalPrice={product.totalPrice}
                                discount={product.discount}
                                modifierGroups={product.modifierGroups}
                            />
                        </div>
                    ))}

                    {/* For Parked Orders display order notes on top */}
                    {order.status !== EOrderStatus.PARKED && order.notes && (
                        <>
                            <div className="separator-2"></div>
                            <div className="mt-2">{order.notes && <div className="text-grey">Order Notes: {order.notes}</div>}</div>
                        </>
                    )}

                    <div className="separator-2"></div>
                    {order.surcharge ? <div className="mb-1">Surcharge: ${convertCentsToDollars(order.surcharge)}</div> : <></>}
                    {order.orderTypeSurcharge ? (
                        <div className="mb-1">Order Type Surcharge: ${convertCentsToDollars(order.orderTypeSurcharge)}</div>
                    ) : (
                        <></>
                    )}
                    {order.eftposSurcharge ? <div className="mb-1">Card Surcharge: ${convertCentsToDollars(order.eftposSurcharge)}</div> : <></>}
                    {order.eftposTip ? <div className="mb-1">Eftpos Tip: ${convertCentsToDollars(order.eftposTip)}</div> : <></>}
                    {order.discount ? <div className="mb-1">Discount: -${convertCentsToDollars(order.discount)}</div> : <></>}
                    <div className="h4">Total: ${convertCentsToDollars(order.subTotal || 0)}</div>

                    <div className="separator-2"></div>
                    <div className="text-underline mb-2">Payment Method</div>
                    {order.paymentAmounts && order.paymentAmounts.cash ? (
                        <div className="mt-1">Cash: ${convertCentsToDollars(order.paymentAmounts.cash)}</div>
                    ) : (
                        <></>
                    )}
                    {order.paymentAmounts && order.paymentAmounts.eftpos ? (
                        <div className="mt-1">
                            Eftpos ({order.eftposCardType}): ${convertCentsToDollars(order.paymentAmounts.eftpos)}
                        </div>
                    ) : (
                        <></>
                    )}
                    {order.paymentAmounts && order.paymentAmounts.online ? (
                        <div className="mt-1">Online: ${convertCentsToDollars(order.paymentAmounts.online)}</div>
                    ) : (
                        <></>
                    )}
                    {order.paymentAmounts && order.paymentAmounts.uberEats ? (
                        <div className="mt-1">Uber Eats: ${convertCentsToDollars(order.paymentAmounts.uberEats)}</div>
                    ) : (
                        <></>
                    )}
                    {order.paymentAmounts && order.paymentAmounts.menulog ? (
                        <div className="mt-1">Menulog: ${convertCentsToDollars(order.paymentAmounts.menulog)}</div>
                    ) : (
                        <></>
                    )}
                    {order.paymentAmounts && order.paymentAmounts.doordash ? (
                        <div className="mt-1">Doordash: ${convertCentsToDollars(order.paymentAmounts.doordash)}</div>
                    ) : (
                        <></>
                    )}
                    {order.paymentAmounts && order.paymentAmounts.delivereasy ? (
                        <div className="mt-1">Delivereasy: ${convertCentsToDollars(order.paymentAmounts.delivereasy)}</div>
                    ) : (
                        <></>
                    )}
                    {order.paymentAmounts &&
                    !order.paymentAmounts.cash &&
                    !order.paymentAmounts.eftpos &&
                    !order.paymentAmounts.online &&
                    !order.paymentAmounts.uberEats &&
                    !order.paymentAmounts.menulog &&
                    !order.paymentAmounts.doordash &&
                    !order.paymentAmounts.delivereasy ? (
                        <div className="mt-1">Unpaid</div>
                    ) : (
                        <></>
                    )}
                    <div className="separator-2"></div>

                    <div className="order-action-buttons-container mt-2">
                        {order.status !== EOrderStatus.PARKED && order.status !== EOrderStatus.COMPLETED && (
                            <Button onClick={() => onOrderComplete(order)}>Complete</Button>
                        )}
                        {order.status !== EOrderStatus.PARKED && order.status !== EOrderStatus.REFUNDED && (
                            <Button onClick={() => onOrderRefund(order)}>Refund</Button>
                        )}
                        {order.status !== EOrderStatus.PARKED && order.status !== EOrderStatus.CANCELLED && (
                            <Button onClick={() => onOrderCancel(order)}>Cancel</Button>
                        )}
                        {order.status === EOrderStatus.PARKED && <Button onClick={() => onOpenParkedOrder(order)}>Open Sale</Button>}
                        {<Button onClick={() => onOrderReprint(order)}>Reprint</Button>}
                    </div>

                    {order.eftposReceipt && (
                        <Link className="text-small mt-2" onClick={onToggleReceipt}>
                            {viewReceipt ? "Hide Receipt" : "View Receipt"}
                        </Link>
                    )}
                    {viewReceipt && (
                        <pre className="text-small mt-2" style={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                            {order.eftposReceipt}
                        </pre>
                    )}
                </div>
            )}

            <ModalV2 padding="24px" isOpen={mailPopup} onRequestClose={onCloseMailPopup}>
                <div>
                    <Input
                        className="mb-2"
                        type="text"
                        label="Enter your email"
                        name="emailAddress"
                        autoFocus={true}
                        placeholder="Email address"
                        value={emails}
                        onChange={(e) => setEmails(e.target.value)}
                    />
                    <Button onClick={sendEmail}>Send Email</Button>
                </div>
            </ModalV2>
        </div>
    );
};

const OrderItemDetails = (props: {
    name: string;
    quantity: number;
    notes: string | null;
    price: number;
    totalPrice: number;
    discount: number;
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
            mStr += ` (+$${convertCentsToDollars(price)})`;
        }

        return mStr;
    };

    const nameDisplay = (
        <div className="product-detail">
            <div className="h4">{`${props.quantity > 1 ? `${props.quantity} x ` : ""}${props.name}`}</div>
            <div className="h4">${convertCentsToDollars(props.totalPrice * props.quantity - props.discount)}</div>
            {/* {props.discount ? <div className="h4 original-price">${props.totalPrice * props.quantity}</div> : <></>} */}
        </div>
    );

    const modifiersDisplay = (
        <>
            {props.modifierGroups &&
                props.modifierGroups.map((mg) => (
                    <>
                        {!mg.hideForCustomer && (
                            <>
                                <div className="text-bold mt-2" key={mg.id}>
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
                                                            showNoExtraSelectionsMade={
                                                                m.productModifiers?.some((pm) => pm.modifierGroups?.length) || false
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

    const notesDisplay = <div className="mt-2">{props.notes && <div className="text-grey">Notes: {props.notes}</div>}</div>;

    return (
        <div>
            {nameDisplay}
            {modifiersDisplay}
            {notesDisplay}
        </div>
    );
};
