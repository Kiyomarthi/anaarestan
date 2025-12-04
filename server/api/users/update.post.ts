import { JwtPayload } from "jsonwebtoken";
import { getDB } from "~~/server/db";
import { requireAuth } from "~~/server/utils/auth";
import { buildUpdateQuery } from "~~/server/utils/common";
import { allowedUserFields, userFields } from "~~/server/utils/user";
import { validate } from "~~/shared/validation";

export default defineEventHandler(async (event) => {
  const user = requireAuth(event) as JwtPayload;

  const body = await readBody(event);

  if (!user || !user.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: user not logged in",
    });
  }

  validateBody(body, {
    full_name: (v) => validate(v).min(3).max(100).run(),
  });

  const query = buildUpdateQuery(
    "users",
    body,
    "id",
    user?.id,
    allowedUserFields
  );

  if (!query) return { success: false, message: "No valid fields to update" };

  const db = (await getDB()) as any;
  await db.execute(query.sql, query.values);

  const [rows] = await db.execute(
    `SELECT ${userFields.join(", ")} FROM users WHERE id = ?`,
    [user.id]
  );

  return { success: true, data: rows[0] };
});
