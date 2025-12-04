import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { userFields } from "~~/server/utils/user";

export default defineEventHandler(async (event) => {
  const user = requireRole(event, "admin");

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "User ID is required",
    });
  }

  const db = (await getDB()) as any;

  const [rows] = await db.execute(
    `SELECT ${userFields.join(", ")} FROM users WHERE id = ?`,
    [id]
  );

  if (!rows || (rows as unknown[]).length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }

  return {
    success: true,
    data: (rows as unknown[])[0],
  };
});
