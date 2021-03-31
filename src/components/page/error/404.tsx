import { H1, H4 } from "../../../tabin/components/headings";
import { Space2, Space4 } from "../../../tabin/components/spaces";

const styles = require("./fourOFour.module.css");

export const NoMatch = () => {
  return (
    <>
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
