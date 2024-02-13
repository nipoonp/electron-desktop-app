const awsenv = process.env.REACT_APP_AWS_ENV || "sandbox";

export let awsmobile: any;

if (awsenv == "sandbox") {
    awsmobile = {
        aws_project_region: "ap-southeast-2",
        aws_appsync_graphqlEndpoint: "https://mrm7btzpdnh2jksbk3aqnnoe5m.appsync-api.ap-southeast-2.amazonaws.com/graphql",
        aws_appsync_region: "ap-southeast-2",
        aws_appsync_authenticationType: "AMAZON_COGNITO_USER_POOLS",
        aws_cognito_identity_pool_id: "ap-southeast-2:a6fca620-c78c-4e67-af6b-fcab588b9b81",
        aws_cognito_region: "ap-southeast-2",
        aws_user_pools_id: "ap-southeast-2_moLKg8wIK",
        aws_user_pools_web_client_id: "7p39g3a11ede3f8tn05ka6aucl",
        oauth: {},
        aws_cognito_username_attributes: ["EMAIL"],
        aws_cognito_social_providers: [],
        aws_cognito_signup_attributes: ["EMAIL"],
        aws_cognito_mfa_configuration: "OFF",
        aws_cognito_mfa_types: ["SMS"],
        aws_cognito_password_protection_settings: {
            passwordPolicyMinLength: 8,
            passwordPolicyCharacters: [],
        },
        aws_cognito_verification_mechanisms: ["EMAIL"],
        aws_user_files_s3_bucket: "tabin205509-sandbox",
        aws_user_files_s3_bucket_region: "ap-southeast-2",
    };
}

export default awsmobile;
