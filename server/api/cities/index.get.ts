import { getDB } from "~~/server/db";
import { getQuery } from "h3";

/**
 * GET /api/cities
 * - امکان فیلتر بر اساس province_id
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const query = getQuery(event);

  const params: any[] = [];
  let where = "1=1";

  if (query.province_id) {
    const provinceId = Number(query.province_id);
    if (!Number.isNaN(provinceId)) {
      where += " AND c.province_id = ?";
      params.push(provinceId);
    }
  }

  const [rows] = (await db.query(
    `
      SELECT
        c.*,
        p.name AS province_name,
        p.shipping_cost AS province_shipping_cost
      FROM cities c
      JOIN provinces p ON p.id = c.province_id
      WHERE ${where}
      ORDER BY c.name ASC
    `,
    params,
  )) as any[];

  return {
    success: true,
    data: rows || [],
  };
});


