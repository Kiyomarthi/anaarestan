import { getDB } from "~~/server/db";
import { getOptionalAuth, requireAuth } from "~~/server/utils/auth";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";

/**
 * PATCH /api/addresses/:id
 * - user: فقط می‌تواند آدرس خودش را ویرایش کند
 * - admin: می‌تواند هر آدرسی را ویرایش کند
 */
export default defineEventHandler(async (event) => {
  const db = await getDB();
  const auth = (getOptionalAuth(event) as any | null) || (requireAuth(
    event,
  ) as any);
  const isAdmin = auth?.role === "admin";

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه آدرس ارسال نشده است",
    });
  }

  const [existingRows] = (await db.query(
    `SELECT * FROM addresses WHERE id = ?`,
    [id],
  )) as any[];
  const existing = existingRows?.[0] || null;

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "آدرس پیدا نشد",
    });
  }

  if (!isAdmin && Number(existing.user_id) !== Number(auth.id)) {
    throw createError({
      statusCode: 403,
      statusMessage: "دسترسی ندارید",
    });
  }

  const body = await readBody(event);

  validateBody(body, {
    province_id: (v) => validate(v).run(),
    city_id: (v) => validate(v).run(),
    full_address: (v) => validate(v).min(5).max(500).run(),
    plate: (v) => validate(v).max(50).run(),
    unit: (v) => validate(v).max(50).run(),
    postal_code: (v) => validate(v).min(5).max(20).run(),
    geo_lat: (v) => validate(v).run(),
    geo_lng: (v) => validate(v).run(),
    is_default: (v) => validate(v).run(),
  });

  const sets: string[] = [];
  const params: any[] = [];

  let provinceId: number | null = null;
  let cityId: number | null = null;

  if (body.province_id !== undefined) {
    provinceId = Number(body.province_id);
    if (Number.isNaN(provinceId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "شناسه استان نامعتبر است",
      });
    }
    sets.push("province_id = ?");
    params.push(provinceId);
  }

  if (body.city_id !== undefined) {
    cityId = Number(body.city_id);
    if (Number.isNaN(cityId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "شناسه شهر نامعتبر است",
      });
    }
    sets.push("city_id = ?");
    params.push(cityId);
  }

  if (body.full_address !== undefined) {
    sets.push("full_address = ?");
    params.push(String(body.full_address));
  }

  if (body.plate !== undefined) {
    sets.push("plate = ?");
    params.push(body.plate === null ? null : String(body.plate));
  }

  if (body.unit !== undefined) {
    sets.push("unit = ?");
    params.push(body.unit === null ? null : String(body.unit));
  }

  if (body.postal_code !== undefined) {
    sets.push("postal_code = ?");
    params.push(String(body.postal_code));
  }

  if (body.geo_lat !== undefined) {
    const geoLat =
      body.geo_lat === null || body.geo_lat === ""
        ? null
        : Number(body.geo_lat);
    if (geoLat !== null && Number.isNaN(geoLat)) {
      throw createError({
        statusCode: 400,
        statusMessage: "مختصات عرض جغرافیایی نامعتبر است",
      });
    }
    sets.push("geo_lat = ?");
    params.push(geoLat);
  }

  if (body.geo_lng !== undefined) {
    const geoLng =
      body.geo_lng === null || body.geo_lng === ""
        ? null
        : Number(body.geo_lng);
    if (geoLng !== null && Number.isNaN(geoLng)) {
      throw createError({
        statusCode: 400,
        statusMessage: "مختصات طول جغرافیایی نامعتبر است",
      });
    }
    sets.push("geo_lng = ?");
    params.push(geoLng);
  }

  let isDefaultChangedToTrue = false;
  if (body.is_default !== undefined) {
    const isDefault =
      body.is_default === null || body.is_default === undefined
        ? 0
        : Number(body.is_default)
          ? 1
          : 0;
    sets.push("is_default = ?");
    params.push(isDefault);

    if (isDefault === 1) {
      isDefaultChangedToTrue = true;
    }
  }

  if (!sets.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "هیچ فیلدی برای بروزرسانی ارسال نشده است",
    });
  }

  // اطمینان از صحت رابطه استان/شهر در صورت تغییر
  const nextProvinceId =
    provinceId !== null ? provinceId : Number(existing.province_id);
  const nextCityId = cityId !== null ? cityId : Number(existing.city_id);

  if (provinceId !== null || cityId !== null) {
    const [cityRows] = (await db.query(
      `SELECT id, province_id FROM cities WHERE id = ?`,
      [nextCityId],
    )) as any[];
    const city = cityRows?.[0] || null;
    if (!city) {
      throw createError({
        statusCode: 404,
        statusMessage: "شهر مورد نظر پیدا نشد",
      });
    }
    if (Number(city.province_id) !== nextProvinceId) {
      throw createError({
        statusCode: 400,
        statusMessage: "شهر انتخاب‌شده متعلق به استان ارسال‌شده نیست",
      });
    }
  }

  if (isDefaultChangedToTrue) {
    await db.query(`UPDATE addresses SET is_default = 0 WHERE user_id = ?`, [
      existing.user_id,
    ]);
  }

  params.push(id);
  await db.query(
    `UPDATE addresses SET ${sets.join(
      ", ",
    )}, updated_at = NOW() WHERE id = ?`,
    params,
  );

  const [updatedRows] = (await db.query(
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
    [id],
  )) as any[];

  return {
    success: true,
    message: "آدرس بروزرسانی شد",
    data: updatedRows?.[0] || null,
  };
});


