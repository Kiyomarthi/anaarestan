import { defineNitroPlugin } from "nitropack";
import serveStatic from "serve-static";

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig();

  console.log("[UPLOADS] static plugin loaded");
  console.log("[UPLOADS] url:", config.uploadUrl);
  console.log("[UPLOADS] dir:", config.uploadDir);

  nitroApp.app.use(config.uploadUrl, serveStatic(config.uploadDir));
});
