import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";

export default defineEventHandler(async (event) => {
  const db = await getDB();
  const user = requireRole(event, "admin");

  const id = getRouterParam(event, "id");

  if (!id || isNaN(parseInt(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه صفحه نامعتبر است",
    });
  }

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
    is_active,
    type,
    media_blocks,
    faqs,
    contents,
    links,
    breadcrumbs,
  } = body;

  // Validation - only validate provided fields
  const validationSchema: Record<string, (v: any) => true | string> = {};

  if (slug !== undefined) validationSchema.slug = (v) => validate(v).required().slug().run();
  if (title !== undefined) validationSchema.title = (v) => validate(v).required().min(2).max(255).run();
  if (seo_title !== undefined) validationSchema.seo_title = (v) => validate(v).max(255).run();
  if (seo_description !== undefined) validationSchema.seo_description = (v) => validate(v).max(255).run();
  if (seo_index !== undefined) validationSchema.seo_index = (v) => validate(v).checkMatch([0, 1]).run();
  if (seo_canonical !== undefined) validationSchema.seo_canonical = (v) => validate(v).run();
  if (seo_og_type !== undefined) validationSchema.seo_og_type = (v) => validate(v).run();
  if (seo_image !== undefined) validationSchema.seo_image = (v) => validate(v).run();
  if (is_active !== undefined) validationSchema.is_active = (v) => validate(v).checkMatch([0, 1]).run();
  if (type !== undefined) validationSchema.type = (v) => validate(v).required().run();

  validateBody(body, validationSchema);

  // Validate media_blocks if provided
  if (media_blocks) {
    if (!Array.isArray(media_blocks)) {
      throw createError({
        statusCode: 400,
        statusMessage: "media_blocks باید آرایه باشد",
      });
    }
    for (const block of media_blocks) {
      if (!block.type || !['banner', 'slider'].includes(block.type)) {
        throw createError({
          statusCode: 400,
          statusMessage: "type در media_blocks باید 'banner' یا 'slider' باشد",
        });
      }
      if (block.position === undefined || block.position < 1) {
        throw createError({
          statusCode: 400,
          statusMessage: "position در media_blocks الزامی و باید بزرگتر از 0 باشد",
        });
      }
      if (block.group_index === undefined || block.group_index < 1) {
        throw createError({
          statusCode: 400,
          statusMessage: "group_index در media_blocks الزامی و باید بزرگتر از 0 باشد",
        });
      }
      if (block.item_order === undefined || block.item_order < 1) {
        throw createError({
          statusCode: 400,
          statusMessage: "item_order در media_blocks الزامی و باید بزرگتر از 0 باشد",
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
      if (!content.type || !['text', 'html', 'title', 'subtitle', 'quote'].includes(content.type)) {
        throw createError({
          statusCode: 400,
          statusMessage: "type در contents باید یکی از 'text', 'html', 'title', 'subtitle', 'quote' باشد",
        });
      }
      if (!content.body) {
        throw createError({
          statusCode: 400,
          statusMessage: "body در contents الزامی است",
        });
      }
      if (content.is_active !== undefined && ![0, 1].includes(content.is_active)) {
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
    // Check if page exists
    const [existingRows] = (await connection.query(
      `SELECT id FROM pages WHERE id = ?`,
      [id]
    )) as any[];

    if (!existingRows || existingRows.length === 0) {
      await connection.rollback();
      connection.release();
      throw createError({
        statusCode: 404,
        statusMessage: "صفحه مورد نظر پیدا نشد",
      });
    }

    // Check if slug already exists (excluding current page)
    if (slug) {
      const [slugRows] = (await connection.query(
        `SELECT id FROM pages WHERE slug = ? AND id != ?`,
        [slug, id]
      )) as any[];

      if (slugRows && slugRows.length > 0) {
        await connection.rollback();
        connection.release();
        throw createError({
          statusCode: 400,
          statusMessage: "اسلاگ تکراری است",
        });
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateParams: unknown[] = [];

    if (slug !== undefined) {
      updateFields.push("slug = ?");
      updateParams.push(slug);
    }
    if (title !== undefined) {
      updateFields.push("title = ?");
      updateParams.push(title);
    }
    if (seo_title !== undefined) {
      updateFields.push("seo_title = ?");
      updateParams.push(seo_title);
    }
    if (seo_description !== undefined) {
      updateFields.push("seo_description = ?");
      updateParams.push(seo_description);
    }
    if (seo_index !== undefined) {
      updateFields.push("seo_index = ?");
      updateParams.push(seo_index);
    }
    if (seo_canonical !== undefined) {
      updateFields.push("seo_canonical = ?");
      updateParams.push(seo_canonical);
    }
    if (seo_og_type !== undefined) {
      updateFields.push("seo_og_type = ?");
      updateParams.push(seo_og_type);
    }
    if (seo_image !== undefined) {
      updateFields.push("seo_image = ?");
      updateParams.push(seo_image);
    }
    if (is_active !== undefined) {
      updateFields.push("is_active = ?");
      updateParams.push(is_active);
    }
    if (type !== undefined) {
      updateFields.push("type = ?");
      updateParams.push(type);
    }

    if (updateFields.length > 0) {
      updateFields.push("updated_at = NOW()");
      const updateSql = `UPDATE pages SET ${updateFields.join(", ")} WHERE id = ?`;
      updateParams.push(id);
      await connection.query(updateSql, updateParams);
    }

    // Update media_blocks if provided
    if (media_blocks !== undefined) {
      // Delete existing media_blocks
      await connection.query(`DELETE FROM media_blocks WHERE page_id = ?`, [id]);

      // Insert new media_blocks
      if (media_blocks.length > 0) {
        for (const block of media_blocks) {
          await connection.query(
            `INSERT INTO media_blocks (
              page_id, type, position, group_index, item_order, title, image, link, is_active, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              id,
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
    }

    // Update faqs if provided
    if (faqs !== undefined) {
      // Delete existing faqs
      await connection.query(`DELETE FROM faqs WHERE page_id = ?`, [id]);

      // Insert new faqs
      if (faqs.length > 0) {
        for (const faq of faqs) {
          await connection.query(
            `INSERT INTO faqs (
              page_id, question, answer, sort_order, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              id,
              faq.question,
              faq.answer,
              faq.sort_order,
              faq.is_active !== undefined ? faq.is_active : 1,
            ]
          );
        }
      }
    }

    // Update contents if provided
    if (contents !== undefined) {
      // Delete existing contents
      await connection.query(`DELETE FROM contents WHERE page_id = ?`, [id]);

      // Insert new contents
      if (contents.length > 0) {
        for (const content of contents) {
          await connection.query(
            `INSERT INTO contents (
              page_id, type, title, body, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              id,
              content.type,
              content.title || null,
              content.body,
              content.is_active !== undefined ? content.is_active : 1,
            ]
          );
        }
      }
    }

    // Update links if provided
    if (links !== undefined) {
      // Delete existing links
      await connection.query(`DELETE FROM links WHERE page_id = ?`, [id]);

      // Insert new links
      if (links.length > 0) {
        for (const link of links) {
          await connection.query(
            `INSERT INTO links (
              page_id, title, target, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [
              id,
              link.title,
              link.target,
              link.is_active !== undefined ? link.is_active : 1,
            ]
          );
        }
      }
    }

    // Update breadcrumbs if provided
    if (breadcrumbs !== undefined) {
      // Delete existing breadcrumbs
      await connection.query(`DELETE FROM breadcrumbs WHERE page_id = ?`, [id]);

      // Insert new breadcrumbs
      if (breadcrumbs.length > 0) {
        for (const breadcrumb of breadcrumbs) {
          await connection.query(
            `INSERT INTO breadcrumbs (
              page_id, title, target, position, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              id,
              breadcrumb.title,
              breadcrumb.target,
              breadcrumb.position,
              breadcrumb.is_active !== undefined ? breadcrumb.is_active : 1,
            ]
          );
        }
      }
    }

    await connection.commit();
    connection.release();

    return {
      success: true,
      message: "صفحه با موفقیت بروزرسانی شد",
    };
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
});

/*
 * API Documentation for Update Page (PATCH /api/page/[id])
 *
 * Description:
 * این endpoint یک صفحه موجود را بروزرسانی می‌کند. فقط فیلدهای ارسال شده آپدیت می‌شوند.
 * برای بروزرسانی داده‌های مرتبط (media_blocks, faqs, contents, links)، ابتدا رکوردهای قدیمی حذف
 * و سپس رکوردهای جدید درج می‌شوند. عملیات در transaction انجام می‌شود.
 *
 * Authentication: نیاز به دسترسی admin دارد
 *
 * URL Parameter:
 * - id: شناسه عددی صفحه (required)
 *
 * Request Body (فقط فیلدهای مورد نیاز برای بروزرسانی - همه فیلدها اختیاری):
 * {
 *   "slug": "new-slug",          // باید unique باشد اگر تغییر کند
 *   "title": "عنوان جدید",
 *   "seo_title": "SEO جدید",
 *   "seo_description": "توضیحات SEO جدید",
 *   "seo_index": 0,               // 0 یا 1
 *   "seo_canonical": "https://new-url.com",
 *   "seo_og_type": "article",
 *   "seo_image": "new-image.jpg",
 *   "is_active": 0,               // 0 یا 1
 *   "type": "blog",               // نوع جدید صفحه
 *   "media_blocks": [             // جایگزین کامل media_blocks موجود
 *     {
 *       "type": "slider",
 *       "position": 1,
 *       "group_index": 1,
 *       "item_order": 1,
 *       "title": "عنوان اسلایدر جدید",
 *       "image": "slider.jpg",
 *       "link": "https://example.com",
 *       "is_active": 1
 *     }
 *   ],
 *   "faqs": [...],                // جایگزین کامل faqs موجود
 *   "contents": [...],            // جایگزین کامل contents موجود
 *   "links": [...],                // جایگزین کامل links موجود
 *   "breadcrumbs": [              // جایگزین کامل breadcrumbs موجود
 *     {
 *       "title": "خانه",
 *       "target": "/",
 *       "position": 1,
 *       "is_active": 1
 *     }
 *   ]
 * }
 *
 * Response Success:
 * {
 *   "success": true,
 *   "message": "صفحه با موفقیت بروزرسانی شد"
 * }
 *
 * Error Cases:
 * - 400: Bad Request
 *   - id نامعتبر (عدد نیست)
 *   - Validation Error: داده‌های ورودی نامعتبر
 *   - slug تکراری (اگر تغییر کرده باشد)
 * - 401: Unauthorized - کاربر لاگین نکرده یا دسترسی admin ندارد
 * - 404: Not Found - صفحه با این id وجود ندارد
 * - 500: Internal Server Error - خطای دیتابیس
 *
 * Examples for Postman:
 *
 * 1. بروزرسانی عنوان صفحه:
 *    PATCH /api/page/1
 *    Body: {"title": "عنوان جدید"}
 *    Response: {"success": true, "message": "صفحه با موفقیت بروزرسانی شد"}
 *
 * 2. بروزرسانی کامل با media_blocks جدید:
 *    PATCH /api/page/1
 *    Body: {
 *      "title": "عنوان جدید",
 *      "media_blocks": [
 *        {"type": "banner", "position": 1, "group_index": 1, "item_order": 1, "title": "بنر جدید", "image": "banner.jpg"}
 *      ]
 *    }
 *    Response: صفحه بروزرسانی شده با media_blocks جدید
 *
 * 3. بروزرسانی با خطا (صفحه وجود ندارد):
 *    PATCH /api/page/999
 *    Body: {"title": "تست"}
 *    Response: 404 - صفحه مورد نظر پیدا نشد
 *
 * 4. بروزرسانی با slug تکراری:
 *    PATCH /api/page/1
 *    Body: {"slug": "existing-slug"}
 *    Response: 400 - Validation Error: اسلاگ تکراری است
 *
 * 5. بروزرسانی فقط faqs (دیگران تغییر نمی‌کنند):
 *    PATCH /api/page/1
 *    Body: {"faqs": [{"question": "سوال جدید", "answer": "پاسخ جدید", "sort_order": 1}]}
 *    Response: فقط faqs بروزرسانی می‌شود
 */