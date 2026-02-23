import { getDB } from "~~/server/db";
import { getOptionalAuth, requireAuth } from "~~/server/utils/auth";
import type { H3Event } from "h3";

function getAuthOrThrow(event: H3Event) {
  const auth = getOptionalAuth(event) as any | null;
  if (auth) return auth;
  return requireAuth(event) as any;
}

/**
 * GET /api/addresses
 * - user: فقط آدرس‌های خودش را می‌بیند
 * - admin: می‌تواند همه آدرس‌ها را ببیند و با user_id فیلتر کند
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const query = getQuery(event);
  const auth = getAuthOrThrow(event);
  const isAdmin = auth?.role === "admin";

  let where = "1=1";
  const params: any[] = [];

  if (isAdmin && query.user_id) {
    const userId = Number(query.user_id);
    if (!Number.isNaN(userId)) {
      where += " AND a.user_id = ?";
      params.push(userId);
    }
  } else {
    const userId = Number(auth.id);
    where += " AND a.user_id = ?";
    params.push(userId);
  }

  if (query.province_id) {
    const provinceId = Number(query.province_id);
    if (!Number.isNaN(provinceId)) {
      where += " AND a.province_id = ?";
      params.push(provinceId);
    }
  }

  if (query.city_id) {
    const cityId = Number(query.city_id);
    if (!Number.isNaN(cityId)) {
      where += " AND a.city_id = ?";
      params.push(cityId);
    }
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
      WHERE ${where}
      ORDER BY a.is_default DESC, a.created_at DESC
    `,
    params,
  )) as any[];

  return {
    success: true,
    data: rows || [],
  };
}
);


