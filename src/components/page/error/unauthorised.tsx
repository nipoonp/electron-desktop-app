import { H1, H4 } from "../../../tabin/components/headings";
import { Space2, Space4 } from "../../../tabin/components/spaces";

const styles = require("./unauthorised.module.css");

export default () => {
  return (
    <>
      <div className={styles.containerWrapper}>
        <div className={styles.container}>
          <div className={styles.content}>
            <H1 className={styles.oops}>Hold Up!</H1>
            <Space2 />
            <H4 className={styles.subText}>
              You are not authorised for the selected action.
            </H4>
            <Space4 />
            <div className={styles.bold}>Error Code: 401</div>
            <Space4 />
            <div className={styles.bold}>
              Here are some helpful links instead:
            </div>
          </div>
          <img
            className={styles.illustration}
            src="https://tabin-public.s3-ap-southeast-2.amazonaws.com/images/unauthorised/unauthorised.jpg"
          />
        </div>
      </div>
    </>
  );
};
