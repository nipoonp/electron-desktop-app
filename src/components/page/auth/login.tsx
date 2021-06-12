import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { useAuth, AuthenticationStatus } from "../../../context/auth-context";
import { isMobile } from "react-device-detect";
import { Logger } from "aws-amplify";
import * as yup from "yup";
import { ButtonV2 } from "../../../tabin/components/buttonv2";
import { BoldFont, Title2Font } from "../../../tabin/components/fonts";
import { Space2, Space3 } from "../../../tabin/components/spaces";
import { ErrorMessage } from "../../../tabin/components/errorMessage";
import { ServerErrorV2 } from "../../../tabin/components/serverErrorv2";
import { InputV3 } from "../../../tabin/components/inputv3";
import { Separator } from "../../../tabin/components/separator";
import { useSmallScreen } from "../../../hooks/useWindowSize";
import { beginOrderPath } from "../../main";

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

    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [serverError, setServerError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const { status } = useAuth();

    useEffect(() => {
        if (status === AuthenticationStatus.SignedIn) {
            history.replace(beginOrderPath);
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

    const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            onLogin();
        }
    };

    const emailInput = (
        <>
            <InputV3
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
            <ButtonV2 style={{ borderRadius: "8px", width: "100%" }} disabled={loading} onClick={onLogin} loading={loading}>
                <BoldFont>LOG IN</BoldFont>
            </ButtonV2>
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
                {loginButton}
            </div>
        </>
    );

    return (
        <>
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
