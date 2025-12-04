import { getDB } from "~~/server/db";
import { allowedProductFields, productFields } from "~~/server/utils/product";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const body = await readBody(event);

  if (!user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "User not authenticated",
    });
  }

  const { name, description, price, image, category, stock, status } = body;

  if (!name || !price) {
    throw createError({
      statusCode: 400,
      statusMessage: "Name and price are required",
    });
  }

  const db = await getDB() as any;

  const fields: string[] = [];
  const values: unknown[] = [];
  const placeholders: string[] = [];

  allowedProductFields.forEach((field) => {
    if (body[field] !== undefined) {
      fields.push(field);
      values.push(body[field]);
      placeholders.push("?");
    }
  });

  fields.push("user_id");
  values.push(user.id);
  placeholders.push("?");

  if (fields.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "No valid fields provided",
    });
  }

  const [result] = await db.execute(
    `INSERT INTO products (${fields.join(", ")}) VALUES (${placeholders.join(", ")})`,
    values
  );

  const insertId = (result as { insertId: number }).insertId;

  const [rows] = await db.execute(
    `SELECT ${productFields.join(", ")} FROM products WHERE id = ?`,
    [insertId]
  );

  return {
    success: true,
    data: (rows as unknown[])[0],
  };
});
