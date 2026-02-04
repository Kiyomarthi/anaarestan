import { getDB } from "~~/server/db";
import { getOptionalAuth, requireAuth } from "~~/server/utils/auth";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";
import { recalculateProductRatings } from "~~/server/utils/ratings";

/**
 * PATCH /api/comments/:id
 * - admin can update status, rating, comment
 * - user can update own comment (rating/comment) only if status is pending (0)
 * Status mapping: 0=pending, 1=approved, 2=rejected
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه نظر ارسال نشده است",
    });
  }

  const auth = getOptionalAuth(event) as any | null;
  if (!auth) requireAuth(event); // throw 401
  const isAdmin = auth?.role === "admin";
  const userId = auth?.id;

  const body = await readBody(event);

  validateBody(body, {
    rating: (v) => validate(v).min(1).max(5).run(),
    comment: (v) => validate(v).max(2000).run(),
    status: (v) => validate(v).min(0).max(2).run(),
  });

  const [existingRows] = (await db.query(`SELECT * FROM comments WHERE id = ?`, [
    id,
  ])) as any[];
  const existing = existingRows?.[0] || null;
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "نظر مورد نظر پیدا نشد",
    });
  }

  if (!isAdmin) {
    if (Number(existing.user_id) !== Number(userId)) {
      throw createError({
        statusCode: 403,
        statusMessage: "شما اجازه ویرایش این نظر را ندارید",
      });
    }
    if (Number(existing.status) !== 0) {
      throw createError({
        statusCode: 409,
        statusMessage: "این نظر قابل ویرایش نیست",
      });
    }
  }

  const nextRating =
    body.rating === undefined ? undefined : Number(body.rating);
  const nextComment =
    body.comment === undefined
      ? undefined
      : body.comment === null
        ? null
        : String(body.comment);
  const nextStatus =
    body.status === undefined ? undefined : Number(body.status);

  if (!isAdmin && nextStatus !== undefined) {
    throw createError({
      statusCode: 403,
      statusMessage: "شما اجازه تغییر وضعیت نظر را ندارید",
    });
  }

  if (!isAdmin) {
    // ensure there is at least something to update
    if (nextRating === undefined && nextComment === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: "هیچ فیلدی برای بروزرسانی ارسال نشده است",
      });
    }
  } else {
    // admin: allow status-only updates, etc.
    if (
      nextRating === undefined &&
      nextComment === undefined &&
      nextStatus === undefined
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "هیچ فیلدی برای بروزرسانی ارسال نشده است",
      });
    }
  }

  // Build update query manually (small table)
  const sets: string[] = [];
  const params: any[] = [];
  if (nextRating !== undefined) {
    sets.push("rating = ?");
    params.push(nextRating);
  }
  if (nextComment !== undefined) {
    sets.push("comment = ?");
    params.push(nextComment);
  }
  if (nextStatus !== undefined) {
    sets.push("status = ?");
    params.push(nextStatus);
  }

  params.push(id);
  await db.query(
    `UPDATE comments SET ${sets.join(", ")}, updated_at = NOW() WHERE id = ?`,
    params
  );

  // Recalculate ratings if approval state changed (or approved comment content changed)
  const prevStatus = Number(existing.status);
  const finalStatus = nextStatus === undefined ? prevStatus : nextStatus;
  const productId = Number(existing.product_id);

  const shouldRecalc =
    (prevStatus === 1 && finalStatus !== 1) ||
    (prevStatus !== 1 && finalStatus === 1) ||
    (finalStatus === 1 && (nextRating !== undefined || nextComment !== undefined));

  if (shouldRecalc) {
    await recalculateProductRatings(db as any, productId);
  }

  const [updatedRows] = (await db.query(`SELECT * FROM comments WHERE id = ?`, [
    id,
  ])) as any[];

  return {
    success: true,
    message: "نظر بروزرسانی شد",
    data: updatedRows?.[0] || null,
  };
});


