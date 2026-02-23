import { getDB } from "~~/server/db";
import { getOptionalAuth, requireAuth } from "~~/server/utils/auth";
import { requireRole } from "~~/server/utils/permissions";
import { createError } from "h3";

/**
 * GET /api/wallets
 * Query:
 * - user_id (admin only, optional)
 * - page, limit/per/perPage, noPaginate
 * - user can only see own wallet
 * - admin can see all wallets with filters
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const auth = getOptionalAuth(event) as any | null;
  const isAdmin = auth?.role === "admin";

  if (!auth) {
    throw createError({
      statusCode: 401,
      statusMessage: "نیاز به احراز هویت دارد",
    });
  }

  const query = getQuery(event);
  const noPaginate = query.noPaginate === "true" || query.noPaginate === true;
  const page = parseInt(query.page as string) || 1;
  const limit =
    parseInt(query.limit as string) ||
    parseInt(query.per as string) ||
    parseInt(query.perPage as string) ||
    20;
  const offset = noPaginate ? 0 : (page - 1) * limit;

  const userIdFilter =
    isAdmin && query.user_id ? Number(query.user_id) : null;

  const params: any[] = [];
  let where = "1=1";

  // User filter: non-admin only sees own wallet
  if (!isAdmin) {
    where += " AND w.user_id = ?";
    params.push(Number(auth.id));
  } else if (userIdFilter && !Number.isNaN(userIdFilter)) {
    where += " AND w.user_id = ?";
    params.push(userIdFilter);
  }

  let sql = `
    SELECT
      w.*,
      u.full_name AS user_full_name,
      u.phone AS user_phone
    FROM wallets w
    LEFT JOIN users u ON u.id = w.user_id
    WHERE ${where}
    ORDER BY w.created_at DESC
  `;

  if (!noPaginate) sql += ` LIMIT ${limit} OFFSET ${offset}`;

  const [rows] = (await db.query(sql, params)) as any[];

  let total = 0;
  let totalPages = 0;
  if (!noPaginate) {
    const [countRows] = (await db.query(
      `SELECT COUNT(*) as total FROM wallets w WHERE ${where}`,
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

