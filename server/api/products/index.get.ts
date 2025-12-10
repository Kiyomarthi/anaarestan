import { getDB } from "~~/server/db";

export default defineEventHandler(async (event) => {
  const db = await getDB();

  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const search = query.search as string;
  const category_id = query.category_id as string;

  let whereClause = "1=1";
  const params: unknown[] = [];

  if (search) {
    whereClause += " AND (title LIKE ? OR code LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category_id) {
    whereClause += " AND category_id = ?";
    params.push(category_id);
  }

  // Get products with pagination and category info
  const [productRows] = (await db.query(
    `SELECT 
       p.*,
       c.id AS category_id_full,
       c.name AS category_name,
       c.slug AS category_slug
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE ${whereClause} ORDER BY p.created_at DESC LIMIT ${limit} OFFSET ${offset}`
  )) as any[];

  // Get total count
  const [countRows] = (await db.query(
    `SELECT COUNT(*) as total FROM products WHERE ${whereClause}`
  )) as any[];

  const total = (countRows as { total: number }[])[0]?.total || 0;

  // Fetch related data for each product
  const productsWithDetails = await Promise.all(
    productRows.map(async (product: any) => {
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

      // Get product attributes
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
        [product.id]
      )) as any[];

      // Get variants with their attributes
      const [variantRows] = (await db.query(
        `SELECT * FROM product_variants WHERE product_id = ?`,
        [product.id]
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

      // Get images
      const [imageRows] = (await db.query(
        `SELECT * FROM product_images WHERE product_id = ? ORDER BY position ASC`,
        [product.id]
      )) as any[];

      return {
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
      };
    })
  );

  return {
    success: true,
    data: productsWithDetails,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
});
