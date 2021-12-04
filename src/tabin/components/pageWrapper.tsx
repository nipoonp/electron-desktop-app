import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { beginOrderPath } from "../../components/main";
import { useCart } from "../../context/cart-context";
import { useRegister } from "../../context/register-context";
import { ERegisterType } from "../../graphql/customQueries";


export const PageWrapper = (props: IProps) => {
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const { register } = useRegister();

    const resetAfterSeconds = register && register.type == ERegisterType.KIOSK ? 3 * 60 : 10000 * 60; //3 mins
    const userInactiveSecondsCounter: React.MutableRefObject<number> = useRef(0);

    const resetUserInactiveSecondsCounter = () => {
        userInactiveSecondsCounter.current = 0;
    };

    useEffect(() => {
        const ticker = setInterval(() => {
            if (userInactiveSecondsCounter.current === resetAfterSeconds) {
                navigate(beginOrderPath);
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
