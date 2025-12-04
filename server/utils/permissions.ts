import { H3Event, createError } from "h3";
import { JwtPayload } from "jsonwebtoken";
import { requireAuth } from "./auth";

export function requireRole(event: H3Event, role: string): JwtPayload {
  const user = requireAuth(event) as JwtPayload;

  if (user.role !== role) {
    throw createError({
      statusCode: 403,
      statusMessage: `Forbidden: requires ${role} role`,
    });
  }

  return user as JwtPayload;
}
