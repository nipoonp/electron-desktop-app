import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { FiArrowLeft, FiChevronRight } from "react-icons/fi";
import { useNavigate } from "react-router";
import { useRegister } from "../../../context/register-context";
import { useRestaurant } from "../../../context/restaurant-context";
import { useUser } from "../../../context/user-context";
import { CREATE_CASH_MOVEMENT, CREATE_TAKINGS_SESSION } from "../../../graphql/customMutations";
import {
    ECashMovementType,
    ETakingsScopeType,
    ETakingsSessionStatus,
    GET_CASH_MOVEMENTS_BY_RESTAURANT_BY_OCCURRED_AT,
    GET_TAKINGS_SESSIONS_BY_SCOPE_KEY_BY_OPENED_AT,
    IGET_CASH_MOVEMENT,
    IGET_TAKINGS_SESSION,
} from "../../../graphql/customQueries";
import { Button } from "../../../tabin/components/button";
import { Input } from "../../../tabin/components/input";
import { ModalV2 } from "../../../tabin/components/modalv2";
import { PageWrapper } from "../../../tabin/components/pageWrapper";
import { toast } from "../../../tabin/components/toast";
import { getDollarString } from "../../../util/util";
import { beginOrderPath } from "../../main";
import {
    MONEY_MOVEMENT_PAYMENT_METHODS,
    TMoneyInOutView,
    TMoneyMovementDirection,
    TMoneyMovementPaymentMethod,
    formatHistoryDate,
    getBusinessDate,
    getMovementDateRange,
    getMovementPaymentLabel,
    getMovementReasonText,
    getMovementTypeLabel,
    getPaymentMethodValue,
    resolveTakingsScope,
    toCents,
} from "./cashManagementSupport";

import "./moneyInOut.scss";

