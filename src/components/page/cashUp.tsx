import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { FiAlertTriangle, FiArrowLeft, FiCheckCircle, FiClock, FiRefreshCw } from "react-icons/fi";
import { useNavigate } from "react-router";
import { useRegister } from "../../context/register-context";
import { useRestaurant } from "../../context/restaurant-context";
import { useUser } from "../../context/user-context";
import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../../graphql/customFragments";
import {
    EOrderStatus,
    ETakingsScopeType,
    ETakingsSessionStatus,
    GET_ORDERS_BY_RESTAURANT_BY_BETWEEN_PLACEDAT,
    GET_TAKINGS_SESSIONS_BY_SCOPE_KEY_BY_OPENED_AT,
    IGET_TAKINGS_SESSION,
} from "../../graphql/customQueries";
import { CREATE_TAKINGS_SESSION, UPDATE_TAKINGS_SESSION } from "../../graphql/customMutations";
import { Button } from "../../tabin/components/button";
import { Card } from "../../tabin/components/card";
import { Input } from "../../tabin/components/input";
import { ModalV2 } from "../../tabin/components/modalv2";
import { toast } from "../../tabin/components/toast";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { convertCentsToDollars, convertDollarsToCentsReturnInt, getDollarString, toLocalISOString } from "../../util/util";
import { beginOrderPath, dashboardPath } from "../main";

import "./cashUp.scss";

type TCountMode = "counted" | "denominations";
type TCashUpView = "finalize" | "history";
type TPaymentKey = "cash" | "eftpos" | "online" | "uberEats" | "menulog" | "doordash" | "delivereasy";
type TPaymentTotals = Record<TPaymentKey, number>;
type TPaymentInputs = Record<TPaymentKey, string>;
type TDenominationInputs = Record<string, string>;

const BUSINESS_TIME_ZONE = "Pacific/Auckland";
const PAYMENT_KEYS: TPaymentKey[] = ["cash", "eftpos", "online", "uberEats", "menulog", "doordash", "delivereasy"];
const DENOMINATIONS = [10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10];

const createPaymentTotals = (): TPaymentTotals => ({
    cash: 0,
    eftpos: 0,
    online: 0,
    uberEats: 0,
    menulog: 0,
    doordash: 0,
    delivereasy: 0,
});

const createPaymentInputs = (totals?: Partial<TPaymentTotals>): TPaymentInputs => ({
    cash: convertCentsToDollars(totals?.cash || 0),
    eftpos: convertCentsToDollars(totals?.eftpos || 0),
    online: convertCentsToDollars(totals?.online || 0),
    uberEats: convertCentsToDollars(totals?.uberEats || 0),
    menulog: convertCentsToDollars(totals?.menulog || 0),
    doordash: convertCentsToDollars(totals?.doordash || 0),
    delivereasy: convertCentsToDollars(totals?.delivereasy || 0),
});

const createDenominationInputs = (): TDenominationInputs =>
    DENOMINATIONS.reduce((accumulator, denomination) => {
        accumulator[String(denomination)] = "";
        return accumulator;
    }, {} as TDenominationInputs);

const getBusinessDate = () =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone: BUSINESS_TIME_ZONE,
    }).format(new Date());

const getOrderDateRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return {
        start: toLocalISOString(start),
        end: toLocalISOString(end),
    };
};

const getSiteScopeKey = (restaurantId: string) => `${ETakingsScopeType.SITE}#${restaurantId}`;

const toWholeNumber = (value?: string | number | null) => {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
};

const toCents = (value?: string) => {
    if (!value || value.trim() === "") return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? convertDollarsToCentsReturnInt(parsed) : 0;
};

