import { useEffect, useMemo, useRef } from "react";
import { FiX, FiLogIn, FiLogOut, FiCoffee, FiPlay } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import KioskBoard from "kioskboard";
import { usePosUser } from "../../context/pos-user-context";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import { EAttendanceRecordStatus } from "../../graphql/customQueries";
import { Button } from "../../tabin/components/button";
import { CachedImage } from "../../tabin/components/cachedImage";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { toast } from "../../tabin/components/toast";
import { beginOrderPath } from "../main";

import "./posUserList.scss";

const PIN_LENGTH = 4;
// How long a success message stays on screen before the page moves on by itself.
const CONFIRMATION_DELAY_MS = 900;

export default () => {
    const navigate = useNavigate();
    const {
        availableUsers,
        selectedPosUser,
        isUnlocked,
        selectPosUser,
        skipPosUserSelection,
        unlockPosUser,
        clearSelectedPosUser,
        isPosPinFeatureEnabled,
        hasSkippedPosUserSelection,
        isResumedFromIdleLock,
        attendanceStatusByUserId,
        activeAttendance,
        activeAttendanceBreak,
        attendanceLoading,
        attendanceActionLoading,
        startShift,
        endShift,
        startBreak,
        resumeShift,
        refetchAttendance,
    } = usePosUser();
    const numpadRef = useRef<HTMLInputElement>(null);

    // Show all users when PIN is on (this page doubles as login); otherwise just attendance users.
    const usersToDisplay = useMemo(
        () => (isPosPinFeatureEnabled ? availableUsers : availableUsers.filter((u) => u.attendanceEnabled)),
        [availableUsers, isPosPinFeatureEnabled],
    );

    const isOnBreak = activeAttendance?.status === EAttendanceRecordStatus.ON_BREAK || !!activeAttendanceBreak;
    const isPinRequired = !!selectedPosUser && selectedPosUser.enablePosPin && !isUnlocked;
    const isAttendanceFlow = !!selectedPosUser && isUnlocked && selectedPosUser.attendanceEnabled;

    // Leave this page once there's nothing left for the operator to do here.
    useEffect(() => {
        if (hasSkippedPosUserSelection) {
            navigate(beginOrderPath, { replace: true });
            return;
        }
        if (!isPosPinFeatureEnabled) {
            // No PIN: only leave if there's no one to clock in/out.
            if (usersToDisplay.length === 0 && !selectedPosUser) {
                navigate(beginOrderPath, { replace: true });
            }
            return;
        }
        if (isUnlocked && !selectedPosUser?.attendanceEnabled) {
            navigate(beginOrderPath, { replace: true });
        }
    }, [hasSkippedPosUserSelection, isPosPinFeatureEnabled, isUnlocked, selectedPosUser, usersToDisplay.length, navigate]);

    // Idle-lock resume: same cashier re-authenticating mid-shift, so skip straight back in.
    useEffect(() => {
        if (isAttendanceFlow && isResumedFromIdleLock) {
            navigate(beginOrderPath, { replace: true });
        }
    }, [isAttendanceFlow, isResumedFromIdleLock, navigate]);

    // Refetch attendance on entering the flow, since the query doesn't auto-fire on isUnlocked change.
    useEffect(() => {
        if (isAttendanceFlow) {
            void refetchAttendance();
        }
    }, [selectedPosUser?.id, isUnlocked]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!selectedPosUser?.enablePosPin || isUnlocked || !numpadRef.current) return;

        KioskBoard.run(numpadRef.current, {
            theme: "light",
            keysArrayOfObjects: [
                { "0": "7", "1": "8", "2": "9" },
                { "0": "4", "1": "5", "2": "6" },
                { "0": "1", "1": "2", "2": "3" },
                { "0": "0" },
            ],
        });
    }, [selectedPosUser, isUnlocked]);

    const getInitials = (firstName: string, lastName: string) => `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();

    const onSelectUser = (userId: string) => {
        const selectedUser = availableUsers.find((availableUser) => availableUser.id === userId);
        selectPosUser(userId);

        if (selectedUser && !selectedUser.enablePosPin && !selectedUser.attendanceEnabled) {
            navigate(beginOrderPath, { replace: true });
        }
    };

    const onClosePin = () => {
        clearSelectedPosUser();
    };

    const onUnlock = async () => {
        const pin = numpadRef.current?.value || "";

        if (pin.length !== PIN_LENGTH) {
            toast.error("Enter your 4-digit PIN.");
            return;
        }

        const success = await unlockPosUser(pin);

        if (!success) {
            toast.error("Incorrect 4-digit PIN.");
            if (numpadRef.current) numpadRef.current.value = "";
            return;
        }

        if (!selectedPosUser?.attendanceEnabled) {
            navigate(beginOrderPath, { replace: true });
        }
    };

    const onSkip = () => {
        skipPosUserSelection();
        navigate(beginOrderPath, { replace: true });
    };

    const handleClockIn = async () => {
        const success = await startShift();
        if (!success) {
            toast.error("Unable to clock in.");
            return;
        }
        toast.success("Clocked in.");
        setTimeout(() => navigate(beginOrderPath, { replace: true }), CONFIRMATION_DELAY_MS);
    };

    const handleClockOut = async () => {
        const success = await endShift();
        if (!success) {
            toast.error("Unable to clock out.");
            return;
        }
        toast.success("Clocked out.");
        // Done working — return to the grid for the next person, not into the POS.
        setTimeout(() => clearSelectedPosUser(), CONFIRMATION_DELAY_MS);
    };

    const handleStartBreak = async () => {
        const success = await startBreak();
        if (!success) {
            toast.error("Unable to start break.");
            return;
        }
        toast.success("Break started.");
        // Leaving the work area — return to the grid, not into the POS.
        setTimeout(() => clearSelectedPosUser(), CONFIRMATION_DELAY_MS);
    };

    const handleEndBreak = async () => {
        const success = await resumeShift();
        if (!success) {
            toast.error("Unable to end break.");
            return;
        }
        toast.success("Break ended.");
        // Back to work — continue into the POS.
        setTimeout(() => navigate(beginOrderPath, { replace: true }), CONFIRMATION_DELAY_MS);
    };

    return (
        <PageWrapper>
            {isPinRequired ? (
                <div className="pos-pin">
                    <div className="close-button-wrapper">
                        <FiX className="close-button" size={36} onClick={onClosePin} />
                    </div>
                    <div className="mb-12" style={{ width: "300px" }}>
                        <div className="h3 mb-2">Enter PIN for {selectedPosUser.firstName}</div>
                        <input
                            className="inputFromKey input"
                            ref={numpadRef}
                            data-kioskboard-type="numpad"
                            type="password"
                            inputMode="numeric"
                            maxLength={PIN_LENGTH}
                        />
                    </div>
                    <Button onClick={onUnlock}>Unlock</Button>
                </div>
            ) : isAttendanceFlow && selectedPosUser ? (
                isResumedFromIdleLock ? (
                    <div className="pos-attendance">
                        <div className="pos-attendance__loading">Resuming…</div>
                    </div>
                ) : (
                    <div className="pos-attendance">
                        <div className="close-button-wrapper">
                            <FiX className="close-button" size={36} onClick={onClosePin} />
                        </div>

                        <div className="pos-attendance__employee">
                            {selectedPosUser.firstName} {selectedPosUser.lastName}
                        </div>

                        <div className="pos-attendance__actions">
                            {attendanceLoading ? (
                                <div className="pos-attendance__loading">Loading shift…</div>
                            ) : !activeAttendance ? (
                                <Button
                                    className="pos-attendance__btn-primary"
                                    onClick={handleClockIn}
                                    loading={attendanceActionLoading}
                                    disabled={attendanceActionLoading}
                                >
                                    <FiLogIn />
                                    <span>Clock in</span>
                                </Button>
                            ) : isOnBreak ? (
                                <>
                                    <Button
                                        className="pos-attendance__btn-primary"
                                        onClick={handleClockOut}
                                        loading={attendanceActionLoading}
                                        disabled={attendanceActionLoading}
                                    >
                                        <FiLogOut />
                                        <span>Clock out</span>
                                    </Button>
                                    <Button className="pos-attendance__btn-outline" onClick={handleEndBreak} disabled={attendanceActionLoading}>
                                        <FiPlay />
                                        <span>End break</span>
                                    </Button>
                                </>
                            ) : selectedPosUser.breakTrackingEnabled ? (
                                <>
                                    <Button
                                        className="pos-attendance__btn-primary"
                                        onClick={handleClockOut}
                                        loading={attendanceActionLoading}
                                        disabled={attendanceActionLoading}
                                    >
                                        <FiLogOut />
                                        <span>Clock out</span>
                                    </Button>
                                    <Button className="pos-attendance__btn-outline" onClick={handleStartBreak} disabled={attendanceActionLoading}>
                                        <FiCoffee />
                                        <span>Start break</span>
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    className="pos-attendance__btn-primary"
                                    onClick={handleClockOut}
                                    loading={attendanceActionLoading}
                                    disabled={attendanceActionLoading}
                                >
                                    <FiLogOut />
                                    <span>Clock out</span>
                                </Button>
                            )}
                        </div>
                    </div>
                )
            ) : (
                <div className="pos-user-list">
                    <div className="h2 mb-6">Select a user</div>

                    {usersToDisplay.length === 0 ? (
                        <div className="pos-user-list-empty">
                            <div className="mb-4">No active users are available yet.</div>
                            <Button onClick={onSkip}>Skip</Button>
                        </div>
                    ) : (
                        <div className="pos-user-list-grid">
                            {usersToDisplay.map((availableUser) => {
                                const shiftStatus = availableUser.attendanceEnabled
                                    ? attendanceStatusByUserId[availableUser.userId]
                                    : undefined;
                                return (
                                    <div className="pos-user-card" key={availableUser.id} onClick={() => onSelectUser(availableUser.id)}>
                                        <div className="pos-user-card-avatar-wrapper">
                                            <div className="pos-user-card-avatar" title={`${availableUser.firstName} ${availableUser.lastName}`}>
                                                {availableUser.imageKey && availableUser.imageIdentityPoolId ? (
                                                    <CachedImage
                                                        className="pos-user-card-avatar-image"
                                                        url={`${getCloudFrontDomainName()}/protected/${availableUser.imageIdentityPoolId}/${availableUser.imageKey}`}
                                                        alt={`${availableUser.firstName} ${availableUser.lastName}`}
                                                    />
                                                ) : (
                                                    getInitials(availableUser.firstName, availableUser.lastName)
                                                )}
                                            </div>
                                            {shiftStatus?.isActive && (
                                                <span
                                                    className={`pos-user-card-shift-badge${shiftStatus.isOnBreak ? " on-break" : ""}`}
                                                    title={shiftStatus.isOnBreak ? "On break" : "Clocked in"}
                                                />
                                            )}
                                        </div>
                                        <div className="pos-user-card-name">{`${availableUser.firstName} ${availableUser.lastName}`}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </PageWrapper>
    );
};
