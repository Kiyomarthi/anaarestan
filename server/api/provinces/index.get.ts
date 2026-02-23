import { getDB } from "~~/server/db";

/**
 * GET /api/provinces
 * لیست استان‌ها
 */
export default defineEventHandler(async () => {
  const db = await getDB();

  const [rows] = (await db.query(
    `
      SELECT *
      FROM provinces
      ORDER BY name ASC
    `,
  )) as any[];

  return {
    success: true,
    data: rows || [],
  };
});


