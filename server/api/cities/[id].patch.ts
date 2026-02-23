import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";
import { CACHE_KEY } from "~~/shared/utils/cache";
import { removeCacheByPattern } from "~~/server/utils/cache";

/**
 * PATCH /api/cities/:id
 * بروزرسانی شهر (فقط ادمین)
 */
export default defineEventHandler(async (event) => {
  requireRole(event, "admin");
  const db = await getDB();
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه شهر ارسال نشده است",
    });
  }

  await removeCacheByPattern(`${CACHE_KEY.city}:`);

  const [existingRows] = (await db.query(
    `SELECT * FROM cities WHERE id = ?`,
    [id],
  )) as any[];
  const existing = existingRows?.[0] || null;

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "شهر پیدا نشد",
    });
  }

  const body = await readBody(event);

  validateBody(body, {
    province_id: (v) => validate(v).run(),
    name: (v) => validate(v).min(2).max(191).run(),
    shipping_cost: (v) => validate(v).run(),
  });

  const sets: string[] = [];
  const params: any[] = [];

  let nextProvinceId: number = Number(existing.province_id);

  if (body.province_id !== undefined) {
    const provinceId = Number(body.province_id);
    if (Number.isNaN(provinceId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "شناسه استان نامعتبر است",
      });
    }

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

    nextProvinceId = provinceId;
    sets.push("province_id = ?");
    params.push(provinceId);
  }

  if (body.name !== undefined) {
    sets.push("name = ?");
    params.push(String(body.name).trim());
  }

  if (body.shipping_cost !== undefined) {
    const cost =
      body.shipping_cost === null ? null : Number(body.shipping_cost);
    if (cost !== null && (Number.isNaN(cost) || cost < 0)) {
      throw createError({
        statusCode: 400,
        statusMessage: "هزینه ارسال نامعتبر است",
      });
    }
    sets.push("shipping_cost = ?");
    params.push(cost);
  }

  if (!sets.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "هیچ فیلدی برای بروزرسانی ارسال نشده است",
    });
  }

  params.push(id);
  await db.query(
    `UPDATE cities SET ${sets.join(
      ", ",
    )}, updated_at = NOW() WHERE id = ?`,
    params,
  );

  const [rows] = (await db.query(
    `
      SELECT
        c.*,
        p.name AS province_name,
        p.shipping_cost AS province_shipping_cost
      FROM cities c
      JOIN provinces p ON p.id = c.province_id
      WHERE c.id = ?
    `,
    [id],
  )) as any[];

  return {
    success: true,
    message: "شهر بروزرسانی شد",
    data: rows?.[0] || null,
  };
});


