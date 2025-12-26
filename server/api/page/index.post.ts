import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";

export default defineEventHandler(async (event) => {
  const db = await getDB();
  const user = requireRole(event, "admin");

  const body = await readBody(event);
  const {
    slug,
    title,
    seo_title,
    seo_description,
    seo_index,
    seo_canonical,
    seo_og_type,
    seo_image,
    is_active = 1,
    type,
    media_blocks,
    faqs,
    contents,
    links,
    breadcrumbs,
  } = body;

  // Validation
  validateBody(body, {
    slug: (v) => validate(v).required().slug().run(),
    title: (v) => validate(v).required().min(2).max(255).run(),
    seo_title: (v) => validate(v).max(255).run(),
    seo_description: (v) => validate(v).max(255).run(),
    seo_index: (v) => validate(v).checkMatch([0, 1]).run(),
    seo_canonical: (v) => validate(v).run(),
    seo_og_type: (v) => validate(v).run(),
    seo_image: (v) => validate(v).run(),
    is_active: (v) => validate(v).checkMatch([0, 1]).run(),
    type: (v) => validate(v).required().run(),
  });

  // Validate media_blocks if provided
  if (media_blocks) {
    if (!Array.isArray(media_blocks)) {
      throw createError({
        statusCode: 400,
        statusMessage: "media_blocks باید آرایه باشد",
      });
    }
    for (const block of media_blocks) {
      if (!block.type || !["banner", "slider"].includes(block.type)) {
        throw createError({
          statusCode: 400,
          statusMessage: "type در media_blocks باید 'banner' یا 'slider' باشد",
        });
      }
      if (block.position === undefined || block.position < 1) {
        throw createError({
          statusCode: 400,
          statusMessage:
            "position در media_blocks الزامی و باید بزرگتر از 0 باشد",
        });
      }
      if (block.group_index === undefined || block.group_index < 1) {
        throw createError({
          statusCode: 400,
          statusMessage:
            "group_index در media_blocks الزامی و باید بزرگتر از 0 باشد",
        });
      }
      if (block.item_order === undefined || block.item_order < 1) {
        throw createError({
          statusCode: 400,
          statusMessage:
            "item_order در media_blocks الزامی و باید بزرگتر از 0 باشد",
        });
      }
      if (!block.title) {
        throw createError({
          statusCode: 400,
          statusMessage: "title در media_blocks الزامی است",
        });
      }
      if (!block.image) {
        throw createError({
          statusCode: 400,
          statusMessage: "image در media_blocks الزامی است",
        });
      }
      if (block.is_active !== undefined && ![0, 1].includes(block.is_active)) {
        throw createError({
          statusCode: 400,
          statusMessage: "is_active در media_blocks باید 0 یا 1 باشد",
        });
      }
    }
  }

  // Validate faqs if provided
  if (faqs) {
    if (!Array.isArray(faqs)) {
      throw createError({
        statusCode: 400,
        statusMessage: "faqs باید آرایه باشد",
      });
    }
    for (const faq of faqs) {
      if (!faq.question) {
        throw createError({
          statusCode: 400,
          statusMessage: "question در faqs الزامی است",
        });
      }
      if (!faq.answer) {
        throw createError({
          statusCode: 400,
          statusMessage: "answer در faqs الزامی است",
        });
      }
      if (faq.sort_order === undefined || faq.sort_order < 1) {
        throw createError({
          statusCode: 400,
          statusMessage: "sort_order در faqs الزامی و باید بزرگتر از 0 باشد",
        });
      }
      if (faq.is_active !== undefined && ![0, 1].includes(faq.is_active)) {
        throw createError({
          statusCode: 400,
          statusMessage: "is_active در faqs باید 0 یا 1 باشد",
        });
      }
    }
  }

  // Validate contents if provided
  if (contents) {
    if (!Array.isArray(contents)) {
      throw createError({
        statusCode: 400,
        statusMessage: "contents باید آرایه باشد",
      });
    }
    for (const content of contents) {
      if (
        !content.type ||
        !["text", "html", "title", "subtitle", "quote"].includes(content.type)
      ) {
        throw createError({
          statusCode: 400,
          statusMessage:
            "type در contents باید یکی از 'text', 'html', 'title', 'subtitle', 'quote' باشد",
        });
      }
      if (!content.body) {
        throw createError({
          statusCode: 400,
          statusMessage: "body در contents الزامی است",
        });
      }
      if (
        content.is_active !== undefined &&
        ![0, 1].includes(content.is_active)
      ) {
        throw createError({
          statusCode: 400,
          statusMessage: "is_active در contents باید 0 یا 1 باشد",
        });
      }
    }
  }

  // Validate links if provided
  if (links) {
    if (!Array.isArray(links)) {
      throw createError({
        statusCode: 400,
        statusMessage: "links باید آرایه باشد",
      });
    }
    for (const link of links) {
      if (!link.title) {
        throw createError({
          statusCode: 400,
          statusMessage: "title در links الزامی است",
        });
      }
      if (!link.target) {
        throw createError({
          statusCode: 400,
          statusMessage: "target در links الزامی است",
        });
      }
      if (link.is_active !== undefined && ![0, 1].includes(link.is_active)) {
        throw createError({
          statusCode: 400,
          statusMessage: "is_active در links باید 0 یا 1 باشد",
        });
      }
    }
  }

  // Validate breadcrumbs if provided
  if (breadcrumbs) {
    if (!Array.isArray(breadcrumbs)) {
      throw createError({
        statusCode: 400,
        statusMessage: "breadcrumbs باید آرایه باشد",
      });
    }
    for (const breadcrumb of breadcrumbs) {
      if (!breadcrumb.title) {
        throw createError({
          statusCode: 400,
          statusMessage: "title در breadcrumbs الزامی است",
        });
      }
      if (!breadcrumb.target) {
        throw createError({
          statusCode: 400,
          statusMessage: "target در breadcrumbs الزامی است",
        });
      }
      if (breadcrumb.position === undefined || breadcrumb.position < 1) {
        throw createError({
          statusCode: 400,
          statusMessage: "position در breadcrumbs الزامی و باید بزرگتر از 0 باشد",
        });
      }
      if (breadcrumb.is_active !== undefined && ![0, 1].includes(breadcrumb.is_active)) {
        throw createError({
          statusCode: 400,
          statusMessage: "is_active در breadcrumbs باید 0 یا 1 باشد",
        });
      }
    }
  }

  // Start transaction
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Check if slug already exists
    const [existingRows] = (await connection.query(
      `SELECT id FROM pages WHERE slug = ?`,
      [slug]
    )) as any[];

    if (existingRows && existingRows.length > 0) {
      await connection.rollback();
      connection.release();
      throw createError({
        statusCode: 400,
        statusMessage: "اسلاگ تکراری است",
      });
    }

    // Insert page
    const [pageResult] = (await connection.query(
      `INSERT INTO pages (
        slug, title, seo_title, seo_description, seo_index, seo_canonical,
        seo_og_type, seo_image, is_active, created_at, updated_at, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
      [
        slug,
        title,
        seo_title || null,
        seo_description || null,
        seo_index !== undefined ? seo_index : 1,
        seo_canonical || null,
        seo_og_type || null,
        seo_image || null,
        is_active,
        type,
      ]
    )) as any;

    const pageId = pageResult.insertId;

    // Insert media_blocks if provided
    if (media_blocks && media_blocks.length > 0) {
      for (const block of media_blocks) {
        await connection.query(
          `INSERT INTO media_blocks (
            page_id, type, position, group_index, item_order, title, image, link, is_active, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            pageId,
            block.type,
            block.position,
            block.group_index,
            block.item_order,
            block.title,
            block.image,
            block.link || null,
            block.is_active !== undefined ? block.is_active : 1,
          ]
        );
      }
    }

    // Insert faqs if provided
    if (faqs && faqs.length > 0) {
      for (const faq of faqs) {
        await connection.query(
          `INSERT INTO faqs (
            page_id, question, answer, sort_order, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            pageId,
            faq.question,
            faq.answer,
            faq.sort_order,
            faq.is_active !== undefined ? faq.is_active : 1,
          ]
        );
      }
    }

    // Insert contents if provided
    if (contents && contents.length > 0) {
      for (const content of contents) {
        await connection.query(
          `INSERT INTO contents (
            page_id, type, title, body, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            pageId,
            content.type,
            content.title || null,
            content.body,
            content.is_active !== undefined ? content.is_active : 1,
          ]
        );
      }
    }

    // Insert links if provided
    if (links && links.length > 0) {
      for (const link of links) {
        await connection.query(
          `INSERT INTO links (
            page_id, title, target, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [
            pageId,
            link.title,
            link.target,
            link.is_active !== undefined ? link.is_active : 1,
          ]
        );
      }
    }

    // Insert breadcrumbs if provided
    if (breadcrumbs && breadcrumbs.length > 0) {
      for (const breadcrumb of breadcrumbs) {
        await connection.query(
          `INSERT INTO breadcrumbs (
            page_id, title, target, position, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            pageId,
            breadcrumb.title,
            breadcrumb.target,
            breadcrumb.position,
            breadcrumb.is_active !== undefined ? breadcrumb.is_active : 1,
          ]
        );
      }
    }

    await connection.commit();
    connection.release();

    return {
      success: true,
      message: "صفحه با موفقیت ایجاد شد",
      data: {
        id: pageId,
        slug,
        title,
      },
    };
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
});

