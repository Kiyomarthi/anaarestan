import { defineNitroPlugin } from "#app";
import serveStatic from "serve-static";

export default defineNitroPlugin((nitroApp) => {
  const uploadDir = process.env.UPLOAD_DIR || "/home/anaarest/uploads";
  const uploadUrl = process.env.UPLOAD_URL || "/uploads";

  nitroApp.app.use(uploadUrl, serveStatic(uploadDir));
});
