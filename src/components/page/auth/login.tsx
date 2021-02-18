import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { useAuth, AuthenticationStatus } from "../../../context/auth-context";
import { HomeNav } from "../../nav/homeNav";
import { isMobile } from "react-device-detect";
import { Logger } from "aws-amplify";
import {
  signUpPath,
  forgotPasswordPath,
  authRedirectPath,
  signUpConfirmPath,
  newInformationRequiredPath,
} from "../../main";
import * as yup from "yup";
import { ButtonV2 } from "../../../tabin/components/buttonv2";
import { BoldFont, Title2Font } from "../../../tabin/components/fonts";
import { Space2, Space3 } from "../../../tabin/components/spaces";
import { ErrorMessage } from "../../../tabin/components/errorMessage";
import { ServerErrorV2 } from "../../../tabin/components/serverErrorv2";
import { InputV3 } from "../../../tabin/components/inputv3";
import { FacebookLoginButton } from "../../../tabin/components/auth/facebookLoginButton";
import { GoogleLoginButton } from "../../../tabin/components/auth/googleLoginButton";
import { Separator, Separator3 } from "../../../tabin/components/separator";
import { Link } from "../../../tabin/components/link";
import { useSmallScreen } from "../../../hooks/useWindowSize";
import { useUser } from "../../../context/user-context";
import { useTabNav } from "../../../context/tabNav-context";

const logger = new Logger("Login");

const emailSchema = yup
  .string()
  .email("Please enter a valid email address")
  .required("Email is required");
const passwordSchema = yup
  .string()
  .min(8, "Password must be at least 8 characters long")
  .required("Password is required");

export const Login = () => {
  const { login } = useAuth();
  const history = useHistory();
  const { isSmallScreen } = useSmallScreen();
  const { setSelectedTab } = useTabNav();

  useEffect(() => {
    setSelectedTab("login");
  }, []);

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [serverError, setServerError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { user } = useUser();
  const { status } = useAuth();

  useEffect(() => {
    if (status === AuthenticationStatus.SignedIn) {
      history.replace(authRedirectPath);
    }

    if (status === AuthenticationStatus.UnconfirmedSignIn) {
      history.push(signUpConfirmPath);
    }

    if (status === AuthenticationStatus.NewInformationRequired) {
      history.push(newInformationRequiredPath);
    }
  }, [status]);

  const onChangeEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    setEmailError("");
    setServerError("");
  };

  const onChangePassword = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    setPasswordError("");
    setServerError("");
  };

  const onSwitchToSignUp = () => {
    history.push(signUpPath);
  };

  const onForgetPassword = () => {
    history.push(forgotPasswordPath);
  };

  const onLogin = async () => {
    setLoading(true);
    let fieldsValid = true;

    try {
      await emailSchema.validate(email);
      setEmailError("");
    } catch (e) {
      setEmailError(e.errors[0]);
      fieldsValid = false;
    }

    try {
      await passwordSchema.validate(password);
      setPasswordError("");
    } catch (e) {
      setPasswordError(e.errors[0]);
      fieldsValid = false;
    }

    if (fieldsValid) {
      try {
        await login(email, password);
        logger.debug("Successfully logged in");
        setLoading(false);
      } catch (e) {
        logger.debug("e", e);
        setServerError(e.message);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const socialMediaLogin = (
    <>
      <FacebookLoginButton />
      <Space2 />
      <GoogleLoginButton />
    </>
  );

  const orSeparator = (
    <>
      <div
        style={{
          position: "relative",
          padding: "32px 0",
        }}
      >
        <Separator />
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            padding: "0 24px",
          }}
        >
          or
        </div>
      </div>
    </>
  );

  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onLogin();
    }
  };

  const emailInput = (
    <>
      <InputV3
        cy-data="login-username"
        name="email"
        label="Email"
        type="text"
        onChange={onChangeEmail}
        onKeyPress={onEnter}
        value={email}
        error={emailError ? true : false}
      />
    </>
  );

  const passwordInput = (
    <>
      <InputV3
        cy-data="login-password"
        name="password"
        label="Password"
        type="password"
        onChange={onChangePassword}
        onKeyPress={onEnter}
        value={password}
        error={passwordError ? true : false}
      />
    </>
  );

  const loginButton = (
    <>
      <ButtonV2
        cyData="login-button"
        style={{ borderRadius: "8px", width: "100%" }}
        disabled={loading}
        onClick={onLogin}
        loading={loading}
      >
        <BoldFont>LOG IN</BoldFont>
      </ButtonV2>
    </>
  );

  const dontHaveAnAccount = (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div>Don't have an account?</div>
        <Link onClick={onSwitchToSignUp} style={{ paddingLeft: "8px" }}>
          Sign up
        </Link>
      </div>
    </>
  );

  const content = (
    <>
      <div
        style={
          !isSmallScreen
            ? {
              padding: "24px",
              margin: "0 auto",
              width: "448px",
              border: "1px solid #e4e4e4",
            }
            : {}
        }
      >
        <Title2Font>Log in</Title2Font>
        <Space3 />
        {socialMediaLogin}
        {orSeparator}
        {serverError && (
          <>
            <ServerErrorV2 message={serverError} />
            <Space3 />
          </>
        )}
        {emailInput}
        {emailError && <ErrorMessage message={emailError} />}
        <Space2 />
        {passwordInput}
        {passwordError && <ErrorMessage message={passwordError} />}
        <Space3 />
        <Link onClick={onForgetPassword}>Forgot password?</Link>
        <Space3 />
        {loginButton}
        <Separator3 />
        <Space2 />
        {dontHaveAnAccount}
      </div>
    </>
  );

  return (
    <>
      <HomeNav />
      <div
        style={{
          minHeight: "100vh",
          maxWidth: "1080px",
          margin: "auto",
          padding: "24px",
          paddingTop: isSmallScreen ? "24px" : "40px",
          paddingBottom: isMobile ? "80px" : "unset", // for tab nav
        }}
      >
        {content}
      </div>
    </>
  );
};
