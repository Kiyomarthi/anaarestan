import { getDB } from "~~/server/db";
import { getOptionalAuth, requireAuth } from "~~/server/utils/auth";
import { createError } from "h3";

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

  const [rows] = (await db.query(
    `SELECT
      f.*,
      u.full_name AS user_full_name,
      u.phone AS user_phone,
      p.title AS product_title,
      p.code AS product_code,
      p.slug AS product_slug
     FROM favorites f
     LEFT JOIN users u ON u.id = f.user_id
     LEFT JOIN products p ON p.id = f.product_id
     WHERE f.id = ?`,
    [id]
  )) as any[];

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

  return { success: true, data: fav };
});


