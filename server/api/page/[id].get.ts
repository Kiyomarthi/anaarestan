import { getDB } from "~~/server/db";
import { buildCacheKey, buildAbsoluteUrl } from "~~/server/utils/common";
import { getCachedData, setCacheData } from "~~/server/utils/cache";
import { CACHE_KEY } from "~~/shared/utils/cache";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "id");
  const runtime = useRuntimeConfig();
  const siteNameEn = runtime.public?.siteNameEn || "anarestan";
  const siteUrl = runtime.public?.siteUrl;
  // const redis = useStorage("redis"); // Commented out - using filesystem cache instead
  const isCache = getHeader(event, "cache");
  const cacheKey = buildCacheKey(event, `${siteNameEn}:page:${slug}`) || null;

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Page slug is required",
    });
  }


  // Function to fetch page data from database
  async function fetchPageData() {
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

    const mappedGallery = mediaRows?.map((img: any) => ({
      ...img,
      image: buildAbsoluteUrl(img.image, siteUrl),
    }));

    const pageAbsoluteImageUrl = {
      ...page,
      seo_image: buildAbsoluteUrl(page.seo_image, siteUrl),
    };

    return {
      success: true,
      data: {
        page: pageAbsoluteImageUrl,
        media_blocks: mappedGallery,
        faqs: faqRows,
        contents: contentRows,
        links: linkRows,
        breadcrumbs: breadcrumbRows,
      },
    };
  }

  if (isCache === "true" && cacheKey) {
    // Use filesystem-based cache with stale-while-revalidate pattern
    const cached = await getCachedData(
      event,
      cacheKey,
      60 * 60 * 24 * 90, // 90 days TTL
      fetchPageData
    );

    return {
      ...cached,
      cache: true,
    };
  }

  // Fetch fresh data if cache is disabled
  const response = await fetchPageData();

  if (cacheKey) {
    await setCacheData(cacheKey, response);
  }

  return response;
});
