import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { useAuth, AuthenticationStatus } from "../../../context/auth-context";
import { Logger } from "aws-amplify";
import * as yup from "yup";
import { beginOrderPath } from "../../main";
import { Button } from "../../../tabin/components/button";
import { Input } from "../../../tabin/components/input";

import "./login.scss";

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
            <Input
                name="email"
                label="Email"
                type="text"
                onChange={onChangeEmail}
                onKeyPress={onEnter}
                value={email}
                className={emailError ? "error" : ""}
                error={emailError}
            />
        </>
    );

    const passwordInput = (
        <>
            <Input
                name="password"
                label="Password"
                type="password"
                onChange={onChangePassword}
                onKeyPress={onEnter}
                value={password}
                className={passwordError ? "error" : ""}
                error={passwordError}
            />
        </>
    );

    const loginButton = (
        <>
            <Button disabled={loading} onClick={onLogin} loading={loading}>
                LOG IN
            </Button>
        </>
    );

    return (
        <>
            <div className="login">
                <div className="h2 mb-3">Log in</div>
                {serverError && <div className="text-error mb-3">{passwordError}</div>}
                {emailInput}
                {emailError && <div className="text-error mb-2 mt-2">{emailError}</div>}
                <div className="mb-2"></div>
                {passwordInput}
                {passwordError && <div className="text-error mb-2 mt-2">{passwordError}</div>}
                <div className="mb-3"></div>
                {loginButton}
            </div>
        </>
    );
};
