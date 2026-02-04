import { getDB } from "~~/server/db";
import { getOptionalAuth, requireAuth } from "~~/server/utils/auth";
import { createError } from "h3";

/**
 * DELETE /api/favorites/:id
 * - user can delete own favorite
 * - admin can delete any
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const auth = getOptionalAuth(event) as any | null;
  if (!auth) requireAuth(event);
  const isAdmin = auth?.role === "admin";

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه علاقه‌مندی ارسال نشده است",
    });
  }

  const [rows] = (await db.query(`SELECT * FROM favorites WHERE id = ?`, [
    id,
  ])) as any[];
  const fav = rows?.[0] || null;
  if (!fav) {
    throw createError({
      statusCode: 404,
      statusMessage: "یافت نشد",
    });
  }

  if (!isAdmin && Number(fav.user_id) !== Number(auth.id)) {
    throw createError({
      statusCode: 403,
      statusMessage: "دسترسی ندارید",
    });
  }

  await db.query(`DELETE FROM favorites WHERE id = ?`, [id]);

  return { success: true, message: "حذف شد", data: fav };
});


