import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { FiAlertTriangle, FiArrowLeft, FiCheckCircle, FiChevronRight, FiClock, FiEdit2, FiRefreshCw } from "react-icons/fi";
import { useNavigate } from "react-router";
import { useRegister } from "../../../context/register-context";
import { useRestaurant } from "../../../context/restaurant-context";
import { useUser } from "../../../context/user-context";
import {
    ECashMovementType,
    EOrderStatus,
    ETakingsScopeType,
    ETakingsSessionStatus,
    GET_CASH_MOVEMENTS_BY_RESTAURANT_BY_OCCURRED_AT,
    GET_ORDERS_BY_RESTAURANT_BY_BETWEEN_PLACEDAT,
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
import { convertCentsToDollars, getDollarString } from "../../../util/util";
import { beginOrderPath, dashboardPath } from "../../main";
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
    getHistoryStatusLabel,
    getOrderDateRange,
    getPaymentLabel,
    getTakingsScopeHistoryLabel,
    getTakingsScopeTitle,
    isCashDrawerMovement,
    orderMatchesTakingsScope,
    resolveTakingsScope,
    sortSessions,
    toCents,
    toWholeNumber,
} from "./cashManagementSupport";

import "./cashUp.scss";

export default () => {
    const navigate = useNavigate();
    const { restaurant } = useRestaurant();
    const { register, isPOS } = useRegister();
    const { user } = useUser();

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
    const [warningModalDismissed, setWarningModalDismissed] = useState(false);
    const autoCreateKeyRef = useRef<string | null>(null);
    const hydratedSessionIdRef = useRef<string | null>(null);

    const businessDate = getBusinessDate();
    const resolvedScope = useMemo(
        () =>
            resolveTakingsScope({
                restaurantId: restaurant?.id,
                registerId: register?.id,
                staffId: user?.id,
                defaultScope: restaurant?.takingsDefaultScope,
            }),
        [register?.id, restaurant?.id, restaurant?.takingsDefaultScope, user?.id],
    );
    const scopeType = resolvedScope?.scopeType || ETakingsScopeType.SITE;
    const scopeId = resolvedScope?.scopeId || "";
    const scopeKey = resolvedScope?.scopeKey || "";

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

    const [createTakingsSession, { loading: creatingSession }] = useMutation(CREATE_TAKINGS_SESSION);
    const [updateTakingsSession, { loading: finalizingSession }] = useMutation(UPDATE_TAKINGS_SESSION);
    const [updateDraftTakingsSession, { loading: savingOpeningFloat }] = useMutation(UPDATE_TAKINGS_SESSION);

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
    // Filters cash movements to the active date, session, and scope.
    const activeBusinessDateCashMovements: IGET_CASH_MOVEMENT[] = useMemo(
        () =>
            (cashMovementsData?.getCashMovementsByRestaurantByOccurredAt?.items || []).filter((movement) => {
                const belongsToSession = currentSession?.id ? !movement.takingsSessionId || movement.takingsSessionId === currentSession.id : true;
                const belongsToScope = movement.scopeKey ? movement.scopeKey === scopeKey : scopeType === ETakingsScopeType.SITE;
                return movement.businessDate === activeBusinessDate && belongsToSession && belongsToScope;
            }),
        [activeBusinessDate, cashMovementsData, currentSession?.id, scopeKey, scopeType],
    );

    // Sums the cash movements used in reconciliation.
    const recordedTotals = useMemo(() => buildRecordedTotals(activeBusinessDateOrders), [activeBusinessDateOrders]);
    const cashMovementTotals = useMemo(() => {
        const totals = {
            moneyInCents: 0,
            moneyOutCents: 0,
            cashDropsCents: 0,
            tipPayoutsCents: 0,
        };

        activeBusinessDateCashMovements.filter(isCashDrawerMovement).forEach((movement) => {
            const amountCents = movement.amountCents || 0;

            if (movement.type === ECashMovementType.MONEY_IN) totals.moneyInCents += amountCents;
            if (movement.type === ECashMovementType.MONEY_OUT) totals.moneyOutCents += amountCents;
            if (movement.type === ECashMovementType.CASH_DROP) totals.cashDropsCents += amountCents;
            if (movement.type === ECashMovementType.TIP_PAYOUT) totals.tipPayoutsCents += amountCents;
        });

        return totals;
    }, [activeBusinessDateCashMovements]);

    const orderWarnings = useMemo(() => {
        const initial = {
            openOrdersCount: 0,
            parkedOrdersCount: 0,
            unpaidOrdersCount: 0,
        };

        activeBusinessDateOrders?.forEach((order) => {
            if (order.status === EOrderStatus.CANCELLED || order.status === EOrderStatus.REFUNDED) return;

            if (order.status === EOrderStatus.NEW) initial.openOrdersCount += 1;
            if (order.status === EOrderStatus.PARKED) initial.parkedOrdersCount += 1;
            if (!order.paid) initial.unpaidOrdersCount += 1;
        });

        return initial;
    }, [activeBusinessDateOrders]);

    // Loads the form from the current session without resetting it on every refetch.
    useEffect(() => {
        const hydrationKey = currentSession?.id || `new:${scopeKey}:${businessDate}`;
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

        setOpeningFloatInput(convertCentsToDollars(currentSession.openingFloatCents));
        setCountedPaymentInputs(createPaymentInputs({ cash: currentSession.countedDrawerCashCents }));
        setVarianceReason(currentSession.varianceReason || "");
        setNotes(currentSession.notes || "");
        setAcknowledgedWarnings(false);
    }, [businessDate, currentSession, scopeKey]);

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

    const openingFloatCents = toCents(openingFloatInput);

    // Expected cash = opening float + cash sales + cash movements.
    const expectedDrawerCashCents =
        openingFloatCents +
        recordedTotals.cash +
        cashMovementTotals.moneyInCents -
        cashMovementTotals.moneyOutCents -
        cashMovementTotals.cashDropsCents -
        cashMovementTotals.tipPayoutsCents;

    const countedDrawerCashCents = countedTotals.cash;
    const cashVarianceCents = countedDrawerCashCents - expectedDrawerCashCents;
    const unresolvedOrdersCount = orderWarnings.openOrdersCount + orderWarnings.parkedOrdersCount + orderWarnings.unpaidOrdersCount;
    const varianceThresholdCents = restaurant?.takingsVarianceReasonThresholdCents ?? 5000;
    // Variance reason is required only when the variance passes the threshold.
    const requiresVarianceReason = Math.abs(cashVarianceCents) > varianceThresholdCents;
    const blocksFinalize = !!restaurant?.takingsBlockIfOpenOrders && unresolvedOrdersCount > 0;
    // New sessions need the opening float to be saved once.
    const openingFloatRequiresReview =
        !!currentSession && currentSession.openingFloatCents === 0 && !reviewedOpeningFloatSessionIds.includes(currentSession.id);

    // Reloads all cash-up data.
    const handleRefresh = useCallback(async () => {
        await Promise.allSettled([refetchTakingsSessions(), refetchOrders(), refetchCashMovements()]);
    }, [refetchCashMovements, refetchOrders, refetchTakingsSessions]);

    // Creates a new open session for the current scope.
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
            if (!restaurant || !user || !scopeType || !scopeId || !scopeKey) return null;

            try {
                const sameDaySessions = allSessions.filter((session) => session.businessDate === sessionBusinessDate);
                const sessionNumber = sameDaySessions.reduce((max, session) => Math.max(max, session.sessionNumber), 0) + 1;

                const result = await createTakingsSession({
                    variables: {
                        restaurantId: restaurant.id,
                        businessDate: sessionBusinessDate,
                        scopeType,
                        scopeId,
                        scopeKey,
                        sessionNumber,
                        status: ETakingsSessionStatus.OPEN,
                        openedAt: new Date().toISOString(),
                        openedBy: user.id,
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
        [allSessions, businessDate, createTakingsSession, refetchTakingsSessions, restaurant, scopeId, scopeKey, scopeType, user],
    );

    useEffect(() => {
        // Auto-creates a session when cash up opens and none exists yet.
        if (!restaurant?.takingsEnable || !restaurant?.id || !user || !isPOS || !scopeType || !scopeId || !scopeKey) return;
        if (takingsLoading || creatingSession) return;
        if (currentSession) {
            autoCreateKeyRef.current = `${scopeKey}:${businessDate}`;
            return;
        }

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
        user,
    ]);

    // Resets the warning modal when the session changes.
    useEffect(() => {
        setWarningModalDismissed(false);
        if (unresolvedOrdersCount === 0) setShowWarningModal(false);
    }, [currentSession?.id, unresolvedOrdersCount]);

    useEffect(() => {
        if (activeView !== "finalize") return;
        if (unresolvedOrdersCount === 0 || warningModalDismissed) return;

        // Shows the unresolved-order warning modal.
        setShowWarningModal(true);
    }, [activeView, unresolvedOrdersCount, warningModalDismissed]);

    // Finalises the current session and opens the next one.
    const handleFinalizeSession = async () => {
        if (!currentSession || !user) return;

        if (openingFloatRequiresReview) {
            toast.error("Confirm and save the opening float for this session before finalising.");
            return;
        }

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
            const finalizedSessionId = currentSession.id;

            await updateTakingsSession({
                variables: {
                    id: finalizedSessionId,
                    openingFloatCents,
                    status: ETakingsSessionStatus.FINALIZED,
                    finalizedAt: new Date().toISOString(),
                    finalizedBy: user.id,
                    cashSalesCents: recordedTotals.cash,
                    cashRefundsCents: 0,
                    moneyInCents: cashMovementTotals.moneyInCents,
                    moneyOutCents: cashMovementTotals.moneyOutCents,
                    cashDropsCents: cashMovementTotals.cashDropsCents,
                    tipPayoutsCents: cashMovementTotals.tipPayoutsCents,
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

            // Creates the next open session right after finalising.
            await handleCreateCurrentSession({
                sessionBusinessDate: businessDate,
                initialOpeningFloatCents: 0,
                requireOpeningFloatReview: true,
            });

            toast.success("Takings finalised.");
            setActiveView("history");
            setSelectedHistorySessionId(finalizedSessionId);
            setEntryPaymentKey(null);
            hydratedSessionIdRef.current = null;
            await refetchTakingsSessions();
        } catch (error) {
            console.error(error);
            toast.error("Unable to finalise takings.");
        }
    };

    // Opens the finalise modal after basic checks pass.
    const handleOpenFinalizeModal = () => {
        if (!currentSession || blocksFinalize || !restaurant?.takingsEnable || !isPOS) return;
        if (openingFloatRequiresReview) {
            toast.error("Confirm and save the opening float for this session before finalising.");
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
        setWarningModalDismissed(true);
    };

    // Accepts the warnings and lets finalising continue.
    const handleContinueFromWarningModal = () => {
        setAcknowledgedWarnings(true);
        setShowWarningModal(false);
        setWarningModalDismissed(true);
    };

    // Saves the opening float on the current session.
    const handleSaveOpeningFloat = async () => {
        if (!currentSession) return;

        try {
            // Saves the reviewed opening float to the session.
            await updateDraftTakingsSession({
                variables: {
                    id: currentSession.id,
                    openingFloatCents,
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
        const currentUserName = user ? `${user.firstName} ${user.lastName}`.trim() : "";

        if (sessionUserId && user?.id === sessionUserId && currentUserName) return currentUserName;
        return sessionUserId || "-";
    };

    // Builds the history summary rows for one session.
    const getHistorySummaryRows = (session: IGET_TAKINGS_SESSION) => {
        const cashRecordedCents = session.expectedDrawerCashCents || 0;
        const cashCountedCents = session.countedDrawerCashCents || 0;
        const rows: Array<{ key: string; label: string; countedCents: number; recordedCents: number; differenceCents: number }> = PAYMENT_KEYS.map(
            (key) => {
                const recordedCents = key === "cash" ? cashRecordedCents : 0;
                const countedCents = key === "cash" ? cashCountedCents : 0;

                return {
                    key,
                    label: getPaymentLabel(key),
                    countedCents,
                    recordedCents,
                    differenceCents: key === "cash" ? (session.varianceCents ?? countedCents - recordedCents) : countedCents - recordedCents,
                };
            },
        );

        rows.push({
            key: "total",
            label: "Total",
            countedCents: cashCountedCents,
            recordedCents: cashRecordedCents,
            differenceCents: session.varianceCents ?? cashCountedCents - cashRecordedCents,
        });

        return rows;
    };

    // Renders the payment count modal.
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

    // Renders one payment row.
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

    return (
        <PageWrapper>
            <div className="cashup-page">
                <ModalV2 padding="0" width="560px" isOpen={showWarningModal} disableClose={false} onRequestClose={handleCloseWarningModal}>
                    <div className="cashup-warning-modal">
                        <div className="cashup-warning-modal__header">
                            <FiAlertTriangle />
                            <div>
                                <h3>Open orders need attention</h3>
                                <p>
                                    Resolve open, parked, or unpaid orders before finalising takings. If you continue, those orders may sit outside
                                    the final reconciliation.
                                </p>
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
                            <div className="cashup-helper cashup-helper--error">
                                This restaurant blocks takings finalisation until those orders are resolved.
                            </div>
                        ) : (
                            <div className="cashup-helper">
                                You can continue to count takings, but finalising means you accept these unresolved order warnings.
                            </div>
                        )}

                        <div className="cashup-warning-modal__footer">
                            <Button className="cashup-step-footer__ghost" onClick={() => navigate(dashboardPath)}>
                                Go To Orders
                            </Button>
                            {!blocksFinalize && <Button onClick={handleContinueFromWarningModal}>Continue To Cash Up</Button>}
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
                        <button className={activeView === "finalize" ? "active" : ""} onClick={() => setActiveView("finalize")}>
                            Cash Up
                        </button>
                        <button className={activeView === "history" ? "active" : ""} onClick={() => setActiveView("history")}>
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

                {hasPreviousBusinessDateOpenSession && (
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
                                        <strong>{getDollarString(countedDrawerCashCents)}</strong>
                                    </div>
                                    <div
                                        className={`cashup-kounta-totals__row ${cashVarianceCents === 0 ? "" : cashVarianceCents > 0 ? "positive" : "negative"}`}
                                    >
                                        <span>Difference ({getDollarString(expectedDrawerCashCents)})</span>
                                        <strong>{getDollarString(cashVarianceCents)}</strong>
                                    </div>
                                </div>

                                <div className="cashup-finalize-inline">
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
                                            disabled={!currentSession || blocksFinalize || !restaurant.takingsEnable || !isPOS}
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
                                        <span>{formatHistoryDate(session.finalizedAt || session.openedAt)}</span>
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
                                            {formatHistoryDate(selectedHistorySession.finalizedAt || selectedHistorySession.openedAt)}{" "}
                                            {restaurant.name}
                                        </div>
                                        <div>{getTakingsScopeHistoryLabel(selectedHistorySession.scopeType)}</div>
                                    </div>

                                    <div className="cashup-history-detail__summary-title">Summary</div>
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
                                </>
                            ) : (
                                <div className="cashup-history-detail__empty">Select a session to view the summary.</div>
                            )}
                        </div>
                    </div>
                )}

                {(takingsLoading || ordersLoading || cashMovementsLoading) && <div className="cashup-page__loading">Loading cash up data...</div>}
                {ordersError && <div className="cashup-page__loading">Unable to load orders for the active cash-up business date.</div>}
            </div>
        </PageWrapper>
    );
};
