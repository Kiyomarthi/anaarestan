import { getDB } from "~~/server/db";
import { requireAuth } from "~~/server/utils/auth";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";

/**
 * POST /api/orders
 * Body: {
 *   cart_id: number (required),
 *   address_id: number (required),
 *   coupon_code?: string,
 *   wallet_amount_used?: number,
 *   payment_method?: string
 * }
 * - Creates order from cart
 * - Validates cart items, address, coupon, wallet balance
 * - Calculates totals and creates order_items
 * - Updates cart status to 'converted'
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const user = requireAuth(event) as any;
  const userId = Number(user.id);

  const body = await readBody(event);

  validateBody(body, {
    cart_id: (v) => validate(v).required().run(),
    address_id: (v) => validate(v).required().run(),
    coupon_code: (v) => validate(v).run(),
    wallet_amount_used: (v) => validate(v).run(),
    payment_method: (v) => validate(v).run(),
  });

  const cartId = Number(body.cart_id);
  const addressId = Number(body.address_id);
  const couponCode =
    body.coupon_code && String(body.coupon_code).trim()
      ? String(body.coupon_code).trim()
      : null;
  const walletAmountUsed =
    body.wallet_amount_used !== undefined
      ? Number(body.wallet_amount_used)
      : 0;
  const paymentMethod =
    body.payment_method && String(body.payment_method).trim()
      ? String(body.payment_method).trim()
      : null;

  if (Number.isNaN(cartId) || Number.isNaN(addressId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه سبد خرید یا آدرس نامعتبر است",
    });
  }

  if (walletAmountUsed < 0 || Number.isNaN(walletAmountUsed)) {
    throw createError({
      statusCode: 400,
      statusMessage: "مبلغ استفاده از کیف پول نامعتبر است",
    });
  }

  // Start transaction
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Verify cart exists and belongs to user
    const [cartRows] = (await connection.query(
      `SELECT * FROM carts WHERE id = ?`,
      [cartId]
    )) as any[];
    const cart = cartRows?.[0] || null;

    if (!cart) {
      await connection.rollback();
      connection.release();
      throw createError({
        statusCode: 404,
        statusMessage: "سبد خرید پیدا نشد",
      });
    }

    if (Number(cart.user_id) !== userId) {
      await connection.rollback();
      connection.release();
      throw createError({
        statusCode: 403,
        statusMessage: "این سبد خرید متعلق به شما نیست",
      });
    }

    // Get cart items
    const [cartItemRows] = (await connection.query(
      `SELECT * FROM cart_items WHERE cart_id = ?`,
      [cartId]
    )) as any[];

    if (!cartItemRows || cartItemRows.length === 0) {
      await connection.rollback();
      connection.release();
      throw createError({
        statusCode: 400,
        statusMessage: "سبد خرید خالی است",
      });
    }

    // Verify address exists and belongs to user
    const [addressRows] = (await connection.query(
      `
        SELECT a.*, 
               COALESCE(c.shipping_cost, p.shipping_cost) AS shipping_cost
        FROM addresses a
        LEFT JOIN cities c ON c.id = a.city_id
        LEFT JOIN provinces p ON p.id = a.province_id
        WHERE a.id = ? AND a.user_id = ?
      `,
      [addressId, userId]
    )) as any[];
    const address = addressRows?.[0] || null;

    if (!address) {
      await connection.rollback();
      connection.release();
      throw createError({
        statusCode: 404,
        statusMessage: "آدرس پیدا نشد یا متعلق به شما نیست",
      });
    }

    const shippingCost = Number(address.shipping_cost || 0);

    // Validate and get coupon if provided
    let couponId: number | null = null;
    let couponSnapshot: any = null;
    let discountAmount = 0;

    if (couponCode) {
      const [couponRows] = (await connection.query(
        `SELECT * FROM coupons WHERE code = ? AND is_active = 1`,
        [couponCode]
      )) as any[];
      const coupon = couponRows?.[0] || null;

      if (!coupon) {
        await connection.rollback();
        connection.release();
        throw createError({
          statusCode: 404,
          statusMessage: "کوپن معتبر نیست یا منقضی شده است",
        });
      }

      // Check validity dates
      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        await connection.rollback();
        connection.release();
        throw createError({
          statusCode: 400,
          statusMessage: "کوپن هنوز فعال نشده است",
        });
      }

      if (coupon.valid_to && new Date(coupon.valid_to) < now) {
        await connection.rollback();
        connection.release();
        throw createError({
          statusCode: 400,
          statusMessage: "کوپن منقضی شده است",
        });
      }

      couponId = coupon.id;
      couponSnapshot = {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        max_discount_amount: coupon.max_discount_amount,
      };
    }

    // Calculate subtotal from cart items (using current prices)
    let subtotalAmount = 0;
    const orderItemsData: any[] = [];

    for (const cartItem of cartItemRows) {
      const productId = Number(cartItem.product_id);
      const variantId = cartItem.product_variant_id
        ? Number(cartItem.product_variant_id)
        : null;
      const quantity = Number(cartItem.quantity);
      const priceAtOrder = Number(cartItem.price);

      // Verify product/variant exists and has stock
      if (variantId) {
        const [variantRows] = (await connection.query(
          `SELECT stock FROM product_variants WHERE id = ? AND product_id = ?`,
          [variantId, productId]
        )) as any[];
        const variant = variantRows?.[0] || null;

        if (!variant) {
          await connection.rollback();
          connection.release();
          throw createError({
            statusCode: 404,
            statusMessage: `تنوع محصول با شناسه ${variantId} پیدا نشد`,
          });
        }

        if (Number(variant.stock) < quantity) {
          await connection.rollback();
          connection.release();
          throw createError({
            statusCode: 400,
            statusMessage: `موجودی کافی نیست برای تنوع محصول با شناسه ${variantId}`,
          });
        }
      } else {
        const [productRows] = (await connection.query(
          `SELECT stock FROM products WHERE id = ?`,
          [productId]
        )) as any[];
        const product = productRows?.[0] || null;

        if (!product) {
          await connection.rollback();
          connection.release();
          throw createError({
            statusCode: 404,
            statusMessage: `محصول با شناسه ${productId} پیدا نشد`,
          });
        }

        if (Number(product.stock) < quantity) {
          await connection.rollback();
          connection.release();
          throw createError({
            statusCode: 400,
            statusMessage: `موجودی کافی نیست برای محصول با شناسه ${productId}`,
          });
        }
      }

      const totalPriceAtOrder = priceAtOrder * quantity;
      subtotalAmount += totalPriceAtOrder;

      orderItemsData.push({
        product_id: productId,
        product_variant_id: variantId,
        quantity,
        price_at_order: priceAtOrder,
        total_price_at_order: totalPriceAtOrder,
      });
    }

    // Calculate discount from coupon
    if (couponId && couponSnapshot) {
      if (couponSnapshot.type === "percent") {
        discountAmount = Math.floor(
          (subtotalAmount * couponSnapshot.value) / 100
        );
        if (
          couponSnapshot.max_discount_amount &&
          discountAmount > couponSnapshot.max_discount_amount
        ) {
          discountAmount = couponSnapshot.max_discount_amount;
        }
      } else if (couponSnapshot.type === "fixed_amount") {
        discountAmount = couponSnapshot.value;
        if (discountAmount > subtotalAmount) {
          discountAmount = subtotalAmount;
        }
      }
    }

    // Verify wallet balance if wallet_amount_used > 0
    if (walletAmountUsed > 0) {
      const [walletRows] = (await connection.query(
        `SELECT balance FROM wallets WHERE user_id = ?`,
        [userId]
      )) as any[];
      const wallet = walletRows?.[0] || null;

      if (!wallet || Number(wallet.balance) < walletAmountUsed) {
        await connection.rollback();
        connection.release();
        throw createError({
          statusCode: 400,
          statusMessage: "موجودی کیف پول کافی نیست",
        });
      }
    }

    // Calculate payable amount
    const payableAmount =
      subtotalAmount - discountAmount + shippingCost - walletAmountUsed;
    if (payableAmount < 0) {
      await connection.rollback();
      connection.release();
      throw createError({
        statusCode: 400,
        statusMessage: "مبلغ قابل پرداخت نامعتبر است",
      });
    }

    // Create order
    const [orderResult] = (await connection.query(
      `INSERT INTO orders (
        user_id, address_id, status,
        subtotal_amount, discount_amount, shipping_amount, payable_amount,
        coupon_id, coupon_snapshot, wallet_amount_used, payment_method,
        created_at, updated_at
      ) VALUES (?, ?, 'pending_payment', ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId,
        addressId,
        subtotalAmount,
        discountAmount,
        shippingCost,
        payableAmount,
        couponId,
        couponSnapshot ? JSON.stringify(couponSnapshot) : null,
        walletAmountUsed,
        paymentMethod,
      ]
    )) as any[];

    const orderId = orderResult.insertId;

    // Create order items
    for (const itemData of orderItemsData) {
      await connection.query(
        `INSERT INTO order_items (
          order_id, product_id, product_variant_id,
          quantity, price_at_order, total_price_at_order, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          orderId,
          itemData.product_id,
          itemData.product_variant_id,
          itemData.quantity,
          itemData.price_at_order,
          itemData.total_price_at_order,
        ]
      );
    }

    // Update cart status to 'converted'
    await connection.query(
      `UPDATE carts SET status = 'converted', updated_at = NOW() WHERE id = ?`,
      [cartId]
    );

    // Deduct wallet balance if used
    if (walletAmountUsed > 0) {
      const [walletRows] = (await connection.query(
        `SELECT id, balance FROM wallets WHERE user_id = ?`,
        [userId]
      )) as any[];
      const wallet = walletRows?.[0];

      if (wallet) {
        const balanceBefore = Number(wallet.balance);
        const balanceAfter = balanceBefore - walletAmountUsed;

        await connection.query(
          `UPDATE wallets SET balance = ?, updated_at = NOW() WHERE id = ?`,
          [balanceAfter, wallet.id]
        );

        // Create wallet transaction
        await connection.query(
          `INSERT INTO wallet_transactions (
            wallet_id, type, amount, reason,
            balance_before, balance_after, created_at
          ) VALUES (?, 'debit', ?, ?, ?, ?, NOW())`,
          [
            wallet.id,
            walletAmountUsed,
            "استفاده در سفارش",
            balanceBefore,
            balanceAfter,
          ]
        );
      }
    }

    // Deduct stock from products/variants
    for (const itemData of orderItemsData) {
      if (itemData.product_variant_id) {
        await connection.query(
          `UPDATE product_variants 
           SET stock = stock - ?, updated_at = NOW() 
           WHERE id = ?`,
          [itemData.quantity, itemData.product_variant_id]
        );
      } else {
        await connection.query(
          `UPDATE products 
           SET stock = stock - ?, updated_at = NOW() 
           WHERE id = ?`,
          [itemData.quantity, itemData.product_id]
        );
      }
    }

    await connection.commit();
    connection.release();

    // Fetch created order
    const [orderRows] = (await db.query(
      `SELECT * FROM orders WHERE id = ?`,
      [orderId]
    )) as any[];

    return {
      success: true,
      message: "سفارش با موفقیت ایجاد شد",
      data: orderRows?.[0] || null,
    };
  } catch (error: any) {
    await connection.rollback();
    connection.release();

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "خطا در ایجاد سفارش",
    });
  }
});

