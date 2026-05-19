import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { FiAlertTriangle, FiArrowLeft, FiCheckCircle, FiChevronRight, FiEdit2, FiRefreshCw } from "react-icons/fi";
import { useNavigate } from "react-router";
import { useRegister } from "../../../context/register-context";
import { usePosUser } from "../../../context/pos-user-context";
import { useRestaurant } from "../../../context/restaurant-context";
import { useUser } from "../../../context/user-context";
import {
    ECashMovementType,
    EOrderStatus,
    ETakingsScopeType,
    ETakingsSessionStatus,
    GET_CASH_MOVEMENTS_BY_RESTAURANT_BY_OCCURRED_AT,
    GET_ORDERS_BY_RESTAURANT_BY_BETWEEN_PLACEDAT,
    GET_TAKINGS_SESSION,
    GET_TAKINGS_SESSIONS_BY_SCOPE_KEY_BY_OPENED_AT,
    IGET_CASH_MOVEMENT,
    IGET_TAKINGS_SESSION,
} from "../../../graphql/customQueries";
import { CREATE_TAKINGS_SESSION, UPDATE_TAKINGS_SESSION } from "../../../graphql/customMutations";
import { Button } from "../../../tabin/components/button";
import { Card } from "../../../tabin/components/card";
import { Input } from "../../../tabin/components/input";
import { ModalV2 } from "../../../tabin/components/modalv2";
import { toast } from "../../../tabin/components/toast";
import { PageWrapper } from "../../../tabin/components/pageWrapper";
import { convertCentsToDollars, getDollarString, toLocalISOString } from "../../../util/util";
import { beginOrderPath, ordersPath } from "../../main";
import {
    DENOMINATIONS,
    PAYMENT_KEYS,
    TCashEntryStep,
    TCashUpView,
    TCountMode,
    TDenominationInputs,
    TPaymentInputs,
    TPaymentKey,
    buildRecordedTotals,
    createDenominationInputs,
    createPaymentInputs,
    createPaymentTotals,
    formatHistoryDate,
    getBusinessDate,
    getCashMovementDateRange,
    getCashMovementPaymentKey,
    getHistoryStatusLabel,
    getOrderDateRange,
    orderHasTakingsActivityInSession,
    getPaymentLabel,
    getTakingsSessionDisplayTimestamp,
    getTakingsScopeHistoryLabel,
    getTakingsScopeTitle,
    isReusableOpenTakingsSession,
    isTimestampWithinSessionWindow,
    orderMatchesTakingsScope,
    resolveTakingsScope,
    sortSessions,
    toCents,
    toWholeNumber,
    TPaymentSummarySnapshot,
} from "./cashManagementSupport";

import "./cashUp.scss";