export default () => {
    const navigate = useNavigate();
    const { restaurant } = useRestaurant();
    const { register, isPOS } = useRegister();
    const { user } = useUser();
    const [activeView, setActiveView] = useState<TMoneyInOutView>("entry");
    const [amountInput, setAmountInput] = useState("");
    const [reason, setReason] = useState("");
    const [pendingDirection, setPendingDirection] = useState<TMoneyMovementDirection | null>(null);
    const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);
    const [createdSession, setCreatedSession] = useState<IGET_TAKINGS_SESSION | null>(null);

    const businessDate = getBusinessDate();
    const resolvedScope = useMemo(
        () =>
            resolveTakingsScope({
                restaurantId: restaurant?.id,
                registerId: register?.id,
                staffId: user?.id,
                defaultScope: restaurant?.takingsDefaultScope,
            }),
        [register?.id, restaurant?.id, restaurant?.takingsDefaultScope, user?.id]
    );
    const scopeType = resolvedScope?.scopeType || ETakingsScopeType.SITE;
    const scopeId = resolvedScope?.scopeId || "";
    const scopeKey = resolvedScope?.scopeKey || "";

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
        return (
            items
                .filter((session) => session.scopeKey === scopeKey && session.status === ETakingsSessionStatus.OPEN)
                .sort((left, right) => new Date(right.openedAt).getTime() - new Date(left.openedAt).getTime())[0] || null
        );
    }, [scopeKey, takingsSessionsData]);

    const currentSession = useMemo(() => {
        if (queriedCurrentSession) return queriedCurrentSession;
        if (createdSession?.scopeKey === scopeKey && createdSession.status === ETakingsSessionStatus.OPEN) return createdSession;
        return null;
    }, [createdSession, queriedCurrentSession, scopeKey]);
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

    const cashMovementLoading = takingsSessionsLoading || restaurantCashMovementLoading;
    const cashMovementError = takingsSessionsError || restaurantCashMovementError;

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

    // Reloads sessions and money history.
    const refetchCashMovements = async () => {
        await refetchTakingsSessions();
        await refetchRestaurantCashMovements();
    };

    const selectedMovement = movements.find((movement) => movement.id === selectedMovementId) || movements[0] || null;

    // Builds the user label for history.
    const getMovementUserLabel = (movement: IGET_CASH_MOVEMENT) => {
        const currentUserName = user ? `${user.firstName} ${user.lastName}`.trim() : "";
        if (movement.createdBy && movement.createdBy === user?.id && currentUserName) return currentUserName;
        return movement.createdBy || "-";
    };

    // Builds the initials for the selected user.
    const getMovementInitials = (movement: IGET_CASH_MOVEMENT) => {
        const label = getMovementUserLabel(movement);
        const words = label.split(" ").filter(Boolean);
        if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
        return label.slice(0, 2).toUpperCase();
    };

    // Returns the current session or creates one if needed.
    const ensureCurrentSession = async (): Promise<IGET_TAKINGS_SESSION | null> => {
        if (currentSession) return currentSession;
        if (!restaurant || !user || !scopeType || !scopeId || !scopeKey) return null;

        const sessions: IGET_TAKINGS_SESSION[] = takingsSessionsData?.getTakingsSessionsByScopeKeyByOpenedAt?.items || [];
        const sameDaySessions = sessions.filter((session) => session.businessDate === businessDate);
        const sessionNumber = sameDaySessions.reduce((max, session) => Math.max(max, session.sessionNumber), 0) + 1;

        const result = await createTakingsSession({
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

    // Checks the entry and opens the payment-method modal.
    const openMethodModal = async (direction: TMoneyMovementDirection) => {
        if (!restaurant || !register || !user || !isPOS) return;
        if (takingsSessionsLoading || creatingSession) {
            toast.error("Cash-up session is still loading. Try again.");
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

    // Saves the money movement and refreshes history.
    const saveCashMovement = async (paymentMethod: TMoneyMovementPaymentMethod) => {
        if (!restaurant || !register || !user || !pendingDirection || !currentSession) return;

        const amountCents = toCents(amountInput);
        if (amountCents <= 0) {
            toast.error("Enter a valid amount before saving.");
            return;
        }

        try {
            await createCashMovement({
                variables: {
                    input: {
                        restaurantId: restaurant.id,
                        registerId: register.id,
                        staffId: user.id,
                        takingsSessionId: currentSession.id,
                        scopeKey,
                        businessDate: activeBusinessDate,
                        occurredAt: new Date().toISOString(),
                        type: pendingDirection,
                        paymentMethod: getPaymentMethodValue(paymentMethod),
                        amountCents,
                        reason: reason.trim() || null,
                        createdBy: user.id,
                        owner: user.id,
                    },
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

    // Renders the payment-method modal.
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
                                className={index === 0 ? "money-movement-method-modal__option" : "money-movement-method-modal__option money-movement-method-modal__option--ghost"}
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

                {activeView === "entry" && (
                    <div className="money-movement-entry">
                        <div className="money-movement-panel">
                            <div className="money-movement-copy">Float management, petty cash, cash refunds and cash on delivery for your suppliers.</div>
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
                                    <Input className="money-movement-form__input" value={reason} onChange={(event) => setReason(event.target.value)} />
                                </div>
                            </div>

                            <div className="money-movement-actions">
                                <Button onClick={() => openMethodModal(ECashMovementType.MONEY_IN)} disabled={!restaurant || !register || !isPOS || creatingSession}>
                                    Save Money In
                                </Button>
                                <Button onClick={() => openMethodModal(ECashMovementType.MONEY_OUT)} disabled={!restaurant || !register || !isPOS || creatingSession}>
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

                            {cashMovementError && <div className="money-movement-history__empty">Unable to load money history. Check the AppSync environment and CashMovement index.</div>}
                            {cashMovementLoading && <div className="money-movement-history__empty">Loading money history...</div>}
                            {!cashMovementError && !cashMovementLoading && movements.length === 0 && <div className="money-movement-history__empty">No money movements recorded today.</div>}
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
