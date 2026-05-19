import { FiArrowLeft } from "react-icons/fi";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePosUser } from "../../context/pos-user-context";
import { useRegister } from "../../context/register-context";
import { getCloudFrontDomainName } from "../../private/aws-custom";
import { Button } from "../../tabin/components/button";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { beginOrderPath, posPinPath, registerListPath } from "../main";

import "./posUserList.scss";

export default () => {
    const navigate = useNavigate();
    const { register } = useRegister();
    const { availableUsers, selectPosUser, clearSelectedPosUser, skipPosUserSelection, isPosPinFeatureEnabled } = usePosUser();

    const getInitials = (firstName: string, lastName: string) => `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();

    useEffect(() => {
        if (!isPosPinFeatureEnabled) {
            navigate(beginOrderPath, { replace: true });
        }
    }, [isPosPinFeatureEnabled, navigate]);

    const handleSelectUser = (userId: string) => {
        selectPosUser(userId);
        navigate(posPinPath, { replace: true });
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

                {availableUsers.length === 0 ? (
                    <div className="pos-user-list__empty">
                        <div>No active users are available yet.</div>
                        <Button className="mt-3" onClick={handleSkip}>
                            Skip
                        </Button>
                    </div>
                ) : (
                    <div className="pos-user-list__grid">
                        {availableUsers.map((availableUser) => (
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
