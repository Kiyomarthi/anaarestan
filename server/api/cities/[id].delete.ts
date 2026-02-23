import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { createError } from "h3";

/**
 * DELETE /api/cities/:id
 * حذف شهر (فقط ادمین)
 */
export default defineEventHandler(async (event) => {
  requireRole(event, "admin");
  const db = await getDB();
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه شهر ارسال نشده است",
    });
  }

  const [rows] = (await db.query(`SELECT * FROM cities WHERE id = ?`, [
    id,
  ])) as any[];
  const city = rows?.[0] || null;

  if (!city) {
    return {
      success: false,
      message: "شهر مورد نظر پیدا نشد",
    };
  }

  // ممکن است بعداً نیاز باشد بررسی شود که آدرسی به این شهر وصل نیست
  await db.query(`DELETE FROM cities WHERE id = ?`, [id]);

  return {
    success: true,
    message: "شهر حذف شد",
    data: city,
  };
});


