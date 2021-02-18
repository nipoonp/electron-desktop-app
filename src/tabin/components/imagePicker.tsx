import React, { useState } from "react";
import { PhotoPicker } from "aws-amplify-react";
import { S3Image } from "aws-amplify-react";
import { Logger, Auth, Storage } from "aws-amplify";
import aws_exports from "../../aws-exports.js";
import { H5, H6 } from "./headings";
import { toast } from "./toast";
import { simpleDateTimeFormatUTC } from "../../util/dateFormat";
import { FullScreenSpinner } from "./fullScreenSpinner";
import { useUser } from "../../context/user-context";
import { Space2 } from "./spaces";
import { IS3Image } from "../../graphql/customQueries.jsx";

const logger = new Logger("ImagePicker");

export default (props: IProps) => {
  const { user } = useUser();
  const [imageUploading, setImageUploading] = useState(false);
  // const [imagePreview, setImagePreview] = useState(null);
  const { uploadedImage, setUploadedImage } = props;

  const onImageUpload = async (imageUploaded: any) => {
    setImageUploading(true);
    const date = simpleDateTimeFormatUTC(new Date());
    const filename = `${date}-${imageUploaded.name}`;

    const uploadedImage: any = await Storage.put(filename, imageUploaded.file, {
      level: "protected",
      contentType: imageUploaded.type,
    });

    const image = {
      key: uploadedImage.key,
      bucket: aws_exports.aws_user_files_s3_bucket,
      region: aws_exports.aws_project_region,
      identityPoolId: user ? user.identityPoolId : "",
    };

    setUploadedImage(image);
    setImageUploading(false);
    toast.success("Image Uploaded");
  };

  return (
    <>
      {uploadedImage && uploadedImage.key && (
        <>
          <S3Image
            imgKey={uploadedImage.key}
            level="protected"
            theme={{
              photoImg: { width: "100%", height: "100%" },
            }}
          />
          <Space2 />
        </>
      )}
      <div style={{ textAlign: "center" }}>
        <H6>Add photos by clicking below</H6>
      </div>
      <PhotoPicker
        // onLoad={(url: string) => setImagePreview(url)}
        onPick={(file: any) => onImageUpload(file)}
        level="protected"
        theme={{
          formContainer: { margin: "20px 0 0 0" },
          formSection: {
            padding: 0,
          },
          sectionHeader: {
            display: "none",
          },
          sectionBody: {
            margin: 0,
          },
          photoPlaceholder: {},
          photoPlaceholderIcon: {},
          // photoPickerButton: {
          //   display: "none"
          // }
        }}
      />
      <FullScreenSpinner show={imageUploading} text="Uploading image" />
    </>
  );
};

interface IProps {
  uploadedImage: IS3Image | null;
  setUploadedImage: (uploadedImage: IS3Image | null) => void;
}

/*
<PhotoPicker
onLoad={(url: string) => setImagePreview(url)}
onPick={(file: any) => onImageUpload(file)}
theme={{
  formContainer: {
    margin: 0,
    height: "100%"
  },
  formSection: {
    padding: 0,
    margin: 0,
    width: "100%",
    height: "100%"
  },
  sectionHeader: {
    display: "none"
  },
  sectionBody: {
    margin: 0,
    height: "100%"
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundImage: `url(${imagePreview})`,
    backgroundSize: "cover",
    backgroundPosition: "50% 50%"
  },
  photoPlaceholderIcon: {
    display: "none"
  },
  photoPickerButton: {
    display: "none"
  }
}}
/>
*/
