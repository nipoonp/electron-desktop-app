import { S3Image } from "aws-amplify-react";
import { getCloudFrontDomainName, getPublicCloudFrontDomainName } from "../../private/aws-custom";

export const RestaurantImage = (props: {
    image?: {
        key: string;
        bucket: string;
        region: string;
        identityPoolId: string;
    } | null;
    height?: string;
    width?: string;
    borderRadius?: string;
    objectFit?: "contain" | "-moz-initial" | "inherit" | "initial" | "revert" | "unset" | "cover" | "fill" | "none" | "scale-down";
}) => {
    return (
        <>
            {props.image ? (
                <img
                    src={`${getCloudFrontDomainName()}/protected/${props.image.identityPoolId}/${props.image.key}`}
                    style={{
                        width: props.width,
                        height: props.height,
                        objectFit: props.objectFit || "contain",
                        borderRadius: props.borderRadius,
                    }}
                />
            ) : (
                <img
                    style={{
                        width: props.width,
                        height: props.height,
                        objectFit: props.objectFit || "contain",
                        borderRadius: props.borderRadius,
                    }}
                    src={`${getPublicCloudFrontDomainName()}/images/placeholder/placeholder.jpg`}
                />
            )}
        </>
    );
};
