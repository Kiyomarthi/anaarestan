import { S3Client } from "@aws-sdk/client-s3";
const config = useRuntimeConfig();

export const s3 = new S3Client({
  region: "default",
  endpoint: config.arvanEndpoint,
  credentials: {
    accessKeyId: config.arvanAccessKey,
    secretAccessKey: config.arvanSecretKey,
  },

  forcePathStyle: true,
});
