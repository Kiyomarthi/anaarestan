import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";

export default defineEventHandler(async (event) => {
  const db = await getDB();
  const user = requireRole(event, "admin");

  const code = getRouterParam(event, "code");

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: "کد محصول ارسال نشده است",
    });
  }

  const body = await readBody(event);
  const {
    category_id,
    title,
    short_description,
    description,
    status = 1,
    variants,
    product_attributes,
    variant_attributes,
    images,
  } = body;

  // Validation (excluding code and slug)
  validateBody(body, {
    category_id: (v) => validate(v).required().run(),
    title: (v) => validate(v).required().min(2).max(150).run(),
    short_description: (v) => validate(v).max(300).run(),
    description: (v) => validate(v).run(),
    status: (v) => validate(v).checkMatch([0, 1]).run(),
    variants: (v) => validate(v).required().array().run(),
    images: (v) => validate(v).required().array().run(),
  });

  // Validate variants
  if (!variants || variants.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "حداقل یک variant الزامی است",
    });
  }

  // Validate images
  if (!images || images.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "حداقل یک عکس الزامی است",
    });
  }

  // Check if image with position 1 exists
  const mainImage = images.find((img: any) => img.position === 1);
  if (!mainImage) {
    throw createError({
      statusCode: 400,
      statusMessage: "عکس با position برابر 1 الزامی است",
    });
  }

  // Validate each variant
  for (const variant of variants) {
    if (
      variant.price === undefined ||
      variant.stock === undefined ||
      variant.sku === undefined
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "هر variant باید دارای price، stock و sku باشد",
      });
    }
  }

  // Start transaction
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Check if product exists
    const [existingProductRows] = (await connection.query(
      `SELECT id FROM products WHERE code = ?`,
      [code]
    )) as any[];

    if (!existingProductRows || existingProductRows.length === 0) {
      await connection.rollback();
      connection.release();
      throw createError({
        statusCode: 404,
        statusMessage: "محصول مورد نظر پیدا نشد",
      });
    }

    const productId = existingProductRows[0].id;

    // Calculate main price and find cheapest variant
    let cheapestVariantIndex = -1;
    let cheapestPrice = Infinity;
    let cheapestVariant: any = null;

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const finalPrice =
        variant.discount_price && variant.discount_price > 0
          ? variant.discount_price
          : variant.price;

      if (finalPrice < cheapestPrice) {
        cheapestPrice = finalPrice;
        cheapestVariantIndex = i;
        cheapestVariant = variant;
      }
    }

    if (!cheapestVariant || cheapestVariantIndex === -1) {
      await connection.rollback();
      connection.release();
      throw createError({
        statusCode: 400,
        statusMessage: "خطا در محاسبه قیمت",
      });
    }

    // Calculate total stock from all variants
    const totalStock = variants.reduce((sum: number, variant: any) => {
      return sum + (parseInt(variant.stock) || 0);
    }, 0);

    // Update product (excluding code and slug)
    await connection.query(
      `UPDATE products SET
        category_id = ?,
        title = ?,
        short_description = ?,
        description = ?,
        price = ?,
        discount_price = ?,
        image = ?,
        status = ?,
        stock = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        category_id,
        title,
        short_description || null,
        description || null,
        cheapestVariant.price,
        cheapestVariant.discount_price || null,
        mainImage.url,
        status,
        totalStock,
        productId,
      ]
    );

    // Delete old variants and their attributes
    const [oldVariantRows] = (await connection.query(
      `SELECT id FROM product_variants WHERE product_id = ?`,
      [productId]
    )) as any[];

    for (const oldVariant of oldVariantRows) {
      // Delete variant attributes
      await connection.query(
        `DELETE FROM variant_attribute_values WHERE variant_id = ?`,
        [oldVariant.id]
      );
    }

    // Delete old variants
    await connection.query(
      `DELETE FROM product_variants WHERE product_id = ?`,
      [productId]
    );

    // Delete old product attributes
    await connection.query(
      `DELETE FROM product_attribute_values WHERE product_id = ?`,
      [productId]
    );

    // Delete old images
    await connection.query(`DELETE FROM product_images WHERE product_id = ?`, [
      productId,
    ]);

    // Insert new variants
    let mainVariantId: number | null = null;

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];

      const [variantResult] = (await connection.query(
        `INSERT INTO product_variants (
          product_id, sku, price, discount_price, stock, status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          productId,
          variant.sku,
          variant.price,
          variant.discount_price || null,
          variant.stock,
          variant.status !== undefined ? variant.status : 1,
        ]
      )) as any;

      const variantId = variantResult.insertId;

      // Check if this is the cheapest variant
      if (i === cheapestVariantIndex) {
        mainVariantId = variantId;
      }

      // Insert variant attributes
      if (variant_attributes && variant_attributes[i]) {
        const variantAttrs = variant_attributes[i];
        if (Array.isArray(variantAttrs)) {
          for (const attrValueId of variantAttrs) {
            await connection.query(
              `INSERT INTO variant_attribute_values (
                variant_id, attribute_value_id, created_at, updated_at
              ) VALUES (?, ?, NOW(), NOW())`,
              [variantId, attrValueId]
            );
          }
        }
      }
    }

    // Update main_variant_id in product
    if (mainVariantId) {
      await connection.query(
        `UPDATE products SET main_variant_id = ? WHERE id = ?`,
        [mainVariantId, productId]
      );
    }

    // Insert product attributes
    if (product_attributes && Array.isArray(product_attributes)) {
      for (const attrValueId of product_attributes) {
        await connection.query(
          `INSERT INTO product_attribute_values (
            product_id, attribute_value_id, created_at, updated_at
          ) VALUES (?, ?, NOW(), NOW())`,
          [productId, attrValueId]
        );
      }
    }

    // Insert images
    for (const img of images) {
      await connection.query(
        `INSERT INTO product_images (
          product_id, url, alt_text, position, created_at, updated_at
        ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [productId, img.url, img.alt_text || null, img.position || 0]
      );
    }

    // Commit transaction
    await connection.commit();

    // Fetch complete product data with category info
    const [productRows] = (await connection.query(
      `SELECT 
         p.*,
         c.id AS category_id_full,
         c.name AS category_name,
         c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`,
      [productId]
    )) as any[];

    const product = productRows[0];

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
    const [productAttrRows] = (await connection.query(
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
    const [variantRows] = (await connection.query(
      `SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC`,
      [productId]
    )) as any[];

    const variantsWithAttrs = await Promise.all(
      variantRows.map(async (variant: any) => {
        const [variantAttrRows] = (await connection.query(
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
    const [imageRows] = (await connection.query(
      `SELECT * FROM product_images WHERE product_id = ? ORDER BY position ASC`,
      [productId]
    )) as any[];

    connection.release();

    return {
      success: true,
      message: "محصول با موفقیت بروزرسانی شد",
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
        image: product.image,
        gallery: imageRows,
      },
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
      statusMessage: error.message || "خطا در بروزرسانی محصول",
    });
  }
});

/*
 * API Documentation for Update Product by Code (PATCH /api/products/[code])
 *
 * Description:
 * این endpoint محصول را بر اساس کد محصول (code) بروزرسانی می‌کند.
 * فقط کاربران با نقش admin می‌توانند از این endpoint استفاده کنند.
 * فیلدهای code و slug قابل تغییر نیستند.
 *
 * Authentication:
 * - نیاز به احراز هویت دارد
 * - نیاز به نقش admin دارد
 *
 * Route Parameters:
 * - code (string): کد یکتای محصول (مثال: PROD001)
 *
 * Request Body:
 * همان ساختار body در index.post.ts است با این تفاوت که:
 * - code: ارسال نمی‌شود (از route parameter استفاده می‌شود)
 * - slug: ارسال نمی‌شود (تغییر نمی‌کند)
 *
 * {
 *   "category_id": 1,
 *   "title": "نام محصول",
 *   "short_description": "توضیحات کوتاه",
 *   "description": "توضیحات کامل",
 *   "status": 1,
 *   "variants": [
 *     {
 *       "sku": "PROD001-RED-128",
 *       "price": "100000.00",
 *       "discount_price": "90000.00",
 *       "stock": 25,
 *       "status": 1
 *     },
 *     {
 *       "sku": "PROD001-BLUE-256",
 *       "price": "120000.00",
 *       "discount_price": null,
 *       "stock": 25,
 *       "status": 1
 *     }
 *   ],
 *   "product_attributes": [1, 2, 3],
 *   "variant_attributes": [
 *     [3, 4],  // attributes for first variant
 *     [5, 6]   // attributes for second variant
 *   ],
 *   "images": [
 *     {
 *       "url": "image1-url.jpg",
 *       "alt_text": "عکس اول",
 *       "position": 1
 *     },
 *     {
 *       "url": "image2-url.jpg",
 *       "alt_text": "عکس دوم",
 *       "position": 2
 *     }
 *   ]
 * }
 *
 * Validation Rules:
 * - category_id: الزامی
 * - title: الزامی، حداقل 2 کاراکتر، حداکثر 150 کاراکتر
 * - short_description: حداکثر 300 کاراکتر
 * - status: باید 0 یا 1 باشد
 * - variants: الزامی، باید آرایه‌ای از variantها باشد
 * - images: الزامی، باید آرایه‌ای از عکس‌ها باشد
 * - حداقل یک variant الزامی است
 * - حداقل یک عکس الزامی است
 * - عکس با position برابر 1 الزامی است
 * - هر variant باید دارای price، stock و sku باشد
 *
 * Response Format:
 * همان ساختار response در index.post.ts است:
 * {
 *   "success": true,
 *   "message": "محصول با موفقیت بروزرسانی شد",
 *   "data": {
 *     "id": 1,
 *     "title": "نام محصول",
 *     "slug": "product-slug",  // تغییر نمی‌کند
 *     "code": "PROD001",        // تغییر نمی‌کند
 *     "short_description": "توضیحات کوتاه",
 *     "description": "توضیحات کامل",
 *     "price": "100000.00",
 *     "discount_price": "90000.00",
 *     "image": "image-url.jpg",
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
 *     "products_attribute": [...],
 *     "variant_attribute": [...],
 *     "image": "main-image-url.jpg",
 *     "gallery": [...]
 *   }
 * }
 *
 * Error Responses:
 *
 * 400 Bad Request:
 * - "کد محصول ارسال نشده است"
 * - "حداقل یک variant الزامی است"
 * - "حداقل یک عکس الزامی است"
 * - "عکس با position برابر 1 الزامی است"
 * - "هر variant باید دارای price، stock و sku باشد"
 * - "خطا در محاسبه قیمت"
 *
 * 401 Unauthorized:
 * - "Unauthorized: user not logged in"
 *
 * 403 Forbidden:
 * - "Forbidden: requires admin role"
 *
 * 404 Not Found:
 * - "محصول مورد نظر پیدا نشد"
 *
 * 500 Internal Server Error:
 * - "خطا در بروزرسانی محصول"
 *
 * Important Notes:
 * - فیلدهای code و slug تغییر نمی‌کنند
 * - تمام variantهای قدیمی حذف می‌شوند و variantهای جدید اضافه می‌شوند
 * - تمام ویژگی‌های قدیمی (product و variant) حذف می‌شوند و جدیدها اضافه می‌شوند
 * - تمام عکس‌های قدیمی حذف می‌شوند و عکس‌های جدید اضافه می‌شوند
 * - main_variant_id بر اساس ارزان‌ترین variant محاسبه می‌شود
 * - stock کل محصول از مجموع stock تمام variantها محاسبه می‌شود
 * - price و discount_price محصول از ارزان‌ترین variant گرفته می‌شود
 * - image اصلی محصول از عکس با position 1 گرفته می‌شود
 *
 * Examples for Postman:
 *
 * 1. بروزرسانی محصول با کد PROD001:
 *    PATCH /api/products/PROD001
 *    Headers:
 *      Authorization: Bearer <admin_token>
 *    Body: (همان body در index.post.ts بدون code و slug)
 *
 * 2. بروزرسانی محصول با کد ABC123:
 *    PATCH /api/products/ABC123
 *    Headers:
 *      Authorization: Bearer <admin_token>
 *    Body: (همان body در index.post.ts بدون code و slug)
 */
