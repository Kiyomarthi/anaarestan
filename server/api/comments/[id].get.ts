import { getDB } from "~~/server/db";
import { getOptionalAuth } from "~~/server/utils/auth";
import { createError } from "h3";
import { buildCacheKey } from "~~/server/utils/common";
import { getCachedData, setCacheData } from "~~/server/utils/cache";
import { CACHE_KEY } from "~~/shared/utils/cache";

export default defineEventHandler(async (event) => {
  const auth = getOptionalAuth(event) as any | null;
  const isAdmin = auth?.role === "admin";
  const isCache = getHeader(event, "cache");

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه نظر ارسال نشده است",
    });
  }

  const cacheScope = isAdmin ? "admin" : "public";
  const cacheKey =
    buildCacheKey(event, `${CACHE_KEY.comment}:${cacheScope}:${id}`) || null;

  async function fetchComment() {
    const db = await getDB();
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
  }

  if (isCache === "true" && cacheKey) {
    const cached = await getCachedData(
      event,
      cacheKey,
      60 * 60 * 24 * 60,
      fetchComment
    );

    return {
      cache: true,
      ...cached,
    };
  }

  const response = await fetchComment();

  if (cacheKey) {
    await setCacheData(cacheKey, response);
  }

  return response;
});


