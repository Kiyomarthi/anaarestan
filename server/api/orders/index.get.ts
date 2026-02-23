import { getDB } from "~~/server/db";
import { getOptionalAuth, requireAuth } from "~~/server/utils/auth";
import { createError } from "h3";

/**
 * GET /api/orders
 * Query:
 * - user_id (admin only, optional)
 * - status (optional): pending_payment, paid, processing, shipped, delivered, canceled, failed
 * - page, limit/per/perPage, noPaginate
 * - user can only see own orders
 * - admin can see all orders with filters
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

  const statusFilter =
    typeof query.status === "string" ? query.status : null;
  const userIdFilter =
    isAdmin && query.user_id ? Number(query.user_id) : null;

  const params: any[] = [];
  let where = "1=1";

  // User filter: non-admin only sees own orders
  if (!isAdmin) {
    where += " AND o.user_id = ?";
    params.push(Number(auth.id));
  } else if (userIdFilter && !Number.isNaN(userIdFilter)) {
    where += " AND o.user_id = ?";
    params.push(userIdFilter);
  }

  // Status filter
  const validStatuses = [
    "pending_payment",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "canceled",
    "failed",
  ];
  if (statusFilter && validStatuses.includes(statusFilter)) {
    where += " AND o.status = ?";
    params.push(statusFilter);
  }

  let sql = `
    SELECT
      o.*,
      a.full_address,
      a.postal_code,
      p.name AS province_name,
      c.name AS city_name,
      u.full_name AS user_full_name,
      u.phone AS user_phone
    FROM orders o
    LEFT JOIN addresses a ON a.id = o.address_id
    LEFT JOIN provinces p ON p.id = a.province_id
    LEFT JOIN cities c ON c.id = a.city_id
    LEFT JOIN users u ON u.id = o.user_id
    WHERE ${where}
    ORDER BY o.created_at DESC
  `;

  if (!noPaginate) sql += ` LIMIT ${limit} OFFSET ${offset}`;

  const [rows] = (await db.query(sql, params)) as any[];

  let total = 0;
  let totalPages = 0;
  if (!noPaginate) {
    const [countRows] = (await db.query(
      `SELECT COUNT(*) as total FROM orders o WHERE ${where}`,
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

