import { getDB } from "~~/server/db";
import { buildCacheKey } from "~~/server/utils/common";
import { getCachedData, setCacheData } from "~~/server/utils/cache";
import { CACHE_KEY } from "~~/shared/utils/cache";

/**
 * GET /api/provinces
 * لیست استان‌ها
 */
export default defineEventHandler(async (event) => {
  const isCache = getHeader(event, "cache");
  const cacheKey = buildCacheKey(event, CACHE_KEY.province) || null;

  async function fetchProvinces() {
    const db = await getDB();
    const [rows] = (await db.query(
      `
        SELECT *
        FROM provinces
        ORDER BY name ASC
      `,
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
      fetchProvinces,
    );

    return {
      cache: true,
      ...cached,
    };
  }

  const response = await fetchProvinces();

  if (cacheKey) {
    await setCacheData(cacheKey, response);
  }

  return response;
});


