import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../../../graphql/customFragments";
import {
    ECashMovementPaymentMethod,
    ECashMovementType,
    EOrderStatus,
    ETakingsScopeType,
    ETakingsSessionStatus,
    IGET_CASH_MOVEMENT,
    IGET_TAKINGS_SESSION,
} from "../../../graphql/customQueries";
import { convertCentsToDollars, convertDollarsToCentsReturnInt, toLocalISOString } from "../../../util/util";

export type TCountMode = "counted" | "denominations";
export type TCashEntryStep = "choice" | "counted" | "denominations";
export type TCashUpView = "finalize" | "history";
export type TPaymentKey = "cash" | "eftpos" | "online" | "uberEats" | "menulog" | "doordash" | "delivereasy";
export type TPaymentTotals = Record<TPaymentKey, number>;
export type TPaymentInputs = Record<TPaymentKey, string>;
export type TDenominationInputs = Record<string, string>;

export type TMoneyInOutView = "entry" | "history";
export type TMoneyMovementDirection = ECashMovementType.MONEY_IN | ECashMovementType.MONEY_OUT;
export type TMoneyMovementPaymentMethod = "cash" | "online" | "eftpos";
type TResolvedTakingsScope = {
    scopeType: ETakingsScopeType;
    scopeId: string;
    scopeKey: string;
};

const BUSINESS_TIME_ZONE = "Pacific/Auckland";
const LEGACY_PAYMENT_REASON_PREFIX = /^\[Payment: ([^\]]+)\]\s*/;

export const PAYMENT_KEYS: TPaymentKey[] = ["cash", "eftpos", "online", "uberEats", "menulog", "doordash", "delivereasy"];
export const DENOMINATIONS = [10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10];
export const MONEY_MOVEMENT_PAYMENT_METHODS: Array<{ key: TMoneyMovementPaymentMethod; label: string; value: ECashMovementPaymentMethod }> = [
    { key: "cash", label: "Cash", value: ECashMovementPaymentMethod.CASH },
    { key: "online", label: "Online", value: ECashMovementPaymentMethod.ONLINE },
    { key: "eftpos", label: "Eftpos", value: ECashMovementPaymentMethod.EFTPOS },
];

// Builds an empty payment-totals object so cash-up calculations always start from the same keys.
export const createPaymentTotals = (): TPaymentTotals => ({
    cash: 0,
    eftpos: 0,
    online: 0,
    uberEats: 0,
    menulog: 0,
    doordash: 0,
    delivereasy: 0,
});

// Converts saved cents totals into the text-input shape used by the cash-up form.
export const createPaymentInputs = (totals?: Partial<TPaymentTotals>): TPaymentInputs => ({
    cash: convertCentsToDollars(totals?.cash || 0),
    eftpos: convertCentsToDollars(totals?.eftpos || 0),
    online: convertCentsToDollars(totals?.online || 0),
    uberEats: convertCentsToDollars(totals?.uberEats || 0),
    menulog: convertCentsToDollars(totals?.menulog || 0),
    doordash: convertCentsToDollars(totals?.doordash || 0),
    delivereasy: convertCentsToDollars(totals?.delivereasy || 0),
});

// Prepares a blank quantity map for every supported cash denomination.
export const createDenominationInputs = (): TDenominationInputs =>
    DENOMINATIONS.reduce((accumulator, denomination) => {
        accumulator[String(denomination)] = "";
        return accumulator;
    }, {} as TDenominationInputs);

// Returns the restaurant business date string used by cash-up and money-history queries.
export const getBusinessDate = () =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone: BUSINESS_TIME_ZONE,
    }).format(new Date());

// Builds the placedAt range used to load orders for one business date.
export const getOrderDateRange = (businessDate: string) => {
    const [year, month, day] = businessDate.split("-").map((value) => Number(value));
    const baseDate = Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day) ? new Date(year, month - 1, day) : new Date();
    const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
    const end = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);

    return {
        start: toLocalISOString(start),
        end: toLocalISOString(end),
    };
};