const buildRecordedTotals = (orders: IGET_RESTAURANT_ORDER_FRAGMENT[] | null): TPaymentTotals => {
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

const sortSessions = (sessions: IGET_TAKINGS_SESSION[]) =>
    [...sessions].sort((left, right) => new Date(right.openedAt).getTime() - new Date(left.openedAt).getTime());

const getPaymentLabel = (key: TPaymentKey) => {
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

export default () => {
    const navigate = useNavigate();
    const { restaurant } = useRestaurant();
    const { isPOS } = useRegister();
    const { user } = useUser();

    const [countMode, setCountMode] = useState<TCountMode>("counted");
    const [activeView, setActiveView] = useState<TCashUpView>("finalize");
    const [openingFloatInput, setOpeningFloatInput] = useState("0.00");
    const [declaredClosingFloatInput, setDeclaredClosingFloatInput] = useState("0.00");
    const [countedPaymentInputs, setCountedPaymentInputs] = useState<TPaymentInputs>(createPaymentInputs());
    const [denominationInputs, setDenominationInputs] = useState<TDenominationInputs>(createDenominationInputs());
    const [varianceReason, setVarianceReason] = useState("");
    const [notes, setNotes] = useState("");
    const [acknowledgedWarnings, setAcknowledgedWarnings] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [warningModalDismissed, setWarningModalDismissed] = useState(false);
    const autoCreateKeyRef = useRef<string | null>(null);

    // Cash up is site-scoped in the first release, so the active session is keyed only by restaurant.
    const businessDate = getBusinessDate();
    const orderDateRange = getOrderDateRange();
    const scopeType = ETakingsScopeType.SITE;
    const scopeId = restaurant?.id || "";
    const scopeKey = restaurant ? getSiteScopeKey(restaurant.id) : "";

    const {
        data: takingsData,
        loading: takingsLoading,
        refetch: refetchTakingsSessions,
    } = useQuery(GET_TAKINGS_SESSIONS_BY_SCOPE_KEY_BY_OPENED_AT, {
        variables: {
            scopeKey,
            limit: 100,
        },
        skip: !scopeKey,
        fetchPolicy: "network-only",
    });

    const { data: ordersData, loading: ordersLoading, error: ordersError, refetch: refetchOrders } = useQuery(GET_ORDERS_BY_RESTAURANT_BY_BETWEEN_PLACEDAT, {
        variables: {
            orderRestaurantId: restaurant?.id || "",
            placedAtStartDate: orderDateRange.start,
            placedAtEndDate: orderDateRange.end,
        },
        skip: !restaurant?.id,
        fetchPolicy: "network-only",
    });

    const [createTakingsSession, { loading: creatingSession }] = useMutation(CREATE_TAKINGS_SESSION);
    const [updateTakingsSession, { loading: finalizingSession }] = useMutation(UPDATE_TAKINGS_SESSION);

    // We always work from the latest known session state for this scope.
    const allSessions = useMemo(() => {
        const items = takingsData?.getTakingsSessionsByScopeKeyByOpenedAt?.items || [];
        return sortSessions(items);
    }, [takingsData]);

    // If a session is already open for this business date, reopening the screen should continue that same session.
    const currentSession = useMemo(
        () => allSessions.find((session) => session.status === ETakingsSessionStatus.OPEN && session.businessDate === businessDate) || null,
        [allSessions, businessDate]
    );

    const latestFinalizedSession = useMemo(
        () => allSessions.find((session) => session.status === ETakingsSessionStatus.FINALIZED) || null,
        [allSessions]
    );

    const sessionHistory = useMemo(() => allSessions.slice(0, 8), [allSessions]);
    const todaysOrders = useMemo(() => ordersData?.getOrdersByRestaurantByPlacedAt?.items || null, [ordersData]);

    const recordedTotals = useMemo(() => buildRecordedTotals(todaysOrders), [todaysOrders]);

    const orderWarnings = useMemo(() => {
        const initial = {
            openOrdersCount: 0,
            parkedOrdersCount: 0,
            unpaidOrdersCount: 0,
        };

        todaysOrders?.forEach((order) => {
            if (order.status === EOrderStatus.CANCELLED || order.status === EOrderStatus.REFUNDED) return;

            if (order.status === EOrderStatus.NEW) initial.openOrdersCount += 1;
            if (order.status === EOrderStatus.PARKED) initial.parkedOrdersCount += 1;
            if (!order.paid) initial.unpaidOrdersCount += 1;
        });

        return initial;
    }, [todaysOrders]);

    const suggestedOpeningFloatCents = useMemo(() => {
        if (!restaurant?.takingsCarryForwardFloat) return 0;
        return latestFinalizedSession?.declaredClosingFloatCents || 0;
    }, [latestFinalizedSession, restaurant?.takingsCarryForwardFloat]);

    useEffect(() => {
        if (!currentSession) {
            setOpeningFloatInput(convertCentsToDollars(suggestedOpeningFloatCents));
            setDeclaredClosingFloatInput(convertCentsToDollars(suggestedOpeningFloatCents));
            setCountedPaymentInputs(createPaymentInputs(recordedTotals));
            setDenominationInputs(createDenominationInputs());
            setVarianceReason("");
            setNotes("");
            setAcknowledgedWarnings(false);
            return;
        }

        setOpeningFloatInput(convertCentsToDollars(currentSession.openingFloatCents));
        setDeclaredClosingFloatInput(convertCentsToDollars(currentSession.declaredClosingFloatCents || currentSession.openingFloatCents));
        setCountedPaymentInputs(createPaymentInputs({ ...recordedTotals, cash: currentSession.countedDrawerCashCents }));
        setVarianceReason(currentSession.varianceReason || "");
        setNotes(currentSession.notes || "");
        setAcknowledgedWarnings(false);
    }, [currentSession?.id, suggestedOpeningFloatCents, recordedTotals]);

    const countedCashFromDenominationsCents = DENOMINATIONS.reduce((total, denomination) => {
        return total + denomination * toWholeNumber(denominationInputs[String(denomination)]);
    }, 0);

    const countedTotals = PAYMENT_KEYS.reduce((accumulator, key) => {
        accumulator[key] = key === "cash" && countMode === "denominations" ? countedCashFromDenominationsCents : toCents(countedPaymentInputs[key]);
        return accumulator;
    }, createPaymentTotals());

    // Expected drawer cash is still a first-pass calculation in Electron until ledger events are added in Tabin Web.
    const expectedDrawerCashCents =
        (currentSession?.openingFloatCents ?? toCents(openingFloatInput)) +
        recordedTotals.cash +
        (currentSession?.moneyInCents || 0) -
        (currentSession?.moneyOutCents || 0) -
        (currentSession?.cashDropsCents || 0) -
        (currentSession?.tipPayoutsCents || 0);

    const countedDrawerCashCents = countedTotals.cash;
    const cashVarianceCents = countedDrawerCashCents - expectedDrawerCashCents;
    const unresolvedOrdersCount = orderWarnings.openOrdersCount + orderWarnings.parkedOrdersCount + orderWarnings.unpaidOrdersCount;
    const varianceThresholdCents = restaurant?.takingsVarianceReasonThresholdCents ?? 5000;
    const requiresVarianceReason = Math.abs(cashVarianceCents) > varianceThresholdCents;
    const blocksFinalize = !!restaurant?.takingsBlockIfOpenOrders && unresolvedOrdersCount > 0;

    const handleRefresh = useCallback(async () => {
        await Promise.allSettled([refetchTakingsSessions(), refetchOrders()]);
    }, [refetchOrders, refetchTakingsSessions]);

    const handleCreateCurrentSession = useCallback(async () => {
        if (!restaurant || !user) return;

        try {
            const sameDaySessions = allSessions.filter((session) => session.businessDate === businessDate);
            const sessionNumber = sameDaySessions.reduce((max, session) => Math.max(max, session.sessionNumber), 0) + 1;
            const openingFloatCents = toCents(openingFloatInput);

            await createTakingsSession({
                variables: {
                    restaurantId: restaurant.id,
                    businessDate,
                    scopeType,
                    scopeId,
                    scopeKey,
                    sessionNumber,
                    status: ETakingsSessionStatus.OPEN,
                    openedAt: new Date().toISOString(),
                    openedBy: user.id,
                    openingFloatCents,
                    expectedDrawerCashCents: openingFloatCents,
                    countedDrawerCashCents: 0,
                    varianceCents: 0,
                    openOrdersCount: orderWarnings.openOrdersCount,
                    unpaidOrdersCount: orderWarnings.unpaidOrdersCount,
                    parkedOrdersCount: orderWarnings.parkedOrdersCount,
                    owner: user.id,
                },
            });

            await refetchTakingsSessions();
        } catch (error) {
            console.error(error);
            toast.error("Unable to start cash up session.");
        }
    }, [allSessions, businessDate, createTakingsSession, orderWarnings.openOrdersCount, orderWarnings.parkedOrdersCount, orderWarnings.unpaidOrdersCount, refetchTakingsSessions, restaurant, scopeId, scopeKey, scopeType, user]);

    useEffect(() => {
        // Kounta-style UX: entering cash up should feel continuous, so the page auto-opens the current
        // session instead of forcing staff to press a separate "Start Session" button.
        if (!restaurant?.takingsEnable || !restaurant?.id || !user || !isPOS) return;
        if (takingsLoading || creatingSession) return;
        if (currentSession) {
            autoCreateKeyRef.current = `${scopeKey}:${businessDate}`;
            return;
        }

        const autoCreateKey = `${scopeKey}:${businessDate}`;
        if (autoCreateKeyRef.current === autoCreateKey) return;

        autoCreateKeyRef.current = autoCreateKey;
        handleCreateCurrentSession();
    }, [businessDate, creatingSession, currentSession, handleCreateCurrentSession, isPOS, restaurant?.id, restaurant?.takingsEnable, scopeKey, takingsLoading, user]);

    useEffect(() => {
        setWarningModalDismissed(false);
        if (unresolvedOrdersCount === 0) setShowWarningModal(false);
    }, [currentSession?.id, unresolvedOrdersCount]);

    useEffect(() => {
        if (activeView !== "finalize") return;
        if (unresolvedOrdersCount === 0 || warningModalDismissed) return;

        // Kounta interrupts the flow with a warning popup instead of forcing staff through a
        // dedicated step screen, so unresolved orders are surfaced as a modal here.
        setShowWarningModal(true);
    }, [activeView, unresolvedOrdersCount, warningModalDismissed]);

    const handleFinalizeSession = async () => {
        if (!currentSession || !user) return;

        if (blocksFinalize) {
            toast.error("Resolve open, parked, or unpaid orders before finalising.");
            return;
        }

        if (unresolvedOrdersCount > 0 && !acknowledgedWarnings) {
            setShowWarningModal(true);
            return;
        }

        if (requiresVarianceReason && !varianceReason.trim()) {
            toast.error("Variance reason is required.");
            return;
        }

        try {
            await updateTakingsSession({
                variables: {
                    id: currentSession.id,
                    status: ETakingsSessionStatus.FINALIZED,
                    finalizedAt: new Date().toISOString(),
                    finalizedBy: user.id,
                    declaredClosingFloatCents: toCents(declaredClosingFloatInput),
                    cashSalesCents: recordedTotals.cash,
                    cashRefundsCents: 0,
                    moneyInCents: currentSession.moneyInCents || 0,
                    moneyOutCents: currentSession.moneyOutCents || 0,
                    cashDropsCents: currentSession.cashDropsCents || 0,
                    tipPayoutsCents: currentSession.tipPayoutsCents || 0,
                    expectedDrawerCashCents,
                    countedDrawerCashCents,
                    varianceCents: cashVarianceCents,
                    varianceReason: varianceReason.trim() || null,
                    openOrdersCount: orderWarnings.openOrdersCount,
                    unpaidOrdersCount: orderWarnings.unpaidOrdersCount,
                    parkedOrdersCount: orderWarnings.parkedOrdersCount,
                    notes: notes.trim() || null,
                },
            });

            toast.success("Takings finalised.");
            // Once the current session is finalized, allow the next page visit / post-finalize refresh to
            // implicitly start the next session for the same scope.
            autoCreateKeyRef.current = null;
            await refetchTakingsSessions();
        } catch (error) {
            console.error(error);
            toast.error("Unable to finalise takings.");
        }
    };

    const handleCloseWarningModal = () => {
        setShowWarningModal(false);
        setWarningModalDismissed(true);
    };

    const handleContinueFromWarningModal = () => {
        setAcknowledgedWarnings(true);
        setShowWarningModal(false);
        setWarningModalDismissed(true);
    };

    const renderPaymentRow = (key: TPaymentKey, label: string) => {
        const counted = countedTotals[key];
        const recorded = recordedTotals[key];
        const difference = counted - recorded;

        return (
            <div className="cashup-payment-row" key={key}>
                <div className="cashup-payment-row__label">{label}</div>
                <div className="cashup-payment-row__recorded">{getDollarString(recorded)}</div>
                <div className="cashup-payment-row__input">
                    {key === "cash" && countMode === "denominations" ? (
                        <div className="cashup-payment-row__pill">{getDollarString(counted)}</div>
                    ) : (
                        <Input
                            type="number"
                            value={countedPaymentInputs[key]}
                            onChange={(event) =>
                                setCountedPaymentInputs((previous) => ({
                                    ...previous,
                                    [key]: event.target.value,
                                }))
                            }
                        />
                    )}
                </div>
                <div className={`cashup-payment-row__difference ${difference === 0 ? "neutral" : difference > 0 ? "positive" : "negative"}`}>
                    {difference > 0 ? "+" : ""}
                    {getDollarString(difference)}
                </div>
            </div>
        );
    };

    if (!restaurant) return <></>;

    return (
        <PageWrapper>
            <div className="cashup-page">
                <ModalV2 padding="0" width="560px" isOpen={showWarningModal} disableClose={false} onRequestClose={handleCloseWarningModal}>
                    <div className="cashup-warning-modal">
                        <div className="cashup-warning-modal__header">
                            <FiAlertTriangle />
                            <div>
                                <h3>Open orders need attention</h3>
                                <p>Resolve open, parked, or unpaid orders before finalising takings. If you continue, those orders may sit outside the final reconciliation.</p>
                            </div>
                        </div>

                        <div className="cashup-warning-grid">
                            <div className={`cashup-warning ${orderWarnings.openOrdersCount > 0 ? "warning" : ""}`}>
                                <FiClock />
                                <div>
                                    <strong>{orderWarnings.openOrdersCount}</strong>
                                    <span>Open Orders</span>
                                </div>
                            </div>
                            <div className={`cashup-warning ${orderWarnings.parkedOrdersCount > 0 ? "warning" : ""}`}>
                                <FiAlertTriangle />
                                <div>
                                    <strong>{orderWarnings.parkedOrdersCount}</strong>
                                    <span>Parked Orders</span>
                                </div>
                            </div>
                            <div className={`cashup-warning ${orderWarnings.unpaidOrdersCount > 0 ? "warning" : ""}`}>
                                <FiAlertTriangle />
                                <div>
                                    <strong>{orderWarnings.unpaidOrdersCount}</strong>
                                    <span>Unpaid Orders</span>
                                </div>
                            </div>
                        </div>

                        {blocksFinalize ? (
                            <div className="cashup-helper cashup-helper--error">This restaurant blocks takings finalisation until those orders are resolved.</div>
                        ) : (
                            <div className="cashup-helper">You can continue to count takings, but finalising means you accept these unresolved order warnings.</div>
                        )}

                        <div className="cashup-warning-modal__footer">
                            <Button className="cashup-step-footer__ghost" onClick={() => navigate(dashboardPath)}>
                                Go To Orders
                            </Button>
                            {!blocksFinalize && <Button onClick={handleContinueFromWarningModal}>Continue To Cash Up</Button>}
                        </div>
                    </div>
                </ModalV2>

                <div className="cashup-page__header">
                    <div>
                        <button className="cashup-page__back" onClick={() => navigate(beginOrderPath)}>
                            <FiArrowLeft />
                            <span>Back To Sale</span>
                        </button>
                        <div className="cashup-page__eyebrow">Site Cash Up</div>
                        <h1>Finalize Takings</h1>
                        <p>
                            Cash up is currently site-based for <strong>{restaurant.name}</strong> on <strong>{businessDate}</strong>.
                        </p>
                    </div>
                    <Button className="cashup-page__refresh" onClick={handleRefresh}>
                        <FiRefreshCw />
                        <span>Refresh</span>
                    </Button>
                </div>

                {!restaurant.takingsEnable && (
                    <Card className="cashup-banner">
                        <div className="cashup-banner__content">
                            <FiAlertTriangle />
                            <div>Cash up is disabled for this restaurant in Tabin Web.</div>
                        </div>
                    </Card>
                )}

                {isPOS === false && (
                    <Card className="cashup-banner">
                        <div className="cashup-banner__content">
                            <FiAlertTriangle />
                            <div>This screen is designed for POS registers.</div>
                        </div>
                    </Card>
                )}

                <div className="cashup-view-tabs">
                    <button className={activeView === "finalize" ? "active" : ""} onClick={() => setActiveView("finalize")}>
                        Finalize Takings
                    </button>
                    <button className={activeView === "history" ? "active" : ""} onClick={() => setActiveView("history")}>
                        Cash Up History
                    </button>
                </div>

                {activeView === "finalize" && (
                    <div className="cashup-layout cashup-layout--simple">
                        <div className="cashup-layout__main">
                            <div className="cashup-section-stack">
                                <Card title="Cash Takings" className="cashup-card">
                                    <div className="cashup-inline-fields">
                                        <Input
                                            label="Opening Float"
                                            type="number"
                                            value={openingFloatInput}
                                            onChange={(event) => setOpeningFloatInput(event.target.value)}
                                            disabled={!currentSession}
                                        />
                                        <Input
                                            label="Closing Float To Keep"
                                            type="number"
                                            value={declaredClosingFloatInput}
                                            onChange={(event) => setDeclaredClosingFloatInput(event.target.value)}
                                            disabled={!currentSession}
                                        />
                                    </div>

                                    {restaurant.takingsCarryForwardFloat && latestFinalizedSession && (
                                        <div className="cashup-helper">Carry-forward suggestion: {getDollarString(suggestedOpeningFloatCents)}</div>
                                    )}
                                    {!currentSession && <div className="cashup-helper">The current site session is created automatically when cash up opens.</div>}

                                    <div className="cashup-mode-toggle">
                                        <button className={countMode === "counted" ? "active" : ""} onClick={() => setCountMode("counted")}>
                                            Counted
                                        </button>
                                        <button className={countMode === "denominations" ? "active" : ""} onClick={() => setCountMode("denominations")}>
                                            Denominations
                                        </button>
                                    </div>

                                    <div className="cashup-cash-focus">
                                        <div className="cashup-cash-focus__metric">
                                            <span>Recorded Cash</span>
                                            <strong>{getDollarString(recordedTotals.cash)}</strong>
                                        </div>
                                        <div className="cashup-cash-focus__metric">
                                            <span>Counted Cash</span>
                                            <strong>{getDollarString(countedDrawerCashCents)}</strong>
                                        </div>
                                        <div className={`cashup-cash-focus__metric ${cashVarianceCents === 0 ? "" : cashVarianceCents > 0 ? "positive" : "negative"}`}>
                                            <span>Difference</span>
                                            <strong>{getDollarString(cashVarianceCents)}</strong>
                                        </div>
                                    </div>

                                    {countMode === "counted" && (
                                        <div className="cashup-counted-entry">
                                            <Input
                                                label="Enter Counted Cash"
                                                type="number"
                                                value={countedPaymentInputs.cash}
                                                onChange={(event) =>
                                                    setCountedPaymentInputs((previous) => ({
                                                        ...previous,
                                                        cash: event.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                    )}

                                    {countMode === "denominations" && (
                                        <div className="cashup-denominations">
                                            {DENOMINATIONS.map((denomination) => (
                                                <div className="cashup-denomination" key={denomination}>
                                                    <div className="cashup-denomination__label">{getDollarString(denomination)}</div>
                                                    <Input
                                                        type="number"
                                                        value={denominationInputs[String(denomination)]}
                                                        onChange={(event) =>
                                                            setDenominationInputs((previous) => ({
                                                                ...previous,
                                                                [String(denomination)]: event.target.value,
                                                            }))
                                                        }
                                                    />
                                                    <div className="cashup-denomination__total">
                                                        {getDollarString(denomination * toWholeNumber(denominationInputs[String(denomination)]))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card>

                                <Card title="Other Payments" className="cashup-card">
                                    <div className="cashup-kounta-copy">
                                        Enter the counted totals for non-cash payments. Integrated terminals can be compared against the recorded values here.
                                    </div>
                                    <div className="cashup-payment-header">
                                        <span>Payment Type</span>
                                        <span>Recorded</span>
                                        <span>Counted</span>
                                        <span>Difference</span>
                                    </div>
                                    {renderPaymentRow("eftpos", "Eftpos")}
                                    {renderPaymentRow("online", "Online")}
                                    {renderPaymentRow("uberEats", "Uber Eats")}
                                    {renderPaymentRow("menulog", "Menulog")}
                                    {renderPaymentRow("doordash", "DoorDash")}
                                    {renderPaymentRow("delivereasy", "Delivereasy")}
                                </Card>

                                <Card title="Finalise Takings" className="cashup-card">
                                    {unresolvedOrdersCount > 0 && (
                                        <div className={`cashup-warning-inline ${blocksFinalize ? "blocked" : ""}`}>
                                            <div>
                                                <strong>{unresolvedOrdersCount} unresolved orders</strong>
                                                <span>
                                                    {blocksFinalize
                                                        ? "Finalising is blocked until open, parked, or unpaid orders are resolved."
                                                        : "You have continued with unresolved order warnings for this takings run."}
                                                </span>
                                            </div>
                                            <Button className="cashup-step-footer__ghost" onClick={() => navigate(dashboardPath)}>
                                                Go To Orders
                                            </Button>
                                        </div>
                                    )}

                                    <div className="cashup-review-table">
                                        <div className="cashup-review-table__header">
                                            <span>Payment</span>
                                            <span>Counted</span>
                                            <span>Recorded</span>
                                            <span>Difference</span>
                                        </div>
                                        {PAYMENT_KEYS.map((key) => {
                                            const counted = countedTotals[key];
                                            const recorded = recordedTotals[key];
                                            const difference = counted - recorded;

                                            return (
                                                <div className="cashup-review-table__row" key={key}>
                                                    <span>{getPaymentLabel(key)}</span>
                                                    <span>{getDollarString(counted)}</span>
                                                    <span>{getDollarString(recorded)}</span>
                                                    <span className={difference === 0 ? "" : difference > 0 ? "positive" : "negative"}>{getDollarString(difference)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="cashup-summary cashup-summary--review">
                                        <div className="cashup-summary__row">
                                            <span>Expected Drawer Cash</span>
                                            <strong>{getDollarString(expectedDrawerCashCents)}</strong>
                                        </div>
                                        <div className="cashup-summary__row">
                                            <span>Counted Drawer Cash</span>
                                            <strong>{getDollarString(countedDrawerCashCents)}</strong>
                                        </div>
                                        <div className={`cashup-summary__row ${cashVarianceCents === 0 ? "" : cashVarianceCents > 0 ? "positive" : "negative"}`}>
                                            <span>Cash Variance</span>
                                            <strong>{getDollarString(cashVarianceCents)}</strong>
                                        </div>
                                    </div>

                                    <div className="cashup-fields">
                                        <Input
                                            label={`Variance Reason${requiresVarianceReason ? " (Required)" : ""}`}
                                            value={varianceReason}
                                            onChange={(event) => setVarianceReason(event.target.value)}
                                            disabled={!currentSession}
                                        />
                                        <div>
                                            <div className="text-bold mb-2">Session Notes</div>
                                            <textarea
                                                className="cashup-textarea"
                                                value={notes}
                                                onChange={(event) => setNotes(event.target.value)}
                                                disabled={!currentSession}
                                            />
                                        </div>
                                    </div>

                                    <div className="cashup-finalize-actions">
                                        <Button
                                            onClick={handleFinalizeSession}
                                            loading={finalizingSession}
                                            disabled={!currentSession || blocksFinalize || !restaurant.takingsEnable || !isPOS}
                                        >
                                            <FiCheckCircle />
                                            <span>Finalize Takings</span>
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}

                {activeView === "history" && (
                    <Card title="Cash Up History" className="cashup-card cashup-history-card">
                        <div className="cashup-history">
                            {sessionHistory.length === 0 && <div className="cashup-helper">No sessions have been created for this scope yet.</div>}
                            {sessionHistory.map((session) => (
                                <div className="cashup-history__item" key={session.id}>
                                    <div>
                                        <strong>
                                            #{session.sessionNumber} {session.status}
                                        </strong>
                                        <span>{new Date(session.openedAt).toLocaleString()}</span>
                                        <span>Business Date: {session.businessDate}</span>
                                    </div>
                                    <div className="cashup-history__totals">
                                        <div>{getDollarString(session.countedDrawerCashCents || 0)}</div>
                                        <span>Counted Cash</span>
                                    </div>
                                    <div className="cashup-history__totals">
                                        <div>{getDollarString(session.varianceCents || 0)}</div>
                                        <span>Variance</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {(takingsLoading || ordersLoading) && <div className="cashup-page__loading">Loading cash up data...</div>}
                {ordersError && <div className="cashup-page__loading">Unable to load today&apos;s orders for cash up.</div>}
            </div>
        </PageWrapper>
    );
};
