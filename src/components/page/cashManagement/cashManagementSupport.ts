import { format, subDays } from "date-fns";
import {
    EMoneyMovementPaymentMethod,
    EMoneyMovementType,
    ECashupScopeType,
    ECashupSessionStatus,
    IGET_CASHUP_ORDER,
    IGET_CASHUP_SESSION,
} from "../../../graphql/customQueries";
import { convertDollarsToCentsReturnInt } from "../../../util/util";

export type TCountMode = "counted" | "denominations";
export type TCashUpView = "list" | "detail" | "entry" | "movement-detail" | "movement-entry";
export type TPaymentKey = "cash" | "eftpos" | "online" | "uberEats" | "menulog" | "doordash" | "delivereasy";
export type TPaymentTotals = Record<TPaymentKey, number>;
export type TPaymentInputs = Record<TPaymentKey, string>;
export type TDenominationInputs = Record<string, string>;

export type TMoneyMovementDirection = EMoneyMovementType.MONEY_IN | EMoneyMovementType.MONEY_OUT;

export type TResolvedCashupScope = {
    scopeType: ECashupScopeType;
    scopeId: string;
    scopeKey: string;
};

export type TPaymentSummarySnapshot = Record<
    TPaymentKey,
    { recordedCents: number; countedCents: number; differenceCents: number; moneyIn?: number; moneyOut?: number }
>;

export const PAYMENT_KEYS: TPaymentKey[] = ["cash", "eftpos", "online", "uberEats", "menulog", "doordash", "delivereasy"];
export const DENOMINATIONS = [10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10];
export const createPaymentTotals = (): TPaymentTotals => ({
    cash: 0,
    eftpos: 0,
    online: 0,
    uberEats: 0,
    menulog: 0,
    doordash: 0,
    delivereasy: 0,
});

// Counted amounts start blank so staff type what they counted instead of editing a prefilled 0.00.
export const createPaymentInputs = (): TPaymentInputs => ({
    cash: "",
    eftpos: "",
    online: "",
    uberEats: "",
    menulog: "",
    doordash: "",
    delivereasy: "",
});

export const createDenominationInputs = (): TDenominationInputs =>
    DENOMINATIONS.reduce((accumulator, denomination) => {
        accumulator[String(denomination)] = "";
        return accumulator;
    }, {} as TDenominationInputs);

export const getBusinessDate = () => format(new Date(), "yyyy-MM-dd");

// Local ISO window covering one business date, matching the offset-less format written by toLocalISOString.
export const getBusinessDayRange = (businessDate: string) => ({
    start: `${businessDate}T00:00:00.00`,
    end: `${businessDate}T23:59:59.99`,
});

// Orders are fetched from one day earlier so orders placed yesterday but settled/refunded today
// (e.g. parked overnight) still reach the cash up window filters.
export const getOrderFetchRange = (businessDate: string) => {
    const previousDay = format(subDays(new Date(`${businessDate}T00:00:00`), 1), "yyyy-MM-dd");
    return { start: `${previousDay}T00:00:00.00`, end: `${businessDate}T23:59:59.99` };
};

// Deterministic id so concurrent creates for the same scope/date/number collide instead of duplicating.
export const buildCashupSessionId = (scopeKey: string, businessDate: string, sessionSequence: number) => `${scopeKey}#${businessDate}#${sessionSequence}`;

export const resolveCashupScope = ({
    restaurantId,
    registerId,
    staffId,
    defaultScope,
}: {
    restaurantId?: string | null;
    registerId?: string | null;
    staffId?: string | null;
    defaultScope?: ECashupScopeType | null;
}): TResolvedCashupScope | null => {
    if (defaultScope === ECashupScopeType.REGISTER && registerId) {
        return { scopeType: ECashupScopeType.REGISTER, scopeId: registerId, scopeKey: `${ECashupScopeType.REGISTER}#${registerId}` };
    }

    if (defaultScope === ECashupScopeType.STAFF && staffId) {
        return { scopeType: ECashupScopeType.STAFF, scopeId: staffId, scopeKey: `${ECashupScopeType.STAFF}#${staffId}` };
    }

    if (restaurantId) {
        return { scopeType: ECashupScopeType.SITE, scopeId: restaurantId, scopeKey: `${ECashupScopeType.SITE}#${restaurantId}` };
    }

    return null;
};

