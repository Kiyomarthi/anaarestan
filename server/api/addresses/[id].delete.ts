import { getDB } from "~~/server/db";
import { getOptionalAuth, requireAuth } from "~~/server/utils/auth";
import { createError } from "h3";

/**
 * DELETE /api/addresses/:id
 * - user: فقط می‌تواند آدرس خودش را حذف کند
 * - admin: می‌تواند هر آدرسی را حذف کند
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const auth = (getOptionalAuth(event) as any | null) || (requireAuth(
    event,
  ) as any);
  const isAdmin = auth?.role === "admin";

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه آدرس ارسال نشده است",
    });
  }

  const [rows] = (await db.query(
    `SELECT * FROM addresses WHERE id = ?`,
    [id],
  )) as any[];
  const address = rows?.[0] || null;

  if (!address) {
    throw createError({
      statusCode: 404,
      statusMessage: "آدرس پیدا نشد",
    });
  }

  if (!isAdmin && Number(address.user_id) !== Number(auth.id)) {
    throw createError({
      statusCode: 403,
      statusMessage: "دسترسی ندارید",
    });
  }

  await db.query(`DELETE FROM addresses WHERE id = ?`, [id]);

  return {
    success: true,
    message: "آدرس حذف شد",
  };
});


