import { getDB } from "~~/server/db";
import { getOptionalAuth } from "~~/server/utils/auth";
import { createError } from "h3";

export default defineEventHandler(async (event) => {
  const db = await getDB();
  const auth = getOptionalAuth(event) as any | null;
  const isAdmin = auth?.role === "admin";

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه نظر ارسال نشده است",
    });
  }

  const [rows] = (await db.query(
    `SELECT
      c.*,
      u.full_name AS user_full_name,
      u.phone AS user_phone,
      p.title AS product_title,
      p.code AS product_code,
      p.slug AS product_slug
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     LEFT JOIN products p ON p.id = c.product_id
     WHERE c.id = ?`,
    [id]
  )) as any[];

  const comment = rows?.[0] || null;
  if (!comment) {
    throw createError({
      statusCode: 404,
      statusMessage: "نظر مورد نظر پیدا نشد",
    });
  }

  // non-admin can only see approved comments
  if (!isAdmin && Number(comment.status) !== 1) {
    throw createError({
      statusCode: 404,
      statusMessage: "نظر مورد نظر پیدا نشد",
    });
  }

  return { success: true, data: comment };
});


