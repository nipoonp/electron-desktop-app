import React, { useEffect, useState, useRef } from "react";
import { useHistory } from "react-router";
import { beginOrderPath } from "../../components/main";
import { useCart } from "../../context/cart-context";

const styles = require("./kioskPageWrapper.module.css");

export const KioskPageWrapper = (props: IProps) => {
  const [x, setX] = useState();
  const [y, setY] = useState();
  const history = useHistory();
  const { clearCart } = useCart();

  const resetAfterSeconds = 3 * 60; //3 mins
  const userInactiveSecondsCounter: React.MutableRefObject<number> = useRef(0);

  const resetUserInactiveSecondsCounter = () => {
    userInactiveSecondsCounter.current = 0;
  };

  useEffect(() => {
    const update = (e: any) => {
      setX(e.x);
      setY(e.y);
      resetUserInactiveSecondsCounter();
    };

    window.addEventListener("mousemove", update);
    window.addEventListener("touchmove", update);

    return () => {
      window.removeEventListener("mousemove", update);
      window.removeEventListener("touchmove", update);
    };
  }, [setX, setY]);

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
      {/* <h1>{`x: ${x}; y: ${y};`}</h1> */}
      <div
        // style={{ cursor: "none" }}
        onClick={() => {
          resetUserInactiveSecondsCounter();
        }}
      >
        {props.children}
      </div>
      {/* <div className={`${styles.cursor}`} style={{ left: x, top: y }}></div> */}
    </>
  );
};

interface IProps {
  children: React.ReactNode;
}
