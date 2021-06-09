import React from "react";
import { useHistory } from "react-router";
import { checkoutPath } from "../main";
import { useCart } from "../../context/cart-context";
import { KioskPageWrapper } from "../../tabin/components/kioskPageWrapper";
import { Button } from "../../tabin/components/button";
import { InputV2 } from "../../tabin/components/inputv2";
import { useRestaurant } from "../../context/restaurant-context";

export const TableNumber = () => {
    const history = useHistory();
    const { tableNumber, setTableNumber } = useCart();
    const { restaurant } = useRestaurant();

    if (restaurant == null) {
        throw "Restaurant is invalid!";
    }

    const onNext = () => {
        history.push(checkoutPath);
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTableNumber(e.target.value);
    };

    return (
        <>
            <KioskPageWrapper>
                <div className="table-number">
                    <div className="h2 mb-6">Enter the table number you wish to dine on (click next if you are unsure)</div>
                    <div className="mb-6" style={{ width: "300px" }}>
                        <div className="h3 mb-2">Table Number</div>
                        <InputV2 type="number" onChange={onChange} value={tableNumber ?? ""} />
                    </div>
                    <Button onClick={onNext}>Next</Button>
                </div>
            </KioskPageWrapper>
        </>
    );
};
