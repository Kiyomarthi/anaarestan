import { getDB } from "~~/server/db";
import { getOptionalAuth, requireAuth } from "~~/server/utils/auth";
import { createError } from "h3";

/**
 * GET /api/addresses/:id
 * - admin: دسترسی به همه آدرس‌ها
 * - user: فقط آدرس‌های خودش
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
    `
      SELECT
        a.*,
        p.name AS province_name,
        c.name AS city_name,
        COALESCE(c.shipping_cost, p.shipping_cost) AS shipping_cost
      FROM addresses a
      JOIN provinces p ON p.id = a.province_id
      JOIN cities c ON c.id = a.city_id
      WHERE a.id = ?
    `,
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

  return {
    success: true,
    data: address,
  };
});


