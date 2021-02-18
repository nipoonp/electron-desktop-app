import React, { useState } from "react";
import { isMobile } from "react-device-detect";
import { HomeNav } from "../../nav/homeNav";
import { H1, H4 } from "../../../tabin/components/headings";
import { Space2, Space4, Space1 } from "../../../tabin/components/spaces";
// import {
//   landingPath,
//   restaurantsPath,
//   landingBusinessPath,
//   termsPath,
//   privacyPath
// } from "../../main";

const styles = require("./fourOFour.module.css");

export const NoMatch = () => {
  return (
    <>
      <HomeNav />
      <div className={styles.containerWrapper}>
        <div className={styles.container}>
          <div className={styles.content}>
            <H1 className={styles.oops}>Oops!</H1>
            <Space2 />
            <H4 className={styles.subText}>
              We can't seem to find the page you're looking for.
            </H4>
            <Space4 />
            <div className={styles.bold}>Error Code: 404</div>
            <Space4 />
            <div className={styles.bold}>
              Here are some helpful links instead:
            </div>
            {/* <Space2 />
            <span>
              <a href={landingPath} className={styles.link}>
                Home
              </a>
            </span>
            <Space2 />
            <span>
              <a href={restaurantsPath} className={styles.link}>
                Explore
              </a>
            </span>
            <Space2 />
            <span>
              <a href={landingBusinessPath} className={styles.link}>
                Add your restaurant
              </a>
            </span>
            <Space2 />
            <span>
              <a href={termsPath} className={styles.link}>
                Terms of use
              </a>
            </span>
            <Space2 />
            <span>
              <a href={privacyPath} className={styles.link}>
                Privacy Policy
              </a>
            </span> */}
          </div>
          <img
            className={styles.illustration}
            src="https://tabin-public.s3-ap-southeast-2.amazonaws.com/images/pageNotFound/404.jpg"
          />
        </div>
      </div>
    </>
  );
};
