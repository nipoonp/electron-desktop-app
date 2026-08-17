import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useApolloClient, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { useRegister } from "./register-context";
import { useRestaurant } from "./restaurant-context";
import { CREATE_ATTENDANCE, UPDATE_ATTENDANCE } from "../graphql/customMutations";
import {
    EAttendanceAdjustmentStatus,
    EAttendanceRecordStatus,
    IGET_ATTENDANCE,
    IGET_ATTENDANCE_BREAK,
    IGET_ROSTER_SHIFT,
    LIST_ATTENDANCES_BY_USER,
    LIST_ROSTER_SHIFTS_BY_RESTAURANT_AND_DATE,
} from "../graphql/customQueries";

export type TShiftStatus = { isActive: boolean; isOnBreak: boolean };

export type TPosUser = {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    imageKey: string | null;
    imageIdentityPoolId: string | null;
    enablePosPin: boolean;
    posPin: string | null;
    attendanceEnabled: boolean;
    breakTrackingEnabled: boolean;
    defaultBreakDurationMinutes: number | null;
};

type ContextProps = {
    availableUsers: TPosUser[];
    selectedPosUser: TPosUser | null;
    isUnlocked: boolean;
    isPosPinFeatureEnabled: boolean;
    hasSkippedPosUserSelection: boolean;
    activeAttendance: IGET_ATTENDANCE | null;
    activeAttendanceBreak: IGET_ATTENDANCE_BREAK | null;
    attendanceHistory: IGET_ATTENDANCE[];
    attendanceLoading: boolean;
    attendanceActionLoading: boolean;
    // True if this unlock is just resuming after an idle re-lock, not a fresh user selection.
    isResumedFromIdleLock: boolean;
    // Who's currently on shift across the restaurant, keyed by userId. Used to badge the user grid.
    attendanceStatusByUserId: Record<string, TShiftStatus>;
    refetchAttendance: () => Promise<void>;
    selectPosUser: (posUserId: string) => void;
    skipPosUserSelection: () => void;
    unlockPosUser: (pin: string) => Promise<boolean>;
    lockPosUser: () => void;
    clearSelectedPosUser: () => void;
    startShift: () => Promise<boolean>;
    endShift: () => Promise<boolean>;
    startBreak: () => Promise<boolean>;
    resumeShift: () => Promise<boolean>;
};

const PosUserContext = createContext<ContextProps>({
    availableUsers: [],
    selectedPosUser: null,
    isUnlocked: false,
    isPosPinFeatureEnabled: false,
    hasSkippedPosUserSelection: false,
    activeAttendance: null,
    activeAttendanceBreak: null,
    attendanceHistory: [],
    attendanceLoading: false,
    attendanceActionLoading: false,
    isResumedFromIdleLock: false,
    attendanceStatusByUserId: {},
    refetchAttendance: async () => {},
    selectPosUser: () => {},
    skipPosUserSelection: () => {},
    unlockPosUser: async () => false,
    lockPosUser: () => {},
    clearSelectedPosUser: () => {},
    startShift: async () => false,
    endShift: async () => false,
    startBreak: async () => false,
    resumeShift: async () => false,
});

// Storage key for the currently selected POS user.
const buildSelectedUserStorageKey = (restaurantId?: string | null, registerId?: string | null) =>
    `selectedPosUserId:${restaurantId || "none"}:${registerId || "none"}`;

// Storage key for whether the selected user has passed the PIN check.
const buildUnlockedStorageKey = (restaurantId?: string | null, registerId?: string | null) =>
    `selectedPosUserUnlocked:${restaurantId || "none"}:${registerId || "none"}`;

// Storage key for whether the operator skipped user selection (no active staff).
const buildSkippedSelectionStorageKey = (restaurantId?: string | null, registerId?: string | null) =>
    `selectedPosUserSkipped:${restaurantId || "none"}:${registerId || "none"}`;

export const getBusinessDate = (date = new Date()) => new Intl.DateTimeFormat("en-CA").format(date);

