import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import "./pageWrapper.scss";

import { useNavigate } from "react-router";
import { beginOrderPath, tabs } from "../../components/main";
import { useCart } from "../../context/cart-context";
import { useRegister } from "../../context/register-context";
import { ERegisterType } from "../../graphql/customQueries";
import { usePinch } from "@use-gesture/react";
import { Menu } from "../../components/shared/menu";
import { ModalV2 } from "./modalv2";
import { Button } from "./button";
import { getDollarString } from "../../util/util";

export const PageWrapper = (props: IProps) => {
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const { register, isShownNewOnlineOrderReceivedModal, setIsShownNewOnlineOrderReceivedModal, newOnlineOrderInfo, isPOS } = useRegister();

    const [showOnlineOrderModal, setShowOnlineOrderModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    let timerId: NodeJS.Timeout;

    const resetAfterSeconds = register && register.type == ERegisterType.KIOSK ? 3 * 60 : 10000 * 60; //3 mins
    const userInactiveSecondsCounter: React.MutableRefObject<number> = useRef(0);

    const resetUserInactiveSecondsCounter = () => {
        userInactiveSecondsCounter.current = 0;
    };

    useEffect(() => {
        setShowOnlineOrderModal(isShownNewOnlineOrderReceivedModal);
    }, [isShownNewOnlineOrderReceivedModal]);

    useEffect(() => {
        const ticker = setInterval(() => {
            if (userInactiveSecondsCounter.current == resetAfterSeconds) {
                navigate(beginOrderPath);
                clearCart();
            }
            userInactiveSecondsCounter.current++;
        }, 1000);

        return () => clearTimeout(ticker);
    }, []);

    const bind = usePinch(
        (state) => {
            // console.log("xxx...state", state.touches, state.elapsedTime);

            if (state.touches === 5 && state.elapsedTime > 300) setShowMenu(true);
        },
        { eventOptions: { passive: false } },
    );

    useEffect(() => {
        document.addEventListener("gesturestart", (e) => e.preventDefault());
        document.addEventListener("gesturechange", (e) => e.preventDefault());

        return () => {
            document.removeEventListener("gesturestart", (e) => {});
            document.removeEventListener("gesturechange", (e) => {});
        };
    }, []);

    useEffect(() => {
        document.body.onmousedown = () => {
            timerId = setTimeout(() => {
                setShowMenu(true);
            }, 1000);
        };

        document.body.onmouseup = () => {
            clearTimeout(timerId);
        };
    }, []);

    const onClickMenuRoute = (route: string) => {
        setShowMenu(false);
        navigate(route);
    };

    const onHideMenu = () => {
        setShowMenu(false);
    };

    const getOrderDateString = (date: string | null) => {
        if (!date) return null;

        const parsedDate = new Date(date);

        if (isNaN(parsedDate.getTime())) return null;

        return format(parsedDate, "dd MMM h:mm aa");
    };

    const getOrderTypeString = (type: string) => type.charAt(0) + type.slice(1).toLowerCase();

    const renderOnlineOrderCard = (order: (typeof newOnlineOrderInfo)[number]) => {
        const placedAt = getOrderDateString(order.placedAt);
        const scheduledAt = getOrderDateString(order.orderScheduledAt);

        return (
            <div className="online-order-card">
                <div className="online-order-card-top mb-2">
                    <div className="text-bold">Order #{order.number}</div>
                    <div className="text-bold">{getDollarString(order.total)}</div>
                </div>

                <div className="online-order-card-schedule mb-2">
                    <div className="text-bold mb-1">Scheduled At</div>
                    <div className="online-order-card-schedule-time text-bold">{scheduledAt || "ASAP"}</div>
                </div>

                <div className="online-order-card-meta">
                    {placedAt && (
                        <div className="online-order-card-meta-item">
                            <div className="text-bold mb-1">Placed At</div>
                            <div>{placedAt}</div>
                        </div>
                    )}
                    <div className="online-order-card-meta-item">
                        <div className="text-bold mb-1">Type</div>
                        <div>{getOrderTypeString(order.type)}</div>
                    </div>
                    {order.customerFirstName && (
                        <div className="online-order-card-meta-item">
                            <div className="text-bold mb-1">Customer</div>
                            <div>{order.customerFirstName}</div>
                        </div>
                    )}
                    {order.customerPhoneNumber && (
                        <div className="online-order-card-meta-item">
                            <div className="text-bold mb-1">Phone</div>
                            <div>{order.customerPhoneNumber}</div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const hasMultipleNewOnlineOrders = newOnlineOrderInfo.length > 1;

    return (
        <>
            <div
                style={{ touchAction: "none" }}
                {...bind()}
                onClick={() => {
                    resetUserInactiveSecondsCounter();
                }}
            >
                {props.children}
                {showMenu && <Menu tabs={tabs} onClickMenuRoute={onClickMenuRoute} onHideMenu={onHideMenu} />}
                {isPOS && (
                    <ModalV2
                        width="480px"
                        padding="24px"
                        isOpen={showOnlineOrderModal}
                        disableClose={true}
                        shouldCloseOnOverlayClick={false}
                        shouldCloseOnEsc={false}
                        onRequestClose={() => {}}
                    >
                        <div className="new-online-orders-modal">
                            <div className="h3">
                                {newOnlineOrderInfo.length} Online Order{newOnlineOrderInfo.length > 1 ? "s" : ""} Received!
                            </div>
                            {hasMultipleNewOnlineOrders ? (
                                <div className="new-online-orders-list">
                                    {newOnlineOrderInfo.map((order) => (
                                        <div key={order.number}>{renderOnlineOrderCard(order)}</div>
                                    ))}
                                </div>
                            ) : (
                                <div className="new-online-orders-single">
                                    {newOnlineOrderInfo.map((order) => (
                                        <div key={order.number}>{renderOnlineOrderCard(order)}</div>
                                    ))}
                                </div>
                            )}
                            <div className="new-online-orders-modal-actions">
                                <Button
                                    onClick={() => {
                                        setShowOnlineOrderModal(false);
                                        setIsShownNewOnlineOrderReceivedModal(false);
                                    }}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </ModalV2>
                )}
            </div>
        </>
    );
};

interface IProps {
    children: React.ReactNode;
}
