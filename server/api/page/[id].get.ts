import { getDB } from "~~/server/db";
import { buildCacheKey } from "~~/server/utils/common";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "id");
  const runtime = useRuntimeConfig();
  const siteNameEn = runtime.public?.siteNameEn || "anarestan";
  const redis = useStorage("redis");
  const isCache = getHeader(event, "cache");
  const cacheKey = buildCacheKey(event, `${siteNameEn}:page:${slug}`) || null;

  if (isCache === "true" && cacheKey) {
    const cached = await redis.getItem(cacheKey);

    if (cached) {
      return {
        ...cached,
        cache: true,
      };
    }
  }

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Page slug is required",
    });
  }

  const db = await getDB();

  // Get page
  const [pageRows] = await db.execute(
    `SELECT * FROM pages WHERE slug = ? AND is_active = 1`,
    [slug]
  );

  if (!pageRows || (pageRows as any[]).length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Page not found",
    });
  }

  const page = (pageRows as any[])[0];
  const id = page.id;

  // Get media_blocks
  const [mediaRows] = await db.execute(
    `SELECT * FROM media_blocks WHERE page_id = ? AND is_active = 1 ORDER BY group_index, item_order`,
    [id]
  );

  // Get faqs
  const [faqRows] = await db.execute(
    `SELECT * FROM faqs WHERE page_id = ? AND is_active = 1 ORDER BY sort_order`,
    [id]
  );

  // Get contents
  const [contentRows] = await db.execute(
    `SELECT * FROM contents WHERE page_id = ? AND is_active = 1 ORDER BY id`,
    [id]
  );

  // Get links
  const [linkRows] = await db.execute(
    `SELECT * FROM links WHERE page_id = ? AND is_active = 1 ORDER BY id`,
    [id]
  );

  // Get breadcrumbs
  const [breadcrumbRows] = await db.execute(
    `SELECT * FROM breadcrumbs WHERE page_id = ? AND is_active = 1 ORDER BY position`,
    [id]
  );

  const response = {
    success: true,
    data: {
      page,
      media_blocks: mediaRows,
      faqs: faqRows,
      contents: contentRows,
      links: linkRows,
      breadcrumbs: breadcrumbRows,
    },
  };

  if (cacheKey) {
    await redis.setItem(cacheKey, response, { ttl: 60 * 60 * 24 * 30 });
  }

  return response;
});
