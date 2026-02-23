import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { createError } from "h3";

/**
 * GET /api/coupons/:id
 * فقط ادمین می‌تواند جزییات یک کوپن را ببیند
 */
export default defineEventHandler(async (event) => {
  requireRole(event, "admin");
  const db = await getDB();

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه کوپن ارسال نشده است",
    });
  }

  const [rows] = (await db.query(`SELECT * FROM coupons WHERE id = ?`, [
    id,
  ])) as any[];
  const coupon = rows?.[0] || null;

  if (!coupon) {
    throw createError({
      statusCode: 404,
      statusMessage: "کوپن پیدا نشد",
    });
  }

  return {
    success: true,
    data: coupon,
  };
});


