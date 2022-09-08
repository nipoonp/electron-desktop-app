import { useState } from "react";
import { useNavigate } from "react-router";
import { checkoutPath } from "../main";
import { useCart } from "../../context/cart-context";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { Button } from "../../tabin/components/button";
import { Input } from "../../tabin/components/input";
import { useRestaurant } from "../../context/restaurant-context";

import "./buzzerNumber.scss";

export default () => {
    const navigate = useNavigate();
    const { buzzerNumber, setBuzzerNumber } = useCart();
    const [buzzer, setBuzzer] = useState(buzzerNumber);
    const { restaurant } = useRestaurant();

    if (restaurant == null) throw "Restaurant is invalid!";

    const onNext = () => {
        if (buzzerNumber) {
            setBuzzerNumber(buzzer);
            navigate(`${checkoutPath}`);
        } else {
            setBuzzerNumber(buzzer);
            navigate(`${checkoutPath}/true`);
        }
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBuzzer(e.target.value);
    };

    return (
        <>
            <PageWrapper>
                <div className="buzzer-number">
                    <div className="h2 mb-6">Enter your buzzer number</div>
                    <div className="mb-6 buzzer-image-container">
                        <img
                            alt="Buzzer Image"
                            className="buzzer-image"
                            src="https://tabin-public.s3.ap-southeast-2.amazonaws.com/images/buzzer-image.png"
                        />
                    </div>
                    <div className="mb-12" style={{ width: "300px" }}>
                        <div className="h3 mb-2">Buzzer Number</div>
                        <Input type="number" autoFocus={true} onChange={onChange} value={buzzer ? buzzer.slice(0, 2) : ""} />
                    </div>
                    <Button onClick={onNext}>Next</Button>
                </div>
            </PageWrapper>
        </>
    );
};
