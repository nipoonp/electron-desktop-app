import { useState } from "react";
import { useNavigate } from "react-router";
import { checkoutPath } from "../main";
import { useCart } from "../../context/cart-context";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { Button } from "../../tabin/components/button";
import { Input } from "../../tabin/components/input";
import { useRestaurant } from "../../context/restaurant-context";

import "./buzzerNumber.scss";
import { FiX } from "react-icons/fi";

export default () => {
    const navigate = useNavigate();
    const { restaurant } = useRestaurant();
    const { buzzerNumber, setBuzzerNumber } = useCart();

    const [buzzer, setBuzzer] = useState(buzzerNumber);
    const [buzzerError, setBuzzerError] = useState(false);

    if (restaurant == null) throw "Restaurant is invalid!";

    const onClose = () => {
        navigate(`${checkoutPath}`);
    };

    const onNext = () => {
        if (buzzer) {
            setBuzzerNumber(buzzer);
            navigate(`${checkoutPath}/true`);
        } else {
            setBuzzerError(true);
        }
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBuzzer(e.target.value);
        setBuzzerError(false);
    };

    return (
        <>
            <PageWrapper>
                <div className="buzzer-number">
                    <div className="close-button-wrapper">
                        <FiX className="close-button" size={36} onClick={onClose} />
                    </div>
                    <div className="h2 mb-6">Enter your buzzer number</div>
                    <div className="mb-6 buzzer-image-container">
                        <img
                            alt="Buzzer Image"
                            className="buzzer-image"
                            src="https://tabin-public.s3.ap-southeast-2.amazonaws.com/images/buzzer-image.png"
                        />
                        <div className="buzzer-image-override"></div>
                    </div>
                    <div className="mb-12" style={{ width: "300px" }}>
                        <div className="h3 mb-2">Buzzer Number</div>
                        <Input
                            type="number"
                            autoFocus={true}
                            onChange={onChange}
                            value={buzzer ? buzzer.slice(0, 2) : ""}
                            error={buzzerError ? "Required" : ""}
                        />
                    </div>
                    <Button onClick={onNext}>Next</Button>
                </div>
            </PageWrapper>
        </>
    );
};
