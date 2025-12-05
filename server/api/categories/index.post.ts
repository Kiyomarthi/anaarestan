// server/api/categories/post.ts
import { getDB } from "~~/server/db";
import { createSlug } from "~~/server/utils/format";
import { validate } from "~~/shared/validation";

export default defineEventHandler(async (event) => {
  const db = await getDB();

  const user = requireRole(event, "admin");

  const body = await readBody(event);
  const { name, parent_id, status = 1, image } = body;

  validateBody(body, {
    name: (v) => validate(v).required().min(2).max(50).run(),
    image: (v) => validate(v).required().max(100).run(),
    status: (v) => validate(v).checkRule([0, 1]).run(),
  });

  let baseSlug = createSlug(name);
  let slug = baseSlug;

  const [existing] = (await db.query(
    "SELECT id FROM categories WHERE slug = ?",
    [slug]
  )) as any;

  if (existing.length) {
    console.log("-----------------------", existing);
    slug = `${baseSlug}-${Date.now()}`;
  }

  const [insertResult] = (await db.query(
    "INSERT INTO categories (name, slug, parent_id, status, image) VALUES (?, ?, ?, ?, ?)",
    [name, slug, parent_id || null, status, image || null]
  )) as any;

  const [newCategoryRows] = (await db.query(
    "SELECT * FROM categories WHERE id = ?",
    [insertResult.insertId]
  )) as any;

  const newCategory = newCategoryRows[0];

  return {
    success: true,
    message: "Category created successfully",
    data: newCategory,
  };
});
