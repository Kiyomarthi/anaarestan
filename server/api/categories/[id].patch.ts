import { getDB } from "~~/server/db";
import { createSlug } from "~~/server/utils/format";
import { validate } from "~~/shared/validation";
import { buildUpdateQuery } from "~~/server/utils/common";
import { buildAbsoluteUrl } from "~~/server/utils/common";

export default defineEventHandler(async (event) => {
  const user = requireRole(event, "admin");
  const id = getRouterParam(event, "id");
  const {
    public: { siteUrl },
  } = useRuntimeConfig();

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category ID is required",
    });
  }

  const redis = useStorage("redis");
  const keys = await redis.getKeys(`${CACHE_KEY.category}:`);

  await Promise.all(keys.map((key) => redis.removeItem(key)));

  const body = await readBody(event);
  const { name, parent_id, status, image } = body;
  validateBody(body, {
    name: (v) => validate(v).required().min(2).max(50).run(),
    image: (v) => validate(v).required().max(100).run(),
    status: (v) => validate(v).checkMatch([0, 1]).run(),
  });

  const db = await getDB();
  // Check if category exists
  const [existingRows] = (await db.query(
    "SELECT id FROM categories WHERE id = ?",
    [id]
  )) as any;

  if (!existingRows.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "Category not found",
    });
  }

  // Build update data
  const updateData: Record<string, unknown> = {};

  if (name) {
    updateData.name = name;

    // Check slug uniqueness
    let slug = createSlug(name);
    const [slugExists] = (await db.query(
      "SELECT id FROM categories WHERE slug = ? AND id != ?",
      [slug, id]
    )) as any;

    if (slugExists.length) {
      slug = `${slug}-${Date.now()}`;
    }

    updateData.slug = slug;
  }

  if (parent_id !== undefined) {
    updateData.parent_id = parent_id || null;
  }

  if (status !== undefined) {
    updateData.status = status;
  }

  if (image !== undefined) {
    updateData.image = image || null;
  }

  // If no fields to update
  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "No fields to update",
    });
  }

  // Build and execute update query
  const updateQuery = await buildUpdateQuery(
    "categories",
    updateData,
    "id",
    id,
    ["name", "slug", "parent_id", "status", "image"]
  );

  if (!updateQuery) {
    throw createError({
      statusCode: 400,
      statusMessage: "No valid fields to update",
    });
  }

  await db.query(updateQuery.sql, updateQuery.values);

  // Fetch updated category
  const [updatedRows] = (await db.query(
    "SELECT * FROM categories WHERE id = ?",
    [id]
  )) as any;

  const updatedCategory = updatedRows[0];

  return {
    success: true,
    message: "Category updated successfully",
    data: {
      ...updatedCategory,
      image: buildAbsoluteUrl(updatedCategory.image, siteUrl),
    },
  };
});
