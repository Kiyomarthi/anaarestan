import { getDB } from "~~/server/db";
import { getOptionalAuth } from "~~/server/utils/auth";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";

/**
 * POST /api/carts
 * Body: { user_id?, status?, items? }
 * items: [{ product_id, quantity, price }]
 * - auth optional; if logged in, user_id is set
 * - admin can set user_id and status
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const auth = getOptionalAuth(event) as any | null;
  const isAdmin = auth?.role === "admin";

  const body = await readBody(event);
  validateBody(body, {
    user_id: (v) => validate(v).run(),
    status: (v) =>
      v === undefined
        ? true
        : validate(v).checkMatch(["active", "converted", "abandoned"]).run(),
    items: (v) => (v === undefined ? true : Array.isArray(v) ? true : "invalid"),
  });

  const items = Array.isArray(body.items) ? body.items : [];

  const itemErrors: Record<string, string> = {};
  items.forEach((item: any, i: number) => {
    const productCheck = validate(item?.product_id).required().run();
    if (productCheck !== true) {
      itemErrors[`items.${i}.product_id`] = productCheck as string;
    } else if (Number.isNaN(Number(item?.product_id))) {
      itemErrors[`items.${i}.product_id`] = "شناسه محصول نامعتبر است";
    }

    const quantityCheck = validate(item?.quantity).required().run();
    if (quantityCheck !== true) {
      itemErrors[`items.${i}.quantity`] = quantityCheck as string;
    } else if (Number.isNaN(Number(item?.quantity))) {
      itemErrors[`items.${i}.quantity`] = "تعداد نامعتبر است";
    } else if (Number(item?.quantity) <= 0) {
      itemErrors[`items.${i}.quantity`] = "تعداد باید بیشتر از صفر باشد";
    }

    const priceCheck = validate(item?.price).required().run();
    if (priceCheck !== true) {
      itemErrors[`items.${i}.price`] = priceCheck as string;
    } else if (Number.isNaN(Number(item?.price))) {
      itemErrors[`items.${i}.price`] = "قیمت نامعتبر است";
    } else if (Number(item?.price) < 0) {
      itemErrors[`items.${i}.price`] = "قیمت نامعتبر است";
    }
  });

  if (Object.keys(itemErrors).length > 0) {
    throw createError({
      statusCode: 400,
      message: "Validation Error",
      data: itemErrors,
    });
  }

  let userId: number | null = null;
  if (isAdmin && body.user_id) userId = Number(body.user_id);
  else if (auth?.id) userId = Number(auth.id);

  const status = isAdmin && body.status ? body.status : "active";

  const [insertResult] = (await db.query(
    `INSERT INTO carts (user_id, status) VALUES (?, ?)`,
    [userId, status]
  )) as any[];

  const cartId = insertResult?.insertId;

  if (items.length > 0) {
    const productIds = Array.from(
      new Set(items.map((item: any) => Number(item.product_id)))
    ).filter((id) => !Number.isNaN(id));

    if (productIds.length > 0) {
      const placeholders = productIds.map(() => "?").join(", ");
      const [pRows] = (await db.query(
        `SELECT id FROM products WHERE id IN (${placeholders})`,
        productIds
      )) as any[];

      const foundIds = new Set(pRows.map((r: any) => Number(r.id)));
      const missing = productIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw createError({
          statusCode: 404,
          statusMessage: `محصول یافت نشد: ${missing.join(", ")}`,
        });
      }
    }

    for (const item of items) {
      await db.query(
        `INSERT INTO cart_items (cart_id, product_id, quantity, price, created_at)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           quantity = quantity + VALUES(quantity),
           price = VALUES(price)`,
        [cartId, Number(item.product_id), Number(item.quantity), item.price]
      );
    }
  }

  const [cartRows] = (await db.query(`SELECT * FROM carts WHERE id = ?`, [
    cartId,
  ])) as any[];
  const [itemRows] = (await db.query(
    `SELECT * FROM cart_items WHERE cart_id = ? ORDER BY created_at ASC`,
    [cartId]
  )) as any[];

  return {
    success: true,
    message: "سبد خرید ایجاد شد",
    data: {
      ...(cartRows?.[0] || null),
      items: itemRows || [],
    },
  };
});
