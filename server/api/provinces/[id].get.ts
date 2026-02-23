import { getDB } from "~~/server/db";
import { createError } from "h3";
import { buildCacheKey } from "~~/server/utils/common";
import { getCachedData, setCacheData } from "~~/server/utils/cache";
import { CACHE_KEY } from "~~/shared/utils/cache";

/**
 * GET /api/provinces/:id
 * دریافت یک استان
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const isCache = getHeader(event, "cache");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه استان ارسال نشده است",
    });
  }

  const cacheKey = buildCacheKey(event, `${CACHE_KEY.province}:${id}`) || null;

  async function fetchProvince() {
    const db = await getDB();
    const [rows] = (await db.query(`SELECT * FROM provinces WHERE id = ?`, [
      id,
    ])) as any[];
    const province = rows?.[0] || null;

    if (!province) {
      throw createError({
        statusCode: 404,
        statusMessage: "استان پیدا نشد",
      });
    }

    return {
      success: true,
      data: province,
    };
  }

  if (isCache === "true" && cacheKey) {
    const cached = await getCachedData(
      event,
      cacheKey,
      60 * 60 * 24 * 365, // 1 year TTL
      fetchProvince,
    );

    return {
      cache: true,
      ...cached,
    };
  }

  const response = await fetchProvince();

  if (cacheKey) {
    await setCacheData(cacheKey, response);
  }

  return response;
});


