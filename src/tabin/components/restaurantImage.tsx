import React from "react";
import { S3Image } from "aws-amplify-react";

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
  objectFit?:
    | "contain"
    | "-moz-initial"
    | "inherit"
    | "initial"
    | "revert"
    | "unset"
    | "cover"
    | "fill"
    | "none"
    | "scale-down";
}) => {
  return (
    <>
      {props.image ? (
        <S3Image
          level="protected"
          imgKey={props.image.key}
          identityId={props.image.identityPoolId}
          theme={{
            photoImg: {
              width: props.width,
              height: props.height,
              objectFit: props.objectFit || "contain",
              borderRadius: props.borderRadius,
            },
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
          src="https://tabin-public.s3-ap-southeast-2.amazonaws.com/images/placeholder/placeholder.jpg"
        />
      )}
    </>
  );
};
