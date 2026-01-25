import { PutObjectCommand } from "@aws-sdk/client-s3";

export default defineEventHandler(async (event) => {
  const body = await readMultipartFormData(event);
  const config = useRuntimeConfig();

  const fileItem = body?.find((item: any) => item.name === "file");
  if (!fileItem) {
    return { success: false, message: "فایلی دریافت نشد" };
  }

  const fileName = fileItem.filename;

  const key = `${fileName}-${Date.now()}`;

  const uploadParams = {
    Bucket: config.arvanBucket,
    Key: key,
    Body: fileItem?.data,
    ACL: "public-read",
  };

  try {
    const data = await s3.send(new PutObjectCommand(uploadParams));
    return {
      success: true,
      key: key,
      url: `${config.arvanBucketEndpoint}/${fileName}`,
    };
  } catch (err) {
    return { success: false, message: err?.message };
  }
});
