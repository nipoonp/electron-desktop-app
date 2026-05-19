import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { FiAlertTriangle, FiArrowLeft, FiChevronRight } from "react-icons/fi";
import { useNavigate } from "react-router";
import { usePosUser } from "../../../context/pos-user-context";
import { useRegister } from "../../../context/register-context";
import { useRestaurant } from "../../../context/restaurant-context";
import { useUser } from "../../../context/user-context";
import { CREATE_CASH_MOVEMENT, CREATE_TAKINGS_SESSION, UPDATE_TAKINGS_SESSION } from "../../../graphql/customMutations";
import {
    ECashMovementType,
    ETakingsScopeType,
    ETakingsSessionStatus,
    GET_CASH_MOVEMENTS_BY_RESTAURANT_BY_OCCURRED_AT,
    GET_TAKINGS_SESSION,
    GET_TAKINGS_SESSIONS_BY_SCOPE_KEY_BY_OPENED_AT,
    IGET_CASH_MOVEMENT,
    IGET_TAKINGS_SESSION,
} from "../../../graphql/customQueries";
import { Button } from "../../../tabin/components/button";
import { Card } from "../../../tabin/components/card";
import { Input } from "../../../tabin/components/input";
import { ModalV2 } from "../../../tabin/components/modalv2";
import { PageWrapper } from "../../../tabin/components/pageWrapper";
import { toast } from "../../../tabin/components/toast";
import { getDollarString, toLocalISOString } from "../../../util/util";
import { beginOrderPath } from "../../main";
import {
    MONEY_MOVEMENT_PAYMENT_METHODS,
    TMoneyInOutView,
    TMoneyMovementDirection,
    TMoneyMovementPaymentMethod,
    buildTakingsScopeStorageKey,
    formatHistoryDate,
    getBusinessDate,
    getMovementDateRange,
    getMovementPaymentLabel,
    getMovementReasonText,
    getMovementTypeLabel,
    getPaymentMethodValue,
    isReusableOpenTakingsSession,
    resolveTakingsScope,
    sortSessions,
    toCents,
} from "./cashManagementSupport";

import "./moneyInOut.scss";

