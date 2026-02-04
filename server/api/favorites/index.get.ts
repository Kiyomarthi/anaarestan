import { getDB } from "~~/server/db";
import { getOptionalAuth, requireAuth } from "~~/server/utils/auth";
import { createError } from "h3";

/**
 * GET /api/favorites
 * - user: list own favorites (default)
 * - admin: can list all, or filter by user_id/product_id
 * Pagination: page, limit/per/perPage, noPaginate
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const auth = getOptionalAuth(event) as any | null;
  if (!auth) requireAuth(event);
  const isAdmin = auth?.role === "admin";

  const query = getQuery(event);
  const noPaginate = query.noPaginate === "true" || query.noPaginate === true;
  const page = parseInt(query.page as string) || 1;
  const limit =
    parseInt(query.limit as string) ||
    parseInt(query.per as string) ||
    parseInt(query.perPage as string) ||
    20;
  const offset = noPaginate ? 0 : (page - 1) * limit;

  const userIdQ = query.user_id ? Number(query.user_id) : null;
  const productIdQ = query.product_id ? Number(query.product_id) : null;

  let whereClause = "1=1";
  const params: unknown[] = [];

  if (isAdmin) {
    if (userIdQ && !Number.isNaN(userIdQ)) {
      whereClause += " AND f.user_id = ?";
      params.push(userIdQ);
    }
    if (productIdQ && !Number.isNaN(productIdQ)) {
      whereClause += " AND f.product_id = ?";
      params.push(productIdQ);
    }
  } else {
    whereClause += " AND f.user_id = ?";
    params.push(auth.id);
  }

  let selectSql = `
    SELECT
      f.*,
      u.full_name AS user_full_name,
      u.phone AS user_phone,
      p.title AS product_title,
      p.code AS product_code,
      p.slug AS product_slug
    FROM favorites f
    LEFT JOIN users u ON u.id = f.user_id
    LEFT JOIN products p ON p.id = f.product_id
    WHERE ${whereClause}
    ORDER BY f.created_at DESC
  `;

  if (!noPaginate) selectSql += ` LIMIT ${limit} OFFSET ${offset}`;

  const [rows] = (await db.query(selectSql, params)) as any[];

  let total = 0;
  let totalPages = 0;
  if (!noPaginate) {
    const [countRows] = (await db.query(
      `SELECT COUNT(*) as total FROM favorites f WHERE ${whereClause}`,
      params
    )) as any[];
    total = countRows?.[0]?.total || 0;
    totalPages = Math.ceil(total / limit);
  } else {
    total = rows?.length || 0;
  }

  return {
    success: true,
    data: rows || [],
    meta: noPaginate ? { total } : { page, limit, total, totalPages },
  };
});


