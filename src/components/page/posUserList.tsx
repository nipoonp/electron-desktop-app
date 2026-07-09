import { FiArrowLeft } from "react-icons/fi";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePosUser } from "../../context/pos-user-context";
import { useRegister } from "../../context/register-context";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import { Button } from "../../tabin/components/button";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { beginOrderPath, posPinPath, posTimeclockPath, registerListPath } from "../main";

import "./posUserList.scss";

export default () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { register } = useRegister();
    const { availableUsers, selectPosUser, clearSelectedPosUser, skipPosUserSelection, isPosPinFeatureEnabled } = usePosUser();
    const isShiftSelection = (location.state as { mode?: string } | null)?.mode === "shift" || !isPosPinFeatureEnabled;
    const usersToDisplay = isShiftSelection ? availableUsers.filter((availableUser) => availableUser.attendanceEnabled) : availableUsers;

    const getInitials = (firstName: string, lastName: string) => `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();

    useEffect(() => {
        if (!isPosPinFeatureEnabled && !isShiftSelection) {
            navigate(beginOrderPath, { replace: true });
        }
    }, [isPosPinFeatureEnabled, isShiftSelection, navigate]);

    const handleSelectUser = (userId: string) => {
        if (isShiftSelection) {
            navigate(posTimeclockPath, { replace: true });
            return;
        }

        const selectedUser = availableUsers.find((availableUser) => availableUser.id === userId) || null;
        selectPosUser(userId);
        navigate(isPosPinFeatureEnabled && selectedUser?.posPinEnabled ? posPinPath : beginOrderPath, { replace: true });
    };

    const handleSkip = () => {
        skipPosUserSelection();
        navigate(beginOrderPath, { replace: true });
    };

    return (
        <PageWrapper>
            <div className="pos-user-list">
                <div className="pos-user-list__header">
                    <button
                        className="pos-user-list__back"
                        onClick={() => {
                            clearSelectedPosUser();
                            navigate(registerListPath);
                        }}
                    >
                        <FiArrowLeft />
                        <span>Back to Registers</span>
                    </button>
                    <div className="pos-user-list__titlebar">
                        <div className="pos-user-list__eyebrow">Active Users</div>
                    </div>
                    <div className="pos-user-list__register-name">{register?.name || ""}</div>
                </div>

                {usersToDisplay.length === 0 ? (
                    <div className="pos-user-list__empty">
                        <div>{isShiftSelection ? "No attendance-enabled users are available yet." : "No active users are available yet."}</div>
                        {isShiftSelection ? (
                            <Button className="mt-3" onClick={() => navigate(beginOrderPath, { replace: true })}>
                                Back to POS
                            </Button>
                        ) : (
                            <Button className="mt-3" onClick={handleSkip}>
                                Skip
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="pos-user-list__grid">
                        {usersToDisplay.map((availableUser) => (
                            <button className="pos-user-card" key={availableUser.id} onClick={() => handleSelectUser(availableUser.id)}>
                                <div className="pos-user-card__avatar" title={`${availableUser.firstName} ${availableUser.lastName}`}>
                                    {availableUser.imageKey && availableUser.imageIdentityPoolId ? (
                                        <img
                                            src={`${getCloudFrontDomainName()}/protected/${availableUser.imageIdentityPoolId}/${availableUser.imageKey}`}
                                            alt={`${availableUser.firstName} ${availableUser.lastName}`}
                                            className="pos-user-card__avatar-image"
                                        />
                                    ) : (
                                        getInitials(availableUser.firstName, availableUser.lastName)
                                    )}
                                </div>
                                <div className="pos-user-card__name">{`${availableUser.firstName} ${availableUser.lastName}`}</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </PageWrapper>
    );
};
