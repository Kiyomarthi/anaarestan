import { getDB } from "~~/server/db";
import { getOptionalAuth } from "~~/server/utils/auth";
import { createError } from "h3";

/**
 * DELETE /api/carts/:id
 * - admin can delete any cart
 * - user/guest can delete their cart
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

  await db.query(`DELETE FROM carts WHERE id = ?`, [id]);

  return { success: true, message: "حذف شد" };
});
