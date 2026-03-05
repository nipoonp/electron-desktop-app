import awsconfig from "../aws-exports";

//Update this file later on. Currently, AWS Amplify does not support caching for S3. So, we are using cloudfront for cashing. This can be a security risk because people can access the S3 private folders with the cloudfront link.

interface ICloudFrontDomainNames {
    [key: string]: string;
}
const cloudFrontDomainNames: ICloudFrontDomainNames = {
    sandbox: "https://d1roylqijj5dlt.cloudfront.net",
    dev: "https://d2nmoln0sb0cri.cloudfront.net",
    test: "https://d7g1r2w4ykupn.cloudfront.net",
    prod: "https://d1hfsnuz4i23pd.cloudfront.net",
};

export const getCloudFrontDomainName = () => {
    const envStart = awsconfig.aws_user_files_s3_bucket.lastIndexOf("-");
    const env = awsconfig.aws_user_files_s3_bucket.slice(envStart + 1);

    return cloudFrontDomainNames[env];
};

export const getPublicCloudFrontDomainName = () => {
    return "https://d30m4xw3xm7tyf.cloudfront.net";
};

export const getCreateMergedOrderEndpoint = () => {
    const endpoints = {
        dev: "https://gaij0oobvc.execute-api.ap-southeast-2.amazonaws.com/dev/merge-order",
        test: "",
        prod: "https://redxcueb0i.execute-api.ap-southeast-2.amazonaws.com/prod/merge-order",
    };
    const envStart = awsconfig.aws_user_files_s3_bucket.lastIndexOf("-");
    const env = awsconfig.aws_user_files_s3_bucket.slice(envStart + 1);

    return endpoints[env];
};