export default () => {
    // Money In/Out page: records cash movements against the active takings session
    // and exposes a history view for the current business date.
    // This component maintains the current session state, validates movement entry,
    // and refreshes session data while the page is visible.
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
    const [activeView, setActiveView] = useState<TMoneyInOutView>("entry");
    const [amountInput, setAmountInput] = useState("");
    const [reason, setReason] = useState("");
    const [pendingDirection, setPendingDirection] = useState<TMoneyMovementDirection | null>(null);
    const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);
    const [createdSession, setCreatedSession] = useState<IGET_TAKINGS_SESSION | null>(null);
    const lastActivityTouchRef = useRef<number>(0);

    const businessDate = getBusinessDate();
    const takingsScopeStorageKey = useMemo(() => buildTakingsScopeStorageKey(restaurant?.id, register?.id), [register?.id, restaurant?.id]);
    const persistedScopeType = useMemo(() => {
        if (!isPOS || !restaurant?.takingsAllowScopeSwitch) return null;
        const storedScopeType = localStorage.getItem(takingsScopeStorageKey) as ETakingsScopeType | null;
        return storedScopeType;
    }, [isPOS, restaurant?.takingsAllowScopeSwitch, takingsScopeStorageKey]);
    const resolvedScope = useMemo(
        () =>
            resolveTakingsScope({
                restaurantId: restaurant?.id,
                registerId: register?.id,
                staffId: effectiveCashUserId,
                defaultScope: persistedScopeType || restaurant?.takingsDefaultScope,
            }),
        [effectiveCashUserId, persistedScopeType, register?.id, restaurant?.id, restaurant?.takingsDefaultScope],
    );
    const scopeType = resolvedScope?.scopeType || ETakingsScopeType.SITE;
    const scopeId = resolvedScope?.scopeId || "";
    const scopeKey = resolvedScope?.scopeKey || "";

    // Load any open takings sessions for the resolved scope so the page can
    // determine the active session and create a new one when necessary.
    const {
        data: takingsSessionsData,
        loading: takingsSessionsLoading,
        error: takingsSessionsError,
        refetch: refetchTakingsSessions,
    } = useQuery(GET_TAKINGS_SESSIONS_BY_SCOPE_KEY_BY_OPENED_AT, {
        variables: {
            scopeKey,
            limit: 100,
        },
        skip: !scopeKey,
        fetchPolicy: "network-only",
    });

    const queriedCurrentSession: IGET_TAKINGS_SESSION | null = useMemo(() => {
        const items: IGET_TAKINGS_SESSION[] = takingsSessionsData?.getTakingsSessionsByScopeKeyByOpenedAt?.items || [];
        return sortSessions(items.filter((session) => session.scopeKey === scopeKey && session.status === ETakingsSessionStatus.OPEN))[0] || null;
    }, [scopeKey, takingsSessionsData]);

    const currentSession = useMemo(() => {
        if (queriedCurrentSession) return queriedCurrentSession;
        if (createdSession?.scopeKey === scopeKey && createdSession.status === ETakingsSessionStatus.OPEN) return createdSession;
        return null;
    }, [createdSession, queriedCurrentSession, scopeKey]);
    const hasPreviousBusinessDateOpenSession = !!currentSession && currentSession.businessDate !== businessDate;
    const activeBusinessDate = currentSession?.businessDate || businessDate;
    const movementDateRange = useMemo(() => getMovementDateRange(activeBusinessDate), [activeBusinessDate]);

    const {
        data: restaurantCashMovementData,
        loading: restaurantCashMovementLoading,
        error: restaurantCashMovementError,
        refetch: refetchRestaurantCashMovements,
    } = useQuery(GET_CASH_MOVEMENTS_BY_RESTAURANT_BY_OCCURRED_AT, {
        variables: {
            restaurantId: restaurant?.id || "",
            occurredAt: { between: [movementDateRange.start, movementDateRange.end] },
            limit: 1000,
        },
        skip: !restaurant?.id || takingsSessionsLoading,
        fetchPolicy: "network-only",
    });

    const [createCashMovement, { loading: savingMovement }] = useMutation(CREATE_CASH_MOVEMENT);
    const [createTakingsSession, { loading: creatingSession }] = useMutation(CREATE_TAKINGS_SESSION);
    const [updateTakingsSession, { loading: rollingSessionForward }] = useMutation(UPDATE_TAKINGS_SESSION);

    const cashMovementLoading = takingsSessionsLoading || restaurantCashMovementLoading || rollingSessionForward;
    const cashMovementError = takingsSessionsError || restaurantCashMovementError;

    // Build the money movement history list for the active business date and scope.
    // This includes legacy site-only rows and excludes movements from other scopes.
    const movements: IGET_CASH_MOVEMENT[] = useMemo(() => {
        const items: IGET_CASH_MOVEMENT[] = restaurantCashMovementData?.getCashMovementsByRestaurantByOccurredAt?.items || [];

        return items
            .filter((movement) => {
                // Keeps legacy rows only for site scope.
                const belongsToScope = movement.scopeKey ? movement.scopeKey === scopeKey : scopeType === ETakingsScopeType.SITE;
                return movement.businessDate === activeBusinessDate && belongsToScope;
            })
            .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());
    }, [activeBusinessDate, restaurantCashMovementData, scopeKey, scopeType]);
    const currentSessionMovements = useMemo(
        () => (currentSession ? movements.filter((movement) => movement.takingsSessionId === currentSession.id) : []),
        [currentSession, movements],
    );
    const canRefreshOpenSessionTimestamp = useMemo(
        () => !!currentSession && isReusableOpenTakingsSession(currentSession, currentSessionMovements),
        [currentSession, currentSessionMovements],
    );
    const canReusePreviousBusinessDateOpenSession = useMemo(
        () => hasPreviousBusinessDateOpenSession && canRefreshOpenSessionTimestamp,
        [canRefreshOpenSessionTimestamp, hasPreviousBusinessDateOpenSession],
    );

    // Reloads sessions and money history.
    const refetchCashMovements = async () => {
        await refetchTakingsSessions();
        await refetchRestaurantCashMovements();
    };

    const touchCurrentSessionActivity = useCallback(async () => {
        if (!currentSession || currentSession.status !== ETakingsSessionStatus.OPEN) return;
        if (currentSession.businessDate !== businessDate) return;
        if (rollingSessionForward || creatingSession) return;

        const now = Date.now();
        if (now - lastActivityTouchRef.current < 30_000) return;

        try {
            const activityAt = new Date(now).toISOString();
            await updateTakingsSession({
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
    }, [businessDate, creatingSession, currentSession, refetchTakingsSessions, rollingSessionForward, updateTakingsSession]);

    useEffect(() => {
        const refreshVisibleMoneyData = async () => {
            if (document.visibilityState === "visible") {
                await touchCurrentSessionActivity();
                await refetchCashMovements();
            }
        };

        window.addEventListener("focus", refreshVisibleMoneyData);
        document.addEventListener("visibilitychange", refreshVisibleMoneyData);

        return () => {
            window.removeEventListener("focus", refreshVisibleMoneyData);
            document.removeEventListener("visibilitychange", refreshVisibleMoneyData);
        };
    }, [refetchCashMovements, touchCurrentSessionActivity]);

    const selectedMovement = movements.find((movement) => movement.id === selectedMovementId) || movements[0] || null;

    // Builds the user label for history.
    const getMovementUserLabel = (movement: IGET_CASH_MOVEMENT) => {
        if (movement.createdBy && movement.createdBy === effectiveCashUserId && effectiveCashUserName) return effectiveCashUserName;
        return movement.createdBy || "-";
    };

    // Builds the initials for the selected user.
    const getMovementInitials = (movement: IGET_CASH_MOVEMENT) => {
        const label = getMovementUserLabel(movement);
        const words = label.split(" ").filter(Boolean);
        if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
        return label.slice(0, 2).toUpperCase();
    };

    // Ensures there is an active takings session for the current scope.
    // If an open session already exists, it may refresh the session timestamp or
    // roll it forward to the current business date before returning it.
    // If no open session exists, this helper creates a new placeholder session.
    const ensureCurrentSession = async (): Promise<IGET_TAKINGS_SESSION | null> => {
        if (currentSession) {
            if (!effectiveCashUserId) return null;
            const shouldRefreshOpenSession =
                currentSession.businessDate !== businessDate ? canReusePreviousBusinessDateOpenSession : canRefreshOpenSessionTimestamp;

            if (!shouldRefreshOpenSession) {
                return currentSession.businessDate === businessDate ? currentSession : null;
            }

            try {
                const sessions: IGET_TAKINGS_SESSION[] = takingsSessionsData?.getTakingsSessionsByScopeKeyByOpenedAt?.items || [];
                const shouldMoveToCurrentBusinessDate = currentSession.businessDate !== businessDate;
                const sameDaySessions = shouldMoveToCurrentBusinessDate
                    ? sessions.filter(
                          (session) => session.scopeKey === scopeKey && session.businessDate === businessDate && session.id !== currentSession.id,
                      )
                    : [];
                const sessionNumber = shouldMoveToCurrentBusinessDate
                    ? sameDaySessions.reduce((max, session) => Math.max(max, session.sessionNumber), 0) + 1
                    : currentSession.sessionNumber;
                const now = new Date();
                const refreshedActivityAt = now.toISOString();
                const refreshedOpenedAt = toLocalISOString(now);

                const result = await updateTakingsSession({
                    variables: {
                        id: currentSession.id,
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

                // Use the sessions list refetch to obtain the refreshed session state.
                const refreshedTakingsResult = await refetchTakingsSessions();
                const refreshedSessions: IGET_TAKINGS_SESSION[] = refreshedTakingsResult.data?.getTakingsSessionsByScopeKeyByOpenedAt?.items || [];
                const refreshedSession = refreshedSessions.find((s) => s.id === currentSession.id) || null;

                const sameDayRefreshAccepted =
                    !shouldMoveToCurrentBusinessDate && refreshedSession?.id === currentSession.id && refreshedSession?.businessDate === businessDate;

                if (
                    sameDayRefreshAccepted ||
                    (refreshedSession?.businessDate === businessDate &&
                        refreshedSession?.lastActivityAt === refreshedActivityAt &&
                        (!shouldMoveToCurrentBusinessDate || refreshedSession?.openedAtUtc === refreshedActivityAt))
                ) {
                    if (refreshedSession) setCreatedSession(refreshedSession);
                    await refetchTakingsSessions();
                    return result.data?.updateTakingsSession || refreshedSession;
                }

                await refetchTakingsSessions();
                return null;
            } catch (error) {
                throw error;
            }
        }
        if (takingsSessionsError) return null;
        if (!restaurant || !restaurant.takingsEnable || !user || !effectiveCashUserId || !scopeType || !scopeId || !scopeKey) return null;

        const sessions: IGET_TAKINGS_SESSION[] = takingsSessionsData?.getTakingsSessionsByScopeKeyByOpenedAt?.items || [];
        const sameDaySessions = sessions.filter((session) => session.businessDate === businessDate);
        const sessionNumber = sameDaySessions.reduce((max, session) => Math.max(max, session.sessionNumber), 0) + 1;

        const now = new Date();
        const openedAt = toLocalISOString(now);
        const openedAtUtc = now.toISOString();

        const result = await createTakingsSession({
            variables: {
                restaurantId: restaurant.id,
                businessDate,
                scopeType,
                scopeId,
                scopeKey,
                sessionNumber,
                status: ETakingsSessionStatus.OPEN,
                openedAt,
                openedAtUtc,
                lastActivityAt: openedAtUtc,
                openedBy: effectiveCashUserId,
                openingFloatCents: 0,
                moneyInCents: 0,
                moneyOutCents: 0,
                cashDropsCents: 0,
                tipPayoutsCents: 0,
                expectedDrawerCashCents: 0,
                countedDrawerCashCents: 0,
                varianceCents: 0,
                openOrdersCount: 0,
                unpaidOrdersCount: 0,
                parkedOrdersCount: 0,
                owner: user.id,
            },
        });

        const session = result.data?.createTakingsSession || null;
        if (session) setCreatedSession(session);
        await refetchTakingsSessions();
        return session;
    };

    // Validates amount and session state before opening the payment-method modal.
    // This ensures a valid active cash-up session exists before recording a money in/out event.
    const openMethodModal = async (direction: TMoneyMovementDirection) => {
        if (!restaurant || !restaurant.takingsEnable || !register || !user || !effectiveCashUserId || !isPOS) return;
        if (takingsSessionsLoading || creatingSession || rollingSessionForward) {
            toast.error("Cash-up session is still loading. Try again.");
            return;
        }
        if (takingsSessionsError) {
            toast.error("Unable to load the active cash-up session.");
            return;
        }

        if (hasPreviousBusinessDateOpenSession && !canReusePreviousBusinessDateOpenSession) {
            toast.error("Finalise the previous cash-up session before recording money in or out for today.");
            return;
        }

        if (toCents(amountInput) <= 0) {
            toast.error("Enter a valid amount before saving.");
            return;
        }

        try {
            const session = await ensureCurrentSession();
            if (!session) {
                toast.error("Unable to start the active cash-up session.");
                return;
            }
            setPendingDirection(direction);
        } catch (error) {
            console.error(error);
            toast.error("Unable to start the active cash-up session.");
        }
    };

    // Persists a money movement and updates the current session activity timestamp.
    // After saving, it refreshes the movement history and switches to the history view.
    const saveCashMovement = async (paymentMethod: TMoneyMovementPaymentMethod) => {
        if (!restaurant || !register || !user || !effectiveCashUserId || !pendingDirection || !currentSession) return;

        const amountCents = toCents(amountInput);
        if (amountCents <= 0) {
            toast.error("Enter a valid amount before saving.");
            return;
        }

        try {
            const occurredAt = new Date().toISOString();

            await createCashMovement({
                variables: {
                    input: {
                        restaurantId: restaurant.id,
                        registerId: register.id,
                        staffId: effectiveCashUserId,
                        takingsSessionId: currentSession.id,
                        scopeKey,
                        businessDate: activeBusinessDate,
                        occurredAt,
                        type: pendingDirection,
                        paymentMethod: getPaymentMethodValue(paymentMethod),
                        amountCents,
                        reason: reason.trim() || null,
                        createdBy: effectiveCashUserId,
                        owner: user.id,
                    },
                },
            });

            await updateTakingsSession({
                variables: {
                    id: currentSession.id,
                    lastActivityAt: occurredAt,
                },
            });

            toast.success(`${getMovementTypeLabel(pendingDirection)} saved.`);
            setAmountInput("");
            setReason("");
            setPendingDirection(null);
            await refetchCashMovements();
            setActiveView("history");
            setSelectedMovementId(null);
        } catch (error) {
            console.error(error);
            toast.error("Unable to save money movement.");
        }
    };

    // Renders the modal asking the user to choose the payment method for the current money movement.
    // Once selected, the payment is stored and history is refreshed.
    const renderMethodModal = () => {
        if (!pendingDirection) return null;

        const title = pendingDirection === ECashMovementType.MONEY_IN ? "Save Money In" : "Save Money Out";

        return (
            <ModalV2 padding="0" width="540px" isOpen={!!pendingDirection} disableClose={false} onRequestClose={() => setPendingDirection(null)}>
                <div className="money-movement-method-modal">
                    <h2>{title}</h2>
                    <p>Select the payment method for this money movement.</p>

                    <div className="money-movement-method-modal__grid">
                        {MONEY_MOVEMENT_PAYMENT_METHODS.map((method, index) => (
                            <Button
                                className={
                                    index === 0
                                        ? "money-movement-method-modal__option"
                                        : "money-movement-method-modal__option money-movement-method-modal__option--ghost"
                                }
                                disabled={savingMovement}
                                key={method.key}
                                loading={savingMovement && index === 0}
                                onClick={() => saveCashMovement(method.key)}
                            >
                                {method.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </ModalV2>
        );
    };

    return (
        <PageWrapper>
            <div className="money-movement-page">
                {renderMethodModal()}

                <div className="money-movement-page__topbar">
                    <button className="money-movement-page__back" onClick={() => navigate(beginOrderPath)}>
                        <FiArrowLeft />
                        <span>Back to POS</span>
                    </button>

                    <div className="money-movement-tabs">
                        <button className={activeView === "entry" ? "active" : ""} onClick={() => setActiveView("entry")}>
                            Money In/Out
                        </button>
                        <button className={activeView === "history" ? "active" : ""} onClick={() => setActiveView("history")}>
                            Money History
                        </button>
                    </div>

                    <div className="money-movement-page__spacer" />
                </div>

                {!restaurant?.takingsEnable && (
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

                {activeView === "entry" && (
                    <div className="money-movement-entry">
                        <div className="money-movement-panel">
                            <div className="money-movement-copy">
                                Float management, petty cash, cash refunds and cash on delivery for your suppliers.
                            </div>
                            <div className="money-movement-title">Money In/Out</div>

                            <div className="money-movement-form">
                                <div className="money-movement-form__row">
                                    <div className="money-movement-form__label">Amount</div>
                                    <Input
                                        className="money-movement-form__input"
                                        type="number"
                                        min="0"
                                        placeholder="0.00"
                                        value={amountInput}
                                        onChange={(event) => setAmountInput(event.target.value)}
                                    />
                                </div>
                                <div className="money-movement-form__row money-movement-form__row--reason">
                                    <div className="money-movement-form__label">Reason (optional)</div>
                                    <Input
                                        className="money-movement-form__input"
                                        value={reason}
                                        onChange={(event) => setReason(event.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="money-movement-actions">
                                <Button
                                    onClick={() => openMethodModal(ECashMovementType.MONEY_IN)}
                                    disabled={!restaurant?.takingsEnable || !restaurant || !register || !isPOS || creatingSession}
                                >
                                    Save Money In
                                </Button>
                                <Button
                                    onClick={() => openMethodModal(ECashMovementType.MONEY_OUT)}
                                    disabled={!restaurant?.takingsEnable || !restaurant || !register || !isPOS || creatingSession}
                                >
                                    Save Money Out
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {activeView === "history" && (
                    <div className="money-movement-history">
                        <div className="money-movement-history__table">
                            <div className="money-movement-history__header">
                                <span>User</span>
                                <span>Reason</span>
                                <span>Status</span>
                                <span>Cashout ID</span>
                                <span>Date</span>
                                <span />
                            </div>

                            {cashMovementError && (
                                <div className="money-movement-history__empty">
                                    Unable to load money history. Check the AppSync environment and CashMovement index.
                                </div>
                            )}
                            {cashMovementLoading && <div className="money-movement-history__empty">Loading money history...</div>}
                            {!cashMovementError && !cashMovementLoading && movements.length === 0 && (
                                <div className="money-movement-history__empty">No money movements recorded today.</div>
                            )}
                            {!cashMovementError &&
                                !cashMovementLoading &&
                                movements.map((movement) => {
                                    const isSelected = selectedMovement?.id === movement.id;

                                    return (
                                        <button
                                            className={`money-movement-history__row ${isSelected ? "selected" : ""}`}
                                            key={movement.id}
                                            onClick={() => setSelectedMovementId(movement.id)}
                                        >
                                            <span>{getMovementUserLabel(movement)}</span>
                                            <span>{getMovementReasonText(movement.reason)}</span>
                                            <span>{getMovementTypeLabel(movement.type)}</span>
                                            <span>{movement.id.slice(0, 8)}</span>
                                            <span>{formatHistoryDate(movement.occurredAt)}</span>
                                            <FiChevronRight />
                                        </button>
                                    );
                                })}
                        </div>

                        <div className="money-movement-history-detail">
                            {selectedMovement ? (
                                <>
                                    <div className="money-movement-history-detail__header">
                                        <div className="money-movement-history-detail__avatar">{getMovementInitials(selectedMovement)}</div>
                                        <div>
                                            <span>{formatHistoryDate(selectedMovement.occurredAt)}</span>
                                            <strong>
                                                {getMovementTypeLabel(selectedMovement.type)} - {register?.name || "POS"}
                                            </strong>
                                            <span>{getMovementUserLabel(selectedMovement)}</span>
                                        </div>
                                    </div>

                                    <div className="money-movement-history-detail__notes">
                                        <span>Notes:</span>
                                        <span>{getMovementReasonText(selectedMovement.reason)}</span>
                                    </div>

                                    <div className="money-movement-history-detail__line">
                                        <span>{getMovementPaymentLabel(selectedMovement.paymentMethod, selectedMovement.reason)}</span>
                                        <strong>{getDollarString(selectedMovement.amountCents)}</strong>
                                    </div>

                                    <div className="money-movement-history-detail__powered">Powered by Tabin</div>
                                </>
                            ) : (
                                <div className="money-movement-history-detail__empty">Select a money movement to view the details.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
};
