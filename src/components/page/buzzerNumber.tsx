import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { checkoutPath } from "../main";
import { useCart } from "../../context/cart-context";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { Button } from "../../tabin/components/button";
import { Input } from "../../tabin/components/input";
import { useRestaurant } from "../../context/restaurant-context";
import KioskBoard from "kioskboard";

import "./buzzerNumber.scss";
import { FiX } from "react-icons/fi";

export default () => {
    const navigate = useNavigate();
    const { restaurant } = useRestaurant();
    const { buzzerNumber, setBuzzerNumber } = useCart();

    const numpadRef = useRef(null);

    // const [buzzer, setBuzzer] = useState(buzzerNumber);
    const [buzzerError, setBuzzerError] = useState(false);

    useEffect(() => {
        if (numpadRef.current) {
            KioskBoard.run(numpadRef.current, {
                theme: "light",
                keysArrayOfObjects: [
                    {
                        "0": "7",
                        "1": "8",
                        "2": "9",
                    },
                    {
                        "0": "4",
                        "1": "5",
                        "2": "6",
                    },
                    {
                        "0": "1",
                        "1": "2",
                        "2": "3",
                    },
                    {
                        "0": "0",
                        "1": ".",
                    },
                ],
            });
        }
    }, [numpadRef]);

    if (restaurant == null) throw "Restaurant is invalid!";

    const onClose = () => {
        navigate(`${checkoutPath}`);
    };

    const onNext = () => {
        //@ts-ignore
        const buzzer = numpadRef.current.value;

        if (buzzer) {
            setBuzzerNumber(buzzer);
            navigate(`${checkoutPath}/true`);
        } else {
            setBuzzerError(true);
        }
    };

    // const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     setBuzzer(e.target.value);
    //     setBuzzerError(false);
    // };

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
                        {/* <Input
                            type="number"
                            autoFocus={true}
                            onChange={onChange}
                            value={buzzer ? buzzer.slice(0, 2) : ""}
                            error={buzzerError ? "Required" : ""}
                        /> */}
                        <input
                            className={`inputFromKey input`}
                            ref={numpadRef}
                            data-kioskboard-type="numpad"
                            type="number"
                            // autoFocus={true}
                            // onChange={onChange}
                            // value={buzzer ? buzzer.slice(0, 2) : ""}
                        />
                    </div>
                    {buzzerError && <div className="text-error mt-2">{buzzerError ? "Required" : ""}</div>}
                    <Button onClick={onNext}>Next</Button>
                </div>
            </PageWrapper>
        </>
    );
};
