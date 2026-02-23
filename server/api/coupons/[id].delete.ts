import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { createError } from "h3";

/**
 * DELETE /api/coupons/:id
 * حذف کوپن (فقط ادمین)
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
    return {
      success: false,
      message: "کوپن مورد نظر پیدا نشد",
    };
  }

  await db.query(`DELETE FROM coupons WHERE id = ?`, [id]);

  return {
    success: true,
    message: "کوپن حذف شد",
    data: coupon,
  };
});


