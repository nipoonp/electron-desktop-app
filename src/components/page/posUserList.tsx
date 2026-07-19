import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import KioskBoard from "kioskboard";
import { usePosUser } from "../../context/pos-user-context";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import { Button } from "../../tabin/components/button";
import { CachedImage } from "../../tabin/components/cachedImage";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { toast } from "../../tabin/components/toast";
import { beginOrderPath } from "../main";

import "./posUserList.scss";

const PIN_LENGTH = 4;

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
    } = usePosUser();
    const numpadRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isPosPinFeatureEnabled || hasSkippedPosUserSelection || isUnlocked) {
            navigate(beginOrderPath, { replace: true });
        }
    }, [hasSkippedPosUserSelection, isPosPinFeatureEnabled, isUnlocked, navigate]);

    useEffect(() => {
        if (!selectedPosUser?.enablePosPin || !numpadRef.current) return;

        KioskBoard.run(numpadRef.current, {
            theme: "light",
            keysArrayOfObjects: [
                { "0": "7", "1": "8", "2": "9" },
                { "0": "4", "1": "5", "2": "6" },
                { "0": "1", "1": "2", "2": "3" },
                { "0": "0" },
            ],
        });
    }, [selectedPosUser]);

    const getInitials = (firstName: string, lastName: string) => `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();

    const onSelectUser = (userId: string) => {
        const selectedUser = availableUsers.find((availableUser) => availableUser.id === userId);
        selectPosUser(userId);

        if (selectedUser && !selectedUser.enablePosPin) {
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

        navigate(beginOrderPath, { replace: true });
    };

    const onSkip = () => {
        skipPosUserSelection();
        navigate(beginOrderPath, { replace: true });
    };

    return (
        <PageWrapper>
            {selectedPosUser?.enablePosPin ? (
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
            ) : (
                <div className="pos-user-list">
                    <div className="h2 mb-6">Select a user</div>

                    {availableUsers.length === 0 ? (
                        <div className="pos-user-list-empty">
                            <div className="mb-4">No active users are available yet.</div>
                            <Button onClick={onSkip}>Skip</Button>
                        </div>
                    ) : (
                        <div className="pos-user-list-grid">
                            {availableUsers.map((availableUser) => (
                                <div className="pos-user-card" key={availableUser.id} onClick={() => onSelectUser(availableUser.id)}>
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
                                    <div className="pos-user-card-name">{`${availableUser.firstName} ${availableUser.lastName}`}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </PageWrapper>
    );
};
