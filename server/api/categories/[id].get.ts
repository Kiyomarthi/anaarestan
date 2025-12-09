import { getDB } from "~~/server/db";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    return {
      success: false,
      message: "شناسه دسته‌بندی ارسال نشده است",
    };
  }

  const db = await getDB();
  const redis = useStorage("redis");

  const cacheKey = CACHE_KEY.category(`id:${id}`);

  // Check cache first
  const cached = await redis.getItem(cacheKey);
  if (cached) {
    return {
      success: true,
      data: cached,
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

  // Cache the result
  await redis.setItem(cacheKey, category);

  return {
    success: true,
    data: category,
  };
});
