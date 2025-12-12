import { getDB } from "~~/server/db";
import { buildAbsoluteUrl } from "~~/server/utils/common";

export default defineEventHandler(async (event) => {
  const {
    public: { siteUrl },
  } = useRuntimeConfig();
  const code = getRouterParam(event, "code");

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: "کد محصول ارسال نشده است",
    });
  }

  const db = await getDB();

  try {
    // Fetch product with category info
    const [productRows] = (await db.query(
      `SELECT 
         p.*,
         c.id AS category_id_full,
         c.name AS category_name,
         c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.code = ?`,
      [code]
    )) as any[];

    if (!productRows || productRows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "محصول مورد نظر پیدا نشد",
      });
    }

    const product = productRows[0];
    const productId = product.id;

    // Extract category info
    const category = product.category_id_full
      ? {
          id: product.category_id_full,
          name: product.category_name,
          slug: product.category_slug,
        }
      : null;

    // Remove category fields from product object
    delete product.category_id_full;
    delete product.category_name;
    delete product.category_slug;
    delete product.category_id;

    // Fetch product attributes
    const [productAttrRows] = (await db.query(
      `SELECT 
         pav.attribute_value_id AS id,
         av.attribute_id,
         a.name,
         av.value
       FROM product_attribute_values pav
       JOIN attribute_values av ON av.id = pav.attribute_value_id
       JOIN attributes a ON a.id = av.attribute_id
       WHERE pav.product_id = ?`,
      [productId]
    )) as any[];

    // Fetch variants with their attributes
    const [variantRows] = (await db.query(
      `SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC`,
      [productId]
    )) as any[];

    const variantsWithAttrs = await Promise.all(
      variantRows.map(async (variant: any) => {
        const [variantAttrRows] = (await db.query(
          `SELECT 
             vav.attribute_value_id AS id,
             av.attribute_id,
             a.name,
             av.value
           FROM variant_attribute_values vav
           JOIN attribute_values av ON av.id = vav.attribute_value_id
           JOIN attributes a ON a.id = av.attribute_id
           WHERE vav.variant_id = ?`,
          [variant.id]
        )) as any[];

        return {
          ...variant,
          variant_attributes: variantAttrRows.map((row: any) => ({
            id: row.id,
            attribute_id: row.attribute_id,
            name: row.name,
            value: row.value,
          })),
        };
      })
    );

    // Fetch images
    const [imageRows] = (await db.query(
      `SELECT * FROM product_images WHERE product_id = ? ORDER BY position ASC`,
      [productId]
    )) as any[];

    const mappedGallery = imageRows.map((img: any) => ({
      ...img,
      url: buildAbsoluteUrl(img.url, siteUrl),
    }));

    return {
      success: true,
      data: {
        ...product,
        category: category,
        products_attribute: productAttrRows.map((row: any) => ({
          id: row.id,
          attribute_id: row.attribute_id,
          name: row.name,
          value: row.value,
        })),
        variant_attribute: variantsWithAttrs,
        image: buildAbsoluteUrl(product.image, siteUrl),
        gallery: mappedGallery,
      },
    };
  } catch (error: any) {
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "خطا در دریافت اطلاعات محصول",
    });
  }
});

