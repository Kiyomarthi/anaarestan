import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";

/**
 * POST /api/provinces
 * ایجاد استان (فقط ادمین)
 */
export default defineEventHandler(async (event) => {
  requireRole(event, "admin");
  const db = await getDB();
  const body = await readBody(event);

  validateBody(body, {
    name: (v) => validate(v).required().min(2).max(191).run(),
    shipping_cost: (v) => validate(v).run(),
  });

  const name = String(body.name).trim();
  const shippingCost =
    body.shipping_cost === undefined || body.shipping_cost === null
      ? 0
      : Number(body.shipping_cost);

  if (Number.isNaN(shippingCost) || shippingCost < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "هزینه ارسال نامعتبر است",
    });
  }

  try {
    const [result] = (await db.query(
      `
        INSERT INTO provinces (name, shipping_cost, created_at, updated_at)
        VALUES (?, ?, NOW(), NOW())
      `,
      [name, shippingCost],
    )) as any[];

    const insertedId = result?.insertId;
    const [rows] = (await db.query(
      `SELECT * FROM provinces WHERE id = ?`,
      [insertedId],
    )) as any[];

    return {
      success: true,
      message: "استان جدید ایجاد شد",
      data: rows?.[0] || null,
    };
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      throw createError({
        statusCode: 409,
        statusMessage: "نام استان تکراری است",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || "خطا در ایجاد استان",
    });
  }
});


