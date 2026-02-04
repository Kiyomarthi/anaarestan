import { getDB } from "~~/server/db";
import { getOptionalAuth } from "~~/server/utils/auth";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";

/**
 * POST /api/cart-items
 * Body: { cart_id, product_id, quantity, price }
 * - auth optional; user can add to own cart
 * - if user logged in and cart has no user_id, attach it
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const auth = getOptionalAuth(event) as any | null;
  const isAdmin = auth?.role === "admin";

  const body = await readBody(event);
  validateBody(body, {
    cart_id: (v) => validate(v).required().run(),
    product_id: (v) => validate(v).required().run(),
    quantity: (v) => validate(v).required().run(),
    price: (v) => validate(v).required().run(),
  });

  const cartId = Number(body.cart_id);
  const productId = Number(body.product_id);
  const quantity = Number(body.quantity);
  const price = Number(body.price);

  if (
    Number.isNaN(cartId) ||
    Number.isNaN(productId) ||
    Number.isNaN(quantity) ||
    Number.isNaN(price)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "مقادیر ارسال شده نامعتبر است",
    });
  }

  if (quantity <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "تعداد باید بیشتر از صفر باشد",
    });
  }

  if (price < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "قیمت نامعتبر است",
    });
  }

  const [cartRows] = (await db.query(`SELECT * FROM carts WHERE id = ?`, [
    cartId,
  ])) as any[];
  const cart = cartRows?.[0] || null;
  if (!cart) {
    throw createError({
      statusCode: 404,
      statusMessage: "سبد خرید پیدا نشد",
    });
  }

  if (!isAdmin && cart.user_id) {
    if (!auth || Number(cart.user_id) !== Number(auth.id)) {
      throw createError({
        statusCode: 403,
        statusMessage: "دسترسی ندارید",
      });
    }
  }

  const [pRows] = (await db.query(`SELECT id FROM products WHERE id = ?`, [
    productId,
  ])) as any[];
  if (!pRows?.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "محصول مورد نظر پیدا نشد",
    });
  }

  if (!isAdmin && auth?.id && !cart.user_id) {
    await db.query(`UPDATE carts SET user_id = ? WHERE id = ?`, [
      Number(auth.id),
      cartId,
    ]);
  }

  await db.query(
    `INSERT INTO cart_items (cart_id, product_id, quantity, price, created_at)
     VALUES (?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       quantity = quantity + VALUES(quantity),
       price = VALUES(price)`,
    [cartId, productId, quantity, price]
  );

  const [rows] = (await db.query(
    `SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? LIMIT 1`,
    [cartId, productId]
  )) as any[];

  return {
    success: true,
    message: "به سبد خرید اضافه شد",
    data: rows?.[0] || null,
  };
});
