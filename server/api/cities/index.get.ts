import { getDB } from "~~/server/db";
import { getQuery } from "h3";
import { buildCacheKey } from "~~/server/utils/common";
import { getCachedData, setCacheData } from "~~/server/utils/cache";
import { CACHE_KEY } from "~~/shared/utils/cache";

/**
 * GET /api/cities
 * - امکان فیلتر بر اساس province_id
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const isCache = getHeader(event, "cache");
  const cacheKey = buildCacheKey(event, CACHE_KEY.city) || null;

  async function fetchCities() {
    const db = await getDB();
    const params: any[] = [];
    let where = "1=1";

    if (query.province_id) {
      const provinceId = Number(query.province_id);
      if (!Number.isNaN(provinceId)) {
        where += " AND c.province_id = ?";
        params.push(provinceId);
      }
    }

    const [rows] = (await db.query(
      `
        SELECT
          c.*,
          p.name AS province_name,
          p.shipping_cost AS province_shipping_cost
        FROM cities c
        JOIN provinces p ON p.id = c.province_id
        WHERE ${where}
        ORDER BY c.name ASC
      `,
      params,
    )) as any[];

    return {
      success: true,
      data: rows || [],
    };
  }

  if (isCache === "true" && cacheKey) {
    const cached = await getCachedData(
      event,
      cacheKey,
      60 * 60 * 24 * 365, // 1 year TTL
      fetchCities,
    );

    return {
      cache: true,
      ...cached,
    };
  }

  const response = await fetchCities();

  if (cacheKey) {
    await setCacheData(cacheKey, response);
  }

  return response;
});


