import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { FiAlertTriangle, FiArrowLeft, FiGrid, FiPlus, FiPrinter } from "react-icons/fi";
import { useNavigate } from "react-router";
import { useReceiptPrinter } from "../../../context/receiptPrinter-context";
import { useRegister } from "../../../context/register-context";
import { useRestaurant } from "../../../context/restaurant-context";
import { SelectReceiptPrinterModal } from "../../modals/selectReceiptPrinterModal";
import { IPrintCashUpData } from "../../../model/model";
import { IGET_RESTAURANT_REGISTER_PRINTER } from "../../../graphql/customQueries";
import {
    EMoneyMovementPaymentMethod,
    EMoneyMovementType,
    EOrderStatus,
    ECashupScopeType,
    ECashupSessionStatus,
    GET_CASHUP_ORDERS_BY_RESTAURANT_BY_BETWEEN_PLACEDAT,
    IGET_CASHUP_ORDER,
    IGET_CASHUP_SESSION,
    IGET_MONEY_MOVEMENT,
} from "../../../graphql/customQueries";
import { useCashupSession } from "../../../hooks/useCashupSession";
import { Button } from "../../../tabin/components/button";
import { Card } from "../../../tabin/components/card";
import { Input } from "../../../tabin/components/input";
import { Link } from "../../../tabin/components/link";
import { ModalV2 } from "../../../tabin/components/modalv2";
import { Select } from "../../../tabin/components/select";
import { Table } from "../../../tabin/components/table";
import { toast } from "../../../tabin/components/toast";
import { PageWrapper } from "../../../tabin/components/pageWrapper";
import { convertCentsToDollars, getDollarString } from "../../../util/util";
import { beginOrderPath, ordersPath } from "../../main";
import {
    DENOMINATIONS,
    PAYMENT_KEYS,
    TCashUpView,
    TCountMode,
    TDenominationInputs,
    TPaymentInputs,
    TPaymentKey,
    TPaymentSummarySnapshot,
    TMoneyMovementDirection,
    buildRecordedTotals,
    buildCashupDraftStorageKey,
    createDenominationInputs,
    createPaymentInputs,
    createPaymentTotals,
    formatCashupHistoryDate,
    getOrderFetchRange,
    getMoneyMovementPaymentKey,
    getHistoryStatusLabel,
    getMovementPaymentLabel,
    getMovementTypeLabel,
    getPaymentLabel,
    getSessionDisplayTimestamp,
    getSessionVarianceCents,
    getCashupScopeHistoryLabel,
    getCashupScopeTitle,
    getMoneyMovementScopeTitle,
    orderHasCashupActivityInSession,
    orderMatchesCashupScope,
    toCents,
    toWholeNumber,
} from "./cashManagementSupport";

import "./cashUp.scss";

type TCashupDraft = {
    countMode: TCountMode;
    countedPaymentInputs: TPaymentInputs;
    denominationInputs: TDenominationInputs;
    varianceReason: string;
};

