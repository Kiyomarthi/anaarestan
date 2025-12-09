// server/api/attributes/post.ts
import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { createSlug } from "~~/server/utils/format";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";

export default defineEventHandler(async (event) => {
  const db = await getDB();
  const user = requireRole(event, "admin");

  const body = await readBody(event);
  const { name, type, values } = body;

  validateBody(body, {
    name: (v) => validate(v).required().min(2).max(50).run(),
    type: (v) =>
      validate(v).required().checkMatch(["product", "variant"]).run(),
    values: (v) => validate(v).array().run(),
  });

  // اضافه کردن attribute
  const [result] = (await db.query(
    `INSERT INTO attributes (name, type, created_at, updated_at)
     VALUES (?, ?, NOW(), NOW())`,
    [name, type]
  )) as any;

  const attribute_id = result.insertId;

  // اضافه کردن مقادیر attribute
  for (const val of values) {
    await db.query(
      `INSERT INTO attribute_values (attribute_id, value, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())`,
      [attribute_id, val]
    );
  }

  return {
    success: true,
    message: "Attribute created successfully",
    data: {
      id: attribute_id,
      name: name,
      type: type,
      values: values,
    },
  };
});
