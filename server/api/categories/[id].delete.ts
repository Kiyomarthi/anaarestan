import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { createError } from "h3";

export default defineEventHandler(async (event) => {
  requireRole(event, "admin");

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه دسته‌بندی ارسال نشده است",
    });
  }

  const redis = useStorage("redis");  
  const keys = await redis.getKeys(`${CACHE_KEY.category}:`);

  await Promise.all(keys.map((key) => redis.removeItem(key)));

  const db = await getDB();

  // Get the category first so we can return it after deletion
  const [rows] = (await db.query("SELECT * FROM categories WHERE id = ?", [
    id,
  ])) as any[];

  const category = rows[0] || null;

  if (!category) {
    return {
      success: false,
      message: "دسته‌بندی مورد نظر پیدا نشد",
    };
  }

  // Prevent deleting category that has children
  const [childRows] = (await db.query(
    "SELECT id FROM categories WHERE parent_id = ? LIMIT 1",
    [id]
  )) as any[];

  if (childRows.length) {
    return {
      success: false,
      message: "ابتدا زیر دسته‌های این دسته را حذف یا منتقل کنید",
    };
  }

  await db.query("DELETE FROM categories WHERE id = ?", [id]);

  return {
    success: true,
    data: category,
  };
});
