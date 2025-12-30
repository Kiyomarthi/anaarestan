import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";

export default defineEventHandler(async (event) => {
  const user = requireRole(event, "admin");
  const redis = useStorage("redis");

  const id = getRouterParam(event, "id");

  if (!id || isNaN(parseInt(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه صفحه نامعتبر است",
    });
  }

  const db = await getDB();

  // Start transaction
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Check if page exists
    const [pageRows] = (await connection.query(
      `SELECT id, slug FROM pages WHERE id = ?`,
      [id]
    )) as any[];

    if (!pageRows || pageRows.length === 0) {
      await connection.rollback();
      connection.release();
      throw createError({
        statusCode: 404,
        statusMessage: "صفحه مورد نظر پیدا نشد",
      });
    }

    const slug = pageRows?.[0]?.slug;
    await redis.removeItem(`${CACHE_KEY.page}:${slug}`);

    // Delete related data first (due to foreign key constraints)
    await connection.query(`DELETE FROM media_blocks WHERE page_id = ?`, [id]);
    await connection.query(`DELETE FROM faqs WHERE page_id = ?`, [id]);
    await connection.query(`DELETE FROM contents WHERE page_id = ?`, [id]);
    await connection.query(`DELETE FROM links WHERE page_id = ?`, [id]);
    await connection.query(`DELETE FROM breadcrumbs WHERE page_id = ?`, [id]);

    // Delete the page
    await connection.query(`DELETE FROM pages WHERE id = ?`, [id]);

    await connection.commit();
    connection.release();

    return {
      success: true,
      message: "صفحه با موفقیت حذف شد",
    };
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
});

/*
 * API Documentation for Delete Page (DELETE /api/page/[id])
 *
 * Description:
 * این endpoint یک صفحه و تمام داده‌های مرتبط با آن را حذف می‌کند. ابتدا تمام رکوردهای مرتبط
 * در جداول media_blocks، faqs، contents، links و breadcrumbs حذف می‌شوند و سپس صفحه اصلی حذف می‌گردد.
 * عملیات در transaction انجام می‌شود تا در صورت خطا، هیچ داده‌ای حذف نشود.
 *
 * Authentication: نیاز به دسترسی admin دارد
 *
 * URL Parameter:
 * - id: شناسه عددی صفحه (required)
 *
 * Response Success:
 * {
 *   "success": true,
 *   "message": "صفحه با موفقیت حذف شد"
 * }
 *
 * Error Cases:
 * - 400: Bad Request - id نامعتبر (عدد نیست)
 * - 401: Unauthorized - کاربر لاگین نکرده یا دسترسی admin ندارد
 * - 404: Not Found - صفحه با این id وجود ندارد
 * - 500: Internal Server Error - خطای دیتابیس
 *
 * Examples for Postman:
 *
 * 1. حذف صفحه موجود:
 *    DELETE /api/page/1
 *    Response: {"success": true, "message": "صفحه با موفقیت حذف شد"}
 *
 * 2. حذف با خطا (صفحه وجود ندارد):
 *    DELETE /api/page/999
 *    Response: 404 - صفحه مورد نظر پیدا نشد
 *
 * 3. حذف با id نامعتبر:
 *    DELETE /api/page/abc
 *    Response: 400 - شناسه صفحه نامعتبر است
 *
 * Notes:
 * - این عملیات غیرقابل برگشت است
 * - تمام داده‌های مرتبط (بنرها، اسلایدرها، سوالات متداول، محتواها، لینک‌ها، breadcrumbs) نیز حذف می‌شوند
 * - قبل از حذف، اطمینان حاصل کنید که صفحه دیگر استفاده نمی‌شود
 */
