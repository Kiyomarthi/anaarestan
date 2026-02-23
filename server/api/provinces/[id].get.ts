import { getDB } from "~~/server/db";
import { createError } from "h3";

/**
 * GET /api/provinces/:id
 * دریافت یک استان
 */
export default defineEventHandler(async (event) => {
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
    throw createError({
      statusCode: 404,
      statusMessage: "استان پیدا نشد",
    });
  }

  return {
    success: true,
    data: province,
  };
});


