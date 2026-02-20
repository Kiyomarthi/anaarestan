import { getDB } from "~~/server/db";
import { getOptionalAuth } from "~~/server/utils/auth";
import { buildCacheKey } from "~~/server/utils/common";
import { getCachedData, setCacheData } from "~~/server/utils/cache";
import { CACHE_KEY } from "~~/shared/utils/cache";

/**
 * GET /api/comments
 * Query:
 * - product_id | product_code | product_slug (optional)
 * - user_id (admin only, optional)
 * - status: approved|pending|rejected|all (admin only, default: approved)
 * - page, limit/per/perPage, noPaginate
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const auth = getOptionalAuth(event) as any | null;
  const isAdmin = auth?.role === "admin";
  const isCache = getHeader(event, "cache");
  const cacheScope = isAdmin ? "admin" : "public";
  const cacheKey =
    buildCacheKey(event, `${CACHE_KEY.comment}:${cacheScope}`) || null;

  const noPaginate = query.noPaginate === "true" || query.noPaginate === true;
  const page = parseInt(query.page as string) || 1;
  const limit =
    parseInt(query.limit as string) ||
    parseInt(query.per as string) ||
    parseInt(query.perPage as string) ||
    20;
  const offset = noPaginate ? 0 : (page - 1) * limit;

  const productIdRaw = query.product_id ? Number(query.product_id) : null;
  const productCode = query.product_code ? String(query.product_code) : null;
  const productSlug = query.product_slug ? String(query.product_slug) : null;
  const userIdFilter =
    isAdmin && query.user_id ? Number(query.user_id) : null;

  async function fetchComments() {
    const db = await getDB();

    // Resolve product_id if code/slug provided
    let productId: number | null = null;
    if (productIdRaw && !Number.isNaN(productIdRaw)) productId = productIdRaw;
    if (!productId && (productCode || productSlug)) {
      const [pRows] = (await db.query(
        `SELECT id FROM products WHERE ${productCode ? "code" : "slug"} = ? LIMIT 1`,
        [productCode ?? productSlug]
      )) as any[];
      productId = pRows?.[0]?.id ?? null;
    }

    let whereClause = "1=1";
    const params: unknown[] = [];

    if (productId) {
      whereClause += " AND c.product_id = ?";
      params.push(productId);
    }

    if (userIdFilter && !Number.isNaN(userIdFilter)) {
      whereClause += " AND c.user_id = ?";
      params.push(userIdFilter);
    }

    // Status filter
    const statusQuery = String(query.status || "").toLowerCase();
    if (!isAdmin) {
      // non-admin: only approved
      whereClause += " AND c.status = 1";
    } else {
      // admin default: approved, unless explicitly asked
      if (!statusQuery || statusQuery === "approved") {
        whereClause += " AND c.status = 1";
      } else if (statusQuery === "pending") {
        whereClause += " AND c.status = 0";
      } else if (statusQuery === "rejected") {
        whereClause += " AND c.status = 2";
      } else if (statusQuery === "all") {
        // no filter
      } else {
        // unknown -> default approved
        whereClause += " AND c.status = 1";
      }
    }

    const selectSqlBase = `
    SELECT
      c.*,
      u.full_name AS user_full_name,
      u.phone AS user_phone,
      p.title AS product_title,
      p.code AS product_code,
      p.slug AS product_slug
    FROM comments c
    LEFT JOIN users u ON u.id = c.user_id
    LEFT JOIN products p ON p.id = c.product_id
    WHERE ${whereClause}
    ORDER BY c.created_at DESC
  `;

    let selectSql = selectSqlBase;
    if (!noPaginate) selectSql += ` LIMIT ${limit} OFFSET ${offset}`;

    const [rows] = (await db.query(selectSql, params)) as any[];

    let total = 0;
    let totalPages = 0;
    if (!noPaginate) {
      const [countRows] = (await db.query(
        `SELECT COUNT(*) as total FROM comments c WHERE ${whereClause}`,
        params
      )) as any[];
      total = countRows?.[0]?.total || 0;
      totalPages = Math.ceil(total / limit);
    } else {
      total = rows?.length || 0;
    }

    const response: any = { success: true, data: rows || [] };
    response.meta = noPaginate
      ? { total }
      : { page, limit, total, totalPages };

    return response;
  }

  if (isCache === "true" && cacheKey) {
    const cached = await getCachedData(
      event,
      cacheKey,
      60 * 60 * 24 * 60,
      fetchComments
    );

    return {
      cache: true,
      ...cached,
    };
  }

  const response = await fetchComments();

  if (cacheKey) {
    await setCacheData(cacheKey, response);
  }

  return response;
});


