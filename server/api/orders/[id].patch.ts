import { getDB } from "~~/server/db";
import { getOptionalAuth } from "~~/server/utils/auth";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";

/**
 * PATCH /api/orders/:id
 * Body: { status?: string, payment_method?: string }
 * - admin can update any field
 * - user can only cancel own order (status = 'canceled') if status is before 'shipped'
 * - FR-8: User can only cancel orders before 'shipped' status
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const auth = getOptionalAuth(event) as any | null;
  const isAdmin = auth?.role === "admin";

  if (!auth) {
    throw createError({
      statusCode: 401,
      statusMessage: "نیاز به احراز هویت دارد",
    });
  }

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه سفارش ارسال نشده است",
    });
  }

  const body = await readBody(event);

  validateBody(body, {
    status: (v) =>
      v === undefined
        ? true
        : validate(v)
            .checkMatch([
              "pending_payment",
              "paid",
              "processing",
              "shipped",
              "delivered",
              "canceled",
              "failed",
            ])
            .run(),
    payment_method: (v) => validate(v).run(),
  });

  // Get existing order
  const [orderRows] = (await db.query(`SELECT * FROM orders WHERE id = ?`, [
    id,
  ])) as any[];
  const existingOrder = orderRows?.[0] || null;

  if (!existingOrder) {
    throw createError({
      statusCode: 404,
      statusMessage: "سفارش پیدا نشد",
    });
  }

  // Check ownership
  if (!isAdmin) {
    if (Number(existingOrder.user_id) !== Number(auth.id)) {
      throw createError({
        statusCode: 403,
        statusMessage: "دسترسی ندارید",
      });
    }
  }

  const sets: string[] = [];
  const params: any[] = [];

  // Handle status update
  if (body.status !== undefined) {
    const newStatus = String(body.status);
    const currentStatus = String(existingOrder.status);

    // FR-8: User can only cancel before 'shipped'
    if (!isAdmin) {
      if (newStatus !== "canceled") {
        throw createError({
          statusCode: 403,
          statusMessage: "شما فقط می‌توانید سفارش را لغو کنید",
        });
      }

      if (
        currentStatus === "shipped" ||
        currentStatus === "delivered" ||
        currentStatus === "canceled"
      ) {
        throw createError({
          statusCode: 409,
          statusMessage:
            "امکان لغو سفارش فقط قبل از ارسال وجود دارد",
        });
      }
    }

    sets.push("status = ?");
    params.push(newStatus);
  }

  // Handle payment_method update (admin only)
  if (isAdmin && body.payment_method !== undefined) {
    sets.push("payment_method = ?");
    params.push(
      body.payment_method === null || body.payment_method === ""
        ? null
        : String(body.payment_method)
    );
  }

  if (!sets.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "هیچ فیلدی برای بروزرسانی ارسال نشده است",
    });
  }

  params.push(id);
  await db.query(
    `UPDATE orders SET ${sets.join(", ")}, updated_at = NOW() WHERE id = ?`,
    params
  );

  // If order was canceled and wallet_amount_used > 0, refund wallet
  if (
    body.status === "canceled" &&
    Number(existingOrder.wallet_amount_used) > 0
  ) {
    const [walletRows] = (await db.query(
      `SELECT id, balance FROM wallets WHERE user_id = ?`,
      [existingOrder.user_id]
    )) as any[];
    const wallet = walletRows?.[0];

    if (wallet) {
      const balanceBefore = Number(wallet.balance);
      const balanceAfter =
        balanceBefore + Number(existingOrder.wallet_amount_used);

      await db.query(
        `UPDATE wallets SET balance = ?, updated_at = NOW() WHERE id = ?`,
        [balanceAfter, wallet.id]
      );

      // Create refund transaction
      await db.query(
        `INSERT INTO wallet_transactions (
          wallet_id, type, amount, reason,
          balance_before, balance_after, created_at
        ) VALUES (?, 'credit', ?, ?, ?, ?, NOW())`,
        [
          wallet.id,
          existingOrder.wallet_amount_used,
          "بازگشت وجه به دلیل لغو سفارش",
          balanceBefore,
          balanceAfter,
        ]
      );
    }
  }

  // Fetch updated order
  const [updatedRows] = (await db.query(`SELECT * FROM orders WHERE id = ?`, [
    id,
  ])) as any[];

  return {
    success: true,
    message: "سفارش بروزرسانی شد",
    data: updatedRows?.[0] || null,
  };
});

