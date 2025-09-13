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

export default () => {
    const navigate = useNavigate();
    const { restaurant } = useRestaurant();
    const { register } = useRegister();
    const { setTableNumber, covers, setCovers } = useCart();
    const { isPOS } = useRegister();

    const numpadRef = useRef(null);

    const [coversNumber, setCoversNumber] = useState(covers || 1);
    const [tableError, setTableError] = useState(false);

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
        if (isPOS) {
            navigate(`${restaurantPath}/${restaurant.id}`);
        } else {
            navigate(`${checkoutPath}`);
        }
    };

    const onNext = () => {
        if (register?.enableCovers) {
            setCovers(coversNumber);
        }

        if (register?.enableTableFlags) {
            //@ts-ignore
            const table = numpadRef.current.value;

            if (table) {
                setTableNumber(table);

                if (isPOS) {
                    navigate(`${restaurantPath}/${restaurant.id}`);
                } else {
                    navigate(`${checkoutPath}`);
                }
            } else {
                setTableError(true);
            }
        } else {
            if (isPOS) {
                navigate(`${restaurantPath}/${restaurant.id}`);
            } else {
                navigate(`${checkoutPath}`);
            }
        }
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

                    {/* <div className="h2 mb-6">Provide your dine-in details</div> */}
                    {/* <div className="mb-6 table-image-container">
                        <img
                            alt="Table Image"
                            className="table-image"
                            src="https://tabin-public.s3.ap-southeast-2.amazonaws.com/images/table-flag.webp"
                        />
                        <div className="table-image-override"></div>
                    </div> */}
                    {/* {register?.enableTableFlags && (
                        <> */}
                    <div className="mb-4 text-center" style={{ width: "300px" }}>
                        <div className="h3 mb-2">Table Number</div>
                        <input className={`inputFromKey input`} ref={numpadRef} data-kioskboard-type="numpad" type="number" />
                        {tableError && <div className="text-error mt-2">{tableError ? "Required" : ""}</div>}
                    </div>
                    {/* </>
                    )} */}
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
