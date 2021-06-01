import React from "react";
import { getCloudFrontDomainName, getPublicCloudFrontDomainName } from "../../private/aws-custom";

export const RestaurantLogo = (props: {
    logo?: {
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
            {props.logo ? (
                <img
                    src={`${getCloudFrontDomainName()}/protected/${props.logo.identityPoolId}/${props.logo.key}`}
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
