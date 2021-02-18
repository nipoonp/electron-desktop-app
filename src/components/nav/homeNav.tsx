import React, { useState, useEffect } from "react";
import { useAuth, AuthenticationStatus } from "../../context/auth-context";
// import { Menu } from "./menu";
import { Logger } from "aws-amplify";
import { useHistory } from "react-router-dom";
import { useUser } from "../../context/user-context";
import {
  dashboardPath,
  landingPath,
  loginPath,
  signUpPath,
  configureNewEftposPath,
  beginOrderPath,
  registerListPath,
} from "../main";
import { useSmallScreen } from "../../hooks/useWindowSize";
import { ReceiptIcon } from "../../tabin/components/receipt";
import { CreditCardBlankIcon } from "../../tabin/components/creditCardBlankIcon";
import { UserIcon } from "../../tabin/components/userIcon";
import { SignOutIcon } from "../../tabin/components/signOutIcon";
import { GiftCardIcon } from "../../tabin/components/giftCardIcon";

const styles = require("./homeNav.module.css");
const logger = new Logger("homeNav");

export const HomeNav = (props: {
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}) => {
  // context
  const history = useHistory();
  const { status, logout } = useAuth();
  const { user } = useUser();

  // states
  const [showMenu, setShowMenu] = useState(false);

  // logo callbacks
  const onLogoClick = () => {
    // if showing menu, press to unshow
    if (showMenu) {
      setShowMenu(false);
      return;
    }

    // redirect home
    history.push(landingPath);
  };

  // Login modal callbacks
  const onLoginClick = () => {
    // setShowLoginModal(true);
    history.push(loginPath);
  };

  // Sign up modal callbacks
  const onSignUpClick = () => {
    history.push(signUpPath);
  };

  // displays
  const logoDisplay = (
    <img
      alt="Tabin Logo"
      // style={{ height: "25px" }}
      style={{ width: "120px" }}
      // src="https://tabin-public.s3-ap-southeast-2.amazonaws.com/logo/tabin-logo.png"
      src={
        "https://tabin-public.s3-ap-southeast-2.amazonaws.com/logo/tabin-logo.png"
      }
    />
  );

  return (
    <>
      <div
        className={`${styles.nav} ${props.className ? props.className : ""}`}
        style={
          { ...props.style, color: "rgb(48,48,48)" }
        }>
        <div style={{ display: "flex", width: "100%" }}>
          <button className={styles.logoContainer} onClick={onLogoClick}>
            {logoDisplay}
          </button>
          {!showMenu && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                paddingRight: "24px",
              }}
            >
              {props.children}
            </div>
          )}
        </div>
        {showMenu ? (
          <></>
        ) : (
            <div className={styles.links}>
              <nav>
                <ul className={styles.navContainer}>
                  {status === AuthenticationStatus.SignedIn && user ? (
                    <div style={{ marginRight: "8px", display: "flex" }}>
                      <MenuLink menu={<UserMenu />}>
                        {user.firstName}
                      </MenuLink>
                    </div>
                  ) : (
                      <>
                        <Link onClick={onSignUpClick}>
                          Sign up
                    </Link>
                        <Link
                          cyData="login"

                          onClick={onLoginClick}
                        >
                          Log in
                    </Link>
                      </>
                    )}
                </ul>
              </nav>
            </div>
          )}
      </div>
      {/* {modals} */}
      {showMenu && (
        <div className={styles.menuContainer}>
          {/* <Menu
                        onHome={onMenuHome}
                        onAccount={onMenuAccount}
                        onPayment={onMenuPayment}
                        onContactUs={onMenuContactUs}
                        onTermsOfService={onMenuTermsOfService}
                        onPrivacyPolicy={onMenuPrivacyPolicy}
                        onSignup={onMenuSignup}
                        onLogin={onMenuLogin}
                        onLogout={onMenuLogout}
                    /> */}
        </div>
      )}
    </>
  );
};

