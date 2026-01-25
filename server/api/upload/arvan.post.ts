import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getContentType } from "~~/server/utils/common";

export default defineEventHandler(async (event) => {
  requireRole(event, "admin");

  const body = await readMultipartFormData(event);
  const config = useRuntimeConfig();

  const fileItem = body?.find((item: any) => item.name === "file");
  if (!fileItem) {
    return { success: false, message: "فایلی دریافت نشد" };
  }

  const fileName = fileItem?.filename;

  const key = `${Date.now()}-${fileName}`;
  const contentType = getContentType(fileName);

  const uploadParams = {
    Bucket: config.arvanBucket,
    Key: key,
    Body: fileItem?.data,
    ACL: "public-read",
    ContentType: contentType,
  };

  try {
    const data = await s3.send(new PutObjectCommand(uploadParams));
    return {
      success: true,
      key: key,
      url: `${config.public?.arvanBucketEndpoint}/${key}`,
    };
  } catch (err) {
    return { success: false, message: err?.message };
  }
});
