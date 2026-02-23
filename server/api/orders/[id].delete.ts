import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { createError } from "h3";

/**
 * DELETE /api/orders/:id
 * - admin only
 * - soft delete: sets status to 'canceled' instead of actual deletion
 * - or can be used for actual deletion if needed (not recommended)
 */
export default defineEventHandler(async (event) => {
  requireRole(event, "admin");

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه سفارش ارسال نشده است",
    });
  }

  const db = await getDB();

  const [rows] = (await db.query(`SELECT * FROM orders WHERE id = ?`, [
    id,
  ])) as any[];

  const order = rows?.[0] || null;

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: "سفارش پیدا نشد",
    });
  }

  // For safety, we'll just mark as canceled instead of deleting
  // If actual deletion is needed, uncomment the DELETE query below
  await db.query(
    `UPDATE orders SET status = 'canceled', updated_at = NOW() WHERE id = ?`,
    [id]
  );

  // Uncomment below for actual deletion (not recommended):
  // await db.query(`DELETE FROM order_items WHERE order_id = ?`, [id]);
  // await db.query(`DELETE FROM orders WHERE id = ?`, [id]);

  return {
    success: true,
    message: "سفارش لغو شد",
    data: order,
  };
});

