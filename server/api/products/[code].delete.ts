import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";

export default defineEventHandler(async (event) => {
  const user = requireRole(event, "admin");

  const code = getRouterParam(event, "code");

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: "کد محصول ارسال نشده است",
    });
  }

  const db = await getDB();

  // Start transaction
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Check if product exists and get its id
    const [productRows] = (await connection.query(
      `SELECT id FROM products WHERE code = ?`,
      [code]
    )) as any[];

    if (!productRows || productRows.length === 0) {
      await connection.rollback();
      connection.release();
      throw createError({
        statusCode: 404,
        statusMessage: "محصول مورد نظر پیدا نشد",
      });
    }

    const productId = productRows[0].id;

    // Get all variant IDs for this product
    const [variantRows] = (await connection.query(
      `SELECT id FROM product_variants WHERE product_id = ?`,
      [productId]
    )) as any[];

    const variantIds = variantRows.map((row: any) => row.id);

    // Delete variant attributes (if any variants exist)
    if (variantIds.length > 0) {
      const placeholders = variantIds.map(() => "?").join(",");
      await connection.query(
        `DELETE FROM variant_attribute_values WHERE variant_id IN (${placeholders})`,
        variantIds
      );
    }

    // Delete variants
    await connection.query(
      `DELETE FROM product_variants WHERE product_id = ?`,
      [productId]
    );

    // Delete product attributes
    await connection.query(
      `DELETE FROM product_attribute_values WHERE product_id = ?`,
      [productId]
    );

    // Delete product images
    await connection.query(`DELETE FROM product_images WHERE product_id = ?`, [
      productId,
    ]);

    // Delete the product itself
    await connection.query(`DELETE FROM products WHERE id = ?`, [productId]);

    // Commit transaction
    await connection.commit();
    connection.release();

    return {
      success: true,
      message: "محصول با موفقیت حذف شد",
    };
  } catch (error: any) {
    await connection.rollback();
    connection.release();

    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "خطا در حذف محصول",
    });
  }
});

/*
 * API Documentation for Delete Product by Code (DELETE /api/products/[code])
 *
 * Description:
 * این endpoint محصول را بر اساس کد محصول (code) حذف می‌کند.
 * فقط کاربران با نقش admin می‌توانند از این endpoint استفاده کنند.
 * تمام داده‌های مرتبط با محصول نیز حذف می‌شوند.
 *
 * Authentication:
 * - نیاز به احراز هویت دارد
 * - نیاز به نقش admin دارد
 *
 * Route Parameters:
 * - code (string): کد یکتای محصول (مثال: PROD001)
 *
 * Response Format:
 * {
 *   "success": true,
 *   "message": "محصول با موفقیت حذف شد"
 * }
 *
 * Error Responses:
 *
 * 400 Bad Request:
 * {
 *   "statusCode": 400,
 *   "statusMessage": "کد محصول ارسال نشده است"
 * }
 *
 * 401 Unauthorized:
 * {
 *   "statusCode": 401,
 *   "statusMessage": "Unauthorized: user not logged in"
 * }
 *
 * 403 Forbidden:
 * {
 *   "statusCode": 403,
 *   "statusMessage": "Forbidden: requires admin role"
 * }
 *
 * 404 Not Found:
 * {
 *   "statusCode": 404,
 *   "statusMessage": "محصول مورد نظر پیدا نشد"
 * }
 *
 * 500 Internal Server Error:
 * {
 *   "statusCode": 500,
 *   "statusMessage": "خطا در حذف محصول"
 * }
 *
 * Important Notes:
 * - تمام داده‌های مرتبط با محصول به ترتیب زیر حذف می‌شوند:
 *   1. variant_attribute_values (ویژگی‌های variantها)
 *   2. product_variants (variantهای محصول)
 *   3. product_attribute_values (ویژگی‌های محصول)
 *   4. product_images (عکس‌های محصول)
 *   5. products (خود محصول)
 * - تمام عملیات در یک transaction انجام می‌شود
 * - در صورت بروز خطا، تمام تغییرات rollback می‌شوند
 * - کد محصول باید دقیقاً مطابق با کد ذخیره شده در دیتابیس باشد (case-sensitive)
 *
 * Examples for Postman:
 *
 * 1. حذف محصول با کد PROD001:
 *    DELETE /api/products/PROD001
 *    Headers:
 *      Authorization: Bearer <admin_token>
 *
 * 2. حذف محصول با کد ABC123:
 *    DELETE /api/products/ABC123
 *    Headers:
 *      Authorization: Bearer <admin_token>
 *
 * 3. حذف محصول با کد عددی:
 *    DELETE /api/products/12345
 *    Headers:
 *      Authorization: Bearer <admin_token>
 *
 * Warning:
 * این عملیات غیرقابل بازگشت است. پس از حذف محصول، تمام اطلاعات مرتبط
 * (variants، attributes، images) نیز به طور دائم حذف می‌شوند.
 */
