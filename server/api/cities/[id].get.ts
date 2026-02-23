import { getDB } from "~~/server/db";
import { createError } from "h3";

/**
 * GET /api/cities/:id
 * دریافت یک شهر
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه شهر ارسال نشده است",
    });
  }

  const [rows] = (await db.query(
    `
      SELECT
        c.*,
        p.name AS province_name,
        p.shipping_cost AS province_shipping_cost
      FROM cities c
      JOIN provinces p ON p.id = c.province_id
      WHERE c.id = ?
    `,
    [id],
  )) as any[];

  const city = rows?.[0] || null;

  if (!city) {
    throw createError({
      statusCode: 404,
      statusMessage: "شهر پیدا نشد",
    });
  }

  return {
    success: true,
    data: city,
  };
});


