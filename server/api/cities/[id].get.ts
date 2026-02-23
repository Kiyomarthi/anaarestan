import { getDB } from "~~/server/db";
import { createError } from "h3";
import { buildCacheKey } from "~~/server/utils/common";
import { getCachedData, setCacheData } from "~~/server/utils/cache";
import { CACHE_KEY } from "~~/shared/utils/cache";

/**
 * GET /api/cities/:id
 * دریافت یک شهر
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const isCache = getHeader(event, "cache");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه شهر ارسال نشده است",
    });
  }

  const cacheKey = buildCacheKey(event, `${CACHE_KEY.city}:${id}`) || null;

  async function fetchCity() {
    const db = await getDB();

    const [rows] = (await db.query(
      `
        SELECT
          c.*,
          p.name AS province_name,
          p.shipping_cost AS province_shipping_cost
        FROM cities c
        JOIN provinces p ON p.id = c.province_id
        WHERE c.id = ?
      `,
      [id],
    )) as any[];

    const city = rows?.[0] || null;

    if (!city) {
      throw createError({
        statusCode: 404,
        statusMessage: "شهر پیدا نشد",
      });
    }

    return {
      success: true,
      data: city,
    };
  }

  if (isCache === "true" && cacheKey) {
    const cached = await getCachedData(
      event,
      cacheKey,
      60 * 60 * 24 * 365, // 1 year TTL
      fetchCity,
    );

    return {
      cache: true,
      ...cached,
    };
  }

  const response = await fetchCity();

  if (cacheKey) {
    await setCacheData(cacheKey, response);
  }

  return response;
});


