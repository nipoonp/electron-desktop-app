import { useNavigate } from "react-router";
import { checkoutPath } from "../main";
import { useCart } from "../../context/cart-context";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { Button } from "../../tabin/components/button";
import { Input } from "../../tabin/components/input";
import { useRestaurant } from "../../context/restaurant-context";

import "./tableNumber.scss";

export const TableNumber = () => {
    const navigate = useNavigate();
    const { tableNumber, setTableNumber } = useCart();
    const { restaurant } = useRestaurant();

    if (restaurant == null) throw "Restaurant is invalid!";

    const onNext = () => {
        navigate(checkoutPath);
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTableNumber(e.target.value);
    };

    return (
        <>
            <PageWrapper>
                <div className="table-number">
                    <div className="h2 mb-12">Enter the table number you wish to dine on (click next if you are unsure)</div>
                    <div className="mb-12" style={{ width: "300px" }}>
                        <div className="h3 mb-2">Table Number</div>
                        <Input type="number" onChange={onChange} value={tableNumber ?? ""} />
                    </div>
                    <Button onClick={onNext}>Next</Button>
                </div>
            </PageWrapper>
        </>
    );
};
