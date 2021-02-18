import React, { useState, useEffect } from "react";

// https://usehooks.com/useWindowSize/
export const useWindowSize = () => {
  const isClient = typeof window === "object";

  function getSize() {
    return {
      width: isClient ? window.innerWidth : undefined,
      height: isClient ? window.innerHeight : undefined,
    };
  }

  const [windowSize, setWindowSize] = useState(getSize);

  useEffect(() => {
    if (!isClient) {
      return;
    }

    function handleResize() {
      setWindowSize(getSize());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount and unmount

  return windowSize;
};

export const useSmallScreen = () => {
  const { width } = useWindowSize();
  const isSmallScreen = width !== undefined && width <= 744;

  return { isSmallScreen };
};

export const useBigScreen = () => {
  const { width } = useWindowSize();
  const isBigScreen = width && width >= 1128;

  return { isBigScreen };
};
