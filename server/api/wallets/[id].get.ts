import { getDB } from "~~/server/db";
import { getOptionalAuth } from "~~/server/utils/auth";
import { createError } from "h3";

/**
 * GET /api/wallets/:id
 * - admin can access any wallet
 * - user can access own wallet
 * - returns wallet with recent transactions
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
      statusMessage: "شناسه کیف پول ارسال نشده است",
    });
  }

  // Get wallet with user info
  const [walletRows] = (await db.query(
    `
      SELECT
        w.*,
        u.full_name AS user_full_name,
        u.phone AS user_phone
      FROM wallets w
      LEFT JOIN users u ON u.id = w.user_id
      WHERE w.id = ?
    `,
    [id]
  )) as any[];

  const wallet = walletRows?.[0] || null;

  if (!wallet) {
    throw createError({
      statusCode: 404,
      statusMessage: "کیف پول پیدا نشد",
    });
  }

  // Check ownership
  if (!isAdmin) {
    if (Number(wallet.user_id) !== Number(auth.id)) {
      throw createError({
        statusCode: 403,
        statusMessage: "دسترسی ندارید",
      });
    }
  }

  // Get recent transactions (last 50)
  const [transactionRows] = (await db.query(
    `
      SELECT *
      FROM wallet_transactions
      WHERE wallet_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `,
    [id]
  )) as any[];

  return {
    success: true,
    data: {
      ...wallet,
      transactions: transactionRows || [],
    },
  };
});