// Builds a wider occurredAt range so business-date cash movements are not missed around timezone boundaries.
export const getCashMovementDateRange = (businessDate: string) => {
    const [year, month, day] = businessDate.split("-").map((value) => Number(value));
    const baseDate = Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day) ? new Date(year, month - 1, day) : new Date();
    const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 1, 0, 0, 0, 0);
    const end = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1, 23, 59, 59, 999);

    return {
        start: toLocalISOString(start),
        end: toLocalISOString(end),
    };
};

// Money history uses the same widened timestamp window as cash-up movement queries.
export const getMovementDateRange = (businessDate: string) => getCashMovementDateRange(businessDate);

// Produces the site-level scope key used by takings sessions and cash movements.
const getSiteScopeKey = (restaurantId: string) => `${ETakingsScopeType.SITE}#${restaurantId}`;

// Produces the register-level scope key used by takings sessions and cash movements.
const getRegisterScopeKey = (registerId: string) => `${ETakingsScopeType.REGISTER}#${registerId}`;

// Produces the staff-level scope key used by takings sessions and cash movements.
const getStaffScopeKey = (staffId: string) => `${ETakingsScopeType.STAFF}#${staffId}`;

// Resolves the active takings scope from restaurant settings so site, register, and staff
// sessions all share the same scope key format and fallback rules.
export const resolveTakingsScope = ({
    restaurantId,
    registerId,
    staffId,
    defaultScope,
}: {
    restaurantId?: string | null;
    registerId?: string | null;
    staffId?: string | null;
    defaultScope?: ETakingsScopeType | null;
}): TResolvedTakingsScope | null => {
    if (defaultScope === ETakingsScopeType.REGISTER && registerId) {
        return {
            scopeType: ETakingsScopeType.REGISTER,
            scopeId: registerId,
            scopeKey: getRegisterScopeKey(registerId),
        };
    }

    if (defaultScope === ETakingsScopeType.STAFF && staffId) {
        return {
            scopeType: ETakingsScopeType.STAFF,
            scopeId: staffId,
            scopeKey: getStaffScopeKey(staffId),
        };
    }

    if (restaurantId) {
        return {
            scopeType: ETakingsScopeType.SITE,
            scopeId: restaurantId,
            scopeKey: getSiteScopeKey(restaurantId),
        };
    }

    return null;
};

// Coerces mixed UI values into a safe number for arithmetic and GraphQL payloads.
export const toWholeNumber = (value?: string | number | null) => {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
};

// Converts a currency text input into whole cents, treating blank values as zero.
export const toCents = (value?: string) => {
    if (!value || value.trim() === "") return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? convertDollarsToCentsReturnInt(parsed) : 0;
};

// Identifies movements that should affect physical drawer cash rather than non-cash payment totals.
export const isCashDrawerMovement = (movement: IGET_CASH_MOVEMENT) => {
    // Old CashMovement rows do not have paymentMethod; treat them as cash so existing history remains usable.
    return !movement.paymentMethod || movement.paymentMethod === ECashMovementPaymentMethod.CASH;
};

// Filters order rows down to the active takings scope so site and register cash-up views reconcile correctly.
export const orderMatchesTakingsScope = (
    order: IGET_RESTAURANT_ORDER_FRAGMENT,
    scopeType: ETakingsScopeType,
    scopeId: string
) => {
    switch (scopeType) {
        case ETakingsScopeType.REGISTER:
            return order.settledRegisterId === scopeId || order.registerId === scopeId;
        case ETakingsScopeType.STAFF:
            return order.orderUserId === scopeId;
        case ETakingsScopeType.SITE:
        default:
            return true;
    }
};

// Aggregates order paymentAmounts into the recorded totals shown in the cash-up payment rows.
export const buildRecordedTotals = (orders: IGET_RESTAURANT_ORDER_FRAGMENT[] | null): TPaymentTotals => {
    const totals = createPaymentTotals();

    orders?.forEach((order) => {
        // Recorded takings only include orders that were actually paid and not later cancelled/refunded.
        if (order.status === EOrderStatus.CANCELLED || order.status === EOrderStatus.REFUNDED) return;
        if (!order.paid || !order.paymentAmounts) return;

        totals.cash += order.paymentAmounts.cash || 0;
        totals.eftpos += order.paymentAmounts.eftpos || 0;
        totals.online += order.paymentAmounts.online || 0;
        totals.uberEats += order.paymentAmounts.uberEats || 0;
        totals.menulog += order.paymentAmounts.menulog || 0;
        totals.doordash += order.paymentAmounts.doordash || 0;
        totals.delivereasy += order.paymentAmounts.delivereasy || 0;
    });

    return totals;
};

