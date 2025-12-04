import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { userFields } from "~~/server/utils/user";
import { createError } from "h3";

export default defineEventHandler(async (event) => {
  requireRole(event, "admin");

  const id = event.context.params?.id;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه کاربر ارسال نشده است",
    });
  }

  const db = await getDB();

  // Get the user first so we can return it after deletion
  const [rows] = (await db.execute(
    `SELECT ${userFields.join(", ")} FROM users WHERE id = ?`,
    [id]
  )) as any[];

  const user = rows[0] || null;

  if (!user) {
    return {
      success: false,
      message: "کاربر مورد نظر پیدا نشد",
    };
  }

  await db.execute("DELETE FROM users WHERE id = ?", [id]);

  return {
    success: true,
    data: user,
  };
});