export default () => {
    // Cash-up page: reconciles payment totals, opening float, and money movements
    // against the active takings session. It supports session creation, draft saving,
    // finalisation, and history exploration for the current scope.
    const navigate = useNavigate();
    const { restaurant } = useRestaurant();
    const { register, isPOS } = useRegister();
    const { user } = useUser();
    const { selectedPosUser } = usePosUser();
    const effectiveCashUserId = selectedPosUser?.userId || user?.id;
    const effectiveCashUserName = selectedPosUser
        ? `${selectedPosUser.firstName} ${selectedPosUser.lastName}`.trim()
        : user
          ? `${user.firstName} ${user.lastName}`.trim()
          : "";

    const [countMode, setCountMode] = useState<TCountMode>("counted");
    const [cashEntryStep, setCashEntryStep] = useState<TCashEntryStep>("choice");
    const [activeView, setActiveView] = useState<TCashUpView>("finalize");
    const [selectedHistorySessionId, setSelectedHistorySessionId] = useState<string | null>(null);
    const [entryPaymentKey, setEntryPaymentKey] = useState<TPaymentKey | null>(null);
    const [openingFloatInput, setOpeningFloatInput] = useState("0.00");
    const [countedPaymentInputs, setCountedPaymentInputs] = useState<TPaymentInputs>(createPaymentInputs());
    const [denominationInputs, setDenominationInputs] = useState<TDenominationInputs>(createDenominationInputs());
    const [draftDenominationInputs, setDraftDenominationInputs] = useState<TDenominationInputs>(createDenominationInputs());
    const [varianceReason, setVarianceReason] = useState("");
    const [notes, setNotes] = useState("");
    const [acknowledgedWarnings, setAcknowledgedWarnings] = useState(false);
    const [reviewedOpeningFloatSessionIds, setReviewedOpeningFloatSessionIds] = useState<string[]>([]);
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);

    const autoCreateKeyRef = useRef<string | null>(null);
    const suppressAutoCreateRef = useRef(false);
    const hydratedSessionIdRef = useRef<string | null>(null);
    const draftSyncSignatureRef = useRef<string | null>(null);
    const lastActivityTouchRef = useRef<number>(0);

    // The current business date, as used by cash-up queries and session lifetime.
    const businessDate = getBusinessDate();
    const resolvedScope = useMemo(
        () =>
            resolveTakingsScope({
                restaurantId: restaurant?.id,
                registerId: register?.id,
                staffId: effectiveCashUserId,
                defaultScope: restaurant?.takingsDefaultScope,
            }),
        [effectiveCashUserId, register?.id, restaurant?.id],
    );

    const scopeType = resolvedScope?.scopeType || ETakingsScopeType.SITE;
    const scopeId = resolvedScope?.scopeId || "";
    const scopeKey = resolvedScope?.scopeKey || "";

    useEffect(() => {
        setSelectedHistorySessionId(null);
        hydratedSessionIdRef.current = null;
        draftSyncSignatureRef.current = null;
    }, [scopeKey]);

    // Load takings sessions for the selected scope so the page can identify the
    // current open session and build the history list.
    const {
        data: takingsData,
        loading: takingsLoading,
        error: takingsError,
        refetch: refetchTakingsSessions,
    } = useQuery(GET_TAKINGS_SESSIONS_BY_SCOPE_KEY_BY_OPENED_AT, {
        variables: {
            scopeKey,
            limit: 100,
        },
        skip: !scopeKey,
        fetchPolicy: "network-only",
    });

    const [createTakingsSession, { loading: creatingSession }] = useMutation(CREATE_TAKINGS_SESSION);
    const [updateTakingsSession, { loading: finalizingSession }] = useMutation(UPDATE_TAKINGS_SESSION);
    const [rollForwardTakingsSession, { loading: rollingSessionForward }] = useMutation(UPDATE_TAKINGS_SESSION);
    const [updateDraftTakingsSession, { loading: savingOpeningFloat }] = useMutation(UPDATE_TAKINGS_SESSION);
    const [syncDraftTakingsSession] = useMutation(UPDATE_TAKINGS_SESSION);

    // Keeps only sessions for the current scope.
    const allSessions = useMemo(() => {
        const items = takingsData?.getTakingsSessionsByScopeKeyByOpenedAt?.items || [];
        return sortSessions(items.filter((session) => session.scopeKey === scopeKey));
    }, [scopeKey, takingsData]);

    // Uses the latest open session for this scope.
    const currentSession = useMemo(() => allSessions.find((session) => session.status === ETakingsSessionStatus.OPEN) || null, [allSessions]);

    const activeBusinessDate = currentSession?.businessDate || businessDate;
    const hasPreviousBusinessDateOpenSession = !!currentSession && currentSession.businessDate !== businessDate;
    const orderDateRange = useMemo(() => getOrderDateRange(activeBusinessDate), [activeBusinessDate]);
    const cashMovementDateRange = useMemo(() => getCashMovementDateRange(activeBusinessDate), [activeBusinessDate]);

    const {
        data: ordersData,
        loading: ordersLoading,
        error: ordersError,
        refetch: refetchOrders,
    } = useQuery(GET_ORDERS_BY_RESTAURANT_BY_BETWEEN_PLACEDAT, {
        variables: {
            orderRestaurantId: restaurant?.id || "",
            placedAtStartDate: orderDateRange.start,
            placedAtEndDate: orderDateRange.end,
        },
        skip: !restaurant?.id,
        fetchPolicy: "network-only",
    });

    const {
        data: cashMovementsData,
        loading: cashMovementsLoading,
        refetch: refetchCashMovements,
    } = useQuery(GET_CASH_MOVEMENTS_BY_RESTAURANT_BY_OCCURRED_AT, {
        variables: {
            restaurantId: restaurant?.id || "",
            occurredAt: { between: [cashMovementDateRange.start, cashMovementDateRange.end] },
            limit: 1000,
        },
        skip: !restaurant?.id,
        fetchPolicy: "network-only",
    });

    // Builds the history list and keeps only one open row per scope.
    const sessionHistory = useMemo(() => {
        const seenOpenSessionKeys = new Set<string>();

        return allSessions
            .filter((session) => {
                if (session.status !== ETakingsSessionStatus.OPEN) return true;

                const openSessionKey = session.scopeKey;
                if (seenOpenSessionKeys.has(openSessionKey)) return false;

                seenOpenSessionKeys.add(openSessionKey);
                return true;
            })
            .slice(0, 8);
    }, [allSessions]);

    // Tracks the selected history row.
    const selectedHistorySession = useMemo(
        () => sessionHistory.find((session) => session.id === selectedHistorySessionId) || null,
        [selectedHistorySessionId, sessionHistory],
    );

    // Filters orders to the active scope.
    const activeBusinessDateOrders = useMemo(
        () =>
            (ordersData?.getOrdersByRestaurantByPlacedAt?.items || []).filter((order) =>
                scopeType ? orderMatchesTakingsScope(order, scopeType, scopeId) : true,
            ),
        [ordersData, scopeId, scopeType],
    );

    // Keeps only the orders that belong to the current open session window.
    const activeSessionOrders = useMemo(() => {
        if (!currentSession?.openedAtUtc) return [];

        return activeBusinessDateOrders.filter((order) => orderHasTakingsActivityInSession(order, currentSession.openedAtUtc));
    }, [activeBusinessDateOrders, currentSession?.openedAtUtc]);

    // Filters cash movements to the active date, session, and scope.
    const activeBusinessDateCashMovements: IGET_CASH_MOVEMENT[] = useMemo(
        () =>
            (cashMovementsData?.getCashMovementsByRestaurantByOccurredAt?.items || []).filter((movement) => {
                const belongsToSession =
                    !!currentSession?.id &&
                    (!movement.takingsSessionId || movement.takingsSessionId === currentSession.id) &&
                    isTimestampWithinSessionWindow(movement.occurredAt, currentSession.openedAtUtc);
                const belongsToScope = movement.scopeKey ? movement.scopeKey === scopeKey : scopeType === ETakingsScopeType.SITE;
                return movement.businessDate === activeBusinessDate && belongsToSession && belongsToScope;
            }),
        [activeBusinessDate, cashMovementsData, currentSession?.id, currentSession?.openedAtUtc, scopeKey, scopeType],
    );

    const currentSessionCashMovements = useMemo(
        () => (currentSession ? activeBusinessDateCashMovements.filter((movement) => movement.takingsSessionId === currentSession.id) : []),
        [activeBusinessDateCashMovements, currentSession],
    );

    const currentSessionPaymentSnapshot = useMemo(() => {
        if (!currentSession?.paymentSummaryJson) return null;

        try {
            return JSON.parse(currentSession.paymentSummaryJson) as TPaymentSummarySnapshot;
        } catch (error) {
            console.error("Unable to parse takings payment summary.", error);
            return null;
        }
    }, [currentSession?.paymentSummaryJson]);

    const openingFloatCents = toCents(openingFloatInput);
    const persistedOpeningFloatCents = currentSession?.openingFloatCents || 0;

    const canRefreshOpenSessionTimestamp = useMemo(
        () => !!currentSession && isReusableOpenTakingsSession(currentSession, currentSessionCashMovements),
        [currentSession, currentSessionCashMovements],
    );

    const canReusePreviousBusinessDateOpenSession = useMemo(
        () => !!currentSession && currentSession.businessDate !== businessDate && canRefreshOpenSessionTimestamp,
        [businessDate, canRefreshOpenSessionTimestamp, currentSession],
    );

    // Sums the recorded order payments before money-in/out adjustments are applied.
    const baseRecordedTotals = useMemo(
        () => buildRecordedTotals(activeSessionOrders, currentSession?.openedAtUtc),
        [activeSessionOrders, currentSession?.openedAtUtc],
    );

    // Build adjustment totals for money-in/out transactions so each payment channel
    // is reconciled with its recorded order totals.
    const paymentMovementTotals = useMemo(() => {
        const moneyInTotals = createPaymentTotals();
        const moneyOutTotals = createPaymentTotals();

        activeBusinessDateCashMovements.forEach((movement) => {
            if (movement.type !== ECashMovementType.MONEY_IN && movement.type !== ECashMovementType.MONEY_OUT) return;

            const paymentKey = getCashMovementPaymentKey(movement.paymentMethod);
            if (!paymentKey) return;

            const amountCents = movement.amountCents || 0;
            if (movement.type === ECashMovementType.MONEY_IN) moneyInTotals[paymentKey] += amountCents;
            if (movement.type === ECashMovementType.MONEY_OUT) moneyOutTotals[paymentKey] += amountCents;
        });

        return {
            moneyInTotals,
            moneyOutTotals,
        };
    }, [activeBusinessDateCashMovements]);

    // Builds the recorded reconciliation amount for each payment type.
    const recordedTotals = useMemo(
        () =>
            PAYMENT_KEYS.reduce((totals, key) => {
                totals[key] =
                    baseRecordedTotals[key] +
                    paymentMovementTotals.moneyInTotals[key] -
                    paymentMovementTotals.moneyOutTotals[key] +
                    (key === "cash" ? openingFloatCents : 0);

                return totals;
            }, createPaymentTotals()),
        [baseRecordedTotals, openingFloatCents, paymentMovementTotals],
    );

    const cashMovementTotals = useMemo(() => {
        return {
            moneyInCents: paymentMovementTotals.moneyInTotals.cash,
            moneyOutCents: paymentMovementTotals.moneyOutTotals.cash,
        };
    }, [paymentMovementTotals]);

    const persistedRecordedTotals = useMemo(
        () =>
            PAYMENT_KEYS.reduce((totals, key) => {
                totals[key] =
                    baseRecordedTotals[key] +
                    paymentMovementTotals.moneyInTotals[key] -
                    paymentMovementTotals.moneyOutTotals[key] +
                    (key === "cash" ? persistedOpeningFloatCents : 0);

                return totals;
            }, createPaymentTotals()),
        [baseRecordedTotals, paymentMovementTotals, persistedOpeningFloatCents],
    );

    // Counts only unresolved orders that belong to the current open session window.
    const orderWarnings = useMemo(() => {
        const initial = {
            openOrdersCount: 0,
            parkedOrdersCount: 0,
            unpaidOrdersCount: 0,
            paidOpenOrdersCount: 0,
        };

        activeSessionOrders?.forEach((order) => {
            if (order.status === EOrderStatus.CANCELLED || order.status === EOrderStatus.REFUNDED) return;

            // Keep the warning flow aligned with reconciliation: only orders that are still
            // financially unresolved should block or warn during takings finalisation.
            if (order.status === EOrderStatus.PARKED) {
                initial.parkedOrdersCount += 1;
                return;
            }

            if (!order.paid) {
                if (order.status === EOrderStatus.NEW) initial.openOrdersCount += 1;
                else initial.unpaidOrdersCount += 1;
                return;
            }

            if (order.status === EOrderStatus.NEW) initial.paidOpenOrdersCount += 1;
        });

        return initial;
    }, [activeSessionOrders]);

    // Loads the form from the current session without resetting it on every refetch.
    useEffect(() => {
        const hydrationKey = currentSession
            ? `${currentSession.id}:${currentSession.businessDate}:${currentSession.openedAtUtc}`
            : `new:${scopeKey}:${businessDate}`;
        if (hydratedSessionIdRef.current === hydrationKey) return;

        hydratedSessionIdRef.current = hydrationKey;

        if (!currentSession) {
            setOpeningFloatInput("0.00");
            setCountedPaymentInputs(createPaymentInputs());
            setDenominationInputs(createDenominationInputs());
            setVarianceReason("");
            setNotes("");
            setAcknowledgedWarnings(false);
            return;
        }

        setCountMode("counted");
        setOpeningFloatInput(convertCentsToDollars(currentSession.openingFloatCents));
        setCountedPaymentInputs(
            currentSessionPaymentSnapshot
                ? createPaymentInputs(
                      PAYMENT_KEYS.reduce((totals, key) => {
                          totals[key] = currentSessionPaymentSnapshot[key]?.countedCents || 0;
                          return totals;
                      }, createPaymentTotals()),
                  )
                : createPaymentInputs({ cash: currentSession.countedDrawerCashCents }),
        );
        setDenominationInputs(createDenominationInputs());
        setDraftDenominationInputs(createDenominationInputs());
        setVarianceReason(currentSession.varianceReason || "");
        setNotes(currentSession.notes || "");
        setAcknowledgedWarnings(false);
    }, [businessDate, currentSession, currentSessionPaymentSnapshot, scopeKey]);

    // Totals the cash from note and coin quantities.
    const countedCashFromDenominationsCents = DENOMINATIONS.reduce((total, denomination) => {
        return total + denomination * toWholeNumber(denominationInputs[String(denomination)]);
    }, 0);

    const draftCountedCashFromDenominationsCents = DENOMINATIONS.reduce((total, denomination) => {
        return total + denomination * toWholeNumber(draftDenominationInputs[String(denomination)]);
    }, 0);

    // Builds one counted-totals object for the page.
    const countedTotals = PAYMENT_KEYS.reduce((accumulator, key) => {
        accumulator[key] = key === "cash" && countMode === "denominations" ? countedCashFromDenominationsCents : toCents(countedPaymentInputs[key]);
        return accumulator;
    }, createPaymentTotals());

    // Cash expected value still represents physical drawer cash only.
    const expectedDrawerCashCents = recordedTotals.cash;

    const countedDrawerCashCents = countedTotals.cash;
    const cashVarianceCents = countedDrawerCashCents - expectedDrawerCashCents;
    const totalRecordedCents = PAYMENT_KEYS.reduce((total, key) => total + recordedTotals[key], 0);
    const totalCountedCents = PAYMENT_KEYS.reduce((total, key) => total + countedTotals[key], 0);
    const totalExpectedCents = totalRecordedCents;
    const totalVarianceCents = totalCountedCents - totalExpectedCents;

    const paymentSummary = PAYMENT_KEYS.reduce((accumulator, key) => {
        const recordedCents = recordedTotals[key];
        const countedCents = countedTotals[key];

        accumulator[key] = {
            recordedCents,
            countedCents,
            differenceCents: countedCents - recordedCents,
            moneyInCents: paymentMovementTotals.moneyInTotals[key],
            moneyOutCents: paymentMovementTotals.moneyOutTotals[key],
        };

        return accumulator;
    }, {} as TPaymentSummarySnapshot);

    const persistedPaymentSummary = useMemo(
        () =>
            PAYMENT_KEYS.reduce((accumulator, key) => {
                const recordedCents = persistedRecordedTotals[key];
                const countedCents = countedTotals[key];

                accumulator[key] = {
                    recordedCents,
                    countedCents,
                    differenceCents: countedCents - recordedCents,
                    moneyInCents: paymentMovementTotals.moneyInTotals[key],
                    moneyOutCents: paymentMovementTotals.moneyOutTotals[key],
                };

                return accumulator;
            }, {} as TPaymentSummarySnapshot),
        [countedTotals, paymentMovementTotals, persistedRecordedTotals],
    );

    const unresolvedOrdersCount = orderWarnings.openOrdersCount + orderWarnings.parkedOrdersCount + orderWarnings.unpaidOrdersCount;
    const varianceThresholdCents = restaurant?.takingsVarianceReasonThresholdCents ?? 5000;

    // Variance reason is required only when the variance passes the threshold.
    const requiresVarianceReason = Math.abs(totalVarianceCents) > varianceThresholdCents;
    const blocksFinalize = !!restaurant?.takingsBlockIfOpenOrders && unresolvedOrdersCount > 0;

    // New sessions need the opening float to be saved once.
    const openingFloatRequiresReview =
        !!currentSession && currentSession.openingFloatCents === 0 && !reviewedOpeningFloatSessionIds.includes(currentSession.id);
    const persistedExpectedDrawerCashCents = persistedRecordedTotals.cash;
    const persistedCashVarianceCents = countedDrawerCashCents - persistedExpectedDrawerCashCents;
    const persistedRecordedTotalCents = PAYMENT_KEYS.reduce((total, key) => total + persistedRecordedTotals[key], 0);
    const persistedTotalVarianceCents = totalCountedCents - persistedRecordedTotalCents;
    const persistedVarianceReason = varianceReason.trim() || null;
    const persistedNotes = notes.trim() || null;
    const persistedPaymentSummaryJson = JSON.stringify(persistedPaymentSummary);
    const draftSessionUpdateInput = useMemo(
        () =>
            currentSession
                ? {
                      id: currentSession.id,
                      openingFloatCents: persistedOpeningFloatCents,
                      cashSalesCents: baseRecordedTotals.cash,
                      cashRefundsCents: 0,
                      moneyInCents: cashMovementTotals.moneyInCents,
                      moneyOutCents: cashMovementTotals.moneyOutCents,
                      cashDropsCents: 0,
                      tipPayoutsCents: 0,
                      expectedDrawerCashCents: persistedExpectedDrawerCashCents,
                      countedDrawerCashCents,
                      varianceCents: persistedCashVarianceCents,
                      recordedTotalCents: persistedRecordedTotalCents,
                      countedTotalCents: totalCountedCents,
                      paymentVarianceCents: persistedTotalVarianceCents,
                      paymentSummaryJson: persistedPaymentSummaryJson,
                      varianceReason: persistedVarianceReason,
                      openOrdersCount: orderWarnings.openOrdersCount,
                      unpaidOrdersCount: orderWarnings.unpaidOrdersCount,
                      parkedOrdersCount: orderWarnings.parkedOrdersCount,
                      notes: persistedNotes,
                  }
                : null,
        [
            baseRecordedTotals.cash,
            cashMovementTotals.moneyInCents,
            cashMovementTotals.moneyOutCents,
            countedDrawerCashCents,
            currentSession,
            orderWarnings.openOrdersCount,
            orderWarnings.parkedOrdersCount,
            orderWarnings.unpaidOrdersCount,
            persistedCashVarianceCents,
            persistedExpectedDrawerCashCents,
            persistedNotes,
            persistedOpeningFloatCents,
            persistedPaymentSummaryJson,
            persistedRecordedTotalCents,
            persistedTotalVarianceCents,
            persistedVarianceReason,
            totalCountedCents,
        ],
    );

    // Keeps the current open session alive by periodically touching its activity timestamp.
    // This avoids stale open-session placeholders while the user is on the cash-up page.
    const touchCurrentSessionActivity = useCallback(async () => {
        if (!currentSession || currentSession.status !== ETakingsSessionStatus.OPEN) return;
        if (currentSession.businessDate !== businessDate) return;
        if (rollingSessionForward || finalizingSession || creatingSession) return;

        const now = Date.now();
        if (now - lastActivityTouchRef.current < 30_000) return;

        try {
            const activityAt = new Date(now).toISOString();
            await updateDraftTakingsSession({
                variables: {
                    id: currentSession.id,
                    lastActivityAt: activityAt,
                },
            });
            lastActivityTouchRef.current = now;
            await refetchTakingsSessions();
        } catch (error) {
            console.error(error);
        }
    }, [businessDate, creatingSession, currentSession, finalizingSession, refetchTakingsSessions, rollingSessionForward, updateDraftTakingsSession]);

    // Reloads all cash-up data.
    const handleRefresh = useCallback(async () => {
        await Promise.allSettled([refetchTakingsSessions(), refetchOrders(), refetchCashMovements()]);
    }, [refetchCashMovements, refetchOrders, refetchTakingsSessions]);

    useEffect(() => {
        const refreshVisibleCashUpData = async () => {
            if (document.visibilityState === "visible") {
                await touchCurrentSessionActivity();
                handleRefresh();
            }
        };

        window.addEventListener("focus", refreshVisibleCashUpData);
        document.addEventListener("visibilitychange", refreshVisibleCashUpData);

        return () => {
            window.removeEventListener("focus", refreshVisibleCashUpData);
            document.removeEventListener("visibilitychange", refreshVisibleCashUpData);
        };
    }, [handleRefresh, touchCurrentSessionActivity]);

    // Creates a new open takings session for the current scope.
    // This is used when the page loads and there is no active open session,
    // or when the previous session was finalised and a fresh session is required.
    const handleCreateCurrentSession = useCallback(
        async ({
            sessionBusinessDate = businessDate,
            initialOpeningFloatCents = 0,
            requireOpeningFloatReview = true,
        }: {
            sessionBusinessDate?: string;
            initialOpeningFloatCents?: number;
            requireOpeningFloatReview?: boolean;
        } = {}) => {
            if (!restaurant || !user || !effectiveCashUserId || !scopeType || !scopeId || !scopeKey) return null;

            try {
                const sameDaySessions = allSessions.filter((session) => session.businessDate === sessionBusinessDate);
                const sessionNumber = sameDaySessions.reduce((max, session) => Math.max(max, session.sessionNumber), 0) + 1;

                const now = new Date();
                const openedAt = toLocalISOString(now);
                const openedAtUtc = now.toISOString();

                const result = await createTakingsSession({
                    variables: {
                        restaurantId: restaurant.id,
                        businessDate: sessionBusinessDate,
                        scopeType,
                        scopeId,
                        scopeKey,
                        sessionNumber,
                        status: ETakingsSessionStatus.OPEN,
                        openedAt,
                        openedAtUtc,
                        lastActivityAt: openedAtUtc,
                        openedBy: effectiveCashUserId,
                        openingFloatCents: initialOpeningFloatCents,
                        expectedDrawerCashCents: initialOpeningFloatCents,
                        countedDrawerCashCents: 0,
                        varianceCents: 0,
                        openOrdersCount: 0,
                        unpaidOrdersCount: 0,
                        parkedOrdersCount: 0,
                        owner: user.id,
                    },
                });

                const createdSession = result.data?.createTakingsSession || null;
                if (createdSession) {
                    autoCreateKeyRef.current = `${scopeKey}:${sessionBusinessDate}`;
                    if (requireOpeningFloatReview && initialOpeningFloatCents === 0) {
                        setReviewedOpeningFloatSessionIds((previous) => previous.filter((sessionId) => sessionId !== createdSession.id));
                    } else {
                        setReviewedOpeningFloatSessionIds((previous) =>
                            previous.includes(createdSession.id) ? previous : [...previous, createdSession.id],
                        );
                    }
                }

                await refetchTakingsSessions();
                return createdSession;
            } catch (error) {
                console.error(error);
                toast.error("Unable to start cash up session.");
                return null;
            }
        },
        [
            allSessions,
            businessDate,
            createTakingsSession,
            effectiveCashUserId,
            refetchTakingsSessions,
            restaurant,
            scopeId,
            scopeKey,
            scopeType,
            user,
        ],
    );

    // Refreshes an existing open session to keep it valid for the current business date.
    // If the session belongs to a prior business date, it can be rolled forward into today.
    // Otherwise it simply updates the displayed activity time for an untouched open session.
    const handleRollForwardCurrentSession = useCallback(
        async (session: IGET_TAKINGS_SESSION) => {
            if (!effectiveCashUserId) return null;

            try {
                const shouldMoveToCurrentBusinessDate = session.businessDate !== businessDate;
                const sameDaySessions = shouldMoveToCurrentBusinessDate
                    ? allSessions.filter((item) => item.businessDate === businessDate && item.id !== session.id)
                    : [];
                const sessionNumber = shouldMoveToCurrentBusinessDate
                    ? sameDaySessions.reduce((max, item) => Math.max(max, item.sessionNumber), 0) + 1
                    : session.sessionNumber;
                const now = new Date();
                const refreshedActivityAt = now.toISOString();
                const refreshedOpenedAt = toLocalISOString(now);

                const result = await rollForwardTakingsSession({
                    variables: {
                        id: session.id,
                        businessDate,
                        sessionNumber,
                        lastActivityAt: refreshedActivityAt,
                        ...(shouldMoveToCurrentBusinessDate
                            ? {
                                  openedAt: refreshedOpenedAt,
                                  openedAtUtc: refreshedActivityAt,
                                  openedBy: effectiveCashUserId,
                              }
                            : {}),
                    },
                });

                setReviewedOpeningFloatSessionIds((previous) => previous.filter((sessionId) => sessionId !== session.id));
                hydratedSessionIdRef.current = null;
                // Use the existing sessions list refetch to obtain an up-to-date session
                const refreshedTakingsResult = await refetchTakingsSessions();
                const refreshedSessions: IGET_TAKINGS_SESSION[] = refreshedTakingsResult.data?.getTakingsSessionsByScopeKeyByOpenedAt?.items || [];
                const refreshedSession = refreshedSessions.find((s) => s.id === session.id) || null;

                const sameDayRefreshAccepted =
                    !shouldMoveToCurrentBusinessDate && refreshedSession?.id === session.id && refreshedSession?.businessDate === businessDate;

                if (
                    sameDayRefreshAccepted ||
                    (refreshedSession?.businessDate === businessDate &&
                        refreshedSession?.lastActivityAt === refreshedActivityAt &&
                        (!shouldMoveToCurrentBusinessDate || refreshedSession?.openedAtUtc === refreshedActivityAt))
                ) {
                    await refetchTakingsSessions();
                    return result.data?.updateTakingsSession || refreshedSession;
                }

                await refetchTakingsSessions();
                if (shouldMoveToCurrentBusinessDate) {
                    toast.error("Unable to refresh the blank cash-up session time.");
                }
                return null;
            } catch (error) {
                console.error(error);
                if (session.businessDate !== businessDate) {
                    toast.error("Unable to refresh the blank cash-up session time.");
                }
                return null;
            }
        },
        [allSessions, businessDate, effectiveCashUserId, refetchTakingsSessions, rollForwardTakingsSession],
    );

    useEffect(() => {
        // Auto-creates a session when cash up opens and none exists yet.
        if (!restaurant?.takingsEnable || !restaurant?.id || !user || !effectiveCashUserId || !isPOS || !scopeType || !scopeId || !scopeKey) return;
        if (takingsLoading || takingsError || creatingSession || finalizingSession || suppressAutoCreateRef.current) return;
        if (currentSession) return;

        const autoCreateKey = `${scopeKey}:${businessDate}`;
        if (autoCreateKeyRef.current === autoCreateKey) return;

        autoCreateKeyRef.current = autoCreateKey;
        handleCreateCurrentSession();
    }, [
        businessDate,
        creatingSession,
        currentSession,
        handleCreateCurrentSession,
        isPOS,
        restaurant?.id,
        restaurant?.takingsEnable,
        scopeId,
        scopeKey,
        scopeType,
        takingsLoading,
        takingsError,
        user,
        finalizingSession,
    ]);

    // Resets unresolved-order acknowledgement when the session or unresolved counts change.
    useEffect(() => {
        if (unresolvedOrdersCount === 0) setShowWarningModal(false);
    }, [currentSession?.id, unresolvedOrdersCount]);

    useEffect(() => {
        if (!currentSession || currentSession.status !== ETakingsSessionStatus.OPEN || !draftSessionUpdateInput) return;
        if (rollingSessionForward || finalizingSession || creatingSession) return;

        const hasDraftChanges =
            currentSession.openingFloatCents !== draftSessionUpdateInput.openingFloatCents ||
            (currentSession.cashSalesCents || 0) !== draftSessionUpdateInput.cashSalesCents ||
            (currentSession.cashRefundsCents || 0) !== draftSessionUpdateInput.cashRefundsCents ||
            (currentSession.moneyInCents || 0) !== draftSessionUpdateInput.moneyInCents ||
            (currentSession.moneyOutCents || 0) !== draftSessionUpdateInput.moneyOutCents ||
            (currentSession.cashDropsCents || 0) !== draftSessionUpdateInput.cashDropsCents ||
            (currentSession.tipPayoutsCents || 0) !== draftSessionUpdateInput.tipPayoutsCents ||
            currentSession.expectedDrawerCashCents !== draftSessionUpdateInput.expectedDrawerCashCents ||
            currentSession.countedDrawerCashCents !== draftSessionUpdateInput.countedDrawerCashCents ||
            currentSession.varianceCents !== draftSessionUpdateInput.varianceCents ||
            (currentSession.recordedTotalCents || 0) !== draftSessionUpdateInput.recordedTotalCents ||
            (currentSession.countedTotalCents || 0) !== draftSessionUpdateInput.countedTotalCents ||
            (currentSession.paymentVarianceCents || 0) !== draftSessionUpdateInput.paymentVarianceCents ||
            (currentSession.paymentSummaryJson || null) !== draftSessionUpdateInput.paymentSummaryJson ||
            (currentSession.varianceReason || null) !== draftSessionUpdateInput.varianceReason ||
            currentSession.openOrdersCount !== draftSessionUpdateInput.openOrdersCount ||
            currentSession.unpaidOrdersCount !== draftSessionUpdateInput.unpaidOrdersCount ||
            currentSession.parkedOrdersCount !== draftSessionUpdateInput.parkedOrdersCount ||
            (currentSession.notes || null) !== draftSessionUpdateInput.notes;

        if (!hasDraftChanges) {
            draftSyncSignatureRef.current = null;
            return;
        }

        const draftSignature = JSON.stringify(draftSessionUpdateInput);
        if (draftSyncSignatureRef.current === draftSignature) return;

        const timeoutId = window.setTimeout(async () => {
            draftSyncSignatureRef.current = draftSignature;

            try {
                await syncDraftTakingsSession({
                    variables: {
                        ...draftSessionUpdateInput,
                        lastActivityAt: new Date().toISOString(),
                    },
                });
                await refetchTakingsSessions();
            } catch (error) {
                console.error(error);
                draftSyncSignatureRef.current = null;
            }
        }, 700);

        return () => window.clearTimeout(timeoutId);
    }, [
        creatingSession,
        currentSession,
        draftSessionUpdateInput,
        finalizingSession,
        refetchTakingsSessions,
        rollingSessionForward,
        syncDraftTakingsSession,
    ]);

    // Refreshes the blank open session timestamp before switching views.
    const handleChangeView = useCallback(
        async (nextView: TCashUpView) => {
            if (nextView === activeView) return;

            if (currentSession && canRefreshOpenSessionTimestamp && !rollingSessionForward && !creatingSession) {
                await handleRollForwardCurrentSession(currentSession);
            }

            await touchCurrentSessionActivity();
            await handleRefresh();
            setActiveView(nextView);
        },
        [
            activeView,
            canRefreshOpenSessionTimestamp,
            creatingSession,
            currentSession,
            handleRefresh,
            handleRollForwardCurrentSession,
            rollingSessionForward,
            touchCurrentSessionActivity,
        ],
    );

    // Finalises the active open takings session and opens a new placeholder session if needed.
    // This includes reconciliation validation, variance reason checks, and unresolved order handling.
    const handleFinalizeSession = async () => {
        if (!currentSession || !user || !effectiveCashUserId) return;

        if (openingFloatRequiresReview) {
            toast.error("Confirm and save the opening float for this session before finalising.");
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

        suppressAutoCreateRef.current = true;
        try {
            const finalizedSessionId = currentSession.id;

            await updateTakingsSession({
                variables: {
                    id: finalizedSessionId,
                    openingFloatCents,
                    status: ETakingsSessionStatus.FINALIZED,
                    finalizedAt: new Date().toISOString(),
                    finalizedBy: effectiveCashUserId,
                    cashSalesCents: baseRecordedTotals.cash,
                    cashRefundsCents: 0,
                    moneyInCents: cashMovementTotals.moneyInCents,
                    moneyOutCents: cashMovementTotals.moneyOutCents,
                    cashDropsCents: 0,
                    tipPayoutsCents: 0,
                    expectedDrawerCashCents,
                    countedDrawerCashCents,
                    varianceCents: cashVarianceCents,
                    recordedTotalCents: totalRecordedCents,
                    countedTotalCents: totalCountedCents,
                    paymentVarianceCents: totalVarianceCents,
                    paymentSummaryJson: JSON.stringify(paymentSummary),
                    varianceReason: varianceReason.trim() || null,
                    openOrdersCount: orderWarnings.openOrdersCount,
                    unpaidOrdersCount: orderWarnings.unpaidOrdersCount,
                    parkedOrdersCount: orderWarnings.parkedOrdersCount,
                    notes: notes.trim() || null,
                },
            });

            const refreshedTakingsResult = await refetchTakingsSessions();
            const refreshedSessions: IGET_TAKINGS_SESSION[] = refreshedTakingsResult.data?.getTakingsSessionsByScopeKeyByOpenedAt?.items || [];
            const existingOpenSession =
                sortSessions(
                    refreshedSessions.filter((session) => session.scopeKey === scopeKey && session.status === ETakingsSessionStatus.OPEN),
                )[0] || null;

            if (!existingOpenSession) {
                await handleCreateCurrentSession({
                    sessionBusinessDate: businessDate,
                    initialOpeningFloatCents: 0,
                    requireOpeningFloatReview: true,
                });
            }

            toast.success("Takings finalised.");
            setActiveView("history");
            setSelectedHistorySessionId(finalizedSessionId);
            setEntryPaymentKey(null);
            hydratedSessionIdRef.current = null;
            await refetchTakingsSessions();
        } catch (error) {
            console.error(error);
            toast.error("Unable to finalise takings.");
        } finally {
            suppressAutoCreateRef.current = false;
        }
    };

    // Opens the finalise modal after basic checks pass.
    const handleOpenFinalizeModal = () => {
        if (!currentSession || !restaurant?.takingsEnable || !isPOS) return;
        if (openingFloatRequiresReview) {
            toast.error("Confirm and save the opening float for this session before finalising.");
            return;
        }

        if (unresolvedOrdersCount > 0) {
            setShowWarningModal(true);
            return;
        }

        setShowFinalizeModal(true);
    };

    // Runs finalise after the user confirms.
    const handleConfirmFinalize = async () => {
        setShowFinalizeModal(false);
        await handleFinalizeSession();
    };

    // Closes the warning modal.
    const handleCloseWarningModal = () => {
        setShowWarningModal(false);
    };

    // Accepts unresolved-order warnings and continues to the final confirmation step.
    const handleContinueFromWarningModal = () => {
        setAcknowledgedWarnings(true);
        setShowWarningModal(false);
        setShowFinalizeModal(true);
    };

    // Persists the reviewed opening float on the current session.
    // This is required before finalising if the session started with zero float.
    const handleSaveOpeningFloat = async () => {
        if (!currentSession) return;

        try {
            // Saves the reviewed opening float to the session.
            await updateDraftTakingsSession({
                variables: {
                    id: currentSession.id,
                    openingFloatCents,
                    lastActivityAt: new Date().toISOString(),
                },
            });

            setReviewedOpeningFloatSessionIds((previous) => (previous.includes(currentSession.id) ? previous : [...previous, currentSession.id]));
            await refetchTakingsSessions();
            toast.success("Opening float saved.");
        } catch (error) {
            console.error(error);
            toast.error("Unable to save opening float.");
        }
    };

    // Updates one counted payment value.
    const updateCountedPaymentInput = (key: TPaymentKey, value: string) => {
        setCountedPaymentInputs((previous) => ({
            ...previous,
            [key]: value,
        }));
    };

    // Opens the count-entry modal for a payment row.
    const openCountEntry = (key: TPaymentKey) => {
        if (!currentSession) return;
        if (key === "cash") {
            setCashEntryStep("choice");
            setDraftDenominationInputs(denominationInputs);
        }
        setEntryPaymentKey(key);
    };

    // Shows direct cash entry.
    const handleSelectCashCounted = () => {
        setCountMode("counted");
        setCashEntryStep("counted");
    };

    // Shows denomination entry.
    const handleSelectCashDenominations = () => {
        setDraftDenominationInputs(denominationInputs);
        setCashEntryStep("denominations");
    };

    // Applies the denomination count to cash.
    const handleApplyDenominations = () => {
        setDenominationInputs(draftDenominationInputs);
        setCountMode("denominations");
        setEntryPaymentKey(null);
    };

    // Picks the user label for a history row.
    const getHistoryUserLabel = (session: IGET_TAKINGS_SESSION) => {
        const sessionUserId = session.finalizedBy || session.openedBy;

        if (sessionUserId && effectiveCashUserId === sessionUserId && effectiveCashUserName) return effectiveCashUserName;
        return sessionUserId || "-";
    };

    // Reads the saved payment summary and falls back for older sessions.
    const getPaymentSummarySnapshot = (session: IGET_TAKINGS_SESSION): TPaymentSummarySnapshot | null => {
        if (!session.paymentSummaryJson) return null;

        try {
            return JSON.parse(session.paymentSummaryJson) as TPaymentSummarySnapshot;
        } catch (error) {
            console.error("Unable to parse takings payment summary.", error);
            return null;
        }
    };

    // Builds the history summary rows for one session.
    const getHistorySummaryRows = (session: IGET_TAKINGS_SESSION) => {
        const isActiveOpenSession = currentSession?.id === session.id && session.status === ETakingsSessionStatus.OPEN;
        const paymentSnapshot = isActiveOpenSession ? persistedPaymentSummary : getPaymentSummarySnapshot(session);
        const legacyCashRecordedCents = isActiveOpenSession ? persistedExpectedDrawerCashCents : session.expectedDrawerCashCents || 0;
        const legacyCashCountedCents = isActiveOpenSession ? countedDrawerCashCents : session.countedDrawerCashCents || 0;
        const paymentRecordedTotalCents =
            (isActiveOpenSession ? persistedRecordedTotalCents : session.recordedTotalCents) ??
            (paymentSnapshot ? PAYMENT_KEYS.reduce((total, key) => total + (paymentSnapshot[key]?.recordedCents || 0), 0) : legacyCashRecordedCents);
        const countedTotalCents =
            (isActiveOpenSession ? totalCountedCents : session.countedTotalCents) ??
            (paymentSnapshot ? PAYMENT_KEYS.reduce((total, key) => total + (paymentSnapshot[key]?.countedCents || 0), 0) : legacyCashCountedCents);
        const paymentVarianceCents =
            (isActiveOpenSession ? persistedTotalVarianceCents : session.paymentVarianceCents) ?? countedTotalCents - paymentRecordedTotalCents;
        const rows: Array<{ key: string; label: string; countedCents: number; recordedCents: number; differenceCents: number }> = PAYMENT_KEYS.map(
            (key) => {
                const recordedCents = paymentSnapshot?.[key]?.recordedCents ?? (key === "cash" ? legacyCashRecordedCents : 0);
                const countedCents = paymentSnapshot?.[key]?.countedCents ?? (key === "cash" ? legacyCashCountedCents : 0);
                const differenceCents = paymentSnapshot?.[key]?.differenceCents ?? countedCents - recordedCents;

                return {
                    key,
                    label: getPaymentLabel(key),
                    countedCents,
                    recordedCents,
                    differenceCents,
                };
            },
        );

        rows.push({
            key: "total",
            label: "Total",
            countedCents: countedTotalCents,
            recordedCents: paymentRecordedTotalCents,
            differenceCents: paymentVarianceCents,
        });

        return rows;
    };

    // Shows the saved money movement summary for the selected session.
    const getHistoryDrawerRows = (session: IGET_TAKINGS_SESSION) => {
        const isActiveOpenSession = currentSession?.id === session.id && session.status === ETakingsSessionStatus.OPEN;
        const paymentSnapshot = isActiveOpenSession ? persistedPaymentSummary : getPaymentSummarySnapshot(session);
        const cashMoneyInCents = isActiveOpenSession
            ? paymentMovementTotals.moneyInTotals.cash
            : (paymentSnapshot?.cash?.moneyInCents ?? session.moneyInCents ?? 0);
        const cashMoneyOutCents = isActiveOpenSession
            ? paymentMovementTotals.moneyOutTotals.cash
            : (paymentSnapshot?.cash?.moneyOutCents ?? session.moneyOutCents ?? 0);
        const onlineMoneyInCents = isActiveOpenSession ? paymentMovementTotals.moneyInTotals.online : (paymentSnapshot?.online?.moneyInCents ?? 0);
        const onlineMoneyOutCents = isActiveOpenSession ? paymentMovementTotals.moneyOutTotals.online : (paymentSnapshot?.online?.moneyOutCents ?? 0);
        const eftposMoneyInCents = isActiveOpenSession ? paymentMovementTotals.moneyInTotals.eftpos : (paymentSnapshot?.eftpos?.moneyInCents ?? 0);
        const eftposMoneyOutCents = isActiveOpenSession ? paymentMovementTotals.moneyOutTotals.eftpos : (paymentSnapshot?.eftpos?.moneyOutCents ?? 0);

        return [
            { label: "Opening Float", valueCents: isActiveOpenSession ? persistedOpeningFloatCents : session.openingFloatCents || 0 },
            { label: "Cash Money In", valueCents: cashMoneyInCents },
            { label: "Cash Money Out", valueCents: cashMoneyOutCents },
            { label: "Online Money In", valueCents: onlineMoneyInCents },
            { label: "Online Money Out", valueCents: onlineMoneyOutCents },
            { label: "Eftpos Money In", valueCents: eftposMoneyInCents },
            { label: "Eftpos Money Out", valueCents: eftposMoneyOutCents },
        ];
    };

    // Renders the modal used to enter counted payment totals for each payment method.
    // Cash entries can be entered directly or via denomination breakdown.
    const renderCountEntryModal = () => {
        if (!entryPaymentKey) return null;

        const isCashEntry = entryPaymentKey === "cash";
        const label = getPaymentLabel(entryPaymentKey);
        const entryValueCents = countedTotals[entryPaymentKey];
        const draftCashDifferenceCents = draftCountedCashFromDenominationsCents - expectedDrawerCashCents;

        return (
            <ModalV2
                padding="0"
                width={isCashEntry && cashEntryStep === "denominations" ? "720px" : "540px"}
                isOpen={!!entryPaymentKey}
                disableClose={false}
                onRequestClose={() => setEntryPaymentKey(null)}
            >
                <div className="cashup-entry-modal">
                    <div
                        className={`cashup-entry-modal__header ${isCashEntry && cashEntryStep === "choice" ? "cashup-entry-modal__header--choice" : ""}`}
                    >
                        <div>
                            <h3>{isCashEntry ? "Cash Takings" : `${label} Takings`}</h3>
                            {isCashEntry && cashEntryStep === "choice" && (
                                <p>Would you like to enter the total counted or the individual denominations?</p>
                            )}
                        </div>
                        {(!isCashEntry || cashEntryStep !== "choice") && (
                            <strong>
                                {getDollarString(
                                    isCashEntry && cashEntryStep === "denominations" ? draftCountedCashFromDenominationsCents : entryValueCents,
                                )}
                            </strong>
                        )}
                    </div>

                    {isCashEntry && cashEntryStep === "choice" && (
                        <div className="cashup-choice-actions">
                            <Button onClick={handleSelectCashCounted}>Counted</Button>
                            <Button className="cashup-step-footer__ghost" onClick={handleSelectCashDenominations}>
                                Denominations
                            </Button>
                        </div>
                    )}

                    {(!isCashEntry || cashEntryStep === "counted") && (
                        <div className="cashup-entry-modal__amount">
                            <Input
                                autoFocus
                                label={`${label} Counted Amount`}
                                type="number"
                                value={countedPaymentInputs[entryPaymentKey]}
                                onChange={(event) => updateCountedPaymentInput(entryPaymentKey, event.target.value)}
                                disabled={!currentSession}
                            />
                        </div>
                    )}

                    {isCashEntry && cashEntryStep === "denominations" && (
                        <>
                            <div className="cashup-denomination-table">
                                {DENOMINATIONS.map((denomination) => (
                                    <div className="cashup-denomination-table__row" key={denomination}>
                                        <div>{getDollarString(denomination)}</div>
                                        <Input
                                            className="cashup-denomination-table__input"
                                            type="number"
                                            value={draftDenominationInputs[String(denomination)]}
                                            onChange={(event) =>
                                                setDraftDenominationInputs((previous) => ({
                                                    ...previous,
                                                    [String(denomination)]: event.target.value,
                                                }))
                                            }
                                        />
                                        <div>{getDollarString(denomination * toWholeNumber(draftDenominationInputs[String(denomination)]))}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="cashup-denomination-summary">
                                <div>
                                    <strong>Total Counted Cash</strong>
                                    <strong>{getDollarString(draftCountedCashFromDenominationsCents)}</strong>
                                </div>
                                <div>
                                    <span>Difference ({getDollarString(expectedDrawerCashCents)})</span>
                                    <span>{getDollarString(draftCashDifferenceCents)}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {(!isCashEntry || cashEntryStep === "counted") && (
                        <div className="cashup-entry-modal__footer">
                            <Button className="cashup-step-footer__ghost" onClick={() => setEntryPaymentKey(null)}>
                                Done
                            </Button>
                        </div>
                    )}

                    {isCashEntry && cashEntryStep === "denominations" && (
                        <div className="cashup-entry-modal__footer cashup-entry-modal__footer--center">
                            <Button onClick={handleApplyDenominations}>Apply</Button>
                            <Button className="cashup-step-footer__ghost" onClick={() => setEntryPaymentKey(null)}>
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>
            </ModalV2>
        );
    };

    // Renders one payment row in the cash-up totals table.
    // Each row shows the recorded total and opens the entry modal for counted values.
    const renderPaymentRow = (key: TPaymentKey, label: string) => {
        const counted = countedTotals[key];
        const recorded = recordedTotals[key];

        return (
            <div className="cashup-payment-row" key={key}>
                <div className="cashup-payment-row__label">
                    <strong>{label}</strong>
                    <span>Recorded: {getDollarString(recorded)}</span>
                </div>
                <div className="cashup-payment-row__count-label">Total counted</div>
                <div className="cashup-payment-row__input">
                    <button className="cashup-payment-row__counted" onClick={() => openCountEntry(key)} disabled={!currentSession}>
                        <span>{counted > 0 ? getDollarString(counted) : ""}</span>
                        <FiEdit2 />
                    </button>
                </div>
            </div>
        );
    };

    if (!restaurant) return <></>;

    // Page render: top-level cash-up layout with warnings, counts, finalise actions, and history.
    return (
        <PageWrapper>
            <div className="cashup-page">
                <ModalV2 padding="0" width="500px" isOpen={showWarningModal} disableClose={false} onRequestClose={handleCloseWarningModal}>
                    <div className="cashup-warning-modal">
                        <div className="cashup-warning-modal__header">
                            <FiAlertTriangle />
                            <div>
                                <h3>Open orders need attention</h3>
                                <p>
                                    Resolve parked or unpaid orders before finalising takings. If you continue, those orders may sit outside the final
                                    reconciliation.
                                </p>
                            </div>
                        </div>

                        <div className="cashup-warning-grid">
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
                            <div className="cashup-helper cashup-helper--error">
                                This restaurant blocks takings finalisation until those orders are resolved.
                            </div>
                        ) : (
                            <div className="cashup-helper">
                                You can continue to count takings, but finalising means you accept these unresolved order warnings.
                            </div>
                        )}
                        {orderWarnings.paidOpenOrdersCount > 0 && (
                            <div className="cashup-helper">
                                {orderWarnings.paidOpenOrdersCount} paid order{orderWarnings.paidOpenOrdersCount === 1 ? "" : "s"} still remain open.
                                They are already included in recorded takings, but staff should still complete them operationally.
                            </div>
                        )}

                        <div className="cashup-warning-modal__footer">
                            <Button className="cashup-step-footer__ghost" onClick={() => navigate(ordersPath)}>
                                Go To Orders
                            </Button>
                            {blocksFinalize ? (
                                <Button className="cashup-step-footer__ghost" onClick={handleCloseWarningModal}>
                                    Close
                                </Button>
                            ) : (
                                <Button onClick={handleContinueFromWarningModal}>Continue To Finalise</Button>
                            )}
                        </div>
                    </div>
                </ModalV2>

                {renderCountEntryModal()}

                <ModalV2 padding="0" width="510px" isOpen={showFinalizeModal} disableClose={false} onRequestClose={() => setShowFinalizeModal(false)}>
                    <div className="cashup-confirm-modal">
                        <h3>Finalise Takings</h3>
                        <p>Are you sure you want to finalise takings?</p>
                        <p>This cannot be reversed.</p>
                        <div className="cashup-confirm-modal__actions">
                            <Button onClick={handleConfirmFinalize} loading={finalizingSession}>
                                Finalise
                            </Button>
                            <Button className="cashup-step-footer__ghost" onClick={() => setShowFinalizeModal(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </ModalV2>

                <div className="cashup-page__header">
                    <div>
                        <button className="cashup-page__back" onClick={() => navigate(beginOrderPath)}>
                            <FiArrowLeft />
                            <span>Back to POS</span>
                        </button>
                    </div>

                    <div className="cashup-view-tabs">
                        <button className={activeView === "finalize" ? "active" : ""} onClick={() => handleChangeView("finalize")}>
                            Cash Up
                        </button>
                        <button className={activeView === "history" ? "active" : ""} onClick={() => handleChangeView("history")}>
                            History
                        </button>
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

                {hasPreviousBusinessDateOpenSession && !canReusePreviousBusinessDateOpenSession && (
                    <Card className="cashup-banner">
                        <div className="cashup-banner__content">
                            <FiAlertTriangle />
                            <div>
                                An earlier taking session for {currentSession?.businessDate} is still open. Finalise that session before starting
                                today&apos;s taking.
                            </div>
                        </div>
                    </Card>
                )}

                {/* Cash Up view: active reconciliation and finalisation screen */}
                {activeView === "finalize" && (
                    <div className="cashup-layout cashup-layout--simple">
                        <div className="cashup-layout__main">
                            <div className="cashup-section-stack">
                                <div className="cashup-kounta-panel cashup-taking-card">
                                    <div className="cashup-kounta-copy">
                                        Finalising takings at the end of day ensures that the payments recorded against each transaction are
                                        reconciled and balanced with each payment type received.
                                    </div>

                                    {!currentSession && (
                                        <div className="cashup-helper">The current takings session is created automatically when cash up opens.</div>
                                    )}

                                    <div className="cashup-kounta-title">
                                        {getTakingsScopeTitle(currentSession?.scopeType || scopeType || ETakingsScopeType.SITE)}
                                    </div>
                                    {PAYMENT_KEYS.map((key) => renderPaymentRow(key, getPaymentLabel(key)))}
                                </div>

                                <div className="cashup-float-entry">
                                    <div className="cashup-float-entry__label">Opening Float</div>
                                    <Input
                                        className="cashup-float-entry__input"
                                        type="number"
                                        value={openingFloatInput}
                                        onChange={(event) => setOpeningFloatInput(event.target.value)}
                                        disabled={!currentSession}
                                    />
                                    <Button
                                        className="cashup-float-entry__save"
                                        onClick={handleSaveOpeningFloat}
                                        loading={savingOpeningFloat}
                                        disabled={
                                            !currentSession ||
                                            savingOpeningFloat ||
                                            (!openingFloatRequiresReview && openingFloatCents === currentSession?.openingFloatCents)
                                        }
                                    >
                                        Save Float
                                    </Button>
                                </div>
                                <div className="cashup-kounta-totals">
                                    <div className="cashup-kounta-totals__row">
                                        <span>Total Counted</span>
                                        <strong>{getDollarString(totalCountedCents)}</strong>
                                    </div>
                                    <div
                                        className={`cashup-kounta-totals__row ${totalVarianceCents === 0 ? "" : totalVarianceCents > 0 ? "positive" : "negative"}`}
                                    >
                                        <span>Difference ({getDollarString(totalExpectedCents)})</span>
                                        <strong>{getDollarString(totalVarianceCents)}</strong>
                                    </div>
                                </div>

                                <div className="cashup-finalize-inline">
                                    {requiresVarianceReason && (
                                        <div className="cashup-finalize-fields">
                                            <Input
                                                label="Variance Reason (Required)"
                                                value={varianceReason}
                                                onChange={(event) => setVarianceReason(event.target.value)}
                                                disabled={!currentSession}
                                            />
                                        </div>
                                    )}

                                    <div className="cashup-finalize-actions">
                                        <Button
                                            onClick={handleOpenFinalizeModal}
                                            loading={finalizingSession}
                                            disabled={!currentSession || !restaurant.takingsEnable || !isPOS}
                                        >
                                            <FiCheckCircle />
                                            <span>Finalise Takings</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* History view: past sessions list and selected session detail */}
                {activeView === "history" && (
                    <div className={`cashup-history-layout ${selectedHistorySession ? "cashup-history-layout--with-detail" : ""}`}>
                        <div className="cashup-history-table">
                            <div className="cashup-history-table__header">
                                <span>No.</span>
                                <span>Date</span>
                                <span>User</span>
                                <span>Status</span>
                                <span />
                            </div>

                            {sessionHistory.length === 0 && <div className="cashup-helper">No sessions have been created for this scope yet.</div>}
                            {sessionHistory.map((session) => {
                                const isSelected = selectedHistorySession?.id === session.id;

                                return (
                                    <button
                                        className={`cashup-history-table__row ${isSelected ? "selected" : ""}`}
                                        key={session.id}
                                        onClick={() => setSelectedHistorySessionId(session.id)}
                                    >
                                        <span>{session.status === ETakingsSessionStatus.OPEN ? "" : session.sessionNumber}</span>
                                        <span>{formatHistoryDate(getTakingsSessionDisplayTimestamp(session))}</span>
                                        <span>{getHistoryUserLabel(session)}</span>
                                        <span>{getHistoryStatusLabel(session.status)}</span>
                                        <FiChevronRight />
                                    </button>
                                );
                            })}
                        </div>

                        <div className="cashup-history-detail">
                            {selectedHistorySession ? (
                                <>
                                    <div className="cashup-history-detail__meta">
                                        <div>Business Number: {selectedHistorySession.sessionNumber || "-"}</div>
                                        <div>End Of Day {getHistoryStatusLabel(selectedHistorySession.status)} Takings</div>
                                        <div>
                                            {formatHistoryDate(getTakingsSessionDisplayTimestamp(selectedHistorySession))} {restaurant.name}
                                        </div>
                                        <div>{getTakingsScopeHistoryLabel(selectedHistorySession.scopeType)}</div>
                                    </div>

                                    <div className="cashup-history-detail__section">
                                        <div className="cashup-history-detail__section-title">Summary</div>
                                        <div className="cashup-history-detail__summary">
                                            <div className="cashup-history-detail__summary-header">
                                                <span>Payment Type</span>
                                                <span>Counted</span>
                                                <span>Recorded</span>
                                                <span>Diff.</span>
                                            </div>
                                            {getHistorySummaryRows(selectedHistorySession).map((row) => (
                                                <div className={row.key === "total" ? "cashup-history-detail__summary-total" : ""} key={row.key}>
                                                    <span>{row.label}</span>
                                                    <span>{convertCentsToDollars(row.countedCents)}</span>
                                                    <span>{convertCentsToDollars(row.recordedCents)}</span>
                                                    <span>{convertCentsToDollars(row.differenceCents)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="cashup-history-detail__section">
                                        <div className="cashup-history-detail__section-title">Drawer & Money Movements</div>
                                        <div className="cashup-history-detail__line-list">
                                            {getHistoryDrawerRows(selectedHistorySession).map((row) => (
                                                <div key={row.label}>
                                                    <span>{row.label}</span>
                                                    <strong>{convertCentsToDollars(row.valueCents)}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="cashup-history-detail__empty">Select a session to view the summary.</div>
                            )}
                        </div>
                    </div>
                )}

                {(takingsLoading || ordersLoading || cashMovementsLoading || rollingSessionForward) && (
                    <div className="cashup-page__loading">Loading cash up data...</div>
                )}
                {ordersError && <div className="cashup-page__loading">Unable to load orders for the active cash-up business date.</div>}
            </div>
        </PageWrapper>
    );
};
