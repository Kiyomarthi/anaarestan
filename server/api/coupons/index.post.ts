import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";

/**
 * POST /api/coupons
 * ایجاد کوپن جدید (فقط ادمین)
 */
export default defineEventHandler(async (event) => {
  requireRole(event, "admin");
  const db = await getDB();
  const body = await readBody(event);

  validateBody(body, {
    code: (v) => validate(v).required().min(2).max(64).run(),
    type: (v) => validate(v).required().checkMatch(["percent", "fixed_amount"]).run(),
    value: (v) => validate(v).required().run(),
    max_discount_amount: (v) => validate(v).run(),
    min_order_amount: (v) => validate(v).run(),
    usage_limit: (v) => validate(v).run(),
    usage_limit_per_user: (v) => validate(v).run(),
    valid_from: (v) => validate(v).run(),
    valid_to: (v) => validate(v).run(),
    is_active: (v) => validate(v).run(),
  });

  const code = String(body.code).trim();
  const type = String(body.type);
  const value = Number(body.value);

  if (Number.isNaN(value) || value <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "مقدار تخفیف نامعتبر است",
    });
  }

  const maxDiscount =
    body.max_discount_amount === undefined || body.max_discount_amount === null
      ? null
      : Number(body.max_discount_amount);
  const minOrder =
    body.min_order_amount === undefined || body.min_order_amount === null
      ? null
      : Number(body.min_order_amount);
  const usageLimit =
    body.usage_limit === undefined || body.usage_limit === null
      ? null
      : Number(body.usage_limit);
  const usageLimitPerUser =
    body.usage_limit_per_user === undefined ||
    body.usage_limit_per_user === null
      ? null
      : Number(body.usage_limit_per_user);

  const isActive =
    body.is_active === undefined || body.is_active === null
      ? 1
      : Number(body.is_active)
      ? 1
      : 0;

  try {
    const [result] = (await db.query(
      `
        INSERT INTO coupons (
          code,
          type,
          value,
          max_discount_amount,
          min_order_amount,
          usage_limit,
          usage_limit_per_user,
          valid_from,
          valid_to,
          is_active,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        code,
        type,
        value,
        maxDiscount,
        minOrder,
        usageLimit,
        usageLimitPerUser,
        body.valid_from || null,
        body.valid_to || null,
        isActive,
      ],
    )) as any[];

    const insertedId = result?.insertId;
    const [rows] = (await db.query(
      `SELECT * FROM coupons WHERE id = ?`,
      [insertedId],
    )) as any[];

    return {
      success: true,
      message: "کوپن جدید ایجاد شد",
      data: rows?.[0] || null,
    };
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      throw createError({
        statusCode: 409,
        statusMessage: "کد کوپن تکراری است",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || "خطا در ایجاد کوپن",
    });
  }
});


