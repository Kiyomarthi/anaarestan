import { getDB } from "~~/server/db";
import { getOptionalAuth } from "~~/server/utils/auth";
import { createError } from "h3";

/**
 * GET /api/cart-items
 * - admin can list all items (pagination)
 * - user/guest can list items for a specific cart_id they own
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const auth = getOptionalAuth(event) as any | null;
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

  const cartId = query.cart_id ? Number(query.cart_id) : null;

  if (!isAdmin && !cartId) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه سبد خرید الزامی است",
    });
  }

  if (cartId) {
    const [cartRows] = (await db.query(`SELECT * FROM carts WHERE id = ?`, [
      cartId,
    ])) as any[];
    const cart = cartRows?.[0] || null;
    if (!cart) {
      throw createError({
        statusCode: 404,
        statusMessage: "سبد خرید پیدا نشد",
      });
    }

    if (!isAdmin && cart.user_id) {
      if (!auth || Number(cart.user_id) !== Number(auth.id)) {
        throw createError({
          statusCode: 403,
          statusMessage: "دسترسی ندارید",
        });
      }
    }
  }

  const params: any[] = [];
  let where = "1=1";
  if (cartId) {
    where += " AND ci.cart_id = ?";
    params.push(cartId);
  }

  let sql = `
    SELECT ci.*
    FROM cart_items ci
    WHERE ${where}
    ORDER BY ci.created_at DESC
  `;

  if (!noPaginate) sql += ` LIMIT ${limit} OFFSET ${offset}`;

  const [rows] = (await db.query(sql, params)) as any[];

  let total = 0;
  let totalPages = 0;
  if (!noPaginate) {
    const [countRows] = (await db.query(
      `SELECT COUNT(*) as total FROM cart_items ci WHERE ${where}`,
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
