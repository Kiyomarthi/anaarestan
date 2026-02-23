import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";

/**
 * PATCH /api/coupons/:id
 * بروزرسانی کوپن (فقط ادمین)
 */
export default defineEventHandler(async (event) => {
  requireRole(event, "admin");
  const db = await getDB();

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه کوپن ارسال نشده است",
    });
  }

  const [existingRows] = (await db.query(
    `SELECT * FROM coupons WHERE id = ?`,
    [id],
  )) as any[];
  const existing = existingRows?.[0] || null;

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "کوپن پیدا نشد",
    });
  }

  const body = await readBody(event);

  validateBody(body, {
    code: (v) => validate(v).min(2).max(64).run(),
    type: (v) => validate(v).checkMatch(["percent", "fixed_amount"]).run(),
    value: (v) => validate(v).run(),
    max_discount_amount: (v) => validate(v).run(),
    min_order_amount: (v) => validate(v).run(),
    usage_limit: (v) => validate(v).run(),
    usage_limit_per_user: (v) => validate(v).run(),
    valid_from: (v) => validate(v).run(),
    valid_to: (v) => validate(v).run(),
    is_active: (v) => validate(v).run(),
  });

  const sets: string[] = [];
  const params: any[] = [];

  if (body.code !== undefined) {
    sets.push("code = ?");
    params.push(String(body.code).trim());
  }

  if (body.type !== undefined) {
    sets.push("type = ?");
    params.push(String(body.type));
  }

  if (body.value !== undefined) {
    const v = Number(body.value);
    if (Number.isNaN(v) || v <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "مقدار تخفیف نامعتبر است",
      });
    }
    sets.push("value = ?");
    params.push(v);
  }

  if (body.max_discount_amount !== undefined) {
    const v =
      body.max_discount_amount === null
        ? null
        : Number(body.max_discount_amount);
    if (v !== null && Number.isNaN(v)) {
      throw createError({
        statusCode: 400,
        statusMessage: "حداکثر مبلغ تخفیف نامعتبر است",
      });
    }
    sets.push("max_discount_amount = ?");
    params.push(v);
  }

  if (body.min_order_amount !== undefined) {
    const v =
      body.min_order_amount === null ? null : Number(body.min_order_amount);
    if (v !== null && Number.isNaN(v)) {
      throw createError({
        statusCode: 400,
        statusMessage: "حداقل مبلغ سفارش نامعتبر است",
      });
    }
    sets.push("min_order_amount = ?");
    params.push(v);
  }

  if (body.usage_limit !== undefined) {
    const v = body.usage_limit === null ? null : Number(body.usage_limit);
    if (v !== null && Number.isNaN(v)) {
      throw createError({
        statusCode: 400,
        statusMessage: "usage_limit نامعتبر است",
      });
    }
    sets.push("usage_limit = ?");
    params.push(v);
  }

  if (body.usage_limit_per_user !== undefined) {
    const v =
      body.usage_limit_per_user === null
        ? null
        : Number(body.usage_limit_per_user);
    if (v !== null && Number.isNaN(v)) {
      throw createError({
        statusCode: 400,
        statusMessage: "usage_limit_per_user نامعتبر است",
      });
    }
    sets.push("usage_limit_per_user = ?");
    params.push(v);
  }

  if (body.valid_from !== undefined) {
    sets.push("valid_from = ?");
    params.push(body.valid_from || null);
  }

  if (body.valid_to !== undefined) {
    sets.push("valid_to = ?");
    params.push(body.valid_to || null);
  }

  if (body.is_active !== undefined) {
    const v =
      body.is_active === null || body.is_active === undefined
        ? 0
        : Number(body.is_active)
          ? 1
          : 0;
    sets.push("is_active = ?");
    params.push(v);
  }

  if (!sets.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "هیچ فیلدی برای بروزرسانی ارسال نشده است",
    });
  }

  params.push(id);

  try {
    await db.query(
      `UPDATE coupons SET ${sets.join(
        ", ",
      )}, updated_at = NOW() WHERE id = ?`,
      params,
    );
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      throw createError({
        statusCode: 409,
        statusMessage: "کد کوپن تکراری است",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || "خطا در بروزرسانی کوپن",
    });
  }

  const [rows] = (await db.query(`SELECT * FROM coupons WHERE id = ?`, [
    id,
  ])) as any[];

  return {
    success: true,
    message: "کوپن بروزرسانی شد",
    data: rows?.[0] || null,
  };
});