export const calculateDurationMinutes = (startTime?: string | null, endTime = new Date().toISOString()) => {
    if (!startTime) return 0;

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return 0;

    return Math.max(0, Math.round((end - start) / 60000));
};

// Picks the rostered shift closest to "now" if an employee has more than one that day.
// Returns null if they have no rostered shift (an unscheduled clock-in).
export const findClosestScheduledShift = (shifts: IGET_ROSTER_SHIFT[], employeeUserId: string, now: Date): IGET_ROSTER_SHIFT | null => {
    const matches = shifts.filter((shift) => shift.employeeUserId === employeeUserId);
    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];

    return matches.reduce((closest, shift) => {
        const startOf = (s: IGET_ROSTER_SHIFT) => {
            const [hours, minutes] = s.startTime.split(":").map(Number);
            const scheduledStart = new Date(now);
            scheduledStart.setHours(hours, minutes, 0, 0);
            return Math.abs(now.getTime() - scheduledStart.getTime());
        };
        return startOf(shift) < startOf(closest) ? shift : closest;
    });
};

export const toAttendanceAdjustmentInput = (adjustment: any) => ({
    status: adjustment.status,
    changedByUserId: adjustment.changedByUserId || null,
    changedByUserName: adjustment.changedByUserName || null,
    changedAt: adjustment.changedAt || null,
});

export const getAdjustmentHistoryForUpdate = (
    existingHistory: any[] | null | undefined,
    status: EAttendanceAdjustmentStatus,
    userId: string,
    userName: string,
    timestamp: string,
) => {
    const history = existingHistory || [];
    return [
        ...history.map(toAttendanceAdjustmentInput),
        toAttendanceAdjustmentInput({
            status,
            changedByUserId: userId,
            changedByUserName: userName,
            changedAt: timestamp,
        }),
    ];
};

