import { getDB } from "~~/server/db";

export default defineEventHandler(async (event) => {
  const db = await getDB();
  const query = getQuery(event);

  // Pagination parameters
  const noPaginate = query.noPaginate === "true" || query.noPaginate === true;
  const page = parseInt(query.page as string) || 1;
  const limit =
    parseInt(query.limit as string) || parseInt(query.per as string) || 20;
  const offset = noPaginate ? 0 : (page - 1) * limit;

  // Filtering parameters
  const stockStatus = query.stock_status as string; // 'available' or 'unavailable'
  const minPrice = query.min_price
    ? parseFloat(query.min_price as string)
    : null;
  const maxPrice = query.max_price
    ? parseFloat(query.max_price as string)
    : null;
  const sort = query.sort as string; // 'best-selling', 'cheapest', 'newest', 'most-expensive'

  // Build WHERE clause
  let whereClause = "1=1";
  const params: unknown[] = [];

  // Stock status filter
  if (stockStatus === "available") {
    whereClause += " AND stock > 0";
  } else if (stockStatus === "unavailable") {
    whereClause += " AND stock = 0";
  }

  // Price filters
  if (minPrice !== null && !isNaN(minPrice)) {
    whereClause += " AND COALESCE(discount_price, price) >= ?";
    params.push(minPrice);
  }

  if (maxPrice !== null && !isNaN(maxPrice)) {
    whereClause += " AND COALESCE(discount_price, price) <= ?";
    params.push(maxPrice);
  }

  // Build ORDER BY clause
  let orderBy = "ORDER BY created_at DESC"; // Default: newest

  switch (sort) {
    case "cheapest":
      orderBy = "ORDER BY COALESCE(discount_price, price) ASC";
      break;
    case "most-expensive":
      orderBy = "ORDER BY COALESCE(discount_price, price) DESC";
      break;
    case "newest":
      orderBy = "ORDER BY created_at DESC";
      break;
    case "best-selling":
      // Since we don't have sales data, we'll use stock as a proxy or keep default
      // You can modify this later when you have sales tracking
      orderBy = "ORDER BY stock DESC, created_at DESC";
      break;
    default:
      orderBy = "ORDER BY created_at DESC";
  }

  // Select fields (excluding description and category_id)
  const selectFields = [
    "id",
    "title",
    "slug",
    "short_description",
    "price",
    "discount_price",
    "image",
    "code",
    "stock",
    "status",
    "created_at",
    "updated_at",
  ].join(", ");

  // Build query
  let selectSql = `SELECT ${selectFields} FROM products WHERE ${whereClause} ${orderBy}`;

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
      `SELECT COUNT(*) as total FROM products WHERE ${whereClause}`,
      params
    )) as any[];

    total = (countRows as { total: number }[])[0]?.total || 0;
    totalPages = Math.ceil(total / limit);
  } else {
    total = rows?.length || 0;
  }

  // Format response
  const response: any = {
    success: true,
    data: rows || [],
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

  return response;
});

/*
 * API Documentation for Products List (GET /api/products)
 *
 * Description:
 * این endpoint لیست محصولات را برمی‌گرداند. فقط از جدول products داده می‌خواند
 * و فیلدهای description و category_id را شامل نمی‌شود.
 *
 * Query Parameters:
 *
 * Pagination:
 * - noPaginate (boolean/string): اگر true باشد، تمام نتایج را بدون صفحه‌بندی برمی‌گرداند
 * - page (number): شماره صفحه (پیش‌فرض: 1)
 * - limit (number): تعداد نتایج در هر صفحه (پیش‌فرض: 10)
 * - per (number): معادل limit (پیش‌فرض: 10)
 *
 * Filters:
 * - stock_status (string): وضعیت موجودی
 *   - 'available': فقط محصولات موجود (stock > 0)
 *   - 'unavailable': فقط محصولات ناموجود (stock = 0)
 *
 * - min_price (number): حداقل قیمت (بر اساس discount_price یا price)
 * - max_price (number): حداکثر قیمت (بر اساس discount_price یا price)
 *
 * Sorting:
 * - sort (string): نوع مرتب‌سازی
 *   - 'cheapest': ارزان‌ترین (بر اساس discount_price یا price صعودی)
 *   - 'most-expensive': گران‌ترین (بر اساس discount_price یا price نزولی)
 *   - 'newest': جدیدترین (بر اساس created_at نزولی) - پیش‌فرض
 *   - 'best-selling': پرفروش‌ترین (بر اساس stock نزولی، سپس created_at)
 *
 * Response Format:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "title": "نام محصول",
 *       "slug": "product-slug",
 *       "short_description": "توضیحات کوتاه",
 *       "price": "100000.00",
 *       "discount_price": "90000.00",
 *       "image": "image-url.jpg",
 *       "code": "PROD001",
 *       "stock": 50,
 *       "main_variant_id": 1,
 *       "status": 1,
 *       "created_at": "2024-01-01T00:00:00.000Z",
 *       "updated_at": "2024-01-01T00:00:00.000Z"
 *     }
 *   ],
 *   "meta": {
 *     "page": 1,
 *     "limit": 10,
 *     "total": 100,
 *     "totalPages": 10
 *   }
 * }
 *
 * Examples for Postman:
 *
 * 1. دریافت لیست ساده (صفحه‌بندی شده):
 *    GET /api/products
 *
 * 2. دریافت تمام محصولات بدون صفحه‌بندی:
 *    GET /api/products?noPaginate=true
 *
 * 3. دریافت محصولات موجود با صفحه‌بندی:
 *    GET /api/products?stock_status=available&page=1&limit=20
 *
 * 4. فیلتر بر اساس قیمت:
 *    GET /api/products?min_price=50000&max_price=200000
 *
 * 5. مرتب‌سازی ارزان‌ترین:
 *    GET /api/products?sort=cheapest&limit=10
 *
 * 6. ترکیب فیلترها و مرتب‌سازی:
 *    GET /api/products?stock_status=available&min_price=100000&max_price=500000&sort=newest&page=1&limit=15
 *
 * 7. دریافت پرفروش‌ترین محصولات:
 *    GET /api/products?sort=best-selling&limit=10
 *
 * 8. دریافت گران‌ترین محصولات موجود:
 *    GET /api/products?stock_status=available&sort=most-expensive&limit=5
 */
