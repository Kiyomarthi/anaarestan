import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { createError } from "h3";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { buildUpdateQuery } from "~~/server/utils/common";

export default defineEventHandler(async (event) => {
  const user = requireRole(event, "admin");
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه ویژگی ارسال نشده است",
    });
  }

  const body = await readBody(event);
  const { name, type, values } = body;

  validateBody(body, {
    name: (v) => validate(v).min(2).max(50).run(),
    type: (v) => validate(v).checkMatch(["product", "variant"]).run(),
    values: (v) => validate(v).array().run(),
  });

  const db = await getDB();

  // Check if attribute exists
  const [existingRows] = (await db.query(
    "SELECT * FROM attributes WHERE id = ?",
    [id]
  )) as any;

  if (!existingRows.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "ویژگی مورد نظر پیدا نشد",
    });
  }

  // Build update data for attributes table
  const updateData: Record<string, unknown> = {};

  if (name !== undefined) {
    updateData.name = name;
  }

  if (type !== undefined) {
    updateData.type = type;
  }

  // Update attributes table if there are fields to update
  if (Object.keys(updateData).length > 0) {
    const updateQuery = await buildUpdateQuery(
      "attributes",
      updateData,
      "id",
      id,
      ["name", "type"]
    );

    if (updateQuery) {
      // Add updated_at to the SQL query
      const sql = updateQuery.sql.replace("SET", "SET updated_at = NOW(),");
      await db.query(sql, updateQuery.values);
    }
  }

  // Handle attribute values update if provided
  if (values !== undefined && Array.isArray(values)) {
    // Delete existing values
    await db.query("DELETE FROM attribute_values WHERE attribute_id = ?", [id]);

    // Insert new values
    for (const val of values) {
      await db.query(
        `INSERT INTO attribute_values (attribute_id, value, created_at, updated_at)
         VALUES (?, ?, NOW(), NOW())`,
        [id, val]
      );
    }
  }

  // Fetch updated attribute with values
  const [updatedRows] = (await db.query(
    "SELECT * FROM attributes WHERE id = ?",
    [id]
  )) as any;

  const [valuesRows] = (await db.query(
    "SELECT id, attribute_id, value FROM attribute_values WHERE attribute_id = ? ORDER BY id ASC",
    [id]
  )) as any[];

  const updatedAttribute = {
    ...updatedRows[0],
    values: valuesRows || [],
  };

  return {
    success: true,
    message: "ویژگی با موفقیت به‌روزرسانی شد",
    data: updatedAttribute,
  };
});
