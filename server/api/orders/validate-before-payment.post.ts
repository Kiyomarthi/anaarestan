import { getDB } from "~~/server/db";
import { requireAuth } from "~~/server/utils/auth";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";

/**
 * POST /api/orders/validate-before-payment
 * Body: {
 *   cart_id: number (required),
 *   address_id: number (required),
 *   coupon_code?: string,
 *   wallet_amount_used?: number
 * }
 * - Validates cart items stock, prices, shipping cost before payment
 * - Returns validation result with calculated totals
 * - FR-42: Validates inventory, prices, shipping before gateway redirect
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

  const errors: string[] = [];
  const warnings: string[] = [];

  // Verify cart exists and belongs to user
  const [cartRows] = (await db.query(
    `SELECT * FROM carts WHERE id = ? AND user_id = ?`,
    [cartId, userId]
  )) as any[];
  const cart = cartRows?.[0] || null;

  if (!cart) {
    throw createError({
      statusCode: 404,
      statusMessage: "سبد خرید پیدا نشد یا متعلق به شما نیست",
    });
  }

  // Get cart items
  const [cartItemRows] = (await db.query(
    `SELECT * FROM cart_items WHERE cart_id = ?`,
    [cartId]
  )) as any[];

  if (!cartItemRows || cartItemRows.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "سبد خرید خالی است",
    });
  }

  // Verify address exists and belongs to user
  const [addressRows] = (await db.query(
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
    throw createError({
      statusCode: 404,
      statusMessage: "آدرس پیدا نشد یا متعلق به شما نیست",
    });
  }

  const shippingCost = Number(address.shipping_cost || 0);

  // Validate cart items: stock and prices
  let subtotalAmount = 0;
  const itemValidations: any[] = [];

  for (const cartItem of cartItemRows) {
    const productId = Number(cartItem.product_id);
    const variantId = cartItem.product_variant_id
      ? Number(cartItem.product_variant_id)
      : null;
    const quantity = Number(cartItem.quantity);
    const priceInCart = Number(cartItem.price);

    let currentPrice = 0;
    let currentStock = 0;
    let productTitle = "";
    let variantSku = null;

    if (variantId) {
      // Check variant
      const [variantRows] = (await db.query(
        `
          SELECT pv.*, p.title AS product_title
          FROM product_variants pv
          JOIN products p ON p.id = pv.product_id
          WHERE pv.id = ? AND pv.product_id = ?
        `,
        [variantId, productId]
      )) as any[];
      const variant = variantRows?.[0] || null;

      if (!variant) {
        errors.push(
          `تنوع محصول با شناسه ${variantId} پیدا نشد یا متعلق به محصول نیست`
        );
        continue;
      }

      currentPrice = Number(
        variant.discount_price && variant.discount_price > 0
          ? variant.discount_price
          : variant.price
      );
      currentStock = Number(variant.stock);
      productTitle = variant.product_title || "";
      variantSku = variant.sku;

      if (currentStock < quantity) {
        errors.push(
          `موجودی کافی نیست برای ${productTitle} (SKU: ${variantSku}). موجودی: ${currentStock}, درخواستی: ${quantity}`
        );
      }

      if (Math.abs(currentPrice - priceInCart) > 0.01) {
        warnings.push(
          `قیمت ${productTitle} تغییر کرده است. قیمت قبلی: ${priceInCart}, قیمت جدید: ${currentPrice}`
        );
      }
    } else {
      // Check product
      const [productRows] = (await db.query(
        `SELECT * FROM products WHERE id = ?`,
        [productId]
      )) as any[];
      const product = productRows?.[0] || null;

      if (!product) {
        errors.push(`محصول با شناسه ${productId} پیدا نشد`);
        continue;
      }

      currentPrice = Number(
        product.discount_price && product.discount_price > 0
          ? product.discount_price
          : product.price
      );
      currentStock = Number(product.stock);
      productTitle = product.title || "";

      if (currentStock < quantity) {
        errors.push(
          `موجودی کافی نیست برای ${productTitle}. موجودی: ${currentStock}, درخواستی: ${quantity}`
        );
      }

      if (Math.abs(currentPrice - priceInCart) > 0.01) {
        warnings.push(
          `قیمت ${productTitle} تغییر کرده است. قیمت قبلی: ${priceInCart}, قیمت جدید: ${currentPrice}`
        );
      }
    }

    const itemTotal = currentPrice * quantity;
    subtotalAmount += itemTotal;

    itemValidations.push({
      product_id: productId,
      product_variant_id: variantId,
      product_title: productTitle,
      variant_sku: variantSku,
      quantity,
      price_in_cart: priceInCart,
      current_price: currentPrice,
      current_stock: currentStock,
      item_total: itemTotal,
      stock_ok: currentStock >= quantity,
      price_match: Math.abs(currentPrice - priceInCart) <= 0.01,
    });
  }

  // Validate coupon if provided
  let couponId: number | null = null;
  let couponSnapshot: any = null;
  let discountAmount = 0;

  if (couponCode) {
    const [couponRows] = (await db.query(
      `SELECT * FROM coupons WHERE code = ? AND is_active = 1`,
      [couponCode]
    )) as any[];
    const coupon = couponRows?.[0] || null;

    if (!coupon) {
      errors.push("کوپن معتبر نیست یا منقضی شده است");
    } else {
      // Check validity dates
      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        errors.push("کوپن هنوز فعال نشده است");
      } else if (coupon.valid_to && new Date(coupon.valid_to) < now) {
        errors.push("کوپن منقضی شده است");
      } else {
        // Check min_order_amount
        if (
          coupon.min_order_amount &&
          subtotalAmount < coupon.min_order_amount
        ) {
          errors.push(
            `حداقل مبلغ سفارش برای استفاده از این کوپن ${coupon.min_order_amount} تومان است`
          );
        } else {
          couponId = coupon.id;
          couponSnapshot = {
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            max_discount_amount: coupon.max_discount_amount,
          };

          // Calculate discount
          if (coupon.type === "percent") {
            discountAmount = Math.floor(
              (subtotalAmount * coupon.value) / 100
            );
            if (
              coupon.max_discount_amount &&
              discountAmount > coupon.max_discount_amount
            ) {
              discountAmount = coupon.max_discount_amount;
            }
          } else if (coupon.type === "fixed_amount") {
            discountAmount = coupon.value;
            if (discountAmount > subtotalAmount) {
              discountAmount = subtotalAmount;
            }
          }
        }
      }
    }
  }

  // Validate wallet balance if wallet_amount_used > 0
  if (walletAmountUsed > 0) {
    const [walletRows] = (await db.query(
      `SELECT balance FROM wallets WHERE user_id = ?`,
      [userId]
    )) as any[];
    const wallet = walletRows?.[0] || null;

    if (!wallet || Number(wallet.balance) < walletAmountUsed) {
      errors.push("موجودی کیف پول کافی نیست");
    }
  }

  // Calculate payable amount
  const payableAmount =
    subtotalAmount - discountAmount + shippingCost - walletAmountUsed;

  if (payableAmount < 0) {
    errors.push("مبلغ قابل پرداخت نامعتبر است");
  }

  const isValid = errors.length === 0;

  return {
    success: isValid,
    valid: isValid,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    data: {
      subtotal_amount: subtotalAmount,
      discount_amount: discountAmount,
      shipping_amount: shippingCost,
      wallet_amount_used: walletAmountUsed,
      payable_amount: payableAmount,
      item_validations: itemValidations,
      coupon_valid: couponId !== null,
      wallet_valid: walletAmountUsed === 0 || walletAmountUsed > 0,
    },
  };
});

