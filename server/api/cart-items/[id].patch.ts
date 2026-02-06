import { getDB } from "~~/server/db";
import { getOptionalAuth } from "~~/server/utils/auth";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";

/**
 * PATCH /api/cart-items/:id
 * - admin can update any field
 * - user/guest can update quantity for their cart item
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const auth = getOptionalAuth(event) as any | null;
  const isAdmin = auth?.role === "admin";

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه آیتم ارسال نشده است",
    });
  }

  const [rows] = (await db.query(
    `SELECT ci.*, c.user_id AS cart_user_id
     FROM cart_items ci
     JOIN carts c ON c.id = ci.cart_id
     WHERE ci.id = ?`,
    [id]
  )) as any[];

  const item = rows?.[0] || null;
  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: "آیتم پیدا نشد",
    });
  }

  if (!isAdmin && item.cart_user_id) {
    if (!auth || Number(item.cart_user_id) !== Number(auth.id)) {
      throw createError({
        statusCode: 403,
        statusMessage: "دسترسی ندارید",
      });
    }
  }

  const body = await readBody(event);
  validateBody(body, {
    cart_id: (v) => validate(v).run(),
    product_id: (v) => validate(v).run(),
    product_variant_id: (v) => validate(v).run(),
    quantity: (v) => validate(v).run(),
    price: (v) => validate(v).run(),
  });

  if (!isAdmin) {
    const allowedKeys = ["quantity"];
    const invalidKey = Object.keys(body).find(
      (key) => body[key] !== undefined && !allowedKeys.includes(key)
    );
    if (invalidKey) {
      throw createError({
        statusCode: 403,
        statusMessage: "فقط امکان تغییر تعداد وجود دارد",
      });
    }
  }

  const sets: string[] = [];
  const params: any[] = [];

  if (isAdmin && body.cart_id !== undefined) {
    if (Number.isNaN(Number(body.cart_id))) {
      throw createError({
        statusCode: 400,
        statusMessage: "شناسه سبد خرید نامعتبر است",
      });
    }
    sets.push("cart_id = ?");
    params.push(Number(body.cart_id));
  }

  if (isAdmin && body.product_id !== undefined) {
    if (Number.isNaN(Number(body.product_id))) {
      throw createError({
        statusCode: 400,
        statusMessage: "شناسه محصول نامعتبر است",
      });
    }
    sets.push("product_id = ?");
    params.push(Number(body.product_id));
  }

  if (isAdmin && body.product_variant_id !== undefined) {
    const productVariantId =
      body.product_variant_id === null || body.product_variant_id === ""
        ? null
        : Number(body.product_variant_id);

    if (productVariantId !== null && Number.isNaN(productVariantId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "شناسه تنوع محصول نامعتبر است",
      });
    }

    sets.push("product_variant_id = ?");
    params.push(productVariantId);
  }

  if (body.quantity !== undefined) {
    const quantity = Number(body.quantity);
    if (Number.isNaN(quantity)) {
      throw createError({
        statusCode: 400,
        statusMessage: "تعداد نامعتبر است",
      });
    }
    if (quantity <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "تعداد باید بیشتر از صفر باشد",
      });
    }
    sets.push("quantity = ?");
    params.push(quantity);
  }

  if (isAdmin && body.price !== undefined) {
    const price = Number(body.price);
    if (Number.isNaN(price)) {
      throw createError({
        statusCode: 400,
        statusMessage: "قیمت نامعتبر است",
      });
    }
    if (price < 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "قیمت نامعتبر است",
      });
    }
    sets.push("price = ?");
    params.push(price);
  }

  if (!sets.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "هیچ فیلدی برای بروزرسانی ارسال نشده است",
    });
  }

  params.push(id);
  try {
    await db.query(
      `UPDATE cart_items SET ${sets.join(", ")} WHERE id = ?`,
      params
    );
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      throw createError({
        statusCode: 409,
        statusMessage: "این آیتم تکراری است",
      });
    }
    throw err;
  }

  const [updatedRows] = (await db.query(`SELECT * FROM cart_items WHERE id = ?`, [
    id,
  ])) as any[];

  return {
    success: true,
    message: "بروزرسانی شد",
    data: updatedRows?.[0] || null,
  };
});
