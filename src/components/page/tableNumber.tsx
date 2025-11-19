import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { checkoutPath, restaurantPath } from "../main";
import { useCart } from "../../context/cart-context";
import { PageWrapper } from "../../tabin/components/pageWrapper";
import { Button } from "../../tabin/components/button";
import { useRestaurant } from "../../context/restaurant-context";
import KioskBoard from "kioskboard";
import { FiX } from "react-icons/fi";
import { useRegister } from "../../context/register-context";
import { Stepper } from "../../tabin/components/stepper";

import "./tableNumber.scss";
import { Input } from "../../tabin/components/input";

export default () => {
    const navigate = useNavigate();
    const { restaurant } = useRestaurant();
    const { register } = useRegister();
    const { setTableNumber, covers, setCovers, tableNumber } = useCart();
    const { isPOS } = useRegister();

    const [table, setTable] = useState(tableNumber || "");
    const [coversNumber, setCoversNumber] = useState(covers || 1);
    const [tableError, setTableError] = useState(false);

    if (restaurant == null) throw "Restaurant is invalid!";

    const onClose = () => {
        if (isPOS) {
            navigate(`${restaurantPath}/${restaurant.id}`);
        } else {
            navigate(`${checkoutPath}`);
        }
    };

    const onNext = () => {
        setTableNumber(table);
        setCovers(coversNumber);

        if (isPOS) {
            navigate(`${restaurantPath}/${restaurant.id}`);
        } else {
            navigate(`${checkoutPath}`);
        }
    };

    const onChangeTableNumber = (event) => {
        setTable(event.target.value);
        setTableError(false);
    };

    const onUpdateCoversNumber = (count: number) => {
        setCoversNumber(count);
    };

    return (
        <>
            <PageWrapper>
                <div className="table-number">
                    <div className="close-button-wrapper">
                        <FiX className="close-button" size={36} onClick={onClose} />
                    </div>

                    <div className="mb-4 text-center" style={{ width: "300px" }}>
                        <div className="h3 mb-2">Table Number</div>
                        <Input autoFocus onChange={onChangeTableNumber} value={table || ""} error={tableError ? "Required" : ""} />
                        {tableError && <div className="text-error mt-2">{tableError ? "Required" : ""}</div>}
                    </div>

                    {register?.enableCovers && (
                        <>
                            <div className="mb-12 text-center" style={{ width: "300px" }}>
                                <div className="h3 mb-2">Number Of Diners</div>
                                <div className="covers-wrapper">
                                    <Stepper count={coversNumber} min={1} max={20} onUpdate={onUpdateCoversNumber} size={48} />
                                </div>
                            </div>
                        </>
                    )}
                    <Button onClick={onNext}>Next</Button>
                </div>
            </PageWrapper>
        </>
    );
};
