import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../../../graphql/customFragments";
import { EOrderStatus, EOrderType } from "../../../graphql/customQueries";
import { convertCentsToDollars, printedQuantitiesListToMap } from "../../../util/util";

// Cache backend print tracking locally for cart display. The database remains the source of truth.
export const initializeRunningOrderPrintedProductTracking = (order: IGET_RESTAURANT_ORDER_FRAGMENT) =>
    printedQuantitiesListToMap(order.printedQuantities);

// Returns whole minutes since order open time; guards invalid/future timestamps.
export const getElapsedMinutes = (placedAt: string, nowMs: number) => {
    const openedAtMs = new Date(placedAt).getTime();
    if (!Number.isFinite(openedAtMs)) return null;
    if (openedAtMs > nowMs) return 0;
    return Math.floor((nowMs - openedAtMs) / (60 * 1000));
};

// Resolves the server label shown in table metadata.
export const getServerLabelForOrder = (order: IGET_RESTAURANT_ORDER_FRAGMENT, currentRegisterName: string | null) => {
    if (currentRegisterName && order.registerId) return currentRegisterName;
    if (!order.registerId) return "-";
    return `Register ${order.registerId.slice(0, 6)}`;
};

// Formats cents into currency text for table cards/details.
export const formatOrderTotal = (totalCents: number | null | undefined) => {
    if (typeof totalCents !== "number") return "-";
    return `$${convertCentsToDollars(totalCents)}`;
};

// A table is treated as "running/occupied" only for dine-in PARKED orders.
// NEW is intentionally excluded, and status is normalized to uppercase for safe comparison.
export const isOpenDineInRunningOrder = (order: IGET_RESTAURANT_ORDER_FRAGMENT) =>
    order.type === EOrderType.DINEIN && !order.orderMergeId && `${order.status || ""}`.toUpperCase() === EOrderStatus.PARKED;
