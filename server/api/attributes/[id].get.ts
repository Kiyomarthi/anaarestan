import { getDB } from "~~/server/db";
import { createError } from "h3";

export default defineEventHandler(async (event) => {
  const db = await getDB();
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه ارسال نشده است",
    });
  }

  // ---- fetch attribute ----
  const [rows] = (await db.query(
    "SELECT * FROM attributes WHERE id = ? LIMIT 1",
    [id]
  )) as any[];

  if (!rows.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "ویژگی پیدا نشد",
    });
  }

  const attribute = rows[0];

  // ---- fetch related values ----
  const [valuesRows] = (await db.query(
    `SELECT id, attribute_id, value 
     FROM attribute_values 
     WHERE attribute_id = ? 
     ORDER BY id ASC`,
    [id]
  )) as any[];

  return {
    success: true,
    data: {
      ...attribute,
      values: valuesRows || [],
    },
  };
});
