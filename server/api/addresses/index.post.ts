import { getDB } from "~~/server/db";
import { requireAuth } from "~~/server/utils/auth";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";

/**
 * POST /api/addresses
 * Body: {
 *   province_id,
 *   city_id,
 *   full_address,
 *   plate?,
 *   unit?,
 *   postal_code,
 *   geo_lat?,
 *   geo_lng?,
 *   is_default?
 * }
 * - فقط کاربر لاگین‌شده می‌تواند برای خودش آدرس ثبت کند
 */
export default defineEventHandler(async (event) => {
  const user = requireAuth(event) as any;
  const db = await getDB();
  const body = await readBody(event);

  validateBody(body, {
    province_id: (v) => validate(v).required().run(),
    city_id: (v) => validate(v).required().run(),
    full_address: (v) => validate(v).required().min(5).max(500).run(),
    plate: (v) => validate(v).max(50).run(),
    unit: (v) => validate(v).max(50).run(),
    postal_code: (v) => validate(v).required().min(5).max(20).run(),
    geo_lat: (v) => validate(v).run(),
    geo_lng: (v) => validate(v).run(),
    is_default: (v) => validate(v).run(),
  });

  const userId = Number(user.id);
  const provinceId = Number(body.province_id);
  const cityId = Number(body.city_id);

  if ([userId, provinceId, cityId].some((n) => Number.isNaN(n))) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه‌های ارسال شده نامعتبر است",
    });
  }

  // اطمینان از وجود استان و شهر
  const [provRows] = (await db.query(
    `SELECT id FROM provinces WHERE id = ?`,
    [provinceId],
  )) as any[];
  if (!provRows?.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "استان مورد نظر پیدا نشد",
    });
  }

  const [cityRows] = (await db.query(
    `SELECT id, province_id FROM cities WHERE id = ?`,
    [cityId],
  )) as any[];
  const city = cityRows?.[0] || null;
  if (!city) {
    throw createError({
      statusCode: 404,
      statusMessage: "شهر مورد نظر پیدا نشد",
    });
  }
  if (Number(city.province_id) !== provinceId) {
    throw createError({
      statusCode: 400,
      statusMessage: "شهر انتخاب‌شده متعلق به استان ارسال‌شده نیست",
    });
  }

  const isDefaultRaw =
    body.is_default === undefined || body.is_default === null
      ? 0
      : Number(body.is_default) ? 1 : 0;

  // اگر آدرس پیش‌فرض جدیدی ثبت می‌شود، بقیه را غیر پیش‌فرض کن
  if (isDefaultRaw === 1) {
    await db.query(`UPDATE addresses SET is_default = 0 WHERE user_id = ?`, [
      userId,
    ]);
  }

  const geoLat =
    body.geo_lat === undefined || body.geo_lat === null
      ? null
      : Number(body.geo_lat);
  const geoLng =
    body.geo_lng === undefined || body.geo_lng === null
      ? null
      : Number(body.geo_lng);

  if (
    (geoLat !== null && Number.isNaN(geoLat)) ||
    (geoLng !== null && Number.isNaN(geoLng))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "مختصات جغرافیایی نامعتبر است",
    });
  }

  const [result] = (await db.query(
    `
      INSERT INTO addresses
        (user_id, province_id, city_id, full_address, plate, unit, postal_code, geo_lat, geo_lng, is_default, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
    [
      userId,
      provinceId,
      cityId,
      String(body.full_address),
      body.plate ?? null,
      body.unit ?? null,
      String(body.postal_code),
      geoLat,
      geoLng,
      isDefaultRaw,
    ],
  )) as any[];

  const insertedId = result?.insertId;

  const [rows] = (await db.query(
    `
      SELECT
        a.*,
        p.name AS province_name,
        c.name AS city_name,
        COALESCE(c.shipping_cost, p.shipping_cost) AS shipping_cost
      FROM addresses a
      JOIN provinces p ON p.id = a.province_id
      JOIN cities c ON c.id = a.city_id
      WHERE a.id = ?
    `,
    [insertedId],
  )) as any[];

  return {
    success: true,
    message: "آدرس جدید ثبت شد",
    data: rows?.[0] || null,
  };
});


