import { getDB } from "~~/server/db";
import { buildUpdateQuery } from "~~/server/utils/common";
import { allowedUserFields, userFields } from "~~/server/utils/user";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const body = await readBody(event);

  const query = buildUpdateQuery(
    "users",
    body,
    "id",
    user.id,
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