export const PosUserProvider = (props: { children: React.ReactNode }) => {
    const { restaurant } = useRestaurant();
    const { register, isPOS, isPosPinFeatureEnabled } = useRegister();
    const [selectedPosUser, setSelectedPosUser] = useState<TPosUser | null>(null);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [hasSkippedPosUserSelection, setHasSkippedPosUserSelection] = useState(false);
    const [isResumedFromIdleLock, setIsResumedFromIdleLock] = useState(false);

    // Builds the flat POS user list from restaurant staff links.
    const availableUsers = useMemo<TPosUser[]>(
        () =>
            !isPOS
                ? []
                : (restaurant?.users?.items || [])
                      // Use UserRestaurantLink so each user carries their restaurant access and PIN fields.
                      .filter((userLink) => !!userLink?.id && !!userLink?.user?.id)
                      .map((userLink) => ({
                          id: userLink.id,
                          userId: userLink.user.id,
                          firstName: userLink.user.firstName,
                          lastName: userLink.user.lastName,
                          email: userLink.user.email,
                          imageKey: userLink.user.image?.key || null,
                          imageIdentityPoolId: userLink.user.image?.identityPoolId || null,
                          enablePosPin: !!userLink.enablePosPin,
                          posPin: userLink.posPin || null,
                          attendanceEnabled: !!userLink.attendanceEnabled,
                          breakTrackingEnabled: !!userLink.breakTrackingEnabled,
                          defaultBreakDurationMinutes: userLink.defaultBreakDurationMinutes ?? null,
                      }))
                      .sort((left, right) => `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`)),
        [isPOS, restaurant],
    );

    const selectedUserStorageKey = buildSelectedUserStorageKey(restaurant?.id, register?.id);
    const unlockedStorageKey = buildUnlockedStorageKey(restaurant?.id, register?.id);
    const skippedSelectionStorageKey = buildSkippedSelectionStorageKey(restaurant?.id, register?.id);

    const {
        data: attendanceData,
        loading: attendanceLoading,
        refetch: refetchAttendanceQuery,
    } = useQuery(LIST_ATTENDANCES_BY_USER, {
        variables: {
            employeeUserId: selectedPosUser?.userId || "",
            limit: 20,
        },
        skip: !isPOS || !selectedPosUser?.attendanceEnabled || !selectedPosUser?.userId,
        fetchPolicy: "network-only",
    });

    // Who's on shift right now, for badging the user grid. There's no restaurant-wide attendance
    // query, so this polls the per-user query once for each attendance-enabled staff member instead.
    const apolloClient = useApolloClient();
    const [attendanceStatusByUserId, setAttendanceStatusByUserId] = useState<Record<string, TShiftStatus>>({});
    const attendanceEnabledUserIdsKey = useMemo(
        () =>
            availableUsers
                .filter((user) => user.attendanceEnabled)
                .map((user) => user.userId)
                .join(","),
        [availableUsers],
    );

    useEffect(() => {
        const restaurantId = restaurant?.id;
        const userIds = attendanceEnabledUserIdsKey ? attendanceEnabledUserIdsKey.split(",") : [];

        if (!isPOS || !restaurantId || userIds.length === 0) {
            setAttendanceStatusByUserId({});
            return;
        }

        let cancelled = false;

        const fetchStatuses = async () => {
            const entries = await Promise.all(
                userIds.map(async (employeeUserId): Promise<[string, TShiftStatus] | null> => {
                    try {
                        const { data } = await apolloClient.query({
                            query: LIST_ATTENDANCES_BY_USER,
                            variables: { employeeUserId, limit: 5 },
                            fetchPolicy: "network-only",
                        });
                        const items = (data?.listAttendancesByUserId?.items || []) as IGET_ATTENDANCE[];
                        const active = items.find(
                            (attendance) =>
                                attendance.attendanceRestaurantId === restaurantId &&
                                attendance.status !== EAttendanceRecordStatus.COMPLETED &&
                                !attendance.clockOut,
                        );
                        if (!active) return null;
                        return [
                            employeeUserId,
                            { isActive: true, isOnBreak: (active.breaks || []).some((attendanceBreak) => !attendanceBreak.breakEnd) },
                        ];
                    } catch (error) {
                        console.error(`Failed to fetch shift status for user ${employeeUserId}:`, error);
                        return null;
                    }
                }),
            );

            if (cancelled) return;
            const map: Record<string, TShiftStatus> = {};
            entries.forEach((entry) => {
                if (entry) map[entry[0]] = entry[1];
            });
            setAttendanceStatusByUserId(map);
        };

        void fetchStatuses();
        const intervalId = setInterval(fetchStatuses, 20000);

        return () => {
            cancelled = true;
            clearInterval(intervalId);
        };
    }, [isPOS, restaurant?.id, attendanceEnabledUserIdsKey, apolloClient]);

    const [createAttendance, { loading: creatingAttendance }] = useMutation(CREATE_ATTENDANCE);
    const [updateAttendance, { loading: updatingAttendance }] = useMutation(UPDATE_ATTENDANCE);
    const [fetchRosterShifts] = useLazyQuery(LIST_ROSTER_SHIFTS_BY_RESTAURANT_AND_DATE, { fetchPolicy: "network-only" });

    const attendanceHistory = useMemo<IGET_ATTENDANCE[]>(() => {
        return attendanceData?.listAttendancesByUserId?.items || [];
    }, [attendanceData]);

    const activeAttendance = useMemo<IGET_ATTENDANCE | null>(() => {
        return (
            attendanceHistory.find(
                (attendance) =>
                    attendance.attendanceRestaurantId === restaurant?.id &&
                    attendance.status !== EAttendanceRecordStatus.COMPLETED &&
                    !attendance.clockOut,
            ) || null
        );
    }, [attendanceHistory, restaurant?.id]);

    const activeAttendanceBreak = useMemo<IGET_ATTENDANCE_BREAK | null>(() => {
        if (!activeAttendance) return null;
        return (activeAttendance.breaks || []).find((attendanceBreak) => !attendanceBreak.breakEnd) || null;
    }, [activeAttendance]);

    const attendanceActionLoading = creatingAttendance || updatingAttendance;

    const refetchAttendance = useCallback(async () => {
        if (!selectedPosUser?.attendanceEnabled) return;
        await refetchAttendanceQuery();
    }, [refetchAttendanceQuery, selectedPosUser?.attendanceEnabled]);

    // Restores the selected cashier and unlock state when restaurant/register context changes.
    // Runs even with PIN disabled, since attendance-only registers still need the selection to persist.
    useEffect(() => {
        if (!isPOS || !restaurant?.id || !register?.id) {
            setSelectedPosUser(null);
            setIsUnlocked(false);
            setHasSkippedPosUserSelection(false);
            setIsResumedFromIdleLock(false);
            localStorage.removeItem(selectedUserStorageKey);
            localStorage.removeItem(unlockedStorageKey);
            localStorage.removeItem(skippedSelectionStorageKey);
            return;
        }

        const storedSelectedPosUserId = localStorage.getItem(selectedUserStorageKey);
        const matchedUser = availableUsers.find((availableUser) => availableUser.id === storedSelectedPosUserId) || null;
        const canRestoreSkippedSelection = availableUsers.length === 0 && localStorage.getItem(skippedSelectionStorageKey) === "true";

        setSelectedPosUser(matchedUser);
        setIsUnlocked(!!matchedUser && localStorage.getItem(unlockedStorageKey) === "true");
        setHasSkippedPosUserSelection(canRestoreSkippedSelection);

        if (availableUsers.length > 0) {
            localStorage.removeItem(skippedSelectionStorageKey);
        }
    }, [
        availableUsers,
        isPOS,
        isPosPinFeatureEnabled,
        register?.id,
        restaurant?.id,
        selectedUserStorageKey,
        skippedSelectionStorageKey,
        unlockedStorageKey,
    ]);

    // Selects a cashier, skipping the PIN step if PIN is disabled or not required for this user.
    const selectPosUser = (posUserId: string) => {
        const matchedUser = availableUsers.find((availableUser) => availableUser.id === posUserId) || null;
        const shouldUnlockWithoutPin = !!matchedUser && (!isPosPinFeatureEnabled || !matchedUser.enablePosPin);
        // Re-tapping the same already-selected user (no PIN to resume through) counts as a resume,
        // not a fresh selection.
        const isReselectingSameUser = !!matchedUser && selectedPosUser?.id === matchedUser.id;

        setSelectedPosUser(matchedUser);
        setIsUnlocked(shouldUnlockWithoutPin);
        setHasSkippedPosUserSelection(false);
        if (!isReselectingSameUser) {
            setIsResumedFromIdleLock(false);
        }

        if (matchedUser) {
            localStorage.setItem(selectedUserStorageKey, matchedUser.id);
        } else {
            localStorage.removeItem(selectedUserStorageKey);
        }

        localStorage.removeItem(skippedSelectionStorageKey);

        if (shouldUnlockWithoutPin) {
            localStorage.setItem(unlockedStorageKey, "true");
        } else {
            localStorage.removeItem(unlockedStorageKey);
        }
    };

    // Lets the POS flow continue when user selection is required but no active users exist.
    const skipPosUserSelection = () => {
        setSelectedPosUser(null);
        setIsUnlocked(false);
        setHasSkippedPosUserSelection(true);
        localStorage.removeItem(selectedUserStorageKey);
        localStorage.removeItem(unlockedStorageKey);
        localStorage.setItem(skippedSelectionStorageKey, "true");
    };

    // Verifies the entered PIN and marks the register session as unlocked.
    const unlockPosUser = async (pin: string) => {
        if (!selectedPosUser) return false;

        if (!selectedPosUser.enablePosPin) {
            setIsUnlocked(true);
            localStorage.setItem(unlockedStorageKey, "true");
            return true;
        }

        if (pin.length !== 4 || selectedPosUser.posPin !== pin) return false;

        setIsUnlocked(true);
        localStorage.setItem(unlockedStorageKey, "true");
        return true;
    };

    // Locks the current cashier without clearing the selection, and flags the next unlock as a resume.
    const lockPosUser = () => {
        setIsUnlocked(false);
        setIsResumedFromIdleLock(true);
        localStorage.removeItem(unlockedStorageKey);
    };

    const idleTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Re-locks the register after the configured idle timeout instead of staying unlocked forever.
    useEffect(() => {
        const posUserPinTimeoutInSeconds = register?.posUserPinTimeoutInSeconds;

        if (!isPOS || !isPosPinFeatureEnabled || !isUnlocked || !posUserPinTimeoutInSeconds || posUserPinTimeoutInSeconds <= 0) {
            return;
        }

        const timeoutMs = posUserPinTimeoutInSeconds * 1000;
        const activityEvents: (keyof DocumentEventMap)[] = ["mousedown", "keydown", "touchstart", "wheel"];

        const resetIdleTimeout = () => {
            if (idleTimeoutIdRef.current) clearTimeout(idleTimeoutIdRef.current);
            idleTimeoutIdRef.current = setTimeout(lockPosUser, timeoutMs);
        };

        activityEvents.forEach((eventName) => document.addEventListener(eventName, resetIdleTimeout));
        resetIdleTimeout();

        return () => {
            activityEvents.forEach((eventName) => document.removeEventListener(eventName, resetIdleTimeout));
            if (idleTimeoutIdRef.current) {
                clearTimeout(idleTimeoutIdRef.current);
                idleTimeoutIdRef.current = null;
            }
        };
    }, [isPOS, isPosPinFeatureEnabled, isUnlocked, register?.posUserPinTimeoutInSeconds]);

    // Clears the cashier selection completely and resets the saved unlock state.
    const clearSelectedPosUser = () => {
        setSelectedPosUser(null);
        setIsUnlocked(false);
        setHasSkippedPosUserSelection(false);
        setIsResumedFromIdleLock(false);
        localStorage.removeItem(selectedUserStorageKey);
        localStorage.removeItem(unlockedStorageKey);
        localStorage.removeItem(skippedSelectionStorageKey);
    };

    const startShift = async () => {
        if (!restaurant?.id || !selectedPosUser || activeAttendance) return false;

        const now = new Date();
        const timestamp = now.toISOString();
        const userName = `${selectedPosUser.firstName} ${selectedPosUser.lastName}`.trim();
        const businessDate = getBusinessDate();

        // Best-effort link to today's rostered shift; failures just leave it null, never block clock-in.
        let scheduledShiftId: string | null = null;
        try {
            const shiftsRes = await fetchRosterShifts({
                variables: { rosterRestaurantId: restaurant.id, shiftDate: businessDate },
            });
            const shifts = (shiftsRes.data?.listRosterShiftsByRestaurantId?.items || []) as IGET_ROSTER_SHIFT[];
            scheduledShiftId = findClosestScheduledShift(shifts, selectedPosUser.userId, now)?.id ?? null;
        } catch {
            scheduledShiftId = null;
        }

        await createAttendance({
            variables: {
                employeeName: userName,
                employeeUserId: selectedPosUser.userId,
                status: EAttendanceRecordStatus.ACTIVE,
                businessDate,
                clockIn: timestamp,
                manualEntry: false,
                adjustmentHistory: [
                    toAttendanceAdjustmentInput({
                        status: EAttendanceAdjustmentStatus.CREATED,
                        changedByUserId: selectedPosUser.userId,
                        changedByUserName: userName,
                        changedAt: timestamp,
                    }),
                ],
                attendanceRestaurantId: restaurant.id,
                scheduledShiftId,
                owner: selectedPosUser.userId,
            },
        });
        await refetchAttendance();
        return true;
    };

    const endShift = async () => {
        if (!activeAttendance) return false;

        const endedAt = new Date().toISOString();

        const updatedBreaks = (activeAttendance.breaks || []).map((b) =>
            b.breakEnd
                ? { breakStart: b.breakStart, breakEnd: b.breakEnd, durationMinutes: b.durationMinutes ?? null }
                : { breakStart: b.breakStart, breakEnd: endedAt, durationMinutes: calculateDurationMinutes(b.breakStart, endedAt) },
        );

        const userName = selectedPosUser ? `${selectedPosUser.firstName} ${selectedPosUser.lastName}`.trim() : "";
        await updateAttendance({
            variables: {
                id: activeAttendance.id,
                status: EAttendanceRecordStatus.COMPLETED,
                clockOut: endedAt,
                breaks: updatedBreaks.length > 0 ? updatedBreaks : undefined,
                adjustmentHistory: getAdjustmentHistoryForUpdate(
                    activeAttendance.adjustmentHistory,
                    EAttendanceAdjustmentStatus.UPDATED,
                    selectedPosUser?.userId || "",
                    userName,
                    endedAt,
                ),
            },
        });
        await refetchAttendance();
        return true;
    };

    const startBreak = async () => {
        if (!selectedPosUser?.breakTrackingEnabled || !activeAttendance || activeAttendanceBreak) return false;

        const startedAt = new Date().toISOString();
        const userName = selectedPosUser ? `${selectedPosUser.firstName} ${selectedPosUser.lastName}`.trim() : "";
        const existingBreaks = (activeAttendance.breaks || []).map((b) => ({
            breakStart: b.breakStart,
            breakEnd: b.breakEnd ?? null,
            durationMinutes: b.durationMinutes ?? null,
        }));
        await updateAttendance({
            variables: {
                id: activeAttendance.id,
                status: EAttendanceRecordStatus.ON_BREAK,
                breaks: [...existingBreaks, { breakStart: startedAt, breakEnd: null, durationMinutes: null }],
                adjustmentHistory: getAdjustmentHistoryForUpdate(
                    activeAttendance.adjustmentHistory,
                    EAttendanceAdjustmentStatus.UPDATED,
                    selectedPosUser?.userId || "",
                    userName,
                    startedAt,
                ),
            },
        });
        await refetchAttendance();
        return true;
    };

    const resumeShift = async () => {
        if (!activeAttendance || !activeAttendanceBreak) return false;

        const resumedAt = new Date().toISOString();
        const breakDurationMinutes = calculateDurationMinutes(activeAttendanceBreak.breakStart, resumedAt);
        const updatedBreaks = (activeAttendance.breaks || []).map((b) =>
            b.breakEnd
                ? { breakStart: b.breakStart, breakEnd: b.breakEnd, durationMinutes: b.durationMinutes ?? null }
                : { breakStart: b.breakStart, breakEnd: resumedAt, durationMinutes: breakDurationMinutes },
        );

        const userName = selectedPosUser ? `${selectedPosUser.firstName} ${selectedPosUser.lastName}`.trim() : "";
        await updateAttendance({
            variables: {
                id: activeAttendance.id,
                status: EAttendanceRecordStatus.ACTIVE,
                breaks: updatedBreaks,
                adjustmentHistory: getAdjustmentHistoryForUpdate(
                    activeAttendance.adjustmentHistory,
                    EAttendanceAdjustmentStatus.UPDATED,
                    selectedPosUser?.userId || "",
                    userName,
                    resumedAt,
                ),
            },
        });
        await refetchAttendance();
        return true;
    };

    return (
        <PosUserContext.Provider
            value={{
                availableUsers,
                selectedPosUser,
                isUnlocked,
                isPosPinFeatureEnabled,
                hasSkippedPosUserSelection,
                isResumedFromIdleLock,
                attendanceStatusByUserId,
                activeAttendance,
                activeAttendanceBreak,
                attendanceHistory,
                attendanceLoading,
                attendanceActionLoading,
                refetchAttendance,
                selectPosUser,
                skipPosUserSelection,
                unlockPosUser,
                lockPosUser,
                clearSelectedPosUser,
                startShift,
                endShift,
                startBreak,
                resumeShift,
            }}
        >
            {props.children}
        </PosUserContext.Provider>
    );
};

// Reads the current POS cashier state and actions for selection, PIN unlock, and route guards.
export const usePosUser = () => {
    const context = useContext(PosUserContext);
    if (context === undefined) {
        throw new Error(`usePosUser must be used within a PosUserProvider`);
    }
    return context;
};
