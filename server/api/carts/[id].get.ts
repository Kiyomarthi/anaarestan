import { getDB } from "~~/server/db";
import { getOptionalAuth } from "~~/server/utils/auth";
import { createError } from "h3";

/**
 * GET /api/carts/:id
 * - admin can access any cart
 * - user can access own cart
 * - guest can access carts with null user_id
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const auth = getOptionalAuth(event) as any | null;
  const isAdmin = auth?.role === "admin";

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه سبد خرید ارسال نشده است",
    });
  }

  const [rows] = (await db.query(`SELECT * FROM carts WHERE id = ?`, [
    id,
  ])) as any[];
  const cart = rows?.[0] || null;

  if (!cart) {
    throw createError({
      statusCode: 404,
      statusMessage: "سبد خرید پیدا نشد",
    });
  }

  if (!isAdmin) {
    if (cart.user_id) {
      if (!auth || Number(cart.user_id) !== Number(auth.id)) {
        throw createError({
          statusCode: 403,
          statusMessage: "دسترسی ندارید",
        });
      }
    }
  }

  const [items] = (await db.query(
    `SELECT * FROM cart_items WHERE cart_id = ? ORDER BY created_at ASC`,
    [id]
  )) as any[];

  return {
    success: true,
    data: {
      ...cart,
      items: items || [],
    },
  };
});
