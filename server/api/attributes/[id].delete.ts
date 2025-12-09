import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { createError } from "h3";

export default defineEventHandler(async (event) => {
  requireRole(event, "admin");

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه ویژگی ارسال نشده است",
    });
  }

  const db = await getDB();

  // Get the attribute first so we can return it after deletion
  const [rows] = (await db.query("SELECT * FROM attributes WHERE id = ?", [
    id,
  ])) as any[];

  const attribute = rows[0] || null;

  if (!attribute) {
    return {
      success: false,
      message: "ویژگی مورد نظر پیدا نشد",
    };
  }

  // Get attribute values for response
  const [valuesRows] = (await db.query(
    "SELECT id, attribute_id, value FROM attribute_values WHERE attribute_id = ?",
    [id]
  )) as any[];

  // Delete attribute values first (foreign key constraint)
  await db.query("DELETE FROM attribute_values WHERE attribute_id = ?", [id]);

  // Delete the attribute
  await db.query("DELETE FROM attributes WHERE id = ?", [id]);

  return {
    success: true,
    message: "ویژگی با موفقیت حذف شد",
    data: {
      ...attribute,
      values: valuesRows || [],
    },
  };
});
