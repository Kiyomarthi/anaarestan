import { fromNodeMiddleware } from "h3";
import serveStatic from "serve-static";

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig();

  console.log("[UPLOADS] static plugin loaded");
  console.log("[UPLOADS] url:", config.uploadUrl);
  console.log("[UPLOADS] dir:", config.uploadDir);

  nitroApp.h3App.use(
    config.uploadUrl,
    fromNodeMiddleware(
      serveStatic(config.uploadDir)
    )
  );
});
