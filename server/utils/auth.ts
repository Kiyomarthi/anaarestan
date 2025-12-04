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
