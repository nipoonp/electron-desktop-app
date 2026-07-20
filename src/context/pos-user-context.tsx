import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRegister } from "./register-context";
import { useRestaurant } from "./restaurant-context";
import { CREATE_ATTENDANCE, UPDATE_ATTENDANCE } from "../graphql/customMutations";
import {
    EAttendanceAdjustmentStatus,
    EAttendanceRecordStatus,
    IGET_ATTENDANCE,
    IGET_ATTENDANCE_BREAK,
    LIST_ATTENDANCES_BY_USER,
} from "../graphql/customQueries";

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

// Saves the selected POS user for the current restaurant and register.
const buildSelectedUserStorageKey = (restaurantId?: string | null, registerId?: string | null) =>
    `selectedPosUserId:${restaurantId || "none"}:${registerId || "none"}`;

// Stores whether the selected POS user has already passed the PIN check for this register.
const buildUnlockedStorageKey = (restaurantId?: string | null, registerId?: string | null) =>
    `selectedPosUserUnlocked:${restaurantId || "none"}:${registerId || "none"}`;

// Marks that the operator intentionally skipped POS user selection because no active staff were available.
const buildSkippedSelectionStorageKey = (restaurantId?: string | null, registerId?: string | null) =>
    `selectedPosUserSkipped:${restaurantId || "none"}:${registerId || "none"}`;

export const getBusinessDate = (date = new Date()) =>
    new Intl.DateTimeFormat("en-CA").format(date);

export const calculateDurationMinutes = (startTime?: string | null, endTime = new Date().toISOString()) => {
    if (!startTime) return 0;

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return 0;

    return Math.max(0, Math.round((end - start) / 60000));
};

export const getTotalBreakMinutes = (attendance: IGET_ATTENDANCE, openBreakEnd?: string) =>
    (attendance.breaks || []).reduce((total, attendanceBreak) => {
        if (!attendanceBreak.breakEnd) {
            return openBreakEnd ? total + calculateDurationMinutes(attendanceBreak.breakStart, openBreakEnd) : total;
        }
        if (attendanceBreak.durationMinutes !== undefined && attendanceBreak.durationMinutes !== null) {
            return total + attendanceBreak.durationMinutes;
        }
        return total + calculateDurationMinutes(attendanceBreak.breakStart, attendanceBreak.breakEnd);
    }, 0);

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

    // Builds the active POS user list from restaurant staff links and keeps the data flat for UI usage.
    const availableUsers = useMemo<TPosUser[]>(
        () =>
            !isPOS
                ? []
                : (restaurant?.users?.items || [])
                      // POS users must come from UserRestaurantLink so the selected staff member carries
                      // restaurant-scoped access, permissions, and the CRUD-only POS PIN fields together.
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

    const [createAttendance, { loading: creatingAttendance }] = useMutation(CREATE_ATTENDANCE);
    const [updateAttendance, { loading: updatingAttendance }] = useMutation(UPDATE_ATTENDANCE);

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

    // Restores the selected cashier and unlock state whenever restaurant/register context changes.
    useEffect(() => {
        if (!isPOS || !restaurant?.id || !register?.id) {
            setSelectedPosUser(null);
            setIsUnlocked(false);
            setHasSkippedPosUserSelection(false);
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

    // Selects a cashier for the current register and skips PIN when register-level POS PIN is disabled
    // or when the selected user does not require a PIN.
    const selectPosUser = (posUserId: string) => {
        const matchedUser = availableUsers.find((availableUser) => availableUser.id === posUserId) || null;
        const shouldUnlockWithoutPin = !!matchedUser && (!isPosPinFeatureEnabled || !matchedUser.enablePosPin);

        setSelectedPosUser(matchedUser);
        setIsUnlocked(shouldUnlockWithoutPin);
        setHasSkippedPosUserSelection(false);

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

    // Allows POS flow to continue when the register requires user selection but there are no active users to choose from.
    const skipPosUserSelection = () => {
        setSelectedPosUser(null);
        setIsUnlocked(false);
        setHasSkippedPosUserSelection(true);
        localStorage.removeItem(selectedUserStorageKey);
        localStorage.removeItem(unlockedStorageKey);
        localStorage.setItem(skippedSelectionStorageKey, "true");
    };

    // Verifies the entered PIN for the selected cashier and marks the current register session as unlocked.
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

    // Locks the current cashier without clearing who is selected.
    const lockPosUser = () => {
        setIsUnlocked(false);
        localStorage.removeItem(unlockedStorageKey);
    };

    // Clears the cashier selection completely and resets the saved unlock state.
    const clearSelectedPosUser = () => {
        setSelectedPosUser(null);
        setIsUnlocked(false);
        setHasSkippedPosUserSelection(false);
        localStorage.removeItem(selectedUserStorageKey);
        localStorage.removeItem(unlockedStorageKey);
        localStorage.removeItem(skippedSelectionStorageKey);
    };

    const startShift = async () => {
        if (!restaurant?.id || !selectedPosUser || activeAttendance) return false;

        const now = new Date();
        const timestamp = now.toISOString();
        const userName = `${selectedPosUser.firstName} ${selectedPosUser.lastName}`.trim();
        await createAttendance({
            variables: {
                employeeName: userName,
                employeeUserId: selectedPosUser.userId,
                status: EAttendanceRecordStatus.ACTIVE,
                businessDate: getBusinessDate(),
                clockIn: timestamp,
                totalBreakMinutes: 0,
                workedMinutes: 0,
                manualEntry: false,
                adjustedByUserId: selectedPosUser.userId,
                adjustedByUserName: userName,
                adjustedAt: timestamp,
                adjustmentHistory: [
                    toAttendanceAdjustmentInput({
                        status: EAttendanceAdjustmentStatus.CREATED,
                        changedByUserId: selectedPosUser.userId,
                        changedByUserName: userName,
                        changedAt: timestamp,
                    }),
                ],
                attendanceRestaurantId: restaurant.id,
                owner: selectedPosUser.userId,
            },
        });
        await refetchAttendance();
        return true;
    };

    const endShift = async () => {
        if (!activeAttendance) return false;

        const endedAt = new Date().toISOString();
        const totalBreakMinutes = getTotalBreakMinutes(activeAttendance, endedAt);
        const workedMinutes = Math.max(0, calculateDurationMinutes(activeAttendance.clockIn, endedAt) - totalBreakMinutes);

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
                totalBreakMinutes,
                workedMinutes,
                adjustedByUserId: selectedPosUser?.userId || null,
                adjustedByUserName: userName || null,
                adjustedAt: endedAt,
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
                adjustedByUserId: selectedPosUser?.userId || null,
                adjustedByUserName: userName || null,
                adjustedAt: startedAt,
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
        const totalBreakMinutes = updatedBreaks.reduce((total, b) => total + (b.durationMinutes ?? 0), 0);

        const userName = selectedPosUser ? `${selectedPosUser.firstName} ${selectedPosUser.lastName}`.trim() : "";
        await updateAttendance({
            variables: {
                id: activeAttendance.id,
                status: EAttendanceRecordStatus.ACTIVE,
                breaks: updatedBreaks,
                totalBreakMinutes,
                adjustedByUserId: selectedPosUser?.userId || null,
                adjustedByUserName: userName || null,
                adjustedAt: resumedAt,
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
