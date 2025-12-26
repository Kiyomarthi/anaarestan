import { getDB } from "~~/server/db";
import { buildAbsoluteUrl } from "~~/server/utils/common";

export default defineEventHandler(async (event) => {
  const db = await getDB();
  const {
    public: { siteUrl },
  } = useRuntimeConfig();

  const slug = event.context.params.id;

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: `اسلاگ صفحه ارسال نشده است. params: ${JSON.stringify(
        event.context.params
      )}`,
    });
  }

  // Get page information
  const [pageRows] = (await db.query(
    `SELECT
      id, slug, title, seo_title, seo_description, seo_index,
      seo_canonical, seo_og_type, seo_image, is_active,
      created_at, updated_at, type
     FROM pages
     WHERE slug = ? AND is_active = 1`,
    [slug]
  )) as any[];

  if (!pageRows || pageRows.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "صفحه مورد نظر پیدا نشد یا غیرفعال است",
    });
  }

  const page = pageRows[0];

  // Get media_blocks
  const [mediaBlocksRows] = (await db.query(
    `SELECT
      id, type, position, group_index, item_order, title,
      image, link, is_active, created_at
     FROM media_blocks
     WHERE page_id = ? AND is_active = 1
     ORDER BY position ASC, group_index ASC, item_order ASC`,
    [page.id]
  )) as any[];

  // Get faqs
  const [faqsRows] = (await db.query(
    `SELECT
      id, question, answer, sort_order, is_active, created_at, updated_at
     FROM faqs
     WHERE page_id = ? AND is_active = 1
     ORDER BY sort_order ASC`,
    [page.id]
  )) as any[];

  // Get contents
  const [contentsRows] = (await db.query(
    `SELECT
      id, type, title, body, is_active, created_at, updated_at
     FROM contents
     WHERE page_id = ? AND is_active = 1
     ORDER BY created_at ASC`,
    [page.id]
  )) as any[];

  // Get links
  const [linksRows] = (await db.query(
    `SELECT
      id, title, target, is_active, created_at, updated_at
     FROM links
     WHERE page_id = ? AND is_active = 1
     ORDER BY created_at ASC`,
    [page.id]
  )) as any[];

  // Build absolute URLs for images
  const mediaBlocksWithAbsoluteUrls = (mediaBlocksRows || []).map(
    (block: any) => ({
      ...block,
      image: buildAbsoluteUrl(block.image, siteUrl),
    })
  );

  // Format response
  const response = {
    success: true,
    data: {
      page: {
        ...page,
        seo_image: page.seo_image
          ? buildAbsoluteUrl(page.seo_image, siteUrl)
          : null,
      },
      media_blocks: mediaBlocksWithAbsoluteUrls,
      faqs: faqsRows || [],
      contents: contentsRows || [],
      links: linksRows || [],
    },
  };

  return response;
});

/*
 * API Documentation for Get Page by Slug (GET /api/page/[slug])
 *
 * Description:
 * این endpoint اطلاعات کامل یک صفحه را بر اساس slug برمی‌گرداند. این API برای کاربران عادی
 * در دسترس است و نیاز به دسترسی ادمین ندارد. فقط صفحات فعال نمایش داده می‌شوند.
 *
 * URL Parameter:
 * - slug: اسلاگ صفحه (required)
 *
 * Response Format:
 * {
 *   "success": true,
 *   "data": {
 *     "page": {
 *       "id": 1,
 *       "slug": "about-us",
 *       "title": "درباره ما",
 *       "seo_title": "درباره ما - سایت",
 *       "seo_description": "توضیحات SEO",
 *       "seo_index": 1,
 *       "seo_canonical": "https://example.com/about-us",
 *       "seo_og_type": "website",
 *       "seo_image": "https://example.com/images/seo.jpg",
 *       "is_active": 1,
 *       "created_at": "2024-01-01T00:00:00.000Z",
 *       "updated_at": "2024-01-01T00:00:00.000Z",
 *       "type": "static"
 *     },
 *     "media_blocks": [
 *       {
 *         "id": 1,
 *         "type": "banner",
 *         "position": 1,
 *         "group_index": 1,
 *         "item_order": 1,
 *         "title": "عنوان بنر",
 *         "image": "https://example.com/images/banner.jpg",
 *         "link": "https://example.com",
 *         "is_active": 1,
 *         "created_at": "2024-01-01T00:00:00.000Z"
 *       }
 *     ],
 *     "faqs": [
 *       {
 *         "id": 1,
 *         "question": "سوال متداول",
 *         "answer": "پاسخ سوال",
 *         "sort_order": 1,
 *         "is_active": 1,
 *         "created_at": "2024-01-01T00:00:00.000Z",
 *         "updated_at": "2024-01-01T00:00:00.000Z"
 *       }
 *     ],
 *     "contents": [
 *       {
 *         "id": 1,
 *         "type": "text",
 *         "title": "عنوان محتوا",
 *         "body": "متن محتوا",
 *         "is_active": 1,
 *         "created_at": "2024-01-01T00:00:00.000Z",
 *         "updated_at": "2024-01-01T00:00:00.000Z"
 *       }
 *     ],
 *     "links": [
 *       {
 *         "id": 1,
 *         "title": "لینک مفید",
 *         "target": "https://example.com",
 *         "is_active": 1,
 *         "created_at": "2024-01-01T00:00:00.000Z",
 *         "updated_at": "2024-01-01T00:00:00.000Z"
 *       }
 *     ]
 *   }
 * }
 *
 * Error Cases:
 * - 400: Bad Request - slug ارسال نشده
 * - 404: Not Found - صفحه با این slug وجود ندارد یا غیرفعال است
 * - 500: Internal Server Error - خطای سرور
 *
 * Examples for Postman:
 *
 * 1. دریافت صفحه موجود:
 *    GET /api/page/about-us
 *    Response: اطلاعات کامل صفحه با تمام داده‌های مرتبط
 *
 * 2. دریافت صفحه با خطا (وجود ندارد):
 *    GET /api/page/non-existent-page
 *    Response: 404 - صفحه مورد نظر پیدا نشد یا غیرفعال است
 *
 * 3. دریافت صفحه غیرفعال:
 *    GET /api/page/inactive-page
 *    Response: 404 - صفحه مورد نظر پیدا نشد یا غیرفعال است
 *
 * Notes:
 * - تصاویر با URL کامل برمی‌گردند
 * - داده‌ها بر اساس ترتیب مناسب مرتب شده‌اند
 * - فقط صفحات فعال نمایش داده می‌شوند
 * - این API نیاز به authentication ندارد
 */
