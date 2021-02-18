import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Logger } from "aws-amplify";
import { useAuth } from "../context/auth-context";

const logger = new Logger("useAuthRedirectURL");

export const useAuthRedirectURL = () => {
  const { setAuthRedirectPath } = useAuth();
  let location = useLocation();

  useEffect(() => {
    setAuthRedirectPath(location.pathname);
  }, [location]);
};