export const toWholeNumber = (value?: string | number | null) => {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const toCents = (value?: string) => {
    if (!value || value.trim() === "") return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? convertDollarsToCentsReturnInt(parsed) : 0;
};

// Money movements are cash-only for now (ONLINE/EFTPOS may be re-added later), so they always map to the cash column.
export const getMoneyMovementPaymentKey = (_paymentMethod?: EMoneyMovementPaymentMethod | null): TPaymentKey => "cash";

export const orderMatchesCashupScope = (order: IGET_CASHUP_ORDER, scopeType: ECashupScopeType, scopeId: string) => {
    switch (scopeType) {
        case ECashupScopeType.REGISTER:
            return order.settledRegisterId === scopeId || order.registerId === scopeId;
        case ECashupScopeType.STAFF:
            return order.orderUserId === scopeId;
        default:
            return true;
    }
};

const addPaymentAmounts = (totals: TPaymentTotals, amounts: IGET_CASHUP_ORDER["paymentAmounts"], multiplier = 1) => {
    if (!amounts) return;

    PAYMENT_KEYS.forEach((key) => {
        totals[key] += (amounts[key] || 0) * multiplier;
    });
};

export const isTimestampWithinSessionWindow = (value: string | null | undefined, sessionOpenedAt: string | null | undefined) => {
    if (!value || !sessionOpenedAt) return false;
    return value >= sessionOpenedAt;
};

export const getOrderSettledTimestamp = (order: IGET_CASHUP_ORDER) => (order.paid ? order.settledAt || order.placedAt : null);

// Settled payments add to recorded totals within the session window; refunds subtract.
export const buildRecordedTotals = (orders: IGET_CASHUP_ORDER[] | null, sessionOpenedAt: string | null | undefined): TPaymentTotals => {
    const totals = createPaymentTotals();

    orders?.forEach((order) => {
        if (order.paymentAmounts && isTimestampWithinSessionWindow(getOrderSettledTimestamp(order), sessionOpenedAt)) {
            addPaymentAmounts(totals, order.paymentAmounts, 1);
        }
        if (isTimestampWithinSessionWindow(order.refundedAt, sessionOpenedAt)) {
            addPaymentAmounts(totals, order.refundPaymentAmounts || order.paymentAmounts, -1);
        }
    });

    return totals;
};

export const orderHasCashupActivityInSession = (order: IGET_CASHUP_ORDER, sessionOpenedAt: string | null | undefined) =>
    isTimestampWithinSessionWindow(getOrderSettledTimestamp(order), sessionOpenedAt) ||
    isTimestampWithinSessionWindow(order.refundedAt, sessionOpenedAt) ||
    isTimestampWithinSessionWindow(order.parkedAt, sessionOpenedAt) ||
    isTimestampWithinSessionWindow(order.placedAt, sessionOpenedAt);

export const getSessionDisplayTimestamp = (session: IGET_CASHUP_SESSION) =>
    (session.status === ECashupSessionStatus.FINALISED && session.finalisedAt) || session.openedAt;

export const getSessionVarianceCents = (session: IGET_CASHUP_SESSION) => (session.countedTotal || 0) - (session.recordedTotal || 0);

export const sortSessions = (sessions: IGET_CASHUP_SESSION[]) =>
    [...sessions].sort((left, right) => (getSessionDisplayTimestamp(right) > getSessionDisplayTimestamp(left) ? 1 : -1));

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

export const formatHistoryDate = (value: string) => {
    const date = new Date(value);
    const isToday = date.toDateString() === new Date().toDateString();

    return `${format(date, "HH:mm")} ${isToday ? "Today" : format(date, "dd/MM/yy")}`;
};

// Matches the date style used across the project (e.g. the orders page "placed at"), e.g. "19 Jul 3:45 pm".
export const formatCashupHistoryDate = (value?: string | null) => (value ? format(new Date(value), "dd MMM h:mm aa") : "-");

export const formatCashupDateTime = (value?: string | null) => (value ? format(new Date(value), "dd MMM yyyy, HH:mm") : "-");

export const formatCashupBusinessDate = (value?: string | null) => (value ? format(new Date(`${value}T00:00:00`), "dd MMM yyyy") : "-");

export const getHistoryStatusLabel = (status: ECashupSessionStatus) => (status === ECashupSessionStatus.FINALISED ? "Finalised" : "Not yet finalised");

export const getCashupScopeHistoryLabel = (scopeType: ECashupScopeType, scopeName: string) => {
    switch (scopeType) {
        case ECashupScopeType.REGISTER:
            return `Register: ${scopeName}`;
        case ECashupScopeType.STAFF:
            return `Staff: ${scopeName}`;
        default:
            return `Site: ${scopeName}`;
    }
};

export const getCashupScopeId = (scopeKey: string) => {
    const separatorIndex = scopeKey.indexOf("#");
    return separatorIndex === -1 ? "" : scopeKey.slice(separatorIndex + 1);
};

export const getCashupScopeTitle = (scopeType: ECashupScopeType, scopeName: string) => `Cash Up — ${getCashupScopeHistoryLabel(scopeType, scopeName)}`;

export const getMoneyMovementScopeTitle = (scopeType: ECashupScopeType, scopeName: string) =>
    `Money Movement — ${getCashupScopeHistoryLabel(scopeType, scopeName)}`;

export const getMovementTypeLabel = (type: EMoneyMovementType) => (type === EMoneyMovementType.MONEY_IN ? "Money In" : "Money Out");

export const getMovementPaymentLabel = (_paymentMethod?: EMoneyMovementPaymentMethod | null) => "Cash";

export const buildCashupDraftStorageKey = (sessionId: string) => `cashupDraft:${sessionId}`;
