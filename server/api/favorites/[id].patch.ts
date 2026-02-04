import { getDB } from "~~/server/db";
import { getOptionalAuth, requireAuth } from "~~/server/utils/auth";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";

/**
 * PATCH /api/favorites/:id
 * Minimal endpoint for parity with other resources:
 * - admin can reassign user_id/product_id (rare)
 * - user can only "move" favorite to another product (generally not used)
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const auth = getOptionalAuth(event) as any | null;
  if (!auth) requireAuth(event);
  const isAdmin = auth?.role === "admin";

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه علاقه‌مندی ارسال نشده است",
    });
  }

  const body = await readBody(event);
  validateBody(body, {
    user_id: (v) => validate(v).run(),
    product_id: (v) => validate(v).run(),
  });

  const [rows] = (await db.query(`SELECT * FROM favorites WHERE id = ?`, [
    id,
  ])) as any[];
  const existing = rows?.[0] || null;
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "یافت نشد",
    });
  }

  if (!isAdmin && Number(existing.user_id) !== Number(auth.id)) {
    throw createError({
      statusCode: 403,
      statusMessage: "دسترسی ندارید",
    });
  }

  if (!isAdmin && body.user_id !== undefined) {
    throw createError({
      statusCode: 403,
      statusMessage: "اجازه تغییر کاربر را ندارید",
    });
  }

  const sets: string[] = [];
  const params: any[] = [];

  if (body.user_id !== undefined) {
    sets.push("user_id = ?");
    params.push(Number(body.user_id));
  }

  if (body.product_id !== undefined) {
    sets.push("product_id = ?");
    params.push(Number(body.product_id));
  }

  if (!sets.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "هیچ فیلدی برای بروزرسانی ارسال نشده است",
    });
  }

  params.push(id);
  try {
    await db.query(
      `UPDATE favorites SET ${sets.join(", ")} WHERE id = ?`,
      params
    );
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      throw createError({
        statusCode: 409,
        statusMessage: "این علاقه‌مندی تکراری است",
      });
    }
    throw err;
  }

  const [updated] = (await db.query(`SELECT * FROM favorites WHERE id = ?`, [
    id,
  ])) as any[];

  return { success: true, message: "بروزرسانی شد", data: updated?.[0] || null };
});


