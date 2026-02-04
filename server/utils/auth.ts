import { verifyToken } from "./jwt";
import { H3Event, createError } from "h3";

export function requireAuth(event: H3Event) {
  const authHeader = event.node.req.headers["authorization"] || "";

  if (!authHeader) {
    throw createError({
      statusCode: 401,
      statusMessage: "No token provided",
    });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid token",
    });
  }

  if (!payload) {
    throw createError({
      statusCode: 401,
      statusMessage: "Token expired or invalid",
    });
  }

  return payload;
}

/**
 * Like requireAuth, but returns null instead of throwing when token is missing/invalid.
 * Useful for endpoints where authentication is optional (e.g. product details with is_favorite).
 */
export function getOptionalAuth(event: H3Event) {
  const authHeader = event.node.req.headers["authorization"] || "";
  if (!authHeader) return null;

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  const payload = verifyToken(token);
  return payload || null;
}