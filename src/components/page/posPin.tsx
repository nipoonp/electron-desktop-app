import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiDelete } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { usePosUser } from "../../context/pos-user-context";
import { Button } from "../../tabin/components/button";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { toast } from "../../tabin/components/toast";
import { beginOrderPath, posUserListPath } from "../main";

import "./posPin.scss";

const PIN_LENGTH = 4;
const PIN_PAD_VALUES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

export default () => {
    const navigate = useNavigate();
    const { selectedPosUser, isUnlocked, unlockPosUser, clearSelectedPosUser, isPosPinFeatureEnabled, hasSkippedPosUserSelection } = usePosUser();
    const [pin, setPin] = useState("");

    useEffect(() => {
        if (!isPosPinFeatureEnabled || hasSkippedPosUserSelection) {
            navigate(beginOrderPath, { replace: true });
            return;
        }

        if (!selectedPosUser) {
            navigate(posUserListPath, { replace: true });
            return;
        }

        if (isUnlocked || !selectedPosUser.posPinEnabled) {
            navigate(beginOrderPath, { replace: true });
        }
    }, [hasSkippedPosUserSelection, isPosPinFeatureEnabled, isUnlocked, navigate, selectedPosUser]);

    const title = useMemo(() => {
        if (!selectedPosUser) return "Enter Pin";
        return `Enter Pin for ${selectedPosUser.firstName}`;
    }, [selectedPosUser]);

    const handleUnlock = async (nextPin: string) => {
        const success = await unlockPosUser(nextPin);
        if (!success) {
            toast.error("Incorrect 4-digit PIN.");
            setPin("");
            return;
        }

        navigate(beginOrderPath, { replace: true });
    };

    const handleDigit = async (digit: string) => {
        if (pin.length >= PIN_LENGTH) return;

        const nextPin = `${pin}${digit}`;
        setPin(nextPin);

        if (nextPin.length === PIN_LENGTH) {
            await handleUnlock(nextPin);
        }
    };

    const handleDelete = () => setPin((previous) => previous.slice(0, -1));

    return (
        <PageWrapper>
            <div className="pos-pin-page">
                <div className="pos-pin-page__header">
                    <button
                        className="pos-pin-page__back"
                        onClick={() => {
                            clearSelectedPosUser();
                            navigate(posUserListPath, { replace: true });
                        }}
                    >
                        <FiArrowLeft />
                        <span>Back to Users</span>
                    </button>
                </div>

                <div className="pos-pin-panel">
                    <div className="h2 text-center mb-2">Enter PIN</div>
                    <div className="pos-pin-page__dots">
                        {Array.from({ length: PIN_LENGTH }).map((_, index) => (
                            <span className={index < pin.length ? "filled" : ""} key={index} />
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
                        <Button className="pos-pin-pad__delete" onClick={handleDelete}>
                            <FiDelete />
                        </Button>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};
