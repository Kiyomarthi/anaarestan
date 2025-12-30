import { getDB } from "~~/server/db";
import { buildAbsoluteUrl, buildCacheKey } from "~~/server/utils/common";

export default defineEventHandler(async (event) => {
  const runtime = useRuntimeConfig();
  const siteNameEn = runtime.public?.siteNameEn || "anarestan";
  const redis = useStorage("redis");
  const isCache = getHeader(event, "cache");
  const cacheKey = buildCacheKey(event, `${siteNameEn}:page`) || null;

  if (isCache === "true" && cacheKey) {
    const cached = await redis.getItem(cacheKey);

    if (cached) {
      return {
        ...cached,
        cache: true,
      };
    }
  }

  const {
    public: { siteUrl },
  } = useRuntimeConfig();

  const query = getQuery(event);

  // Pagination parameters
  const noPaginate = query.noPaginate === "true" || query.noPaginate === true;
  const page = parseInt(query.page as string) || 1;
  const limit =
    parseInt(query.limit as string) || parseInt(query.per as string) || 20;
  const offset = noPaginate ? 0 : (page - 1) * limit;
  const search = query.search ? String(query.search).trim() : null;
  const db = await getDB();

  // Filtering parameters
  const type = query.type as string;

  // Build WHERE clause
  let whereClause = "1=1";
  const params: unknown[] = [];

  // Type filter
  if (type) {
    whereClause += " AND type = ?";
    params.push(type);
  }

  // Search filter
  if (search) {
    whereClause += " AND (title LIKE ? OR slug LIKE ?)";
    params.push(`%${search}%`);
    params.push(`%${search}%`);
  }

  // Build ORDER BY clause
  const orderBy = "ORDER BY created_at DESC";

  // Select fields
  const selectFields = [
    "id",
    "slug",
    "title",
    "seo_title",
    "seo_description",
    "seo_index",
    "seo_canonical",
    "seo_og_type",
    "seo_image",
    "is_active",
    "created_at",
    "updated_at",
    "type",
  ].join(", ");

  // Build query
  let selectSql = `SELECT ${selectFields} FROM pages WHERE ${whereClause} ${orderBy}`;

  // Add pagination if needed
  if (!noPaginate) {
    selectSql += ` LIMIT ${limit} OFFSET ${offset}`;
  }

  // Execute query
  const [rows] = (await db.query(selectSql, params)) as any[];

  // Get total count for pagination
  let total = 0;
  let totalPages = 0;

  if (!noPaginate) {
    const [countRows] = (await db.query(
      `SELECT COUNT(*) as total FROM pages WHERE ${whereClause}`,
      params
    )) as any[];

    total = (countRows as { total: number }[])[0]?.total || 0;
    totalPages = Math.ceil(total / limit);
  } else {
    total = rows?.length || 0;
  }

  const dataWithAbsoluteImage = (rows || []).map((row: any) => ({
    ...row,
    seo_image: row.seo_image ? buildAbsoluteUrl(row.seo_image, siteUrl) : null,
  }));

  // Format response
  const response: any = {
    success: true,
    data: dataWithAbsoluteImage,
  };

  if (!noPaginate) {
    response.meta = {
      page,
      limit,
      total,
      totalPages,
    };
  } else {
    response.meta = {
      total,
    };
  }

  if (cacheKey) {
    await redis.setItem(cacheKey, response);
  }

  return response;
});

/*
 * API Documentation for Pages List (GET /api/page)
 *
 * Description:
 * این endpoint لیست صفحات را برمی‌گرداند. فقط از جدول pages داده می‌خواند.
 *
 * Query Parameters:
 *
 * Pagination:
 * - noPaginate (boolean/string): اگر true باشد، تمام نتایج را بدون صفحه‌بندی برمی‌گرداند
 * - page (number): شماره صفحه (پیش‌فرض: 1)
 * - limit (number): تعداد نتایج در هر صفحه (پیش‌فرض: 20)
 * - per (number): معادل limit (پیش‌فرض: 20)
 *
 * Filters:
 * - type (string): فیلتر بر اساس نوع صفحه
 * - search (string): جستجو در عنوان (title) و slug
 *
 * Response Format:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "slug": "page-slug",
 *       "title": "عنوان صفحه",
 *       "seo_title": "عنوان SEO",
 *       "seo_description": "توضیحات SEO",
 *       "seo_index": 1,
 *       "seo_canonical": "canonical-url",
 *       "seo_og_type": "website",
 *       "seo_image": "image-url.jpg",
 *       "is_active": 1,
 *       "created_at": "2024-01-01T00:00:00.000Z",
 *       "updated_at": "2024-01-01T00:00:00.000Z",
 *       "type": "page-type"
 *     }
 *   ],
 *   "meta": {
 *     "page": 1,
 *     "limit": 20,
 *     "total": 100,
 *     "totalPages": 5
 *   }
 * }
 *
 * Examples for Postman:
 *
 * 1. دریافت لیست ساده (صفحه‌بندی شده):
 *    GET /api/page
 *
 * 2. دریافت تمام صفحات بدون صفحه‌بندی:
 *    GET /api/page?noPaginate=true
 *
 * 3. فیلتر بر اساس نوع:
 *    GET /api/page?type=blog&page=1&limit=10
 *
 * 4. جستجو در عنوان و slug:
 *    GET /api/page?search=keyword
 *
 * 5. ترکیب فیلترها:
 *    GET /api/page?type=page&search=test&page=1&limit=15
 */
