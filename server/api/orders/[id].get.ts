import { getDB } from "~~/server/db";
import { getOptionalAuth } from "~~/server/utils/auth";
import { createError } from "h3";

/**
 * GET /api/orders/:id
 * - admin can access any order
 * - user can access own order
 * - returns order with order_items and related data
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const auth = getOptionalAuth(event) as any | null;
  const isAdmin = auth?.role === "admin";

  if (!auth) {
    throw createError({
      statusCode: 401,
      statusMessage: "نیاز به احراز هویت دارد",
    });
  }

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه سفارش ارسال نشده است",
    });
  }

  // Get order with address and user info
  const [orderRows] = (await db.query(
    `
      SELECT
        o.*,
        a.full_address,
        a.postal_code,
        a.plate,
        a.unit,
        p.name AS province_name,
        p.id AS province_id,
        c.name AS city_name,
        c.id AS city_id,
        u.full_name AS user_full_name,
        u.phone AS user_phone
      FROM orders o
      LEFT JOIN addresses a ON a.id = o.address_id
      LEFT JOIN provinces p ON p.id = a.province_id
      LEFT JOIN cities c ON c.id = a.city_id
      LEFT JOIN users u ON u.id = o.user_id
      WHERE o.id = ?
    `,
    [id]
  )) as any[];

  const order = orderRows?.[0] || null;

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: "سفارش پیدا نشد",
    });
  }

  // Check ownership
  if (!isAdmin) {
    if (Number(order.user_id) !== Number(auth.id)) {
      throw createError({
        statusCode: 403,
        statusMessage: "دسترسی ندارید",
      });
    }
  }

  // Get order items with product info
  const [itemRows] = (await db.query(
    `
      SELECT
        oi.*,
        p.code AS product_code,
        p.title AS product_title,
        p.image AS product_image
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
      ORDER BY oi.created_at ASC
    `,
    [id]
  )) as any[];

  // Get variant attributes if variant_id exists
  const variantIds = Array.from(
    new Set(
      (itemRows || [])
        .map((row: any) => row.product_variant_id)
        .filter((v: any) => !!v)
    )
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
      variantIds
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
      variant_attributes:
        variantId && variantAttrsByVariantId[variantId]
          ? variantAttrsByVariantId[variantId]
          : [],
      product_image: buildAbsoluteUrlArvan(row.product_image),
    };
  });

  // Parse coupon_snapshot if exists
  let couponSnapshot = null;
  if (order.coupon_snapshot) {
    try {
      couponSnapshot =
        typeof order.coupon_snapshot === "string"
          ? JSON.parse(order.coupon_snapshot)
          : order.coupon_snapshot;
    } catch (e) {
      // ignore parse error
    }
  }

  return {
    success: true,
    data: {
      ...order,
      items,
      coupon_snapshot: couponSnapshot,
      address: {
        full_address: order.full_address,
        postal_code: order.postal_code,
        plate: order.plate,
        unit: order.unit,
        province_id: order.province_id,
        province_name: order.province_name,
        city_id: order.city_id,
        city_name: order.city_name,
      },
    },
  };
});

