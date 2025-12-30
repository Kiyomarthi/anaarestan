import { getDB } from "~~/server/db";
import { buildAbsoluteUrl, buildCacheKey } from "~~/server/utils/common";

export default defineEventHandler(async (event) => {
  const {
    public: { siteUrl },
  } = useRuntimeConfig();

  const id = getRouterParam(event, "id");
  const isCache = getHeader(event, "cache");

  if (!id) {
    return {
      success: false,
      message: "شناسه دسته‌بندی ارسال نشده است",
    };
  }

  const db = await getDB();
  const redis = useStorage("redis");

  const cacheKey = buildCacheKey(event, `${CACHE_KEY.category}:${id}`) || null;

  const addSiteUrl = (category: any): any => ({
    ...category,
    image: buildAbsoluteUrl(category.image, siteUrl),
    children: Array.isArray(category.children)
      ? category.children.map((child: any) => addSiteUrl(child))
      : [],
  });

  // Check cache first
  if (isCache === "true" && cacheKey) {
    const cached = await redis.getItem(cacheKey);
    return {
      ...cached,
      cache: true,
    };
  }

  // Get all categories to build the tree structure (similar to index.get.ts)
  const [rows] = (await db.query(
    "SELECT * FROM categories ORDER BY id ASC"
  )) as any[];

  const map = new Map<number, any>();

  rows?.forEach((row: any) => {
    map.set(row.id, { ...row, children: [] });
  });

  // Build tree structure (exactly like index.get.ts)
  map.forEach((cat) => {
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id).children.push(cat);
    }
  });

  // Find the category with the requested ID
  const category = map.get(Number(id));

  if (!category) {
    return {
      success: false,
      message: "دسته‌بندی مورد نظر پیدا نشد",
    };
  }

  const response = {
    success: true,
    data: addSiteUrl(category),
  };

  // Cache the result
  if (cacheKey)
    await redis.setItem(cacheKey, response, { ttl: 60 * 60 * 24 * 60 });

  return response;
});
