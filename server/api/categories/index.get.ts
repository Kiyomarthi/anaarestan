import { getDB } from "~~/server/db";
import { buildAbsoluteUrl, buildCacheKey } from "~~/server/utils/common";

export default defineEventHandler(async (event) => {
  const db = await getDB();
  const redis = useStorage("redis");
  const {
    public: { siteUrl },
  } = useRuntimeConfig();

  const query = getQuery(event);
  const search =
    typeof query.search === "string" && query.search.trim().length > 0
      ? query.search.trim()
      : null;

  // Pagination parameters
  const noPaginate = query.noPaginate === "true" || query.noPaginate === true;
  const page = parseInt(query.page as string) || 1;
  const limit =
    parseInt(query.limit as string) || parseInt(query.perPage as string) || 10;
  const offset = noPaginate ? 0 : (page - 1) * limit;

  const isCache = getHeader(event, "cache");
  const cacheKey = buildCacheKey(event, CACHE_KEY.category) || null;

  const addSiteUrl = (category: any): any => ({
    ...category,
    image: buildAbsoluteUrl(category.image, siteUrl),
    children: Array.isArray(category.children)
      ? category.children.map((child: any) => addSiteUrl(child))
      : [],
  });

  // Flatten function for pagination
  const flattenCategories = (items: any[] = [], level = 0): any[] =>
    items.flatMap((cat) => {
      const current = { ...cat, level };
      const children = flattenCategories(cat.children ?? [], level + 1);
      return [current, ...children];
    });

  if (isCache === "true" && cacheKey) {
    const cached = await redis.getItem(cacheKey);
    if (cached) {
      return {
        ...cached,
        cache: true,
      };
    }
  }

  const params: any[] = [];
  let sql = "SELECT * FROM categories";

  if (search) {
    sql += " WHERE name LIKE ? OR slug LIKE ? OR code LIKE ?";
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  sql += " ORDER BY id ASC";

  const [rows] = (await db.query(sql, params)) as any[];

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
  const flattened = flattenCategories(tree).map((cat) => addSiteUrl(cat));
  const total = flattened.length;

  if (noPaginate) {
    // Return tree structure without pagination
    if (cacheKey) {
      await redis.setItem(cacheKey, tree);
    }
    return {
      success: true,
      data: responseData,
      meta: {
        total,
      },
    };
  }

  // Apply pagination on parent categories only (tree structure)
  const paginatedData = responseData.slice(offset, offset + limit);

  const response = {
    success: true,
    data: paginatedData,
    meta: {
      page,
      limit,
      total: responseData.length, // Total parent categories
      totalPages: Math.ceil(responseData.length / limit),
    },
  };

  if (cacheKey) {
    await redis.setItem(cacheKey, response, { ttl: 60 * 60 * 24 * 60 });
  }

  return response;
});
