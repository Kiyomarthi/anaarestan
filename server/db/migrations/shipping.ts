import { getDB } from "../index";

/**
 * Migration helper for Shipping & Checkout feature.
 * این تابع را می‌توان به صورت دستی (مثلاً از یک اسکریپت نود جداگانه) صدا زد
 * تا جداول مربوط به آدرس، کوپن، سفارش، ولت و استان/شهر ساخته شوند.
 */
export async function migrateShipping() {
  const db = await getDB();

  // Provinces
  await db.query(`
    CREATE TABLE IF NOT EXISTS provinces (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(191) NOT NULL,
      shipping_cost INT UNSIGNED NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_provinces_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Cities
  await db.query(`
    CREATE TABLE IF NOT EXISTS cities (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      province_id INT UNSIGNED NOT NULL,
      name VARCHAR(191) NOT NULL,
      shipping_cost INT UNSIGNED NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_cities_province_id (province_id),
      CONSTRAINT fk_cities_province
        FOREIGN KEY (province_id) REFERENCES provinces (id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Addresses
  await db.query(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      province_id INT UNSIGNED NOT NULL,
      city_id INT UNSIGNED NOT NULL,
      full_address VARCHAR(500) NOT NULL,
      plate VARCHAR(50) NULL,
      unit VARCHAR(50) NULL,
      postal_code VARCHAR(20) NOT NULL,
      geo_lat DECIMAL(10,8) NULL,
      geo_lng DECIMAL(11,8) NULL,
      is_default TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_addresses_user_id (user_id),
      KEY idx_addresses_province_id (province_id),
      KEY idx_addresses_city_id (city_id),
      CONSTRAINT fk_addresses_province
        FOREIGN KEY (province_id) REFERENCES provinces (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT fk_addresses_city
        FOREIGN KEY (city_id) REFERENCES cities (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Coupons
  await db.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      code VARCHAR(64) NOT NULL,
      type ENUM('percent', 'fixed_amount') NOT NULL,
      value INT UNSIGNED NOT NULL,
      max_discount_amount INT UNSIGNED NULL,
      min_order_amount INT UNSIGNED NULL,
      usage_limit INT UNSIGNED NULL,
      usage_limit_per_user INT UNSIGNED NULL,
      valid_from DATETIME NULL,
      valid_to DATETIME NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_coupons_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Orders
  await db.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      address_id INT UNSIGNED NOT NULL,
      status ENUM(
        'pending_payment',
        'paid',
        'processing',
        'shipped',
        'delivered',
        'canceled',
        'failed'
      ) NOT NULL DEFAULT 'pending_payment',
      subtotal_amount INT UNSIGNED NOT NULL DEFAULT 0,
      discount_amount INT UNSIGNED NOT NULL DEFAULT 0,
      shipping_amount INT UNSIGNED NOT NULL DEFAULT 0,
      payable_amount INT UNSIGNED NOT NULL DEFAULT 0,
      coupon_id INT UNSIGNED NULL,
      coupon_snapshot JSON NULL,
      wallet_amount_used INT UNSIGNED NOT NULL DEFAULT 0,
      payment_method VARCHAR(50) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_orders_user_id (user_id),
      KEY idx_orders_status (status),
      KEY idx_orders_address_id (address_id),
      KEY idx_orders_coupon_id (coupon_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Order Items
  await db.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      order_id INT UNSIGNED NOT NULL,
      product_id INT UNSIGNED NOT NULL,
      product_variant_id INT UNSIGNED NULL,
      quantity INT UNSIGNED NOT NULL DEFAULT 1,
      price_at_order INT UNSIGNED NOT NULL,
      total_price_at_order INT UNSIGNED NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_order_items_order_id (order_id),
      KEY idx_order_items_product_id (product_id),
      KEY idx_order_items_variant_id (product_variant_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Wallets
  await db.query(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      balance INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_wallets_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Wallet Transactions
  await db.query(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      wallet_id INT UNSIGNED NOT NULL,
      type ENUM('credit', 'debit') NOT NULL,
      amount INT UNSIGNED NOT NULL,
      reason VARCHAR(255) NULL,
      balance_before INT NOT NULL,
      balance_after INT NOT NULL,
      meta JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_wallet_transactions_wallet_id (wallet_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}


