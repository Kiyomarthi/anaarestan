import { getDB } from "~~/server/db";
import { getOptionalAuth } from "~~/server/utils/auth";
import { createError } from "h3";

/**
 * GET /api/cart-items/:id
 * - admin can access any item
 * - user/guest can access items in their cart
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const auth = getOptionalAuth(event) as any | null;
  const isAdmin = auth?.role === "admin";

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه آیتم ارسال نشده است",
    });
  }

  const [rows] = (await db.query(
    `SELECT ci.*, c.user_id AS cart_user_id
     FROM cart_items ci
     JOIN carts c ON c.id = ci.cart_id
     WHERE ci.id = ?`,
    [id]
  )) as any[];

  const item = rows?.[0] || null;
  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: "آیتم پیدا نشد",
    });
  }

  if (!isAdmin && item.cart_user_id) {
    if (!auth || Number(item.cart_user_id) !== Number(auth.id)) {
      throw createError({
        statusCode: 403,
        statusMessage: "دسترسی ندارید",
      });
    }
  }

  const { cart_user_id, ...data } = item;

  return { success: true, data };
});