/*
 * API Documentation for Create Page (POST /api/page)
 *
 * Description:
 * این endpoint یک صفحه جدید با تمام داده‌های مرتبط ایجاد می‌کند. عملیات در یک transaction انجام می‌شود
 * تا در صورت خطا، هیچ داده‌ای ذخیره نشود. این API برای ایجاد صفحات کامل در پنل ادمین استفاده می‌شود.
 *
 * Authentication: نیاز به دسترسی admin دارد
 *
 * Request Body (همه فیلدها اختیاری هستند به جز موارد مشخص شده):
 * {
 *   "slug": "about-us",           // required - باید unique و slug معتبر باشد
 *   "title": "درباره ما",         // required - حداقل 2، حداکثر 255 کاراکتر
 *   "seo_title": "درباره ما - سایت",
 *   "seo_description": "توضیحات SEO",
 *   "seo_index": 1,               // 0 یا 1
 *   "seo_canonical": "https://example.com/about-us",
 *   "seo_og_type": "website",
 *   "seo_image": "image.jpg",
 *   "is_active": 1,               // 0 یا 1، پیش‌فرض 1
 *   "type": "static",             // required - نوع صفحه
 *   "media_blocks": [             // optional - آرایه بنرها و اسلایدرها
 *     {
 *       "type": "banner",         // required - 'banner' یا 'slider'
 *       "position": 1,            // required - عدد مثبت
 *       "group_index": 1,         // required - عدد مثبت
 *       "item_order": 1,          // required - عدد مثبت
 *       "title": "عنوان بنر",     // required - alt تصویر
 *       "image": "banner.jpg",    // required
 *       "link": "https://example.com", // optional
 *       "is_active": 1            // optional - پیش‌فرض 1
 *     }
 *   ],
 *   "faqs": [                     // optional - آرایه سوالات متداول
 *     {
 *       "question": "سوال متداول", // required
 *       "answer": "پاسخ سوال",     // required
 *       "sort_order": 1,           // required - عدد مثبت
 *       "is_active": 1             // optional - پیش‌فرض 1
 *     }
 *   ],
 *   "contents": [                 // optional - آرایه محتواها
 *     {
 *       "type": "text",           // required - 'text','html','title','subtitle','quote'
 *       "title": "عنوان محتوا",   // optional
 *       "body": "متن محتوا",      // required
 *       "is_active": 1            // optional - پیش‌فرض 1
 *     }
 *   ],
 *   "links": [                    // optional - آرایه لینک‌ها
 *     {
 *       "title": "لینک مفید",     // required
 *       "target": "https://example.com", // required
 *       "is_active": 1            // optional - پیش‌فرض 1
 *     }
 *   ],
 *   "breadcrumbs": [              // optional - آرایه breadcrumbها
 *     {
 *       "title": "خانه",          // required
 *       "target": "/",            // required
 *       "position": 1,            // required - عدد مثبت
 *       "is_active": 1            // optional - پیش‌فرض 1
 *     }
 *   ]
 * }
 *
 * Response Success:
 * {
 *   "success": true,
 *   "message": "صفحه با موفقیت ایجاد شد",
 *   "data": {
 *     "id": 1,
 *     "slug": "about-us",
 *     "title": "درباره ما"
 *   }
 * }
 *
 * Error Cases:
 * - 400: Validation Error - داده‌های ورودی نامعتبر
 *   - slug تکراری
 *   - فیلدهای required خالی
 *   - مقادیر enum نامعتبر (مثل type در media_blocks)
 *   - مقادیر عددی نامعتبر
 * - 401: Unauthorized - کاربر لاگین نکرده یا دسترسی admin ندارد
 * - 500: Internal Server Error - خطای دیتابیس یا سرور
 *
 * Examples for Postman:
 *
 * 1. ایجاد صفحه ساده (فقط اطلاعات اصلی):
 *    POST /api/page
 *    Body: {
 *      "slug": "contact-us",
 *      "title": "تماس با ما",
 *      "type": "static",
 *      "is_active": 1
 *    }
 *    Response: صفحه ایجاد شده با id جدید
 *
 * 2. ایجاد صفحه کامل با تمام داده‌ها:
 *    POST /api/page
 *    Body: همان نمونه بالا
 *    Response: صفحه با تمام media_blocks، faqs، contents و links ایجاد شده
 *
 * 3. ایجاد صفحه با خطا (slug تکراری):
 *    POST /api/page
 *    Body: {"slug": "existing-slug", "title": "عنوان", "type": "static"}
 *    Response: 400 - Validation Error: اسلاگ تکراری است
 *
 * 4. ایجاد صفحه با media_blocks نامعتبر:
 *    POST /api/page
 *    Body: {
 *      "slug": "test",
 *      "title": "تست",
 *      "type": "static",
 *      "media_blocks": [{"type": "invalid", "position": 1, "group_index": 1, "item_order": 1, "title": "test", "image": "test.jpg"}]
 *    }
 *    Response: 400 - Validation Error: type در media_blocks باید 'banner' یا 'slider' باشد
 */
