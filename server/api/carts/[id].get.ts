import { getDB } from "~~/server/db";
import { getOptionalAuth } from "~~/server/utils/auth";
import { createError } from "h3";

/**
 * GET /api/carts/:id
 * - admin can access any cart
 * - user can access own cart
 * - guest can access carts with null user_id
 * - در پاسخ، اطلاعات پایه محصول و ویژگی‌های وریانت انتخاب‌شده نیز برگردانده می‌شود
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const auth = getOptionalAuth(event) as any | null;
  const isAdmin = auth?.role === "admin";

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه سبد خرید ارسال نشده است",
    });
  }

  const [rows] = (await db.query(`SELECT * FROM carts WHERE id = ?`, [
    id,
  ])) as any[];
  const cart = rows?.[0] || null;

  if (!cart) {
    throw createError({
      statusCode: 404,
      statusMessage: "سبد خرید پیدا نشد",
    });
  }

  if (!isAdmin) {
    if (cart.user_id) {
      if (!auth || Number(cart.user_id) !== Number(auth.id)) {
        throw createError({
          statusCode: 403,
          statusMessage: "دسترسی ندارید",
        });
      }
    }
  }

  // آیتم‌های سبد به همراه اطلاعات پایه محصول
  const [itemRows] = (await db.query(
    `
      SELECT
        ci.*,
        p.code AS product_code,
        p.title AS product_title,
        p.image AS product_image
      FROM cart_items ci
      LEFT JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = ?
      ORDER BY ci.created_at ASC
    `,
    [id],
  )) as any[];

  // جمع‌آوری شناسه وریانت‌ها برای گرفتن ویژگی‌ها
  const variantIds = Array.from(
    new Set(
      (itemRows || [])
        .map((row: any) => row.product_variant_id)
        .filter((v: any) => !!v),
    ),
  );

  let variantAttrsByVariantId: Record<
    number,
    { id: number; attribute_id: number; name: string; value: string }[]
  > = {};

  if (variantIds.length) {
    const placeholders = variantIds.map(() => "?").join(",");
    const [variantAttrRows] = (await db.query(
      `
        SELECT
          vav.variant_id,
          vav.attribute_value_id AS id,
          av.attribute_id,
          a.name,
          av.value
        FROM variant_attribute_values vav
        JOIN attribute_values av ON av.id = vav.attribute_value_id
        JOIN attributes a ON a.id = av.attribute_id
        WHERE vav.variant_id IN (${placeholders})
      `,
      variantIds,
    )) as any[];

    (variantAttrRows || []).forEach((row: any) => {
      const key = Number(row.variant_id);
      if (!variantAttrsByVariantId[key]) {
        variantAttrsByVariantId[key] = [];
      }
      variantAttrsByVariantId[key].push({
        id: row.id,
        attribute_id: row.attribute_id,
        name: row.name,
        value: row.value,
      });
    });
  }

  const items = (itemRows || []).map((row: any) => {
    const variantId = row.product_variant_id
      ? Number(row.product_variant_id)
      : null;

    return {
      ...row,
      // ویژگی‌های وریانت انتخاب‌شده (مثلاً رنگ، وزن و ...)
      variant_attributes:
        variantId && variantAttrsByVariantId[variantId]
          ? variantAttrsByVariantId[variantId]
          : [],

      product_image: buildAbsoluteUrlArvan(row.product_image),
    };
  });

  return {
    success: true,
    data: {
      ...cart,
      items,
    },
  };
});
