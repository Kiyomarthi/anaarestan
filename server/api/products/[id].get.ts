import { getDB } from "~~/server/db";
import { productFields } from "~~/server/utils/product";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product ID is required",
    });
  }

  const db = await getDB() as any

  const [rows] = await db.execute(
    `SELECT ${productFields.join(", ")} FROM products WHERE id = ?`,
    [id]
  );

  if (!rows || (rows as unknown[]).length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Product not found",
    });
  }

  return {
    success: true,
    data: (rows as unknown[])[0],
  };
});
