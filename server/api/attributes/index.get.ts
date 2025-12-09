import { getDB } from "~~/server/db";

export default defineEventHandler(async (event) => {
  const db = await getDB();
  const redis = useStorage("redis");

  const cacheKeyHeader = getHeader(event, "cache-key");
  const cacheKey = cacheKeyHeader ? CACHE_KEY.attribute(cacheKeyHeader) : null;

  if (cacheKey) {
    const cached = await redis.getItem(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        cache: true,
      };
    }
  }

  // Get all attributes
  const [attributesRows] = (await db.query(
    "SELECT * FROM attributes ORDER BY id ASC"
  )) as any[];

  // Get all attribute values
  const [valuesRows] = (await db.query(
    "SELECT id, attribute_id, value FROM attribute_values ORDER BY attribute_id ASC, id ASC"
  )) as any[];

  // Group values by attribute_id
  const valuesMap = new Map<number, any[]>();
  valuesRows?.forEach((row: any) => {
    if (!valuesMap.has(row.attribute_id)) {
      valuesMap.set(row.attribute_id, []);
    }
    valuesMap.get(row.attribute_id)!.push(row);
  });

  // Combine attributes with their values
  const attributes =
    attributesRows?.map((attr: any) => ({
      ...attr,
      values: valuesMap.get(attr.id) || [],
    })) || [];

  if (cacheKey) {
    await redis.setItem(cacheKey, attributes);
  }

  return {
    success: true,
    data: attributes,
  };
});
