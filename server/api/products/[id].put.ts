import { getDB } from "~~/server/db";
import { buildUpdateQuery } from "~~/server/utils/common";
import { allowedProductFields, productFields } from "~~/server/utils/product";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const id = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "User not authenticated",
    });
  }

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product ID is required",
    });
  }

  const db = await getDB() as any;

  // Check if product exists and belongs to user
  const [productRows] = await db.execute(
    "SELECT user_id FROM products WHERE id = ?",
    [id]
  );

  if (!productRows || (productRows as unknown[]).length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Product not found",
    });
  }

  const product = (productRows as { user_id: number }[])[0];

  // Allow admin or product owner to update
  if (product.user_id !== user.id && user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "You don't have permission to update this product",
    });
  }

  const query = buildUpdateQuery(
    "products",
    body,
    "id",
    id,
    allowedProductFields
  );

  if (!query) {
    return { success: false, message: "No valid fields to update" };
  }

  await db.execute(query.sql, query.values);

  const [rows] = await db.execute(
    `SELECT ${productFields.join(", ")} FROM products WHERE id = ?`,
    [id]
  );

  return {
    success: true,
    data: (rows as unknown[])[0],
  };
});