/*
 * API Documentation for Get Product by Code (GET /api/products/[code])
 *
 * Description:
 * این endpoint جزئیات کامل یک محصول را بر اساس کد محصول (code) برمی‌گرداند.
 * تمام اطلاعات مرتبط شامل دسته‌بندی، ویژگی‌های محصول، variantها و عکس‌ها را شامل می‌شود.
 *
 * Route Parameters:
 * - code (string): کد یکتای محصول (مثال: PROD001)
 *
 * Response Format:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "title": "نام محصول",
 *     "slug": "product-slug",
 *     "short_description": "توضیحات کوتاه",
 *     "description": "توضیحات کامل محصول",
 *     "price": "100000.00",
 *     "discount_price": "90000.00",
 *     "image": "image-url.jpg",
 *     "code": "PROD001",
 *     "stock": 50,
 *     "main_variant_id": 1,
 *     "status": 1,
 *     "created_at": "2024-01-01T00:00:00.000Z",
 *     "updated_at": "2024-01-01T00:00:00.000Z",
 *     "category": {
 *       "id": 1,
 *       "name": "نام دسته‌بندی",
 *       "slug": "category-slug"
 *     },
 *     "products_attribute": [
 *       {
 *         "id": 1,
 *         "attribute_id": 1,
 *         "name": "CPU",
 *         "value": "Snapdragon 888"
 *       },
 *       {
 *         "id": 2,
 *         "attribute_id": 2,
 *         "name": "RAM",
 *         "value": "8GB"
 *       }
 *     ],
 *     "variant_attribute": [
 *       {
 *         "id": 1,
 *         "product_id": 1,
 *         "sku": "PROD001-RED-128",
 *         "price": "100000.00",
 *         "discount_price": "90000.00",
 *         "stock": 25,
 *         "status": 1,
 *         "created_at": "2024-01-01T00:00:00.000Z",
 *         "updated_at": "2024-01-01T00:00:00.000Z",
 *         "variant_attributes": [
 *           {
 *             "id": 3,
 *             "attribute_id": 3,
 *             "name": "رنگ",
 *             "value": "قرمز"
 *           },
 *           {
 *             "id": 4,
 *             "attribute_id": 4,
 *             "name": "حافظه",
 *             "value": "128GB"
 *           }
 *         ]
 *       },
 *       {
 *         "id": 2,
 *         "product_id": 1,
 *         "sku": "PROD001-BLUE-256",
 *         "price": "120000.00",
 *         "discount_price": null,
 *         "stock": 25,
 *         "status": 1,
 *         "created_at": "2024-01-01T00:00:00.000Z",
 *         "updated_at": "2024-01-01T00:00:00.000Z",
 *         "variant_attributes": [
 *           {
 *             "id": 5,
 *             "attribute_id": 3,
 *             "name": "رنگ",
 *             "value": "آبی"
 *           },
 *           {
 *             "id": 6,
 *             "attribute_id": 4,
 *             "name": "حافظه",
 *             "value": "256GB"
 *           }
 *         ]
 *       }
 *     ],
 *     "image": "main-image-url.jpg",
 *     "gallery": [
 *       {
 *         "id": 1,
 *         "product_id": 1,
 *         "url": "image1-url.jpg",
 *         "alt_text": "عکس اول",
 *         "position": 1,
 *         "created_at": "2024-01-01T00:00:00.000Z",
 *         "updated_at": "2024-01-01T00:00:00.000Z"
 *       },
 *       {
 *         "id": 2,
 *         "product_id": 1,
 *         "url": "image2-url.jpg",
 *         "alt_text": "عکس دوم",
 *         "position": 2,
 *         "created_at": "2024-01-01T00:00:00.000Z",
 *         "updated_at": "2024-01-01T00:00:00.000Z"
 *       }
 *     ]
 *   }
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
 * 404 Not Found:
 * {
 *   "statusCode": 404,
 *   "statusMessage": "محصول مورد نظر پیدا نشد"
 * }
 *
 * 500 Internal Server Error:
 * {
 *   "statusCode": 500,
 *   "statusMessage": "خطا در دریافت اطلاعات محصول"
 * }
 *
 * Examples for Postman:
 *
 * 1. دریافت محصول با کد PROD001:
 *    GET /api/products/PROD001
 *
 * 2. دریافت محصول با کد ABC123:
 *    GET /api/products/ABC123
 *
 * 3. دریافت محصول با کد عددی:
 *    GET /api/products/12345
 *
 * Notes:
 * - کد محصول باید دقیقاً مطابق با کد ذخیره شده در دیتابیس باشد (case-sensitive)
 * - اگر محصولی با کد داده شده پیدا نشود، خطای 404 برگردانده می‌شود
 * - تمام variantها به ترتیب id مرتب می‌شوند
 * - عکس‌های گالری به ترتیب position مرتب می‌شوند
 * - اگر محصول دسته‌بندی نداشته باشد، category برابر null خواهد بود
 * - اگر محصول ویژگی یا variant نداشته باشد، آرایه‌های مربوطه خالی خواهند بود
 */
