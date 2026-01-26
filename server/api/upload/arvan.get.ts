import { ListObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";

export default defineEventHandler(async (event) => {
  requireRole(event, "admin");
  // TODO: add paginate and search for list of files
  const config = useRuntimeConfig();
  try {
    const response = await s3.send(
      new ListObjectsCommand({
        Bucket: config.arvanBucket,
      })
    );

    return response;
  } catch (err) {
    return { success: false, message: err };
  }
});
