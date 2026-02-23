import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";

/**
 * POST /api/wallets/manual-transaction
 * Body: {
 *   user_id: number (required),
 *   type: 'credit' | 'debit' (required),
 *   amount: number (required),
 *   reason: string (optional)
 * }
 * - admin only
 * - Creates or updates wallet for user
 * - Records transaction with balance_before and balance_after
 * - FR-11: Records transaction with type, amount, reason, balance_before, balance_after
 */
export default defineEventHandler(async (event) => {
  requireRole(event, "admin");

  const db = await getDB();
  const body = await readBody(event);

  validateBody(body, {
    user_id: (v) => validate(v).required().run(),
    type: (v) =>
      validate(v)
        .required()
        .checkMatch(["credit", "debit"])
        .run(),
    amount: (v) => validate(v).required().run(),
    reason: (v) => validate(v).run(),
  });

  const userId = Number(body.user_id);
  const type = String(body.type);
  const amount = Number(body.amount);
  const reason =
    body.reason && String(body.reason).trim()
      ? String(body.reason).trim()
      : null;

  if (Number.isNaN(userId) || Number.isNaN(amount) || amount <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "مقادیر ارسال شده نامعتبر است",
    });
  }

  // Verify user exists
  const [userRows] = (await db.query(`SELECT id FROM users WHERE id = ?`, [
    userId,
  ])) as any[];
  if (!userRows || userRows.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "کاربر پیدا نشد",
    });
  }

  // Start transaction
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Get or create wallet
    const [walletRows] = (await connection.query(
      `SELECT id, balance FROM wallets WHERE user_id = ?`,
      [userId]
    )) as any[];
    let wallet = walletRows?.[0] || null;

    if (!wallet) {
      // Create wallet with balance 0
      const [insertResult] = (await connection.query(
        `INSERT INTO wallets (user_id, balance, created_at, updated_at) 
         VALUES (?, 0, NOW(), NOW())`,
        [userId]
      )) as any[];
      wallet = {
        id: insertResult.insertId,
        balance: 0,
      };
    }

    const balanceBefore = Number(wallet.balance);
    let balanceAfter: number;

    if (type === "credit") {
      balanceAfter = balanceBefore + amount;
    } else {
      // debit
      if (balanceBefore < amount) {
        await connection.rollback();
        connection.release();
        throw createError({
          statusCode: 400,
          statusMessage: "موجودی کیف پول کافی نیست",
        });
      }
      balanceAfter = balanceBefore - amount;
    }

    // Update wallet balance
    await connection.query(
      `UPDATE wallets SET balance = ?, updated_at = NOW() WHERE id = ?`,
      [balanceAfter, wallet.id]
    );

    // Create transaction record
    const [transactionResult] = (await connection.query(
      `INSERT INTO wallet_transactions (
        wallet_id, type, amount, reason,
        balance_before, balance_after, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        wallet.id,
        type,
        amount,
        reason || (type === "credit" ? "واریز دستی توسط ادمین" : "برداشت دستی توسط ادمین"),
        balanceBefore,
        balanceAfter,
      ]
    )) as any[];

    await connection.commit();
    connection.release();

    // Fetch created transaction
    const [transactionRows] = (await db.query(
      `SELECT * FROM wallet_transactions WHERE id = ?`,
      [transactionResult.insertId]
    )) as any[];

    // Fetch updated wallet
    const [updatedWalletRows] = (await db.query(
      `SELECT * FROM wallets WHERE id = ?`,
      [wallet.id]
    )) as any[];

    return {
      success: true,
      message:
        type === "credit"
          ? "مبلغ به کیف پول اضافه شد"
          : "مبلغ از کیف پول کسر شد",
      data: {
        wallet: updatedWalletRows?.[0] || null,
        transaction: transactionRows?.[0] || null,
      },
    };
  } catch (error: any) {
    await connection.rollback();
    connection.release();

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "خطا در ثبت تراکنش",
    });
  }
});

