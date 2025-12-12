import { getDB } from "~~/server/db";
import { buildAbsoluteUrl } from "~~/server/utils/common";

export default defineEventHandler(async (event) => {
  const db = await getDB();
  const redis = useStorage("redis");
  const {
    public: { siteUrl },
  } = useRuntimeConfig();

  const cacheKeyHeader = getHeader(event, "cache-key");
  const cacheKey = cacheKeyHeader ? CACHE_KEY.category(cacheKeyHeader) : null;

  const addSiteUrl = (category: any): any => ({
    ...category,
    image: buildAbsoluteUrl(category.image, siteUrl),
    children: Array.isArray(category.children)
      ? category.children.map((child: any) => addSiteUrl(child))
      : [],
  });

  if (cacheKey) {
    const cached = await redis.getItem(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached.map((cat: any) => addSiteUrl(cat)),
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

  const responseData = tree.map((cat) => addSiteUrl(cat));

  if (cacheKey) {
    await redis.setItem(cacheKey, tree);
  }

  return {
    success: true,
    data: responseData,
  };
});
