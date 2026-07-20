import { useState, useMemo, useEffect } from "react";
import { FiSearch, FiChevronDown, FiLogIn, FiLogOut, FiCoffee, FiPlay, FiDelete } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { TPosUser, usePosUser } from "../../context/pos-user-context";
import { useRegister } from "../../context/register-context";
import { EAttendanceRecordStatus } from "../../graphql/customQueries";
import { Button } from "../../tabin/components/button";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { toast } from "../../tabin/components/toast";
import { beginOrderPath } from "../main";

import "./posTimeclock.scss";

const PIN_LENGTH = 4;
const PIN_PAD_VALUES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const formatDateTime = (timestamp?: string | null): string => {
    if (!timestamp) return "";
    try {
        const date = new Date(timestamp);
        const dayName = date.toLocaleDateString(undefined, { weekday: "long" });
        const dayNum = parseInt(new Intl.DateTimeFormat("en-CA", { day: "numeric" }).format(date), 10);
        const month = date.toLocaleDateString(undefined, { month: "long" });
        const year = new Intl.DateTimeFormat("en-CA", { year: "numeric" }).format(date);
        const time = date
            .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true })
            .replace(" am", "am")
            .replace(" pm", "pm");
        return `${dayName}, ${ordinal(dayNum)} ${month} ${year} at ${time}`;
    } catch {
        return "";
    }
};

const formatClockTime = (date: Date): { timeMain: string; timePeriod: string } => {
    const str = date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
    const match = str.match(/^(\d+:\d+)\s*(am|pm)$/i);
    if (match) return { timeMain: match[1], timePeriod: match[2].toUpperCase() };
    const parts = str.split(" ");
    return { timeMain: parts[0] || str, timePeriod: (parts[1] || "").toUpperCase() };
};

const staffListName = (user: TPosUser) =>
    `${user.firstName.toUpperCase()} ${user.lastName.slice(0, 1).toUpperCase()}`;

