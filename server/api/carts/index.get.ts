import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";

/**
 * GET /api/carts
 * Admin-only list with pagination and filters
 */
export default defineEventHandler(async (event) => {
  requireRole(event, "admin");
  const db = await getDB();
  const query = getQuery(event);

  const noPaginate = query.noPaginate === "true" || query.noPaginate === true;
  const page = parseInt(query.page as string) || 1;
  const limit =
    parseInt(query.limit as string) ||
    parseInt(query.per as string) ||
    parseInt(query.perPage as string) ||
    20;
  const offset = noPaginate ? 0 : (page - 1) * limit;

  const status = typeof query.status === "string" ? query.status : null;
  const userId = query.user_id ? Number(query.user_id) : null;

  const params: any[] = [];
  let where = "1=1";

  if (status && ["active", "converted", "abandoned"].includes(status)) {
    where += " AND c.status = ?";
    params.push(status);
  }

  if (userId && !Number.isNaN(userId)) {
    where += " AND c.user_id = ?";
    params.push(userId);
  }

  let sql = `
    SELECT
      c.*,
      COUNT(ci.id) AS items_count,
      COALESCE(SUM(ci.quantity * ci.price), 0) AS total_price
    FROM carts c
    LEFT JOIN cart_items ci ON ci.cart_id = c.id
    WHERE ${where}
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;

  if (!noPaginate) sql += ` LIMIT ${limit} OFFSET ${offset}`;

  const [rows] = (await db.query(sql, params)) as any[];

  let total = 0;
  let totalPages = 0;
  if (!noPaginate) {
    const [countRows] = (await db.query(
      `SELECT COUNT(*) as total FROM carts c WHERE ${where}`,
      params
    )) as any[];
    total = countRows?.[0]?.total || 0;
    totalPages = Math.ceil(total / limit);
  } else {
    total = rows?.length || 0;
  }

  const response: any = { success: true, data: rows || [] };
  response.meta = noPaginate
    ? { total }
    : { page, limit, total, totalPages };

  return response;
});
