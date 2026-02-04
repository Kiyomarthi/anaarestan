import { getDB } from "~~/server/db";
import { getOptionalAuth } from "~~/server/utils/auth";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";

/**
 * PATCH /api/carts/:id
 * - admin can update user_id/status
 * - user/guest can update status only for their cart
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

  const body = await readBody(event);
  validateBody(body, {
    user_id: (v) => validate(v).run(),
    status: (v) =>
      v === undefined
        ? true
        : validate(v).checkMatch(["active", "converted", "abandoned"]).run(),
  });

  if (!isAdmin && body.user_id !== undefined) {
    throw createError({
      statusCode: 403,
      statusMessage: "اجازه تغییر کاربر را ندارید",
    });
  }

  const sets: string[] = [];
  const params: any[] = [];

  if (isAdmin && body.user_id !== undefined) {
    sets.push("user_id = ?");
    params.push(body.user_id === null ? null : Number(body.user_id));
  }

  if (body.status !== undefined) {
    sets.push("status = ?");
    params.push(body.status);
  }

  if (!sets.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "هیچ فیلدی برای بروزرسانی ارسال نشده است",
    });
  }

  params.push(id);
  await db.query(`UPDATE carts SET ${sets.join(", ")} WHERE id = ?`, params);

  const [updatedRows] = (await db.query(`SELECT * FROM carts WHERE id = ?`, [
    id,
  ])) as any[];

  return {
    success: true,
    message: "بروزرسانی شد",
    data: updatedRows?.[0] || null,
  };
});