export default () => {
    const navigate = useNavigate();
    const { register } = useRegister();
    const {
        availableUsers,
        selectedPosUser,
        isUnlocked,
        isPosPinFeatureEnabled,
        activeAttendance,
        activeAttendanceBreak,
        attendanceLoading,
        attendanceActionLoading,
        selectPosUser,
        unlockPosUser,
        clearSelectedPosUser,
        skipPosUserSelection,
        startShift,
        endShift,
        startBreak,
        resumeShift,
        refetchAttendance,
    } = usePosUser();

    const [searchQuery, setSearchQuery] = useState("");
    const [pinInput, setPinInput] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());

    // Live clock
    useEffect(() => {
        const id = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    // Ensure fresh attendance data when the user reaches the actions panel.
    // The context query auto-fires on userId change, but not on isUnlocked change
    // (e.g. after entering a PIN for an already-selected user).
    useEffect(() => {
        if (selectedPosUser?.attendanceEnabled && isUnlocked) {
            void refetchAttendance();
        }
    }, [selectedPosUser?.id, isUnlocked]); // eslint-disable-line react-hooks/exhaustive-deps

    // When PIN is enabled show all POS users (timeclock is also the login screen).
    // When PIN is disabled show only attendance-enabled users.
    const usersToDisplay = useMemo(
        () => (isPosPinFeatureEnabled ? availableUsers : availableUsers.filter((u) => u.attendanceEnabled)),
        [availableUsers, isPosPinFeatureEnabled],
    );

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return usersToDisplay;
        const q = searchQuery.toLowerCase();
        return usersToDisplay.filter(
            (u) => u.firstName.toLowerCase().includes(q) || u.lastName.toLowerCase().includes(q),
        );
    }, [usersToDisplay, searchQuery]);

    const isOnBreak = activeAttendance?.status === EAttendanceRecordStatus.ON_BREAK || !!activeAttendanceBreak;

    // View is derived entirely from context — no separate local "view" state needed.
    const isPinRequired = !!selectedPosUser && isPosPinFeatureEnabled && selectedPosUser.enablePosPin && !isUnlocked;
    const localView: "idle" | "pin" | "actions" = !selectedPosUser ? "idle" : isPinRequired ? "pin" : "actions";

    // Show "Continue to POS" when the route guard will let them through:
    // attendance not required OR (clocked in AND not on break).
    const canContinueToPOS =
        !selectedPosUser?.attendanceEnabled || (!attendanceLoading && !!activeAttendance && !isOnBreak);

    const handleSelectUser = (userId: string) => {
        if (selectedPosUser?.id === userId) {
            clearSelectedPosUser();
            setPinInput("");
            return;
        }
        setPinInput("");
        selectPosUser(userId);
    };

    const handleDigit = async (digit: string) => {
        if (pinInput.length >= PIN_LENGTH) return;
        const next = `${pinInput}${digit}`;
        setPinInput(next);
        if (next.length === PIN_LENGTH) {
            const success = await unlockPosUser(next);
            if (!success) {
                toast.error("Incorrect 4-digit PIN.");
                setPinInput("");
            }
        }
    };

    const handleDeleteDigit = () => setPinInput((prev) => prev.slice(0, -1));

    const handleAction = async (action: () => Promise<boolean>, successMsg: string, errorMsg: string) => {
        try {
            const success = await action();
            if (!success) {
                toast.error(errorMsg);
                return;
            }
            toast.success(successMsg);
        } catch {
            toast.error(errorMsg);
        }
    };

    const handleSkip = () => {
        skipPosUserSelection();
        navigate(beginOrderPath, { replace: true });
    };

    const handleContinueToPOS = () => navigate(beginOrderPath, { replace: true });

    const lastActionText = useMemo(() => {
        if (localView !== "actions" || !selectedPosUser) return "";
        if (activeAttendance) {
            if (activeAttendanceBreak) return `You last went on a break on ${formatDateTime(activeAttendanceBreak.breakStart)}`;
            return `You last clocked in on ${formatDateTime(activeAttendance.clockIn)}`;
        }
        return "";
    }, [localView, selectedPosUser, activeAttendance, activeAttendanceBreak]);

    const { timeMain, timePeriod } = formatClockTime(currentTime);

    return (
        <PageWrapper>
            <div className="pos-timeclock">
                {/* ── Left: staff list ── */}
                <div className="pos-timeclock__sidebar">
                    <div className="pos-timeclock__search">
                        <FiSearch className="pos-timeclock__search-icon" />
                        <input
                            className="pos-timeclock__search-input"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="pos-timeclock__list">
                        {filteredUsers.length === 0 ? (
                            <div className="pos-timeclock__empty">
                                <p>No staff found</p>
                                {availableUsers.length === 0 && (
                                    <Button className="mt-2" onClick={handleSkip}>
                                        Continue to POS
                                    </Button>
                                )}
                            </div>
                        ) : (
                            filteredUsers.map((user) => {
                                const isSelected = selectedPosUser?.id === user.id;
                                return (
                                    <button
                                        key={user.id}
                                        className={`pos-timeclock__staff-item${isSelected ? " selected" : ""}`}
                                        onClick={() => handleSelectUser(user.id)}
                                    >
                                        <span className="pos-timeclock__staff-name">{staffListName(user)}</span>
                                        {isSelected && <FiChevronDown className="pos-timeclock__chevron" />}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className="pos-timeclock__register">{register?.name || ""}</div>
                </div>

                {/* ── Right: clock / PIN / actions ── */}
                <div className="pos-timeclock__panel">
                    {/* ── Idle ── */}
                    {localView === "idle" && (
                        <>
                            <div className="pos-timeclock__clock">
                                <span className="pos-timeclock__clock-digits">{timeMain}</span>
                                <span className="pos-timeclock__clock-period">{timePeriod}</span>
                            </div>
                            <p className="pos-timeclock__prompt">
                                Hey there, just click on your name to clock in or out
                            </p>
                        </>
                    )}

                    {/* ── PIN entry ── */}
                    {localView === "pin" && selectedPosUser && (
                        <div className="pos-timeclock__pin-panel">
                            <div className="pos-timeclock__panel-employee">
                                {selectedPosUser.firstName} {selectedPosUser.lastName}
                            </div>
                            <div className="h2 text-center">Enter PIN</div>
                            <div className="pos-timeclock__pin-dots">
                                {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                                    <span key={i} className={i < pinInput.length ? "filled" : ""} />
                                ))}
                            </div>
                            <div className="pos-pin-pad">
                                {PIN_PAD_VALUES.slice(0, 9).map((digit) => (
                                    <Button className="pos-pin-pad__key" key={digit} onClick={() => handleDigit(digit)}>
                                        {digit}
                                    </Button>
                                ))}
                                <div className="pos-pin-pad__spacer" />
                                <Button className="pos-pin-pad__key" onClick={() => handleDigit("0")}>
                                    0
                                </Button>
                                <Button className="pos-pin-pad__delete" onClick={handleDeleteDigit}>
                                    <FiDelete />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ── Actions ── */}
                    {localView === "actions" && selectedPosUser && (
                        <>
                            <div className="pos-timeclock__clock">
                                <span className="pos-timeclock__clock-digits">{timeMain}</span>
                                <span className="pos-timeclock__clock-period">{timePeriod}</span>
                            </div>

                            <div className="pos-timeclock__panel-employee">
                                {selectedPosUser.firstName} {selectedPosUser.lastName}
                            </div>

                            {selectedPosUser.attendanceEnabled && (
                                <div className="pos-timeclock__actions">
                                    {attendanceLoading ? (
                                        <div className="pos-timeclock__loading">Loading shift…</div>
                                    ) : (
                                        <>
                                            {!activeAttendance && (
                                                <Button
                                                    className="pos-timeclock__btn-primary"
                                                    onClick={() => handleAction(startShift, "Clocked in.", "Unable to clock in.")}
                                                    loading={attendanceActionLoading}
                                                    disabled={attendanceActionLoading}
                                                >
                                                    <FiLogIn />
                                                    <span>Clock in</span>
                                                </Button>
                                            )}

                                            {activeAttendance && !isOnBreak && (
                                                <Button
                                                    className="pos-timeclock__btn-primary"
                                                    onClick={() => handleAction(endShift, "Clocked out.", "Unable to clock out.")}
                                                    loading={attendanceActionLoading}
                                                    disabled={attendanceActionLoading}
                                                >
                                                    <FiLogOut />
                                                    <span>Clock out</span>
                                                </Button>
                                            )}

                                            {activeAttendance && !isOnBreak && selectedPosUser.breakTrackingEnabled && (
                                                <Button
                                                    className="pos-timeclock__btn-outline"
                                                    onClick={() => handleAction(startBreak, "Break started.", "Unable to start break.")}
                                                    disabled={attendanceActionLoading}
                                                >
                                                    <FiCoffee />
                                                    <span>Start break</span>
                                                </Button>
                                            )}

                                            {activeAttendance && isOnBreak && (
                                                <>
                                                    <Button
                                                        className="pos-timeclock__btn-primary"
                                                        onClick={() => handleAction(endShift, "Clocked out.", "Unable to clock out.")}
                                                        loading={attendanceActionLoading}
                                                        disabled={attendanceActionLoading}
                                                    >
                                                        <FiLogOut />
                                                        <span>Clock out</span>
                                                    </Button>
                                                    <Button
                                                        className="pos-timeclock__btn-outline"
                                                        onClick={() => handleAction(resumeShift, "Break ended.", "Unable to end break.")}
                                                        disabled={attendanceActionLoading}
                                                    >
                                                        <FiPlay />
                                                        <span>End break</span>
                                                    </Button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {canContinueToPOS && (
                                <Button className="pos-timeclock__btn-continue" onClick={handleContinueToPOS}>
                                    Continue to POS
                                </Button>
                            )}

                            {lastActionText && <p className="pos-timeclock__last-action">{lastActionText}</p>}
                        </>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
};
