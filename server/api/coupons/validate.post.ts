import { getDB } from "~~/server/db";
import { requireAuth } from "~~/server/utils/auth";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";

/**
 * POST /api/coupons/validate
 * Body: { code: string, subtotal_amount?: number }
 * - Public endpoint for validating coupon code
 * - Returns coupon info if valid
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const body = await readBody(event);

  validateBody(body, {
    code: (v) => validate(v).required().run(),
    subtotal_amount: (v) => validate(v).run(),
  });

  const code = String(body.code).trim();
  const subtotalAmount =
    body.subtotal_amount !== undefined ? Number(body.subtotal_amount) : null;

  const [couponRows] = (await db.query(
    `SELECT * FROM coupons WHERE code = ? AND is_active = 1`,
    [code]
  )) as any[];

  const coupon = couponRows?.[0] || null;

  if (!coupon) {
    return {
      success: false,
      valid: false,
      message: "کوپن معتبر نیست یا منقضی شده است",
    };
  }

  // Check validity dates
  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return {
      success: false,
      valid: false,
      message: "کوپن هنوز فعال نشده است",
    };
  }

  if (coupon.valid_to && new Date(coupon.valid_to) < now) {
    return {
      success: false,
      valid: false,
      message: "کوپن منقضی شده است",
    };
  }

  // Check min_order_amount if subtotal provided
  if (
    subtotalAmount !== null &&
    coupon.min_order_amount &&
    subtotalAmount < coupon.min_order_amount
  ) {
    return {
      success: false,
      valid: false,
      message: `حداقل مبلغ سفارش برای استفاده از این کوپن ${coupon.min_order_amount} تومان است`,
    };
  }

  // Calculate discount preview
  let discountAmount = 0;
  if (subtotalAmount !== null) {
    if (coupon.type === "percent") {
      discountAmount = Math.floor((subtotalAmount * coupon.value) / 100);
      if (
        coupon.max_discount_amount &&
        discountAmount > coupon.max_discount_amount
      ) {
        discountAmount = coupon.max_discount_amount;
      }
    } else if (coupon.type === "fixed_amount") {
      discountAmount = Math.min(coupon.value, subtotalAmount);
    }
  }

  return {
    success: true,
    valid: true,
    data: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      max_discount_amount: coupon.max_discount_amount,
      min_order_amount: coupon.min_order_amount,
      discount_amount: discountAmount,
    },
  };
});

