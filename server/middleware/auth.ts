import { verifyToken } from "~~/server/utils/jwt";
import { protectedRoutes } from "~~/server/utils/auth";

export default defineEventHandler((event) => {
  const url = event.node.req.url || "";
  const method = event.node.req.method || "";
  const urlPath = url.split("?")[0];

  // Check if route is in protected routes (exact match)
  if (!protectedRoutes.includes(urlPath)) {
    // Check for dynamic routes like /api/products/[id] for PUT/DELETE
    if (urlPath.startsWith("/api/products/") && method !== "GET") {
      // This will be handled by the individual handlers
      // But we still need to verify token if provided
      const auth = getRequestHeader(event, "authorization");
      if (auth) {
        const token = auth.split(" ")[1];
        const payload = verifyToken(token);
        if (payload) {
          event.context.user = payload;
        }
      }
    }
    return;
  }

  // Allow GET requests to /api/products without auth (public listing)
  if (method === "GET" && urlPath === "/api/products") {
    return;
  }

  const auth = getRequestHeader(event, "authorization");

  if (!auth)
    throw createError({ statusCode: 401, statusMessage: "No token provided" });

  const token = auth.split(" ")[1];
  const payload = verifyToken(token);

  if (!payload)
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid or expired token",
    });

  event.context.user = payload;
});
