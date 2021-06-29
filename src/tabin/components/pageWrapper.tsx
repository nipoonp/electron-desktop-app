import { useEffect, useState, useRef } from "react";

import { useHistory } from "react-router";
import { beginOrderPath } from "../../components/main";
import { useCart } from "../../context/cart-context";

export const PageWrapper = (props: IProps) => {
    const history = useHistory();
    const { clearCart } = useCart();

    const resetAfterSeconds = 3 * 60; //3 mins
    const userInactiveSecondsCounter: React.MutableRefObject<number> = useRef(0);

    const resetUserInactiveSecondsCounter = () => {
        userInactiveSecondsCounter.current = 0;
    };

    useEffect(() => {
        const ticker = setInterval(() => {
            if (userInactiveSecondsCounter.current == resetAfterSeconds) {
                history.push(beginOrderPath);
                clearCart();
            }
            userInactiveSecondsCounter.current++;
        }, 1000);

        return () => clearTimeout(ticker);
    }, []);

    return (
        <>
            <div
                onClick={() => {
                    resetUserInactiveSecondsCounter();
                }}
            >
                {props.children}
            </div>
        </>
    );
};

interface IProps {
    children: React.ReactNode;
}
