import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { createError } from "h3";

/**
 * DELETE /api/provinces/:id
 * حذف استان (فقط ادمین) - در صورت نداشتن شهر
 */
export default defineEventHandler(async (event) => {
  requireRole(event, "admin");
  const db = await getDB();
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه استان ارسال نشده است",
    });
  }

  const [rows] = (await db.query(`SELECT * FROM provinces WHERE id = ?`, [
    id,
  ])) as any[];
  const province = rows?.[0] || null;

  if (!province) {
    return {
      success: false,
      message: "استان مورد نظر پیدا نشد",
    };
  }

  const [cityRows] = (await db.query(
    `SELECT id FROM cities WHERE province_id = ? LIMIT 1`,
    [id],
  )) as any[];

  if (cityRows?.length) {
    return {
      success: false,
      message: "ابتدا شهرهای وابسته به این استان را حذف یا منتقل کنید",
    };
  }

  await db.query(`DELETE FROM provinces WHERE id = ?`, [id]);

  return {
    success: true,
    message: "استان حذف شد",
    data: province,
  };
});


