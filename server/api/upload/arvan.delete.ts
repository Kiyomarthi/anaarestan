import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export default defineEventHandler(async (event) => {
  requireRole(event, "admin");
  const config = useRuntimeConfig();
  const body = await readBody(event);
  const { key } = body;

  try {
    const data = await s3.send(
      new DeleteObjectCommand({
        Bucket: config.arvanBucket,
        Key: key,
      })
    );
    return {
      success: true,
      data,
    };
  } catch (err) {
    return { success: false, message: err };
  }
});
