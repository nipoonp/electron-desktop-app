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
} else if (awsenv == "dev") {
    awsmobile = {
        aws_project_region: "ap-southeast-2",
        aws_cognito_identity_pool_id: "ap-southeast-2:3a3ee547-3658-4232-ac02-5dd6486261ae",
        aws_cognito_region: "ap-southeast-2",
        aws_user_pools_id: "ap-southeast-2_TC0lyQ5Bc",
        aws_user_pools_web_client_id: "31tqu019t0vtec9589pf6p8tm4",
        oauth: {
            domain: "tabin6c48ba57-6c48ba57-dev.auth.ap-southeast-2.amazoncognito.com",
            scope: ["phone", "email", "openid", "profile", "aws.cognito.signin.user.admin"],
            redirectSignIn: "https://www.tabin.co.nz/",
            redirectSignOut: "https://www.tabin.co.nz/",
            responseType: "code",
        },
        federationTarget: "COGNITO_USER_POOLS",
        aws_appsync_graphqlEndpoint: "https://64xhwtd6l5e3nnl6dl2btn2tze.appsync-api.ap-southeast-2.amazonaws.com/graphql",
        aws_appsync_region: "ap-southeast-2",
        aws_appsync_authenticationType: "AMAZON_COGNITO_USER_POOLS",
        aws_user_files_s3_bucket: "tabin223725-dev",
        aws_user_files_s3_bucket_region: "ap-southeast-2",
    };
} else if (awsenv === "test") {
    awsmobile = {
        aws_project_region: "ap-southeast-2",
        aws_cognito_identity_pool_id: "ap-southeast-2:0aeaaa09-fa4e-459f-a00f-28182f754484",
        aws_cognito_region: "ap-southeast-2",
        aws_user_pools_id: "ap-southeast-2_ir5fkpJpJ",
        aws_user_pools_web_client_id: "obig06jkkk0egctmn4t2eirrd",
        oauth: {
            domain: "tabin6c48ba57-6c48ba57-test.auth.ap-southeast-2.amazoncognito.com",
            scope: ["phone", "email", "openid", "profile", "aws.cognito.signin.user.admin"],
            redirectSignIn: "https://www.tabin.co.nz/",
            redirectSignOut: "https://www.tabin.co.nz/",
            responseType: "code",
        },
        federationTarget: "COGNITO_USER_POOLS",
        aws_appsync_graphqlEndpoint: "https://z6ui35vxdrd5ldaqlr35c6nfmq.appsync-api.ap-southeast-2.amazonaws.com/graphql",
        aws_appsync_region: "ap-southeast-2",
        aws_appsync_authenticationType: "AMAZON_COGNITO_USER_POOLS",
        aws_user_files_s3_bucket: "tabin180850-test",
        aws_user_files_s3_bucket_region: "ap-southeast-2",
    };
} else {
    awsmobile = {
        aws_project_region: "ap-southeast-2",
        aws_cognito_identity_pool_id: "ap-southeast-2:5d4a2da4-2080-408e-bd35-bbcf07c3d282",
        aws_cognito_region: "ap-southeast-2",
        aws_user_pools_id: "ap-southeast-2_yK56rpuT5",
        aws_user_pools_web_client_id: "79ksbrvked8gc743tnam0hb6rp",
        oauth: {
            domain: "tabin6c48ba57-6c48ba57-prod.auth.ap-southeast-2.amazoncognito.com",
            scope: ["phone", "email", "openid", "profile", "aws.cognito.signin.user.admin"],
            redirectSignIn: "https://www.tabin.co.nz/",
            redirectSignOut: "https://www.tabin.co.nz/",
            responseType: "code",
        },
        federationTarget: "COGNITO_USER_POOLS",
        aws_appsync_graphqlEndpoint: "https://euqi27n5krb4bcposqoshkpe5m.appsync-api.ap-southeast-2.amazonaws.com/graphql",
        aws_appsync_region: "ap-southeast-2",
        aws_appsync_authenticationType: "AMAZON_COGNITO_USER_POOLS",
        aws_user_files_s3_bucket: "tabin182909-prod",
        aws_user_files_s3_bucket_region: "ap-southeast-2",
    };
}

export default awsmobile;
