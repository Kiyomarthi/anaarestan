import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { getQuery } from "h3";

/**
 * GET /api/coupons
 * فقط برای ادمین:
 *  - امکان فیلتر بر اساس code، وضعیت فعال بودن و بازه زمانی
 */
export default defineEventHandler(async (event) => {
  requireRole(event, "admin");
  const db = await getDB();
  const query = getQuery(event);

  const code =
    typeof query.code === "string" && query.code.trim().length > 0
      ? query.code.trim()
      : null;
  const isActive =
    query.is_active === "1" || query.is_active === "0"
      ? Number(query.is_active)
      : null;

  const params: any[] = [];
  let where = "1=1";

  if (code) {
    where += " AND code LIKE ?";
    params.push(`%${code}%`);
  }

  if (isActive !== null) {
    where += " AND is_active = ?";
    params.push(isActive);
  }

  const [rows] = (await db.query(
    `
      SELECT *
      FROM coupons
      WHERE ${where}
      ORDER BY created_at DESC
    `,
    params,
  )) as any[];

  return {
    success: true,
    data: rows || [],
  };
});


