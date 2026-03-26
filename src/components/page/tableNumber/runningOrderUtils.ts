import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../../../graphql/customFragments";
import { EOrderStatus, EOrderType } from "../../../graphql/customQueries";
import { convertCentsToDollars } from "../../../util/util";
import { getParkedOrderPrintedProductStorageKey, getProductQuantities } from "../checkout";

// Reuse checkout helper so both screens follow the same kitchen round-tracking key format.
export { getParkedOrderPrintedProductStorageKey };

// Set print tracking only once, so previous unsent-item data is kept.
export const initializeRunningOrderPrintedProductTracking = (order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
    const storageKey = getParkedOrderPrintedProductStorageKey(order.id);
    const currentQuantities = getProductQuantities(order.products);
    // Save current items as the starting baseline.
    const writeCurrentQuantities = () => localStorage.setItem(storageKey, JSON.stringify(currentQuantities));

    let existing: unknown = null;
    try {
        existing = JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
        writeCurrentQuantities();
        return;
    }

    const hasTrackedQuantities =
        typeof existing === "object" &&
        existing !== null &&
        Object.values(existing as Record<string, unknown>).some((quantity) => typeof quantity === "number" && quantity > 0);

    // Keep existing tracking if it already has valid values.
    if (hasTrackedQuantities) return;

    writeCurrentQuantities();
};

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
