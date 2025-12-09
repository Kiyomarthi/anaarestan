import { getDB } from "~~/server/db";

export default defineEventHandler(async (event) => {
  const db = await getDB();
  const redis = useStorage("redis");

  const cacheKeyHeader = getHeader(event, "cache-key");
  const cacheKey = cacheKeyHeader ? CACHE_KEY.category(cacheKeyHeader) : null;

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

  const [rows] = (await db.query(
    "SELECT * FROM categories ORDER BY id ASC"
  )) as any[];

  const map = new Map<number, any>();

  rows?.forEach((row: any) => {
    map.set(row.id, { ...row, children: [] });
  });

  const tree: any[] = [];

  map.forEach((cat) => {
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id).children.push(cat);
    } else {
      tree.push(cat);
    }
  });

  if (cacheKey) {
    await redis.setItem(cacheKey, tree);
  }

  return {
    success: true,
    data: tree,
  };
});
