import { getDB } from "~~/server/db";
import { getOptionalAuth, requireAuth } from "~~/server/utils/auth";
import { createError } from "h3";
import { recalculateProductRatings } from "~~/server/utils/ratings";
import { CACHE_KEY } from "~~/shared/utils/cache";
import { removeCacheByPattern } from "~~/server/utils/cache";

/**
 * DELETE /api/comments/:id
 * - admin can delete any
 * - user can delete own comment (any status)
 * - if deleted comment was approved, product_ratings will be recalculated
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  await removeCacheByPattern(`${CACHE_KEY.comment}:`);
  await removeCacheByPattern(`${CACHE_KEY.product}:`);
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه نظر ارسال نشده است",
    });
  }

  const auth = getOptionalAuth(event) as any | null;
  if (!auth) requireAuth(event);
  const isAdmin = auth?.role === "admin";
  const userId = auth?.id;

  const [rows] = (await db.query(`SELECT * FROM comments WHERE id = ?`, [
    id,
  ])) as any[];
  const comment = rows?.[0] || null;
  if (!comment) {
    throw createError({
      statusCode: 404,
      statusMessage: "نظر مورد نظر پیدا نشد",
    });
  }

  if (!isAdmin && Number(comment.user_id) !== Number(userId)) {
    throw createError({
      statusCode: 403,
      statusMessage: "شما اجازه حذف این نظر را ندارید",
    });
  }

  await db.query(`DELETE FROM comments WHERE id = ?`, [id]);

  if (Number(comment.status) === 1) {
    await recalculateProductRatings(db as any, Number(comment.product_id));
  }

  return {
    success: true,
    message: "نظر حذف شد",
    data: comment,
  };
});


