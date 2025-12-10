import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { createSlug, generateCode } from "~~/server/utils/format";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";

export default defineEventHandler(async (event) => {
  const db = await getDB();
  const user = requireRole(event, "admin");

  const body = await readBody(event);
  const {
    category_id,
    title,
    slug,
    short_description,
    description,
    code,
    status = 1,
    variants,
    product_attributes,
    variant_attributes,
    images,
  } = body;

  // Validation
  validateBody(body, {
    category_id: (v) => validate(v).required().run(),
    title: (v) => validate(v).required().min(2).max(150).run(),
    slug: (v) => validate(v).required().slug().run(),
    short_description: (v) => validate(v).max(300).run(),
    description: (v) => validate(v).run(),
    code: (v) => validate(v).max(20).run(),
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
      throw createError({
        statusCode: 400,
        statusMessage: "خطا در محاسبه قیمت",
      });
    }

    // Generate code if not provided
    const productCode = code || generateCode();

    // Calculate total stock from all variants
    const totalStock = variants.reduce((sum: number, variant: any) => {
      return sum + (parseInt(variant.stock) || 0);
    }, 0);

    // Insert product
    const [productResult] = (await connection.query(
      `INSERT INTO products (
        category_id, title, slug, short_description, description,
        price, discount_price, image, code, main_variant_id, status, stock,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        category_id,
        title,
        slug,
        short_description || null,
        description || null,
        cheapestVariant.price,
        cheapestVariant.discount_price || null,
        mainImage.url,
        productCode,
        null, // Will update after variant is created
        status,
        totalStock,
      ]
    )) as any;

    const productId = productResult.insertId;

    // Insert variants
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
      `SELECT * FROM product_variants WHERE product_id = ?`,
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
      message: "محصول با موفقیت ایجاد شد",
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
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "خطا در ایجاد محصول",
    });
  }
});
