import React from "react";
import { faFacebookF } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CognitoHostedUIIdentityProvider } from "@aws-amplify/auth";

import { Auth } from "aws-amplify";
import { NormalFont } from "../fonts";

export const FacebookLoginButton = () => {
  const onFacebookLogin = () => {
    Auth.federatedSignIn({
      provider: CognitoHostedUIIdentityProvider.Facebook
    });
  };

  return (
    <button
      onClick={onFacebookLogin}
      style={{
        width: "100%",
        display: "flex",
        padding: "18px 27px",
        borderRadius: "8px",
        border: "2px solid #b0b0b0"
      }}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        style={{ height: "20px" }}
      >
        <path
          fill="#1877F2"
          d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"
        ></path>
      </svg>{" "}
      <div style={{ flex: "1" }}>
        <NormalFont>Continue with Facebook</NormalFont>
      </div>
    </button>
  );
};