const DropDownArrow = (props: IDropDownArrowProps) => {
  return (
    <div className={styles.dropDownArrow} style={props.style}>
      <svg
        viewBox="0 0 18 18"
        role="presentation"
        aria-hidden="true"
        focusable="false"
        style={{
          height: "1em",
          width: "1em",
          display: "block",
          fill: "currentcolor",
        }}
      >
        <path
          d="m16.29 4.3a1 1 0 1 1 1.41 1.42l-8 8a1 1 0 0 1 -1.41 0l-8-8a1 1 0 1 1 1.41-1.42l7.29 7.29z"
          fillRule="evenodd"
        />
      </svg>
    </div>
  );
};

interface IDropDownArrowProps {
  style?: React.CSSProperties;
}

const Link = (props: ILinkProps) => {
  return (
    <button
      style={{
        padding: "0px 8px",
      }}
      onClick={props.onClick}
    >
      <li>
        <div className={
          styles.navTextContainer
        }>
          <div
            className={
              styles.navText
            }
            cy-data={props.cyData ? props.cyData : ""}
          >
            {props.children}
          </div>
        </div>
      </li>
    </button>
  );
};

interface ILinkProps {
  children: React.ReactNode;
  onClick?: () => void;
  cyData?: string;
}

const MenuLink = (props: IMenuLinkProps) => {
  const [showMenu, setShowMenu] = useState(false);

  const onClick = () => {
    setShowMenu(!showMenu);
  };

  return (
    <>
      <div style={{ position: "relative" }}>
        <button style={{ padding: "0px 8px" }} onClick={onClick}>
          <li>
            <div className={styles.navTextContainer}>
              <div className={styles.navText}>
                {props.children}
              </div>
            </div>
          </li>
        </button>
        {showMenu && (
          <div style={{ position: "absolute", right: "0px" }}>{props.menu}</div>
        )}
      </div>
    </>
  );
};

interface IMenuLinkProps {
  children: React.ReactNode;
  menu: React.ReactNode;
}

const UserMenu = () => {
  const { logout } = useAuth();
  const history = useHistory();

  const onKioskMode = () => {
    history.push(beginOrderPath);
  };

  const onDashboardRestaurantList = () => {
    history.push(dashboardPath);
  };

  const onConfigureNewEftpos = () => {
    history.push(configureNewEftposPath);
  };

  const onConfigureRegisters = () => {
    history.push(registerListPath);
  };

  return (
    <div
      style={{
        backgroundColor: "white",
        minWidth: "280px",
        maxWidth: "950px",
        boxShadow: "rgba(0, 0, 0, 0.1) 0px 0px 5px",
        borderTopWidth: "0px",
        borderRightWidth: "1px",
        borderBottomWidth: "1px",
        borderLeftWidth: "1px",
        borderStyle: "solid",
        borderColor: "rgb(235, 235, 235)",
      }}
    >
      <ul className={styles.UsermenuUL}>
        <li className={styles.userMenuLI}>
          <button className={styles.userMenuLiButton} onClick={onKioskMode}>
            <div>Kiosk Mode</div>
            <GiftCardIcon height="20px" />
          </button>
          <button
            className={styles.userMenuLiButton}
            onClick={onDashboardRestaurantList}
          >
            <div>Restaurant Dashboards</div>
            <GiftCardIcon height="20px" />
          </button>
          <button
            className={styles.userMenuLiButton}
            onClick={onConfigureNewEftpos}
          >
            <div>Configure New Eftpos</div>
            <GiftCardIcon height="20px" />
          </button>
          <button
            className={styles.userMenuLiButton}
            onClick={onConfigureRegisters}
          >
            <div>Configure Registers</div>
            <GiftCardIcon height="20px" />
          </button>
          {/* <button className={styles.userMenuLiButton} onClick={onPayment}>
                        <div>Payment</div>
                        <CreditCardBlankIcon height="20px" />
                    </button>
                    <button className={styles.userMenuLiButton} onClick={onAccount}>
                        <div>Account</div>
                        <UserIcon height="20px" />
                    </button> */}
          <button className={styles.userMenuLiButton} onClick={logout}>
            <div>Log out</div>
            <SignOutIcon height="20px" />
          </button>
        </li>
      </ul>
    </div>
  );
};
