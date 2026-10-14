import { useCallback, useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { format, subDays } from "date-fns";
import { usePosUser } from "../context/pos-user-context";
import { useRegister } from "../context/register-context";
import { useRestaurant } from "../context/restaurant-context";
import { useUser } from "../context/user-context";
import { CREATE_MONEY_MOVEMENT, CREATE_CASHUP_SESSION, UPDATE_CASHUP_SESSION } from "../graphql/customMutations";
import {
    EMoneyMovementPaymentMethod,
    ECashupSessionStatus,
    GET_MONEY_MOVEMENTS_BY_SCOPE_KEY_BY_RECORDED_AT,
    GET_CASHUP_SESSIONS_BY_SCOPE_KEY_BY_OPENED_AT,
    IGET_MONEY_MOVEMENT,
    IGET_CASHUP_SESSION,
} from "../graphql/customQueries";
import {
    TMoneyMovementDirection,
    buildCashupSessionId,
    getBusinessDate,
    getBusinessDayRange,
    getPaymentSummarySnapshot,
    resolveCashupScope,
    sortSessions,
} from "../components/page/cashManagement/cashManagementSupport";
import { toLocalISOString } from "../util/util";

const SESSION_HISTORY_LIMIT = 8;

const isConditionalCheckError = (error: unknown) => JSON.stringify(error).includes("conditional request failed");

export const useCashupSession = (options?: { skipMovements?: boolean }) => {
    const skipMovements = options?.skipMovements ?? false;
    const { restaurant } = useRestaurant();
    const { register } = useRegister();
    const { user } = useUser();
    const { selectedPosUser, availableUsers } = usePosUser();

    const effectiveCashUserId = selectedPosUser?.userId || user?.id;
    const effectiveCashUserName = selectedPosUser
        ? `${selectedPosUser.firstName} ${selectedPosUser.lastName}`.trim()
        : user
          ? `${user.firstName} ${user.lastName}`.trim()
          : "";

    const businessDate = getBusinessDate();
    const businessDayRange = useMemo(() => getBusinessDayRange(businessDate), [businessDate]);

    const resolvedScope = useMemo(
        () =>
            resolveCashupScope({
                restaurantId: restaurant?.id,
                registerId: register?.id,
                staffId: effectiveCashUserId,
                defaultScope: restaurant?.cashupDefaultScope,
            }),
        [effectiveCashUserId, register?.id, restaurant?.id, restaurant?.cashupDefaultScope],
    );

    const scopeKey = resolvedScope?.scopeKey || "";

    const {
        data: sessionsData,
        loading: sessionsLoading,
        error: sessionsError,
        refetch: refetchSessions,
    } = useQuery(GET_CASHUP_SESSIONS_BY_SCOPE_KEY_BY_OPENED_AT, {
        variables: {
            scopeKey,
            openedAt: { ge: format(subDays(new Date(), 35), "yyyy-MM-dd") },
            limit: 50,
        },
        skip: !scopeKey,
        fetchPolicy: "network-only",
    });

    const openSessionFromData = useMemo(
        () =>
            (sessionsData?.getCashupSessionsByScopeKeyByOpenedAt?.items || []).find(
                (session: IGET_CASHUP_SESSION) => session.scopeKey === scopeKey && session.status === ECashupSessionStatus.OPEN,
            ),
        [scopeKey, sessionsData],
    );

    const {
        data: movementsData,
        loading: movementsLoading,
        error: movementsError,
        refetch: refetchMovements,
    } = useQuery(GET_MONEY_MOVEMENTS_BY_SCOPE_KEY_BY_RECORDED_AT, {
        variables: {
            scopeKey,
            recordedAt: {
                between: [openSessionFromData?.openedAt || businessDayRange.start, businessDayRange.end],
            },
            limit: 500,
        },
        skip: !scopeKey || skipMovements,
        fetchPolicy: "network-only",
    });

    const [createCashupSession, { loading: creatingSession }] = useMutation(CREATE_CASHUP_SESSION);
    const [finaliseCashupSession, { loading: finalisingSession }] = useMutation(UPDATE_CASHUP_SESSION);
    const [updateCashupSessionField] = useMutation(UPDATE_CASHUP_SESSION);
    const [createMoneyMovement, { loading: savingMovement }] = useMutation(CREATE_MONEY_MOVEMENT);

    const allSessions: IGET_CASHUP_SESSION[] = useMemo(
        () => sortSessions((sessionsData?.getCashupSessionsByScopeKeyByOpenedAt?.items || []).filter((session) => session.scopeKey === scopeKey)),
        [scopeKey, sessionsData],
    );

    const currentSession = useMemo(() => allSessions.find((session) => session.status === ECashupSessionStatus.OPEN) || null, [allSessions]);

    // An open session keeps its original window across business dates.
    const cashupWindowStart = useMemo(() => {
        if (currentSession) {
            return currentSession.openedAt;
        }

        const lastFinalisedToday = allSessions.find(
            (session) => session.status === ECashupSessionStatus.FINALISED && session.cashupSessionDate === businessDate,
        );
        return lastFinalisedToday?.finalisedAt || businessDayRange.start;
    }, [allSessions, businessDate, businessDayRange.start, currentSession]);

    const sessionHistory = useMemo(() => allSessions.slice(0, SESSION_HISTORY_LIMIT), [allSessions]);

    const businessDayMovements: IGET_MONEY_MOVEMENT[] = useMemo(
        () =>
            (movementsData?.getMoneyMovementsByScopeKeyByRecordedAt?.items || [])
                .filter((movement) => movement.moneyMovementDate === businessDate)
                .sort((left, right) => (right.recordedAt > left.recordedAt ? 1 : -1)),
        [businessDate, movementsData],
    );

    const currentSessionMovements = useMemo<IGET_MONEY_MOVEMENT[]>(() => {
        if (!currentSession) return [];
        return (movementsData?.getMoneyMovementsByScopeKeyByRecordedAt?.items || [])
            .filter((movement) => movement.cashupSessionId === currentSession.id && movement.recordedAt >= currentSession.openedAt)
            .sort((left, right) => (right.recordedAt > left.recordedAt ? 1 : -1));
    }, [movementsData, currentSession]);

    const refetchAll = useCallback(async () => {
        await Promise.allSettled([refetchSessions(), ...(skipMovements ? [] : [refetchMovements()])]);
    }, [refetchMovements, refetchSessions, skipMovements]);

    // Creates or resumes the open session. The deterministic session id makes
    // concurrent creates from other registers collide, so the loser adopts the winner's session.
    const ensureOpenSession = useCallback(
        async (options?: {
            openingFloatCents?: number;
            skipRefetchAfterCreate?: boolean;
            previousSession?: IGET_CASHUP_SESSION;
        }): Promise<IGET_CASHUP_SESSION | null> => {
            if (!restaurant?.enableCashup || !resolvedScope || !user || !effectiveCashUserId) return null;

            for (let attempt = 0; attempt < 3; attempt++) {
                const result = (await refetchSessions()).data;
                const sessions: IGET_CASHUP_SESSION[] = (result?.getCashupSessionsByScopeKeyByOpenedAt?.items || []).filter(
                    (session: IGET_CASHUP_SESSION) => session.scopeKey === resolvedScope.scopeKey,
                );
                // The session index can lag behind the finalisation mutation.
                if (options?.previousSession?.scopeKey === resolvedScope.scopeKey) {
                    const previousIndex = sessions.findIndex((session) => session.id === options.previousSession?.id);
                    if (previousIndex >= 0) sessions[previousIndex] = options.previousSession;
                    else sessions.push(options.previousSession);
                }
                const openSession = sortSessions(sessions).find((session) => session.status === ECashupSessionStatus.OPEN);

                if (openSession) {
                    return openSession;
                }

                const previousSession = sortSessions(sessions).find((session) => session.status === ECashupSessionStatus.FINALISED);
                const openedAt = previousSession?.finalisedAt || toLocalISOString(new Date());
                const sessionDate = openedAt.slice(0, 10);
                const previousCountedCash = previousSession ? getPaymentSummarySnapshot(previousSession)?.cash?.countedCents ?? 0 : 0;

                // The derived suffix allows multiple cashups per business day and keeps concurrent
                // creates deterministic without persisting a separate sequence field.
                const sessionSequence = sessions.filter((session) => session.cashupSessionDate === sessionDate).length + 1;

                try {
                    const created = await createCashupSession({
                        variables: {
                            id: buildCashupSessionId(resolvedScope.scopeKey, sessionDate, sessionSequence),
                            cashupRestaurantId: restaurant.id,
                            cashupSessionDate: sessionDate,
                            scopeType: resolvedScope.scopeType,
                            scopeKey: resolvedScope.scopeKey,
                            status: ECashupSessionStatus.OPEN,
                            openedAt,
                            openingFloat: options?.openingFloatCents ?? previousCountedCash,
                            owner: user.id,
                        },
                    });

                    if (!options?.skipRefetchAfterCreate) await refetchSessions();
                    return created.data?.createCashupSession || null;
                } catch (error) {
                    if (!isConditionalCheckError(error)) throw error;
                }
            }

            return null;
        },
        [
            createCashupSession,
            effectiveCashUserId,
            refetchSessions,
            resolvedScope,
            restaurant,
            user,
        ],
    );

    const finaliseSession = useCallback(
        async (input: {
            id: string;
            openingFloat: number;
            recordedTotal: number;
            countedTotal: number;
            paymentSummary: string;
            varianceReason: string | null;
        }) => {
            const result = await finaliseCashupSession({
                variables: {
                    ...input,
                    status: ECashupSessionStatus.FINALISED,
                    finalisedAt: toLocalISOString(new Date()),
                    finalisedUserId: effectiveCashUserId,
                    finalisedByName: effectiveCashUserName || null,
                    condition: { status: { eq: ECashupSessionStatus.OPEN } },
                },
            });

            // Finalisation is saved even if refreshing the history fails.
            try {
                await refetchSessions();
            } catch (error) {
                console.error(error);
            }
            return result.data?.updateCashupSession || null;
        },
        [effectiveCashUserId, effectiveCashUserName, finaliseCashupSession, refetchSessions],
    );

    const updateOpeningFloat = useCallback(
        async (sessionId: string, openingFloatCents: number) => {
            const result = await updateCashupSessionField({
                variables: {
                    id: sessionId,
                    openingFloat: openingFloatCents,
                },
            });

            await refetchSessions();
            return result.data?.updateCashupSession || null;
        },
        [updateCashupSessionField, refetchSessions],
    );

    const recordMoneyMovement = useCallback(
        async (input: { type: TMoneyMovementDirection; paymentMethod: EMoneyMovementPaymentMethod; amount: number; reason: string | null }) => {
            if (!restaurant || !register || !user || !effectiveCashUserId) return null;

            const session = await ensureOpenSession();
            if (!session) return null;

            const result = await createMoneyMovement({
                variables: {
                    input: {
                        moneyMovementRestaurantId: restaurant.id,
                        moneyMovementRegisterId: register.id,
                        cashupSessionId: session.id,
                        scopeKey: session.scopeKey,
                        moneyMovementDate: getBusinessDate(),
                        recordedAt: toLocalISOString(new Date()),
                        type: input.type,
                        paymentMethod: input.paymentMethod,
                        amount: input.amount,
                        reason: input.reason,
                        createdUserId: effectiveCashUserId,
                        createdByName: effectiveCashUserName || null,
                        owner: user.id,
                    },
                },
            });

            await refetchAll();
            return result.data?.createMoneyMovement || null;
        },
        [createMoneyMovement, effectiveCashUserId, effectiveCashUserName, ensureOpenSession, refetchAll, register, restaurant, user],
    );

    const getUserDisplayName = useCallback(
        (userId?: string | null, denormalizedName?: string | null) => {
            if (denormalizedName) return denormalizedName;
            if (!userId) return "-";

            const matchedPosUser = availableUsers.find((availableUser) => availableUser.userId === userId);
            if (matchedPosUser) return `${matchedPosUser.firstName} ${matchedPosUser.lastName}`.trim();
            if (user && user.id === userId) return `${user.firstName} ${user.lastName}`.trim();

            return userId.slice(0, 8);
        },
        [availableUsers, user],
    );

    return {
        businessDate,
        scopeType: resolvedScope?.scopeType || null,
        scopeId: resolvedScope?.scopeId || "",
        scopeKey,
        effectiveCashUserId,
        effectiveCashUserName,
        currentSession,
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
        updateOpeningFloat,
        recordMoneyMovement,
        refetchAll,
        getUserDisplayName,
        isConditionalCheckError,
    };
};
