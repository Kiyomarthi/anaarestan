import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";

/**
 * POST /api/cities
 * ایجاد شهر (فقط ادمین)
 */
export default defineEventHandler(async (event) => {
  requireRole(event, "admin");
  const db = await getDB();
  const body = await readBody(event);

  validateBody(body, {
    province_id: (v) => validate(v).required().run(),
    name: (v) => validate(v).required().min(2).max(191).run(),
    shipping_cost: (v) => validate(v).run(),
  });

  const provinceId = Number(body.province_id);
  if (Number.isNaN(provinceId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه استان نامعتبر است",
    });
  }

  const [provRows] = (await db.query(
    `SELECT id FROM provinces WHERE id = ?`,
    [provinceId],
  )) as any[];
  if (!provRows?.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "استان مورد نظر پیدا نشد",
    });
  }

  const name = String(body.name).trim();
  const shippingCost =
    body.shipping_cost === undefined || body.shipping_cost === null
      ? null
      : Number(body.shipping_cost);

  if (shippingCost !== null && (Number.isNaN(shippingCost) || shippingCost < 0)) {
    throw createError({
      statusCode: 400,
      statusMessage: "هزینه ارسال نامعتبر است",
    });
  }

  const [result] = (await db.query(
    `
      INSERT INTO cities (province_id, name, shipping_cost, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `,
    [provinceId, name, shippingCost],
  )) as any[];

  const insertedId = result?.insertId;
  const [rows] = (await db.query(
    `
      SELECT
        c.*,
        p.name AS province_name,
        p.shipping_cost AS province_shipping_cost
      FROM cities c
      JOIN provinces p ON p.id = c.province_id
      WHERE c.id = ?
    `,
    [insertedId],
  )) as any[];

  return {
    success: true,
    message: "شهر جدید ایجاد شد",
    data: rows?.[0] || null,
  };
});


