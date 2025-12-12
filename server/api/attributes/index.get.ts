import { getDB } from "~~/server/db";

export default defineEventHandler(async (event) => {
  const db = await getDB();
  const redis = useStorage("redis");

  const query = getQuery(event);
  const search =
    typeof query.search === "string" && query.search.trim().length > 0
      ? query.search.trim()
      : null;
  const page = parseInt(query.page as string) || 1;
  const limit =
    parseInt(query.limit as string) || parseInt(query.perPage as string) || 10;
  const offset = (page - 1) * limit;

  const cacheKeyHeader = getHeader(event, "cache-key");
  const cacheKey =
    cacheKeyHeader && !search
      ? CACHE_KEY.attribute(
          `${cacheKeyHeader}-p${page}-pp${limit}-s${search || "all"}`
        )
      : null;

  if (cacheKey) {
    const cached = await redis.getItem(cacheKey);
    if (cached) {
      return {
        success: true,
        ...cached,
        cache: true,
      };
    }
  }

  const params: any[] = [];
  let whereClause = "1=1";
  if (search) {
    whereClause += " AND name LIKE ?";
    params.push(`%${search}%`);
  }

  // total count
  const [countRows] = (await db.query(
    `SELECT COUNT(*) as total FROM attributes WHERE ${whereClause}`,
    params
  )) as any[];
  const total = countRows?.[0]?.total || 0;

  // Paged attributes
  const [attributesRows] = (await db.query(
    `SELECT * FROM attributes WHERE ${whereClause} ORDER BY id ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )) as any[];

  const attributeIds = attributesRows.map((a: any) => a.id);
  let valuesRows: any[] = [];
  if (attributeIds.length) {
    const placeholders = attributeIds.map(() => "?").join(",");
    [valuesRows] = (await db.query(
      `SELECT id, attribute_id, value FROM attribute_values WHERE attribute_id IN (${placeholders}) ORDER BY attribute_id ASC, id ASC`,
      attributeIds
    )) as any[];
  }

  const valuesMap = new Map<number, any[]>();
  valuesRows?.forEach((row: any) => {
    if (!valuesMap.has(row.attribute_id)) {
      valuesMap.set(row.attribute_id, []);
    }
    valuesMap.get(row.attribute_id)!.push(row);
  });

  const data =
    attributesRows?.map((attr: any) => ({
      ...attr,
      values: valuesMap.get(attr.id) || [],
    })) || [];

  const response = {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  if (cacheKey) {
    await redis.setItem(cacheKey, response);
  }

  return response;
});