export default () => {
    const navigate = useNavigate();
    const { restaurant } = useRestaurant();
    const { register, isPOS } = useRegister();
    const { printCashUpData } = useReceiptPrinter();

    const [view, setView] = useState<TCashUpView>("list");
    const [selectedHistorySessionId, setSelectedHistorySessionId] = useState<string | null>(null);
    const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);

    // Orders are only needed for cash up entry. Money movements also power the history section
    // on the main screen, so they stay loaded everywhere except a finalised cash up detail.
    const {
        businessDate,
        scopeType,
        scopeId,
        effectiveCashUserName,
        currentSession,
        staleOpenSession,
        cashupWindowStart,
        sessionHistory,
        businessDayMovements,
        currentSessionMovements,
        sessionsLoading,
        sessionsError,
        movementsLoading,
        movementsError,
        creatingSession,
        finalisingSession,
        savingMovement,
        ensureOpenSession,
        finaliseSession,
        recordMoneyMovement,
        refetchAll,
        getUserDisplayName,
        isConditionalCheckError,
    } = useCashupSession({ skipMovements: view === "detail" });

    const scopeName =
        scopeType === ECashupScopeType.REGISTER ? register?.name || "" : scopeType === ECashupScopeType.STAFF ? effectiveCashUserName : restaurant?.name || "";

    const [countMode, setCountMode] = useState<TCountMode>("counted");
    const [openingFloatInput, setOpeningFloatInput] = useState("");
    const [countedPaymentInputs, setCountedPaymentInputs] = useState<TPaymentInputs>(createPaymentInputs());
    const [denominationInputs, setDenominationInputs] = useState<TDenominationInputs>(createDenominationInputs());
    const [draftDenominationInputs, setDraftDenominationInputs] = useState<TDenominationInputs>(createDenominationInputs());
    const [varianceReason, setVarianceReason] = useState("");
    const [showDenominationModal, setShowDenominationModal] = useState(false);
    const [showFinaliseModal, setShowFinaliseModal] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [showSelectReceiptPrinterModal, setShowSelectReceiptPrinterModal] = useState(false);
    const [pendingPrintData, setPendingPrintData] = useState<IPrintCashUpData | null>(null);
    const [movementDirection, setMovementDirection] = useState<TMoneyMovementDirection>(EMoneyMovementType.MONEY_IN);
    const [movementAmountInput, setMovementAmountInput] = useState("");
    const [movementReason, setMovementReason] = useState("");

    const orderFetchRange = useMemo(() => getOrderFetchRange(businessDate), [businessDate]);

    const {
        data: ordersData,
        loading: ordersLoading,
        error: ordersError,
    } = useQuery(GET_CASHUP_ORDERS_BY_RESTAURANT_BY_BETWEEN_PLACEDAT, {
        variables: {
            orderRestaurantId: restaurant?.id || "",
            placedAtStartDate: orderFetchRange.start,
            placedAtEndDate: orderFetchRange.end,
        },
        skip: !restaurant?.id || view !== "entry",
        fetchPolicy: "network-only",
    });

    // Restore or reset the entry form when the active session changes.
    useEffect(() => {
        // Only an already saved float is restored, so a fresh cash up starts with an empty field.
        setOpeningFloatInput(currentSession?.openingFloat ? convertCentsToDollars(currentSession.openingFloat) : "");

        const storedDraft = currentSession ? localStorage.getItem(buildCashupDraftStorageKey(currentSession.id)) : null;
        if (storedDraft) {
            try {
                const draft = JSON.parse(storedDraft) as TCashupDraft;
                setCountMode(draft.countMode);
                setCountedPaymentInputs(draft.countedPaymentInputs);
                setDenominationInputs(draft.denominationInputs);
                setVarianceReason(draft.varianceReason);
                return;
            } catch (error) {
                console.error(error);
            }
        }

        setCountMode("counted");
        setCountedPaymentInputs(createPaymentInputs());
        setDenominationInputs(createDenominationInputs());
        setVarianceReason("");
    }, [currentSession?.id]);

    useEffect(() => {
        if (!currentSession) return;

        const draft: TCashupDraft = { countMode, countedPaymentInputs, denominationInputs, varianceReason };
        localStorage.setItem(buildCashupDraftStorageKey(currentSession.id), JSON.stringify(draft));
    }, [countMode, countedPaymentInputs, currentSession, denominationInputs, varianceReason]);

    const activeSessionOrders: IGET_CASHUP_ORDER[] = useMemo(
        () =>
            (ordersData?.getOrdersByRestaurantByPlacedAt?.items || []).filter(
                (order: IGET_CASHUP_ORDER) =>
                    orderMatchesCashupScope(order, scopeType || ECashupScopeType.SITE, scopeId) && orderHasCashupActivityInSession(order, cashupWindowStart),
            ),
        [ordersData, scopeId, scopeType, cashupWindowStart],
    );

    const baseRecordedTotals = useMemo(() => buildRecordedTotals(activeSessionOrders, cashupWindowStart), [activeSessionOrders, cashupWindowStart]);

    const paymentMovementTotals = useMemo(() => {
        const moneyInTotals = createPaymentTotals();
        const moneyOutTotals = createPaymentTotals();

        currentSessionMovements.forEach((movement) => {
            const paymentKey = getMoneyMovementPaymentKey(movement.paymentMethod);
            if (movement.type === EMoneyMovementType.MONEY_IN) moneyInTotals[paymentKey] += movement.amount || 0;
            if (movement.type === EMoneyMovementType.MONEY_OUT) moneyOutTotals[paymentKey] += movement.amount || 0;
        });

        return { moneyInTotals, moneyOutTotals };
    }, [currentSessionMovements]);

    const openingFloatCents = toCents(openingFloatInput);

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

    const orderWarnings = useMemo(() => {
        const counts = { openOrdersCount: 0, parkedOrdersCount: 0, unpaidOrdersCount: 0, paidOpenOrdersCount: 0 };

        activeSessionOrders.forEach((order) => {
            if (order.status === EOrderStatus.CANCELLED || order.status === EOrderStatus.REFUNDED) return;

            if (order.status === EOrderStatus.PARKED) {
                counts.parkedOrdersCount += 1;
                return;
            }

            if (!order.paid) {
                if (order.status === EOrderStatus.NEW) counts.openOrdersCount += 1;
                else counts.unpaidOrdersCount += 1;
                return;
            }

            if (order.status === EOrderStatus.NEW) counts.paidOpenOrdersCount += 1;
        });

        return counts;
    }, [activeSessionOrders]);

    const countedCashFromDenominationsCents = DENOMINATIONS.reduce(
        (total, denomination) => total + denomination * toWholeNumber(denominationInputs[String(denomination)]),
        0,
    );
    const draftCountedCashFromDenominationsCents = DENOMINATIONS.reduce(
        (total, denomination) => total + denomination * toWholeNumber(draftDenominationInputs[String(denomination)]),
        0,
    );

    const countedTotals = PAYMENT_KEYS.reduce((accumulator, key) => {
        accumulator[key] = key === "cash" && countMode === "denominations" ? countedCashFromDenominationsCents : toCents(countedPaymentInputs[key]);
        return accumulator;
    }, createPaymentTotals());

    const totalRecordedCents = PAYMENT_KEYS.reduce((total, key) => total + recordedTotals[key], 0);
    const totalCountedCents = PAYMENT_KEYS.reduce((total, key) => total + countedTotals[key], 0);
    const totalVarianceCents = totalCountedCents - totalRecordedCents;

    const paymentSummary = PAYMENT_KEYS.reduce((accumulator, key) => {
        accumulator[key] = {
            recordedCents: recordedTotals[key],
            countedCents: countedTotals[key],
            differenceCents: countedTotals[key] - recordedTotals[key],
            moneyIn: paymentMovementTotals.moneyInTotals[key],
            moneyOut: paymentMovementTotals.moneyOutTotals[key],
        };

        return accumulator;
    }, {} as TPaymentSummarySnapshot);

    const unresolvedOrdersCount = orderWarnings.openOrdersCount + orderWarnings.parkedOrdersCount + orderWarnings.unpaidOrdersCount;
    const varianceThresholdCents = restaurant?.cashupVarianceReasonThreshold ?? 5000;
    const requiresVarianceReason = Math.abs(totalVarianceCents) > varianceThresholdCents;

    const selectedHistorySession = useMemo(
        () => sessionHistory.find((session) => session.id === selectedHistorySessionId) || null,
        [selectedHistorySessionId, sessionHistory],
    );

    const selectedMovement = useMemo(
        () => businessDayMovements.find((movement) => movement.id === selectedMovementId) || null,
        [businessDayMovements, selectedMovementId],
    );

    const getMovementUserLabel = (movement: IGET_MONEY_MOVEMENT) => getUserDisplayName(movement.createdUserId, movement.createdByName);

    const getMovementAmountLabel = (movement: IGET_MONEY_MOVEMENT) =>
        `${movement.type === EMoneyMovementType.MONEY_IN ? "+" : "−"}${getDollarString(movement.amount)}`;

    const goToList = () => {
        setView("list");
        setSelectedHistorySessionId(null);
        setSelectedMovementId(null);
    };

    const goToNewCashup = () => {
        if (!restaurant?.enableCashup || !isPOS) return;
        setView("entry");
    };

    const handleHistoryRowClick = (session: IGET_CASHUP_SESSION) => {
        // Finalised sessions open their read-only summary; an in-progress session resumes on the entry screen.
        if (session.status === ECashupSessionStatus.FINALISED) {
            setSelectedHistorySessionId(session.id);
            setView("detail");
            return;
        }

        goToNewCashup();
    };

    const goToNewMovement = () => {
        if (!restaurant?.enableCashup || !register || !isPOS) return;
        setView("movement-entry");
    };

    const handleMovementRowClick = (movement: IGET_MONEY_MOVEMENT) => {
        setSelectedMovementId(movement.id);
        setView("movement-detail");
    };

    const saveMoneyMovement = async () => {
        if (!restaurant?.enableCashup || !register || !isPOS) return;
        if (savingMovement || creatingSession) return;

        if (staleOpenSession) {
            toast.error("Finalise the previous cash up session before recording money in or out for today.");
            return;
        }

        if (toCents(movementAmountInput) <= 0) {
            toast.error("Enter a valid amount before saving.");
            return;
        }

        try {
            const movement = await recordMoneyMovement({
                type: movementDirection,
                paymentMethod: EMoneyMovementPaymentMethod.CASH,
                amount: toCents(movementAmountInput),
                reason: movementReason.trim() || null,
            });

            if (!movement) {
                toast.error("Unable to start the cash up session for this movement.");
                return;
            }

            toast.success(`${getMovementTypeLabel(movementDirection)} saved.`);
            setMovementAmountInput("");
            setMovementReason("");
            setSelectedMovementId(movement.id);
            setView("movement-detail");
        } catch (error) {
            console.error(error);
            toast.error("Unable to save money movement.");
        }
    };

    const handleOpenFinaliseModal = () => {
        if (!restaurant?.enableCashup || !isPOS || staleOpenSession) return;

        if (unresolvedOrdersCount > 0) {
            setShowWarningModal(true);
            return;
        }

        setShowFinaliseModal(true);
    };

    const handleFinaliseSession = async (): Promise<string | null> => {
        if (requiresVarianceReason && !varianceReason.trim()) {
            toast.error("Variance reason is required.");
            return null;
        }

        try {
            const session = await ensureOpenSession({ openingFloatCents, skipRefetchAfterCreate: true });

            if (!session) {
                toast.error(
                    staleOpenSession ? "Finalise the previous cash up session before starting today's cash up." : "Unable to start the cash up session.",
                );
                return null;
            }

            const finalisedSessionId = session.id;

            await finaliseSession({
                id: finalisedSessionId,
                openingFloat: openingFloatCents,
                recordedTotal: totalRecordedCents,
                countedTotal: totalCountedCents,
                paymentSummary: JSON.stringify(paymentSummary),
                varianceReason: varianceReason.trim() || null,
            });

            localStorage.removeItem(buildCashupDraftStorageKey(finalisedSessionId));
            return finalisedSessionId;
        } catch (error) {
            console.error(error);
            if (isConditionalCheckError(error)) {
                toast.error("This session was already finalised on another register.");
                await refetchAll();
            } else {
                toast.error("Unable to finalise cash up.");
            }
            return null;
        }
    };

    const handleConfirmFinalise = async () => {
        const finalisedSessionId = await handleFinaliseSession();
        if (!finalisedSessionId) return;

        setShowFinaliseModal(false);
        toast.success("Cash Up finalised.");
        setSelectedHistorySessionId(finalisedSessionId);
        setView("detail");
    };

    const handleContinueFromWarningModal = () => {
        setShowWarningModal(false);
        setShowFinaliseModal(true);
    };

    const updateCountedPaymentInput = (key: TPaymentKey, value: string) => {
        setCountedPaymentInputs((previous) => ({ ...previous, [key]: value }));
    };

    const openCashDenominations = () => {
        setDraftDenominationInputs(denominationInputs);
        setShowDenominationModal(true);
    };

    const applyCashDenominations = () => {
        setDenominationInputs(draftDenominationInputs);
        setCountMode("denominations");
        setShowDenominationModal(false);
    };

    const useTotalCashAmount = () => {
        setCountMode("counted");
        setShowDenominationModal(false);
    };

    const getPaymentSummarySnapshot = (session: IGET_CASHUP_SESSION): TPaymentSummarySnapshot | null => {
        if (!session.paymentSummary) return null;

        try {
            return JSON.parse(session.paymentSummary) as TPaymentSummarySnapshot;
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    const getHistorySummaryRows = (session: IGET_CASHUP_SESSION) => {
        const isActiveOpenSession = currentSession?.id === session.id;
        const snapshot = isActiveOpenSession ? paymentSummary : getPaymentSummarySnapshot(session);

        const rows: { key: TPaymentKey | "total"; label: string; countedCents: number; recordedCents: number; differenceCents: number }[] = PAYMENT_KEYS.map(
            (key) => ({
                key,
                label: getPaymentLabel(key),
                countedCents: snapshot?.[key]?.countedCents || 0,
                recordedCents: snapshot?.[key]?.recordedCents || 0,
                differenceCents: snapshot?.[key]?.differenceCents || 0,
            }),
        );

        rows.push({
            key: "total",
            label: "Total",
            countedCents: (isActiveOpenSession ? totalCountedCents : session.countedTotal) || 0,
            recordedCents: (isActiveOpenSession ? totalRecordedCents : session.recordedTotal) || 0,
            differenceCents: isActiveOpenSession ? totalVarianceCents : (session.countedTotal || 0) - (session.recordedTotal || 0),
        });

        return rows;
    };

    const getHistoryDrawerRows = (session: IGET_CASHUP_SESSION) => {
        const isActiveOpenSession = currentSession?.id === session.id;
        const snapshot = isActiveOpenSession ? paymentSummary : getPaymentSummarySnapshot(session);

        return [
            { label: "Opening Float", valueCents: session.openingFloat || 0 },
            { label: "Cash Money In", valueCents: snapshot?.cash?.moneyIn || 0 },
            { label: "Cash Money Out", valueCents: snapshot?.cash?.moneyOut || 0 },
        ];
    };

    const buildPrintCashUpData = (session: IGET_CASHUP_SESSION): IPrintCashUpData => ({
        restaurantName: restaurant?.name || "",
        cashupSessionDate: session.cashupSessionDate,
        scopeLabel: getCashupScopeHistoryLabel(session.scopeType, scopeName),
        finalisedAt: session.finalisedAt,
        finalisedByName: session.finalisedByName || null,
        summaryRows: getHistorySummaryRows(session),
        drawerRows: getHistoryDrawerRows(session),
        varianceReason: session.varianceReason,
    });

    const handlePrintSession = async (session: IGET_CASHUP_SESSION) => {
        if (!register) return;

        const printData = buildPrintCashUpData(session);

        if (register.printers.items.length > 1) {
            setPendingPrintData(printData);
            setShowSelectReceiptPrinterModal(true);
        } else if (register.printers.items.length === 1) {
            await printCashUpData({
                ...printData,
                printer: { printerType: register.printers.items[0].type, printerAddress: register.printers.items[0].address },
            });
        } else {
            toast.error("No receipt printers configured");
        }
    };

    const handleSelectPrinterForPrint = async (printer: IGET_RESTAURANT_REGISTER_PRINTER) => {
        setShowSelectReceiptPrinterModal(false);

        if (!pendingPrintData) return;

        await printCashUpData({
            ...pendingPrintData,
            printer: { printerType: printer.type, printerAddress: printer.address },
        });
        setPendingPrintData(null);
    };

    const renderPaymentRow = (key: TPaymentKey) => {
        const recorded = recordedTotals[key];
        const usesDenominations = key === "cash" && countMode === "denominations";

        return (
            <tr key={key}>
                <td className="text-left text-bold">{getPaymentLabel(key)}</td>
                <td className="text-right">{getDollarString(recorded)}</td>
                <td className="text-right">
                    <div className="cashup-count-input">
                        <Input
                            type="number"
                            min="0"
                            placeholder="0.00"
                            value={usesDenominations ? convertCentsToDollars(countedCashFromDenominationsCents) : countedPaymentInputs[key]}
                            onChange={(event) => updateCountedPaymentInput(key, event.target.value)}
                            disabled={!!staleOpenSession || usesDenominations}
                        />
                        {key === "cash" && (
                            <button
                                type="button"
                                className={`cashup-denomination-toggle ${usesDenominations ? "active" : ""}`}
                                onClick={openCashDenominations}
                                disabled={!!staleOpenSession}
                                title={usesDenominations ? "Use total cash amount" : "Count cash by denomination"}
                                aria-label={usesDenominations ? "Use total cash amount" : "Count cash by denomination"}
                            >
                                <FiGrid />
                            </button>
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    const renderBanners = () => (
        <>
            {!restaurant?.enableCashup && (
                <Card className="cashup-banner">
                    <div className="content">
                        <FiAlertTriangle />
                        <div>Cash up is disabled for this restaurant in Tabin Web.</div>
                    </div>
                </Card>
            )}

            {isPOS === false && (
                <Card className="cashup-banner">
                    <div className="content">
                        <FiAlertTriangle />
                        <div>This screen is designed for POS registers.</div>
                    </div>
                </Card>
            )}

            {staleOpenSession && (
                <Card className="cashup-banner">
                    <div className="content">
                        <FiAlertTriangle />
                        <div>
                            An earlier cash up session for {staleOpenSession.cashupSessionDate} is still open. Finalise that session before starting
                            today&apos;s cash up.
                        </div>
                    </div>
                </Card>
            )}
        </>
    );

    if (!restaurant) return <></>;

    return (
        <PageWrapper>
            <div className="cashup">
                <ModalV2 width="500px" isOpen={showWarningModal} disableClose={false} onRequestClose={() => setShowWarningModal(false)}>
                    <div className="cashup-warning-title mb-4">
                        <FiAlertTriangle />
                        <div className="h3">Open orders need attention</div>
                    </div>
                    <div className="text-grey mb-4">
                        Review parked or unpaid orders before finalising cash up. If you continue, those orders may sit outside the final reconciliation.
                    </div>

                    <div className="cashup-warning-grid mb-4">
                        <Card className={`cashup-warning ${orderWarnings.parkedOrdersCount > 0 ? "active" : ""}`}>
                            <div className="h3">{orderWarnings.parkedOrdersCount}</div>
                            <div className="text-grey">Parked Orders</div>
                        </Card>
                        <Card className={`cashup-warning ${orderWarnings.unpaidOrdersCount > 0 ? "active" : ""}`}>
                            <div className="h3">{orderWarnings.unpaidOrdersCount}</div>
                            <div className="text-grey">Unpaid Orders</div>
                        </Card>
                    </div>

                    <div className="text-grey mb-2">
                        You can continue to count cash up, but finalising means you accept these unresolved order warnings.
                    </div>
                    {orderWarnings.paidOpenOrdersCount > 0 && (
                        <div className="text-grey mb-2">
                            {orderWarnings.paidOpenOrdersCount} paid order{orderWarnings.paidOpenOrdersCount === 1 ? "" : "s"} still remain open. They are
                            already included in recorded cash up, but staff should still complete them operationally.
                        </div>
                    )}

                    <div className="cashup-modal-actions mt-6">
                        <Button className="cashup-ghost-button" onClick={() => navigate(ordersPath)}>
                            Go To Orders
                        </Button>
                        <Button onClick={handleContinueFromWarningModal}>Continue To Finalise</Button>
                    </div>
                </ModalV2>

                <ModalV2 width="600px" isOpen={showDenominationModal} disableClose={false} onRequestClose={() => setShowDenominationModal(false)}>
                    <div className="h2 mb-2">Cash Denominations</div>
                    <div className="text-grey mb-6">Enter the quantity counted for each denomination.</div>

                    <div className="cashup-denomination-grid">
                        {DENOMINATIONS.map((denomination) => (
                            <div className="cashup-denomination-field" key={denomination}>
                                <div className="text-bold">{getDollarString(denomination)}</div>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={draftDenominationInputs[String(denomination)]}
                                    onChange={(event) =>
                                        setDraftDenominationInputs((previous) => ({
                                            ...previous,
                                            [String(denomination)]: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                        ))}
                    </div>

                    <div className="cashup-difference mt-6">
                        <span className="text-bold">Total Counted Cash</span>
                        <span className="text-bold">{getDollarString(draftCountedCashFromDenominationsCents)}</span>
                    </div>
                    <div className="cashup-difference">
                        <span>Difference</span>
                        <span className={draftCountedCashFromDenominationsCents - recordedTotals.cash < 0 ? "text-error" : ""}>
                            {getDollarString(draftCountedCashFromDenominationsCents - recordedTotals.cash)}
                        </span>
                    </div>

                    <div className="cashup-modal-actions mt-6">
                        {countMode === "denominations" && (
                            <Button className="cashup-ghost-button" onClick={useTotalCashAmount}>
                                Use Total Amount
                            </Button>
                        )}
                        <Button onClick={applyCashDenominations}>Apply Denominations</Button>
                    </div>
                </ModalV2>

                <SelectReceiptPrinterModal
                    isOpen={showSelectReceiptPrinterModal}
                    onClose={() => {
                        setShowSelectReceiptPrinterModal(false);
                        setPendingPrintData(null);
                    }}
                    onSelectPrinter={handleSelectPrinterForPrint}
                />

                <ModalV2
                    isOpen={showFinaliseModal}
                    disableClose={creatingSession || finalisingSession}
                    onRequestClose={() => {
                        if (!creatingSession && !finalisingSession) setShowFinaliseModal(false);
                    }}
                >
                    <div className="h2 mb-4">Finalise Cash Up</div>
                    <div className="mb-2">Are you sure you want to finalise cash up?</div>
                    <div className="text-grey mb-6">This cannot be reversed.</div>
                    <div className="cashup-modal-actions">
                        <Button
                            onClick={handleConfirmFinalise}
                            loading={creatingSession || finalisingSession}
                            disabled={creatingSession || finalisingSession}
                        >
                            Finalise
                        </Button>
                    </div>
                </ModalV2>

                {view === "list" ? (
                    <div className="header">
                        <div className="back" onClick={() => navigate(beginOrderPath)}>
                            <FiArrowLeft />
                            <span>Back to POS</span>
                        </div>

                        <Button onClick={goToNewCashup} disabled={!restaurant.enableCashup || !isPOS}>
                            <FiPlus />
                            <span>New Cashup</span>
                        </Button>
                    </div>
                ) : (
                    <div className="header">
                        <div className="back" onClick={goToList}>
                            <FiArrowLeft />
                            <span>Back</span>
                        </div>
                    </div>
                )}

                {view !== "detail" && view !== "movement-detail" && renderBanners()}

                {view === "list" && (
                    <div className="list">
                        <div className="h2 mb-4">Cash Up History</div>

                        <div className="list-table">
                            <Table>
                                <thead>
                                    <tr>
                                        <th className="text-left">Date</th>
                                        <th className="text-left">User</th>
                                        <th className="text-left">Register</th>
                                        <th className="text-right">Variance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessionHistory.map((session) => {
                                        const isFinalised = session.status === ECashupSessionStatus.FINALISED;
                                        const varianceCents = getSessionVarianceCents(session);

                                        return (
                                            <tr key={session.id}>
                                                <td className="text-left">
                                                    <Link onClick={() => handleHistoryRowClick(session)}>
                                                        {formatCashupHistoryDate(getSessionDisplayTimestamp(session))}
                                                    </Link>
                                                </td>
                                                <td className="text-left">
                                                    {getUserDisplayName(session.finalisedUserId, session.finalisedByName)}
                                                </td>
                                                <td className="text-left">{scopeName || "-"}</td>
                                                <td className="text-right">
                                                    {isFinalised ? (
                                                        <span className={varianceCents < 0 ? "text-error text-bold" : "text-bold"}>
                                                            {getDollarString(varianceCents)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-grey">In progress</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                            {sessionsError && <div className="text-error mt-4">Unable to load cash up history. Please try again.</div>}
                            {sessionsLoading && sessionHistory.length === 0 && <div className="text-grey mt-4">Loading cash up history...</div>}
                            {!sessionsError && !sessionsLoading && sessionHistory.length === 0 && (
                                <div className="text-grey mt-4">No cash ups have been done yet. Click New Cashup to get started.</div>
                            )}
                        </div>
                    </div>
                )}

                {view === "list" && (
                    <div className="list money-movement-list mt-8">
                        <div className="cashup-section-header mb-4">
                            <div>
                                <div className="h2">Money Movement</div>
                            </div>
                            <Button onClick={goToNewMovement} disabled={!restaurant.enableCashup || !register || !isPOS}>
                                <FiPlus />
                                <span>New Money Movement</span>
                            </Button>
                        </div>

                        <div className="list-table">
                            <Table>
                                <thead>
                                    <tr>
                                        <th className="text-left">Date</th>
                                        <th className="text-left">User</th>
                                        <th className="text-left">Type</th>
                                        <th className="text-left">Reason</th>
                                        <th className="text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {businessDayMovements.map((movement) => (
                                        <tr key={movement.id}>
                                            <td className="text-left">
                                                <Link onClick={() => handleMovementRowClick(movement)}>{formatCashupHistoryDate(movement.recordedAt)}</Link>
                                            </td>
                                            <td className="text-left">{getMovementUserLabel(movement)}</td>
                                            <td className="text-left">{getMovementTypeLabel(movement.type)}</td>
                                            <td className="text-left">{movement.reason || "-"}</td>
                                            <td className="text-right">
                                                <span className={movement.type === EMoneyMovementType.MONEY_OUT ? "text-error text-bold" : "text-bold"}>
                                                    {getMovementAmountLabel(movement)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            {movementsError && <div className="text-error mt-4">Unable to load money movements. Please try again.</div>}
                            {movementsLoading && businessDayMovements.length === 0 && <div className="text-grey mt-4">Loading money movements...</div>}
                            {!movementsError && !movementsLoading && businessDayMovements.length === 0 && (
                                <div className="text-grey mt-4">No money movements have been recorded today.</div>
                            )}
                        </div>
                    </div>
                )}

                {view === "detail" && selectedHistorySession && (
                    <div className="detail">
                        <div className="meta">
                            <div className="h4">End Of Day {getHistoryStatusLabel(selectedHistorySession.status)} Cash Up</div>
                            <div>
                                {formatCashupHistoryDate(getSessionDisplayTimestamp(selectedHistorySession))} · {restaurant.name}
                            </div>
                            <div>{getCashupScopeHistoryLabel(selectedHistorySession.scopeType, scopeName)}</div>
                        </div>

                        <Card title="Summary" className="mt-4">
                            <Table>
                                <thead>
                                    <tr>
                                        <th className="text-left">Payment Type</th>
                                        <th className="text-right">Counted</th>
                                        <th className="text-right">Recorded</th>
                                        <th className="text-right">Diff.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getHistorySummaryRows(selectedHistorySession).map((row) => (
                                        <tr className={row.key === "total" ? "text-bold" : ""} key={row.key}>
                                            <td className="text-left">{row.label}</td>
                                            <td className="text-right">{getDollarString(row.countedCents)}</td>
                                            <td className="text-right">{getDollarString(row.recordedCents)}</td>
                                            <td className="text-right">{getDollarString(row.differenceCents)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            {selectedHistorySession.varianceReason && (
                                <div className="mt-4">
                                    <div className="text-bold">Variance Reason</div>
                                    <div className="mt-1">{selectedHistorySession.varianceReason}</div>
                                </div>
                            )}
                        </Card>

                        <Card title="Drawer & Money Movements" className="mt-4">
                            <Table>
                                <tbody>
                                    {getHistoryDrawerRows(selectedHistorySession).map((row) => (
                                        <tr key={row.label}>
                                            <td className="text-left">{row.label}</td>
                                            <td className="text-right text-bold">{getDollarString(row.valueCents)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card>

                        {selectedHistorySession.status === ECashupSessionStatus.FINALISED && (
                            <Button className="print mt-4" onClick={() => handlePrintSession(selectedHistorySession)}>
                                <FiPrinter />
                                <span>Print Report</span>
                            </Button>
                        )}
                    </div>
                )}

                {view === "movement-detail" && selectedMovement && (
                    <div className="detail">
                        <div className="meta">
                            <div className="h4">
                                {getMovementTypeLabel(selectedMovement.type)}
                                {selectedMovement.moneyMovementRegisterId === register?.id ? ` · ${register.name}` : ""}
                            </div>
                            <div className="mt-1">{formatCashupHistoryDate(selectedMovement.recordedAt)}</div>
                            <div>{getMovementUserLabel(selectedMovement)}</div>
                        </div>

                        <Card title="Money Movement Details" className="mt-4">
                            <Table>
                                <tbody>
                                    <tr>
                                        <td className="text-left">Type</td>
                                        <td className="text-right text-bold">{getMovementTypeLabel(selectedMovement.type)}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-left">{getMovementPaymentLabel(selectedMovement.paymentMethod)}</td>
                                        <td className="text-right text-bold">{getDollarString(selectedMovement.amount)}</td>
                                    </tr>
                                </tbody>
                            </Table>

                            <div className="mt-4">
                                <div className="text-bold">Reason</div>
                                <div className="mt-1">{selectedMovement.reason || "-"}</div>
                            </div>
                        </Card>
                    </div>
                )}

                {view === "entry" && (
                    <div className="finalise">
                        <Card title={getCashupScopeTitle(scopeType || ECashupScopeType.SITE, scopeName)}>
                            <div className="mt-4 mb-4">
                                <Input
                                    label="Opening Float"
                                    type="number"
                                    min="0"
                                    placeholder="0.00"
                                    value={openingFloatInput}
                                    onChange={(event) => setOpeningFloatInput(event.target.value)}
                                    disabled={!!staleOpenSession}
                                />
                            </div>

                            <Table className="cashup-payments-table">
                                <thead>
                                    <tr>
                                        <th className="text-left">Payment Type</th>
                                        <th className="text-right">Recorded</th>
                                        <th className="text-right">Counted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {PAYMENT_KEYS.map((key) => renderPaymentRow(key))}
                                    <tr className="text-bold">
                                        <td className="text-left">Total</td>
                                        <td className="text-right">{getDollarString(totalRecordedCents)}</td>
                                        <td className="text-right">{getDollarString(totalCountedCents)}</td>
                                    </tr>
                                </tbody>
                            </Table>

                            <div className="cashup-difference mt-4">
                                <span className="text-bold">Difference</span>
                                <span className={`text-bold ${totalVarianceCents < 0 ? "text-error" : ""}`}>{getDollarString(totalVarianceCents)}</span>
                            </div>

                            {requiresVarianceReason && (
                                <div className="mt-4">
                                    <Input
                                        label="Variance Reason (Required)"
                                        value={varianceReason}
                                        onChange={(event) => setVarianceReason(event.target.value)}
                                        disabled={!!staleOpenSession}
                                    />
                                </div>
                            )}

                            <div className="cashup-form-actions mt-6">
                                <Button
                                    onClick={handleOpenFinaliseModal}
                                    loading={creatingSession || finalisingSession}
                                    disabled={!!staleOpenSession || creatingSession || finalisingSession || !restaurant.enableCashup || !isPOS}
                                >
                                    Finalise Cash Up
                                </Button>
                            </div>
                        </Card>

                        {(ordersLoading || movementsLoading) && <div className="text-grey mt-4">Loading cash up data...</div>}
                        {ordersError && <div className="text-error mt-4">Unable to load orders for this business date.</div>}
                    </div>
                )}

                {view === "movement-entry" && (
                    <div className="money-movement-entry">
                        <Card title={getMoneyMovementScopeTitle(scopeType || ECashupScopeType.SITE, scopeName)}>
                            <div className="text-grey mb-4">Money movements are recorded as cash only.</div>
                            <div className="money-movement-fields">
                                <div>
                                    <Select
                                        label="Type"
                                        value={movementDirection}
                                        onChange={(event) => setMovementDirection(event.target.value as TMoneyMovementDirection)}
                                        disabled={savingMovement || creatingSession}
                                    >
                                        <option value={EMoneyMovementType.MONEY_IN}>Money In</option>
                                        <option value={EMoneyMovementType.MONEY_OUT}>Money Out</option>
                                    </Select>
                                </div>
                                <div>
                                    <Input
                                        label="Amount"
                                        type="number"
                                        min="0"
                                        placeholder="0.00"
                                        value={movementAmountInput}
                                        onChange={(event) => setMovementAmountInput(event.target.value)}
                                    />
                                </div>
                                <div>
                                    <Input label="Reason (optional)" value={movementReason} onChange={(event) => setMovementReason(event.target.value)} />
                                </div>
                            </div>

                            <div className="cashup-form-actions mt-6">
                                <Button
                                    onClick={saveMoneyMovement}
                                    loading={savingMovement || creatingSession}
                                    disabled={!restaurant.enableCashup || !register || !isPOS || savingMovement || creatingSession}
                                >
                                    Save Money Movement
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
};
