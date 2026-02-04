import { getDB } from "~~/server/db";
import { requireAuth } from "~~/server/utils/auth";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";

/**
 * POST /api/comments
 * Body: { product_id, rating, comment?, user_id? }
 * - user must be authenticated
 * - admin can optionally set user_id to create on behalf of another user
 * - status defaults to 0 (pending)
 * - unique (user_id, product_id)
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event) as any;
  const db = await getDB();
  const body = await readBody(event);

  validateBody(body, {
    product_id: (v) => validate(v).required().run(),
    rating: (v) => validate(v).required().min(1).max(5).run(),
    comment: (v) => validate(v).max(2000).run(),
    user_id: (v) => validate(v).run(),
  });

  const productId = Number(body.product_id);
  const rating = Number(body.rating);
  const comment =
    body.comment === null || body.comment === undefined
      ? null
      : String(body.comment);

  const status = Number(body.status || 0);

  // target user (admin may override)
  let targetUserId = Number(user.id);
  if (user.role === "admin" && body.user_id) {
    targetUserId = Number(body.user_id);
  }

  // Ensure product exists
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
      `INSERT INTO comments (product_id, user_id, rating, comment, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [productId, targetUserId, rating, comment, status],
    )) as any[];

    return {
      success: true,
      message: "نظر شما ثبت شد و پس از بررسی نمایش داده می‌شود",
      data: {
        id: result?.insertId,
        product_id: productId,
        user_id: targetUserId,
        rating,
        comment,
        status: result.status ?? 0,
      },
    };
  } catch (err: any) {
    // Duplicate unique key (user_id, product_id)
    if (err?.code === "ER_DUP_ENTRY") {
      throw createError({
        statusCode: 409,
        statusMessage: "شما قبلا برای این محصول نظر ثبت کرده‌اید",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || "خطا در ثبت نظر",
    });
  }
});