// Sorts takings sessions so the newest opened session is handled first in active and history views.
export const sortSessions = (sessions: IGET_TAKINGS_SESSION[]) =>
    [...sessions].sort((left, right) => new Date(right.openedAt).getTime() - new Date(left.openedAt).getTime());

// Maps a payment key to the user-facing label shown in the cash-up payment list.
export const getPaymentLabel = (key: TPaymentKey) => {
    switch (key) {
        case "cash":
            return "Cash";
        case "eftpos":
            return "Eftpos";
        case "online":
            return "Online";
        case "uberEats":
            return "Uber Eats";
        case "menulog":
            return "Menulog";
        case "doordash":
            return "DoorDash";
        case "delivereasy":
            return "Delivereasy";
        default:
            return key;
    }
};

// Formats session and movement timestamps into the shared history-table display used in cash screens.
export const formatHistoryDate = (value: string) => {
    const date = new Date(value);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const day = date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });

    return `${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })} ${isToday ? "Today" : day}`;
};

// Converts takings session status values into the exact history labels expected by the UI.
export const getHistoryStatusLabel = (status: ETakingsSessionStatus) => (status === ETakingsSessionStatus.FINALIZED ? "Finalised" : "Not yet finalised");

// Maps the active scope into the main takings heading shown above the payment rows.
export const getTakingsScopeTitle = (scopeType: ETakingsScopeType) => {
    switch (scopeType) {
        case ETakingsScopeType.REGISTER:
            return "Takings by Register";
        case ETakingsScopeType.STAFF:
            return "Takings by Staff";
        case ETakingsScopeType.SITE:
        default:
            return "Takings by Site";
    }
};

// Maps the active scope into the history-detail subtitle for finalized sessions.
export const getTakingsScopeHistoryLabel = (scopeType: ETakingsScopeType) => {
    switch (scopeType) {
        case ETakingsScopeType.REGISTER:
            return "Takings for this Register";
        case ETakingsScopeType.STAFF:
            return "Takings for this Staff Member";
        case ETakingsScopeType.SITE:
        default:
            return "Takings for the Whole Site";
    }
};

// Converts a money-movement enum into the action label used in buttons and history rows.
export const getMovementTypeLabel = (type: ECashMovementType) => {
    switch (type) {
        case ECashMovementType.MONEY_IN:
            return "Money In";
        case ECashMovementType.MONEY_OUT:
            return "Money Out";
        case ECashMovementType.CASH_DROP:
            return "Cash Drop";
        case ECashMovementType.OPENING_FLOAT:
            return "Opening Float";
        case ECashMovementType.TIP_PAYOUT:
            return "Tip Payout";
        case ECashMovementType.FLOAT_ADJUSTMENT:
            return "Float Adjustment";
        default:
            return type;
    }
};

// Resolves the selected payment method key into the GraphQL enum stored on CashMovement rows.
export const getPaymentMethodValue = (method: TMoneyMovementPaymentMethod) =>
    MONEY_MOVEMENT_PAYMENT_METHODS.find((item) => item.key === method)?.value || ECashMovementPaymentMethod.CASH;

// Builds the payment-method label shown in money history, with fallback for legacy reason-prefixed rows.
export const getMovementPaymentLabel = (paymentMethod?: ECashMovementPaymentMethod | null, reason?: string | null) =>
    MONEY_MOVEMENT_PAYMENT_METHODS.find((item) => item.value === paymentMethod)?.label || reason?.match(LEGACY_PAYMENT_REASON_PREFIX)?.[1] || "Cash";

// Removes the old payment-method prefix from legacy reasons so history notes remain readable.
export const getMovementReasonText = (reason?: string | null) => reason?.replace(LEGACY_PAYMENT_REASON_PREFIX, "").trim() || "-";
