import { getDB } from "~~/server/db";
import { requireAuth } from "~~/server/utils/auth";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";

/**
 * POST /api/favorites
 * Body: { product_id, user_id? }
 * - authenticated user adds product to favorites
 * - admin can optionally set user_id to create on behalf of another user
 * - unique (user_id, product_id)
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event) as any;
  const db = await getDB();
  const body = await readBody(event);

  validateBody(body, {
    product_id: (v) => validate(v).required().run(),
    user_id: (v) => validate(v).run(),
  });

  const productId = Number(body.product_id);

  let targetUserId = Number(user.id);
  if (user.role === "admin" && body.user_id) {
    targetUserId = Number(body.user_id);
  }

  const [pRows] = (await db.query(`SELECT id FROM products WHERE id = ?`, [
    productId,
  ])) as any[];
  if (!pRows?.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "محصول مورد نظر پیدا نشد",
    });
  }

  try {
    const [result] = (await db.query(
      `INSERT INTO favorites (user_id, product_id, created_at)
       VALUES (?, ?, NOW())`,
      [targetUserId, productId]
    )) as any[];

    return {
      success: true,
      message: "به علاقه‌مندی‌ها اضافه شد",
      data: {
        id: result?.insertId,
        user_id: targetUserId,
        product_id: productId,
      },
    };
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      return {
        success: true,
        message: "این محصول قبلا به علاقه‌مندی‌ها اضافه شده است",
        data: { user_id: targetUserId, product_id: productId },
      };
    }
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || "خطا در افزودن به علاقه‌مندی‌ها",
    });
  }
});


