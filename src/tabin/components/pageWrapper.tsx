import { useEffect, useState, useRef } from "react";

import { useNavigate } from "react-router";
import { beginOrderPath, tabs } from "../../components/main";
import { useCart } from "../../context/cart-context";
import { useRegister } from "../../context/register-context";
import { ERegisterType } from "../../graphql/customQueries";
import { usePinch } from "@use-gesture/react";
import { Menu } from "../../components/shared/menu";

export const PageWrapper = (props: IProps) => {
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const { register } = useRegister();

    const [showMenu, setShowMenu] = useState(false);

    let timerId: NodeJS.Timeout;

    const resetAfterSeconds = register && register.type == ERegisterType.KIOSK ? 3 * 60 : 10000 * 60; //3 mins
    const userInactiveSecondsCounter: React.MutableRefObject<number> = useRef(0);

    const resetUserInactiveSecondsCounter = () => {
        userInactiveSecondsCounter.current = 0;
    };

    useEffect(() => {
        const ticker = setInterval(() => {
            if (userInactiveSecondsCounter.current == resetAfterSeconds) {
                navigate(beginOrderPath);
                clearCart();
            }
            userInactiveSecondsCounter.current++;
        }, 1000);

        return () => clearTimeout(ticker);
    }, []);

    const bind = usePinch(
        (state) => {
            // console.log("xxx...state", state.touches, state.elapsedTime);

            if (state.touches === 5 && state.elapsedTime > 300) setShowMenu(true);
        },
        { eventOptions: { passive: false } }
    );

    useEffect(() => {
        document.addEventListener("gesturestart", (e) => e.preventDefault());
        document.addEventListener("gesturechange", (e) => e.preventDefault());

        return () => {
            document.removeEventListener("gesturestart", (e) => {});
            document.removeEventListener("gesturechange", (e) => {});
        };
    }, []);

    useEffect(() => {
        document.body.onmousedown = () => {
            timerId = setTimeout(() => {
                setShowMenu(true);
            }, 1000);
        };

        document.body.onmouseup = () => {
            clearTimeout(timerId);
        };
    }, []);

    const onClickMenuRoute = (route: string) => {
        setShowMenu(false);
        navigate(route);
    };

    const onHideMenu = () => {
        setShowMenu(false);
    };

    return (
        <>
            <div
                style={{ touchAction: "none" }}
                {...bind()}
                onClick={() => {
                    resetUserInactiveSecondsCounter();
                }}
            >
                {props.children}
                {showMenu && <Menu tabs={tabs} onClickMenuRoute={onClickMenuRoute} onHideMenu={onHideMenu} />}
            </div>
        </>
    );
};

interface IProps {
    children: React.ReactNode;
}
